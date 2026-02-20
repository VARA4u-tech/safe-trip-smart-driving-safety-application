const { createClient } = require("@supabase/supabase-js");
const logger = require("../utils/logger");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (supabase) {
      // Verify token with Supabase
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        logger.error(`Suspicious activity: Invalid token from IP: ${req.ip}`);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      req.user = user;
      next();
    } else {
      // Mock mode auth - accept any token for development if Supabase is not configured
      // In a real app, you'd never do this without a secret key check
      logger.info("Auth Middleware: Running in Mock Mode - Accepting token");
      req.user = { id: "mock-user-id" };
      next();
    }
  } catch (err) {
    logger.error(`Auth error: ${err.message}`);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

module.exports = authMiddleware;
