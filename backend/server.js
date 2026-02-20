const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const xss = require("xss");
const morgan = require("morgan");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Custom Middlewares & Utilities
const logger = require("./utils/logger");
const authMiddleware = require("./middleware/auth");
const {
  validateRequest,
  locationSchema,
  tripStartSchema,
  hazardReportSchema,
} = require("./middleware/validator");

const app = express();
const PORT = process.env.PORT || 5000;

// security: Logging requests
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// security: Set security HTTP headers
app.use(helmet());

// security: CORS Configuration
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

// security: Rate Limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use("/api/", limiter);

// security: Body Parser with limits
app.use(express.json({ limit: "10kb" })); // Prevents large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// security: Prevent HTTP Parameter Pollution
app.use(hpp());

// security: Simple XSS Protection Middleware
app.use((req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// ☁️🚗📰 External API Routes
const weatherRoutes = require("./routes/weather");
const trafficRoutes = require("./routes/traffic");
const newsRoutes = require("./routes/news");

app.use("/api/weather", weatherRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/news", newsRoutes);

// 🧠 Database Initialization (Hybrid Mode)
let supabase = null;
let useMockMock = false;

// In-memory fallback
let mockTrips = [];
let mockHazards = [];

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
    throw new Error("Invalid Supabase URL");
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("✅ Connected to Supabase (Memory Bank Active)");
} catch (err) {
  console.warn(
    "⚠️ Supabase not configured. Switching to TEMPORARY MEMORY (Mock Mode).",
  );
  console.warn(
    "   -> Update backend/.env with real keys to enable permanent storage.",
  );
  useMockMock = true;
}

// ---------------------------------------------------------
// 1️⃣ LOCATION DATA RECEIVER
// ---------------------------------------------------------
app.post(
  "/api/location",
  authMiddleware,
  validateRequest(locationSchema),
  async (req, res) => {
    const { userId, latitude, longitude, speed, timestamp } = req.body;

    console.log(
      `📍 GPS: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}] | Speed: ${speed?.toFixed(1) || 0} km/h`,
    );

    // Risk Analysis
    const riskAnalysis = analyzeRisk(speed, "Clear");

    // Optional: Save location to Supabase if active
    if (!useMockMock && supabase) {
      // execute async save without awaiting to keep response fast
      supabase
        .from("location_history")
        .insert([{ user_id: userId, latitude, longitude, speed, timestamp }])
        .then(({ error }) => {
          if (error) console.error("Loc save error:", error.message);
        });
    }

    res.json({
      status: "success",
      processedAt: new Date(),
      riskLevel: riskAnalysis.level,
      message: riskAnalysis.message,
    });
  },
);

// ---------------------------------------------------------
// 2️⃣ RISK ANALYSIS LOGIC
// ---------------------------------------------------------
function analyzeRisk(speed, weather) {
  if (speed > 80) {
    return { level: "HIGH", message: "⚠️ Speeding! Slow down immediately." };
  }
  if (weather === "Rainy" && speed > 50) {
    return { level: "MEDIUM", message: "🌧️ Wet road. Reduce speed." };
  }
  return { level: "LOW", message: "✅ Driving safe." };
}

// ---------------------------------------------------------
// 3️⃣ EXTERNAL API PROXY
// ---------------------------------------------------------
app.get("/api/alerts", async (req, res) => {
  let dbHazards = [];

  if (!useMockMock && supabase) {
    const { data, error } = await supabase
      .from("hazard_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error) dbHazards = data;
  } else {
    dbHazards = mockHazards;
  }

  const mockExternalAlerts = [
    {
      id: "ext_1",
      type: "Weather",
      message: "Fog reported in 5km",
      severity: "medium",
      created_at: new Date(),
    },
    {
      id: "ext_2",
      type: "Traffic",
      message: "Congestion on Main St",
      severity: "low",
      created_at: new Date(),
    },
  ];

  res.json([...mockExternalAlerts, ...dbHazards]);
});

// ---------------------------------------------------------
// 4️⃣ TRIP MANAGEMENT
// ---------------------------------------------------------
app.post(
  "/api/trip/start",
  authMiddleware,
  validateRequest(tripStartSchema),
  async (req, res) => {
    const { userId, startLocation } = req.body;

    if (!useMockMock && supabase) {
      const { data, error } = await supabase
        .from("trips")
        .insert([
          {
            user_id: userId,
            start_time: new Date(),
            status: "active",
            start_location: startLocation,
          },
        ])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      res.json({ message: "Trip started", tripId: data[0].id });
    } else {
      const trip = {
        id: Date.now().toString(),
        startTime: new Date(),
        status: "active",
        startLocation,
      };
      mockTrips.push(trip);
      res.json({ message: "Trip started (Mock)", tripId: trip.id });
    }
  },
);

app.post("/api/trip/end", async (req, res) => {
  const { tripId, endLocation, distance, duration } = req.body;

  if (!useMockMock && supabase) {
    const { error } = await supabase
      .from("trips")
      .update({
        end_time: new Date(),
        status: "completed",
        end_location: endLocation,
        distance_km: distance,
        duration_sec: duration,
      })
      .eq("id", tripId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Trip ended. Saved to History." });
  } else {
    const trip = mockTrips.find((t) => t.id === tripId);
    if (trip) {
      trip.endTime = new Date();
      trip.status = "completed";
      trip.endLocation = endLocation;
    }
    res.json({ message: "Trip ended (Mock). Saved to Memory." });
  }
});

app.post(
  "/api/report-hazard",
  authMiddleware,
  validateRequest(hazardReportSchema),
  async (req, res) => {
    const { type, severity, location, userId } = req.body;

    if (!useMockMock && supabase) {
      const { error } = await supabase.from("hazard_reports").insert([
        {
          type,
          severity,
          location,
          user_id: userId,
          created_at: new Date(),
        },
      ]);

      if (error) return res.status(500).json({ error: error.message });
      res.json({ message: "Hazard reported successfully" });
    } else {
      const report = {
        id: Date.now().toString(),
        type,
        severity,
        location,
        userId,
        created_at: new Date(),
      };
      mockHazards.push(report);
      res.json({ message: "Hazard reported (Mock)" });
    }
  },
);

// ---------------------------------------------------------
// 5️⃣ ML ACCIDENT PREDICTION (AI ENGINE)
// ---------------------------------------------------------
const { predictRisk } = require("./ml/accident_predictor");

app.post("/api/predict-accident", (req, res) => {
  const {
    speedKmh,
    weatherCondition,
    timeHour,
    trafficLevel,
    incidentHistoryCount,
  } = req.body;

  // Default values if missing
  const input = {
    speedKmh: parseFloat(speedKmh) || 0,
    weatherCondition: weatherCondition || "Clear",
    timeHour: parseInt(timeHour) || new Date().getHours(),
    trafficLevel: trafficLevel || "unknown",
    incidentHistoryCount: parseInt(incidentHistoryCount) || 0,
  };

  const prediction = predictRisk(input);

  console.log(
    `🤖 AI Prediction: Risk=${prediction.probability}% | Status=${prediction.level} | Factor=${prediction.contributingFactors[0]}`,
  );

  res.json(prediction);
});

// 6️⃣ GLOBAL ERROR HANDLER
// ---------------------------------------------------------
app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start
app.listen(PORT, () => {
  logger.info(`🧠 SafeTrip Backend (Brain) running on port ${PORT}`);
  if (useMockMock) {
    logger.warn(
      "⚠️ NOTICE: Running in MOCK MODE (No Database). Updates will be lost on restart.",
    );
  }
});
