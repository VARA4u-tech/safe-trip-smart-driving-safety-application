import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import VintageLayout from "@/components/VintageLayout";
import SpeedHeadingHUD from "@/components/SpeedHeadingHUD";
import SpeedLimitWarning from "@/components/SpeedLimitWarning";
import TripSummaryOverlay, {
  type TripSummaryData,
} from "@/components/TripSummaryOverlay";
import MapSearchBar from "@/components/MapSearchBar";
import NavigationDirections from "@/components/NavigationDirections";
import VoiceCommandButton from "@/components/VoiceCommandButton";
import WeatherWidget from "@/components/WeatherWidget";
import MLSafetyWidget from "@/components/MLSafetyWidget";
import EmergencySOSButton from "@/components/EmergencySOSButton";
import QuickServices from "@/components/QuickServices";
import ARNavigation from "@/components/ARNavigation";
import { useAuth } from "@/hooks/useAuth";
import HazardReportModal from "@/components/HazardReportModal";
import { useMapboxDirections } from "@/hooks/useMapboxDirections";
import { useTrafficIncidents } from "@/hooks/useTrafficLayer";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useTripStore } from "@/hooks/useTripStore";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { mockAlerts, type Alert } from "@/data/mockData";
import {
  MapPin,
  Navigation,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  CloudRain,
  Construction,
  CarFront,
  ArrowLeft,
  Home,
  LayoutDashboard,
  Locate,
  Plus,
  Minus,
  Layers,
  Sun,
  Moon,
  Satellite,
  Navigation2,
  Compass,
  Box,
  User,
} from "lucide-react";
import { toast } from "sonner";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
if (!MAPBOX_TOKEN) {
  console.warn("⚠️ VITE_MAPBOX_ACCESS_TOKEN is missing in .env");
}
mapboxgl.accessToken = MAPBOX_TOKEN;

import { BACKEND_URL } from "@/lib/constants";

const SPEED_LIMIT_KMH = 80;

// ─── Map style definitions ────────────────────────────────────────────────────
type MapStyleKey = "streets" | "satellite" | "night";

const MAP_STYLES: Record<
  MapStyleKey,
  { url: string; label: string; icon: typeof Sun }
> = {
  streets: {
    url: "mapbox://styles/mapbox/streets-v12",
    label: "Streets",
    icon: Sun,
  },
  satellite: {
    url: "mapbox://styles/mapbox/satellite-streets-v12",
    label: "Satellite",
    icon: Satellite,
  },
  night: { url: "mapbox://styles/mapbox/dark-v11", label: "Night", icon: Moon },
};

// ─── Traffic congestion colours (Mapbox traffic layer) ────────────────────────
const TRAFFIC_COLORS = [
  "match",
  ["get", "congestion"],
  "low",
  "#34C759",
  "moderate",
  "#FF9F0A",
  "heavy",
  "#FF3B30",
  "severe",
  "#8B0000",
  /* fallback */ "#34C759",
] as mapboxgl.Expression;

// ─── Alert icon mapping ───────────────────────────────────────────────────────
const alertIcons: Record<Alert["type"], typeof AlertTriangle> = {
  Accident: CarFront,
  Traffic: Construction,
  Weather: CloudRain,
  "Road Block": AlertTriangle,
};

const alertPositions: [number, number][] = [];

// ─── Haversine distance (km) ──────────────────────────────────────────────────
const haversine = (a: [number, number], b: [number, number]): number => {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) *
      Math.cos((b[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const defaultLocation: [number, number] = [78.4867, 17.385]; // Changed to Hyderabad/Generic India as a more likely starting point or fallback

// ─── Helper: create/update accuracy circle GeoJSON ───────────────────────────
function accuracyCircleGeoJSON(
  center: [number, number],
  radiusM: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const coords: [number, number][] = [];
  const kmPerDeg = 111.32;
  const latR = radiusM / 1000 / kmPerDeg;
  const lonR =
    radiusM / 1000 / (kmPerDeg * Math.cos((center[1] * Math.PI) / 180));
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    coords.push([
      center[0] + lonR * Math.cos(angle),
      center[1] + latR * Math.sin(angle),
    ]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
const LiveMapScreen = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isMobile || isTablet;
  const navigate = useNavigate();

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const trailCoordsRef = useRef<[number, number][]>([]);
  const tripActiveRef = useRef(false);
  const tripStartRef = useRef<Date | null>(null);
  const maxSpeedRef = useRef(0);
  const speedSamplesRef = useRef<number[]>([]);
  const accuracyRef = useRef(0);
  const followModeRef = useRef(false);
  const styleChangingRef = useRef(false);

  // UI state
  const [tripActive, setTripActive] = useState(() => {
    return localStorage.getItem("trip_active") === "true";
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("last_known_loc");
    return saved ? JSON.parse(saved) : defaultLocation;
  });
  const [gpsActive, setGpsActive] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [tripDistanceKm, setTripDistanceKm] = useState(0);
  const [tripDurationSec, setTripDurationSec] = useState(0);
  const [tripSummary, setTripSummary] = useState<TripSummaryData | null>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [arMode, setArMode] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [backendAlerts, setBackendAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<
    (Alert & { coords: [number, number] })[]
  >([]);
  const alertMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [styleLayerReady, setStyleLayerReady] = useState(false);

  // Google Maps-like feature states
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("streets");
  const [trafficOn, setTrafficOn] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [followMode, setFollowMode] = useState(false); // auto-follow heading
  const [bearing, setBearing] = useState(0);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  const {
    route: navRoute,
    destinationName,
    currentStepIndex,
    fetchRoute,
    clearRoute,
    updateStepFromLocation,
  } = useMapboxDirections({
    accessToken: MAPBOX_TOKEN,
    mapRef: mapRef as React.RefObject<mapboxgl.Map | null>,
  });

  // ─── Auto-Start Follow Mode on Navigation ────────────────────────────────
  useEffect(() => {
    if (navRoute) {
      if (!followModeRef.current) {
        setFollowMode(true);
        followModeRef.current = true;
        setIs3D(true);
      }
    }
  }, [navRoute]);

  const { saveTrip } = useTripStore();

  // ─── Traffic Incidents Hook (fetches every 60s) ───
  useTrafficIncidents(mapRef.current, userLocation);

  // ─── Environment Monitor (AI Data Source) ───
  const env = useEnvironment(userLocation[1], userLocation[0]);

  const speedKmh = speed !== null ? speed * 3.6 : 0;
  const overSpeedLimit = tripActive && speedKmh > SPEED_LIMIT_KMH;

  // ─── Trip duration timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tripActive) return;
    const interval = setInterval(() => {
      if (tripStartRef.current)
        setTripDurationSec(
          (Date.now() - tripStartRef.current.getTime()) / 1000,
        );
    }, 1000);
    return () => clearInterval(interval);
  }, [tripActive]);

  // ─── Fetch initial alerts from backend ───────────────────────────────────
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/alerts`)
      .then((r) => r.json())
      .then((d) => {
        setBackendAlerts(d);
      })
      .catch(() => {});
  }, []);

  // ─── Initialise map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES["streets"].url,
      center: defaultLocation,
      zoom: 14,
      pitch: 0,
      bearing: 0,
      maxZoom: 20,
      minZoom: 5,
      // Full interaction support for mobile
      dragPan: true,
      touchZoomRotate: true,
      touchPitch: true,
      doubleClickZoom: true,
      dragRotate: true,
    });

    // ── Listen for bearing change (for compass indicator) ─────────────────
    map.on("rotate", () => setBearing(map.getBearing()));

    map.on("load", () => {
      setMapLoaded(true);
      setStyleLayerReady(true);
      addMapLayers(map);
    });

    // Re-add layers after style hot-swap
    map.on("style.load", () => {
      setStyleLayerReady(true);
      addMapLayers(map);
      styleChangingRef.current = false;
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Add all dynamic layers to map ───────────────────────────────────────
  const addMapLayers = useCallback(
    (map: mapboxgl.Map) => {
      // 3D buildings
      if (!map.getLayer("3d-buildings")) {
        const labelLayerId = map
          .getStyle()
          .layers?.find(
            (l) => l.type === "symbol" && (l.layout as any)?.["text-field"],
          )?.id;
        try {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#aab4be",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"],
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "min_height"],
                ],
                "fill-extrusion-opacity": 0.55,
              },
            },
            labelLayerId,
          );
        } catch (_) {}
      }

      // GPS trail
      if (!map.getSource("gps-trail")) {
        map.addSource("gps-trail", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });
        map.addLayer({
          id: "gps-trail-line",
          type: "line",
          source: "gps-trail",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#3B82F6",
            "line-width": 3.5,
            "line-opacity": 0.85,
          },
        });
      }

      // Accuracy circle
      if (!map.getSource("accuracy-circle")) {
        map.addSource("accuracy-circle", {
          type: "geojson",
          data: accuracyCircleGeoJSON(defaultLocation, 20),
        });
        map.addLayer({
          id: "accuracy-fill",
          type: "fill",
          source: "accuracy-circle",
          paint: { "fill-color": "#3B82F6", "fill-opacity": 0.12 },
        });
        map.addLayer({
          id: "accuracy-outline",
          type: "line",
          source: "accuracy-circle",
          paint: {
            "line-color": "#3B82F6",
            "line-width": 1.5,
            "line-opacity": 0.5,
          },
        });
      }

      // Static NY mock alerts removed in favor of dynamic user-centric alerts
      // (Managed by separate useEffect and activeAlerts state)

      // User location pulsing blue dot
      if (!userMarkerRef.current) {
        const userEl = document.createElement("div");
        userEl.innerHTML = `
        <div style="position:relative;width:22px;height:22px;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(59,130,246,0.35);
            animation:pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite;
          "></div>
          <div style="
            position:absolute;inset:3px;border-radius:50%;
            background:#3B82F6;border:2.5px solid white;
            box-shadow:0 2px 6px rgba(59,130,246,0.6);
          "></div>
        </div>
      `;
        // Inject pulse animation once
        if (!document.getElementById("pulse-style")) {
          const st = document.createElement("style");
          st.id = "pulse-style";
          st.textContent = `
          @keyframes pulse-ring {
            0%   { transform:scale(1);   opacity:0.8; }
            100% { transform:scale(2.8); opacity:0;   }
          }
        `;
          document.head.appendChild(st);
        }
        const marker = new mapboxgl.Marker({ element: userEl })
          .setLngLat(defaultLocation)
          .addTo(map);
        userMarkerRef.current = marker;
      }
    },
    [navigate],
  );

  // ─── GPS tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        const acc = pos.coords.accuracy ?? 20;
        setUserLocation(coords);
        localStorage.setItem("last_known_loc", JSON.stringify(coords));
        setGpsActive(true);
        setSpeed(pos.coords.speed);
        setHeading(pos.coords.heading);
        accuracyRef.current = acc;

        const map = mapRef.current;

        // Update blue dot + accuracy circle
        userMarkerRef.current?.setLngLat(coords);
        if (map?.getSource("accuracy-circle")) {
          (map.getSource("accuracy-circle") as mapboxgl.GeoJSONSource).setData(
            accuracyCircleGeoJSON(coords, acc),
          );
        }

        // Auto-follow heading
        if (followModeRef.current && map) {
          map.easeTo({
            center: coords,
            bearing: pos.coords.heading ?? map.getBearing(),
            zoom: 16,
            pitch: 45,
            duration: 800,
          });
        }

        // Send to backend
        const currentSpeedKmh = (pos.coords.speed || 0) * 3.6;
        if (tripActiveRef.current) {
          fetch(`${BACKEND_URL}/api/location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "user_123",
              latitude: coords[1],
              longitude: coords[0],
              speed: currentSpeedKmh,
              timestamp: new Date(),
            }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.riskLevel === "HIGH")
                toast.error(data.message, { duration: 3000 });
              else if (data.riskLevel === "MEDIUM")
                toast.warning(data.message, { duration: 2000 });
            })
            .catch(() => {});
        }

        // Trail & distance
        if (tripActiveRef.current) {
          const prev = trailCoordsRef.current;
          if (prev.length > 0) {
            setTripDistanceKm(
              (d) => d + haversine(prev[prev.length - 1], coords),
            );
          }
          trailCoordsRef.current = [...prev, coords];
          speedSamplesRef.current.push(currentSpeedKmh);
          if (currentSpeedKmh > maxSpeedRef.current)
            maxSpeedRef.current = currentSpeedKmh;

          if (map?.getSource("gps-trail")) {
            (map.getSource("gps-trail") as mapboxgl.GeoJSONSource).setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: trailCoordsRef.current,
              },
            });
          }
        }

        // First GPS fix → fly to user + Generate local mock alerts
        if (!gpsActive && map) {
          map.flyTo({
            center: coords,
            zoom: 15,
            duration: 1500,
            essential: true,
          });

          // Generate 4 mock alerts near the user's current location
          const localAlerts = mockAlerts.map((base, i) => ({
            ...base,
            coords: [
              coords[0] + (Math.random() - 0.5) * 0.015,
              coords[1] + (Math.random() - 0.5) * 0.015,
            ] as [number, number],
          }));
          setActiveAlerts(localAlerts);
        }
      },
      () => setGpsActive(false),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Update nav step as user moves ───────────────────────────────────────
  useEffect(() => {
    if (navRoute) updateStepFromLocation(userLocation);
  }, [userLocation, navRoute, updateStepFromLocation]);

  // ─── Feature 1 & 2: Map style switch ─────────────────────────────────────
  const switchStyle = useCallback((key: MapStyleKey) => {
    const map = mapRef.current;
    if (!map || styleChangingRef.current) return;
    styleChangingRef.current = true;
    setStyleLayerReady(false);
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    setMapStyle(key);
    map.setStyle(MAP_STYLES[key].url);
    setStyleMenuOpen(false);
  }, []);

  // ─── Feature 3: Traffic layer toggle ─────────────────────────────────────
  const toggleTraffic = useCallback(() => {
    const map = mapRef.current;
    if (!map || !styleLayerReady) return;

    if (!trafficOn) {
      try {
        if (!map.getSource("mapbox-traffic")) {
          map.addSource("mapbox-traffic", {
            type: "vector",
            url: "mapbox://mapbox.mapbox-traffic-v1",
          });
        }
        if (!map.getLayer("traffic-line")) {
          map.addLayer({
            id: "traffic-line",
            type: "line",
            source: "mapbox-traffic",
            "source-layer": "traffic",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-width": ["interpolate", ["linear"], ["zoom"], 12, 2, 18, 6],
              "line-color": TRAFFIC_COLORS,
              "line-opacity": 0.85,
            },
          });
        } else {
          map.setLayoutProperty("traffic-line", "visibility", "visible");
        }
        toast.success("Traffic layer ON", {
          description: "🟢 Free  🟠 Moderate  🔴 Heavy",
        });
      } catch (e) {
        toast.error("Traffic layer failed to load");
      }
    } else {
      if (map.getLayer("traffic-line"))
        map.setLayoutProperty("traffic-line", "visibility", "none");
      toast.info("Traffic layer OFF");
    }
    setTrafficOn((p) => !p);
  }, [trafficOn, styleLayerReady]);

  // ─── Feature 5a: Compass – reset north ───────────────────────────────────
  const resetNorth = useCallback(() => {
    mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 45 : 0, duration: 500 });
  }, [is3D]);

  // ─── Feature 5b: 2D / 3D toggle ──────────────────────────────────────────
  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !is3D;
    map.easeTo({ pitch: next ? 55 : 0, zoom: next ? 16 : 14, duration: 700 });
    setIs3D(next);
    toast.info(next ? "3D view enabled" : "2D view enabled");
  }, [is3D]);

  // ─── Feature 6: Auto-follow heading ──────────────────────────────────────
  const toggleFollowMode = useCallback(() => {
    const next = !followMode;
    followModeRef.current = next;
    setFollowMode(next);
    if (next) {
      toast.success("Follow mode ON – map will rotate with you");
      setIs3D(true);
      mapRef.current?.easeTo({
        pitch: 50,
        zoom: 16,
        bearing: heading ?? 0,
        duration: 600,
      });
    } else {
      toast.info("Follow mode OFF");
      mapRef.current?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
      setIs3D(false);
    }
  }, [followMode, heading]);

  // ─── Recenter / zoom ─────────────────────────────────────────────────────
  const handleRecenter = useCallback(() => {
    mapRef.current?.flyTo({
      center: userLocation,
      zoom: 15,
      duration: 1000,
      essential: true,
    });
  }, [userLocation]);

  const handleZoomIn = useCallback(() => {
    const m = mapRef.current;
    if (m) m.easeTo({ zoom: m.getZoom() + 1, duration: 350 });
  }, []);

  const handleZoomOut = useCallback(() => {
    const m = mapRef.current;
    if (m) m.easeTo({ zoom: m.getZoom() - 1, duration: 350 });
  }, []);

  // ─── Trip start / end ────────────────────────────────────────────────────
  const startTrip = useCallback(() => {
    setTripActive(true);
    localStorage.setItem("trip_active", "true");
    tripActiveRef.current = true;
    tripStartRef.current = new Date();
    trailCoordsRef.current = [userLocation];
    maxSpeedRef.current = 0;
    speedSamplesRef.current = [];
    setTripDistanceKm(0);
    setTripDurationSec(0);
    const map = mapRef.current;
    if (map?.getSource("gps-trail")) {
      (map.getSource("gps-trail") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [userLocation] },
      });
    }
    toast.success("Trip started!");
  }, [userLocation]);

  const endTrip = useCallback(() => {
    setTripActive(false);
    localStorage.removeItem("trip_active");
    tripActiveRef.current = false;
    const samples = speedSamplesRef.current;
    const avg = samples.length
      ? samples.reduce((a, b) => a + b, 0) / samples.length
      : 0;
    const startTime = tripStartRef.current || new Date();
    const summaryData: TripSummaryData = {
      distanceKm: tripDistanceKm,
      durationSec: tripDurationSec,
      maxSpeedKmh: maxSpeedRef.current,
      avgSpeedKmh: avg,
      alertCount: mockAlerts.length,
      trailCoords: [...trailCoordsRef.current],
      startTime,
      speedSamples: [...samples],
    };
    saveTrip({
      distanceKm: summaryData.distanceKm,
      durationSec: summaryData.durationSec,
      maxSpeedKmh: summaryData.maxSpeedKmh,
      avgSpeedKmh: summaryData.avgSpeedKmh,
      alertCount: summaryData.alertCount,
      startTime: summaryData.startTime,
      speedSamples: summaryData.speedSamples,
      startLocation: destinationName ? "Current Location" : undefined,
      endLocation: destinationName || undefined,
    });
    setTripSummary(summaryData);
  }, [tripDistanceKm, tripDurationSec, saveTrip, destinationName]);

  // ─── Voice commands ───────────────────────────────────────────────────────
  const handleVoiceCommand = useCallback(
    (cmd: string) => {
      if (cmd.includes("start")) startTrip();
      else if (cmd.includes("end") || cmd.includes("stop")) endTrip();
      else if (cmd.includes("center")) handleRecenter();
      else if (cmd.includes("zoom in")) handleZoomIn();
      else if (cmd.includes("zoom out")) handleZoomOut();
      else if (cmd.includes("traffic")) toggleTraffic();
      else if (cmd.includes("night")) switchStyle("night");
      else if (cmd.includes("satellite")) switchStyle("satellite");
      else if (cmd.includes("3d")) toggle3D();
    },
    [
      startTrip,
      endTrip,
      handleRecenter,
      handleZoomIn,
      handleZoomOut,
      toggleTraffic,
      switchStyle,
      toggle3D,
    ],
  );

  const handleNavigateTo = useCallback(
    (dest: { name: string; coords: [number, number] }) =>
      fetchRoute(userLocation, dest.coords, dest.name),
    [fetchRoute, userLocation],
  );

  const handleReportHazard = useCallback(
    (type: string) => {
      fetch(`${BACKEND_URL}/api/report-hazard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          severity: "medium",
          location: `${userLocation[1].toFixed(4)}, ${userLocation[0].toFixed(4)}`,
          timestamp: new Date(),
        }),
      })
        .then(() =>
          toast.success(`${type} reported`, {
            description: "Syncing with safety network...",
          }),
        )
        .catch(() => toast.error("Failed to sync report"));
    },
    [userLocation],
  );

  // ─── Compass rotation style ───────────────────────────────────────────────
  const compassStyle: React.CSSProperties = {
    transform: `rotate(${-bearing}deg)`,
    transition: "transform 0.2s ease",
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <VintageLayout
      showFrame={false}
      className="relative min-h-screen flex flex-col"
    >
      {/* Trip Summary Overlay */}
      {tripSummary && (
        <TripSummaryOverlay
          data={tripSummary}
          onClose={() => setTripSummary(null)}
        />
      )}

      {/* Speed Limit Warning */}
      <SpeedLimitWarning
        currentSpeedKmh={Math.round(speedKmh)}
        limitKmh={SPEED_LIMIT_KMH}
        visible={overSpeedLimit}
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Map container */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {!tripSummary && (
          <>
            {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 z-40 flex flex-col gap-2 px-3 pt-3 sm:px-4 sm:pt-4 pointer-events-none">
              {/* Row 1: Home + status + voice + Dashboard */}
              <div className="flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/")}
                    title="Return to Home"
                    aria-label="Go home"
                    className={`${isCompact ? "w-10 h-10" : "w-12 h-12"} glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg text-primary`}
                  >
                    <Home className={`${isCompact ? "w-5 h-5" : "w-6 h-6"}`} />
                  </button>

                  <button
                    onClick={() => navigate("/dashboard")}
                    title="User Dashboard"
                    aria-label="User profile"
                    className={`${isCompact ? "w-10 h-10" : "w-12 h-12"} glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-lg text-primary relative`}
                  >
                    <User className={`${isCompact ? "w-5 h-5" : "w-6 h-6"}`} />
                  </button>
                </div>

                {!isCompact && (
                  <div className="glass-panel px-4 py-2 rounded-2xl hidden sm:block shadow">
                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/60 block leading-none mb-1">
                      Status
                    </span>
                    <span className="font-bold text-sm">
                      {tripActive ? "● TRIP ACTIVE" : "READY"}
                    </span>
                  </div>
                )}

                {/* Live Weather Widget */}
                {!isCompact && <WeatherWidget />}

                {/* AI Safety Widget */}
                <MLSafetyWidget
                  currentSpeedKmh={speedKmh}
                  weatherCondition={env.weather.condition}
                  trafficLevel={env.traffic.congestionLabel.toLowerCase()}
                />

                <VoiceCommandButton onCommand={handleVoiceCommand} />
              </div>

              {/* Row 2: Search Bar (Hidden during navigation) */}
              {!navRoute && (
                <div className="pointer-events-auto space-y-4 px-1">
                  <MapSearchBar
                    mapRef={mapRef as React.RefObject<mapboxgl.Map | null>}
                    accessToken={MAPBOX_TOKEN}
                    onNavigateTo={handleNavigateTo}
                    externalQuery={quickSearch}
                    isTripActive={tripActive}
                    onStartTrip={startTrip}
                    onEndTrip={endTrip}
                  />
                  <QuickServices onSearch={(q) => setQuickSearch(q)} />
                </div>
              )}
            </div>

            {/* ── Navigation Directions ──────────────────────────────────────── */}
            <NavigationDirections
              route={navRoute}
              destinationName={destinationName}
              onClose={clearRoute}
              currentStepIndex={currentStepIndex}
              onToggleAR={() => setArMode(true)}
            />

            {arMode && (
              <ARNavigation
                route={navRoute}
                currentStepIndex={currentStepIndex}
                onClose={() => setArMode(false)}
              />
            )}

            {/* ── Speed / Heading HUD ────────────────────────────────────────── */}
            <SpeedHeadingHUD
              speed={speed}
              heading={heading}
              gpsActive={gpsActive}
              tripActive={tripActive}
              tripDistanceKm={tripDistanceKm}
              tripDurationSec={tripDurationSec}
              isCompact={isCompact}
            />

            {/* ── RIGHT CONTROLS COLUMN ─────────────────────────────────────── */}
            {/*
          Layout (top→bottom, right side):
          Compass | 3D | Follow | Layers | Recenter | Zoom+| Zoom-
        */}
            <div
              className="absolute right-3 sm:right-4 flex flex-col gap-2 z-30"
              style={{
                bottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {/* Compass (rotates with map bearing) */}
              <button
                onClick={resetNorth}
                aria-label="Reset north"
                title="Tap to reset north"
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-md overflow-hidden`}
              >
                <Compass
                  className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`}
                  style={compassStyle}
                />
              </button>

              {/* 2D / 3D toggle */}
              <button
                onClick={toggle3D}
                aria-label="Toggle 3D view"
                title={is3D ? "Switch to 2D" : "Switch to 3D"}
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center transition-all shadow-md text-xs font-black ${is3D ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
              >
                <Box className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`} />
              </button>

              {/* Follow mode (auto-rotate with heading) */}
              <button
                onClick={toggleFollowMode}
                aria-label="Toggle follow mode"
                title={
                  followMode ? "Disable follow mode" : "Enable follow mode"
                }
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center transition-all shadow-md ${followMode ? "bg-blue-500 text-white" : "hover:bg-blue-500/10"}`}
              >
                <Navigation2
                  className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`}
                />
              </button>

              {/* Map style / layer picker */}
              <div className="relative">
                <button
                  onClick={() => setStyleMenuOpen((p) => !p)}
                  aria-label="Map style"
                  title="Change map style"
                  className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center transition-all shadow-md ${styleMenuOpen ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
                >
                  <Layers className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`} />
                </button>

                {/* Style picker dropdown */}
                {styleMenuOpen && (
                  <div
                    className={`absolute right-14 top-0 glass-panel rounded-2xl p-2 shadow-2xl flex flex-col gap-1 min-w-[140px] z-50 ${isCompact ? "right-12" : ""}`}
                  >
                    {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                      const s = MAP_STYLES[key];
                      const Icon = s.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => switchStyle(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${mapStyle === key ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {s.label}
                        </button>
                      );
                    })}
                    <div className="border-t border-primary/10 my-1" />
                    <button
                      onClick={toggleTraffic}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${trafficOn ? "bg-green-500 text-white" : "hover:bg-primary/10"}`}
                    >
                      <span className="text-base">🚦</span>
                      Traffic {trafficOn ? "ON" : "OFF"}
                    </button>
                  </div>
                )}
              </div>

              {/* Recenter */}
              <button
                onClick={handleRecenter}
                aria-label="Recenter map"
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-md`}
              >
                <Locate
                  className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-blue-500`}
                />
              </button>

              {/* Zoom + */}
              <button
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-md font-bold text-lg`}
              >
                <Plus className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`} />
              </button>

              {/* Zoom - */}
              <button
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className={`${isCompact ? "w-10 h-10" : "w-11 h-11"} glass-panel rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-md font-bold text-lg`}
              >
                <Minus className={`${isCompact ? "w-4 h-4" : "w-5 h-5"}`} />
              </button>
            </div>

            {/* ── Report Hazard button ────────────────────────────────────────── */}
            <div
              className="absolute left-3 sm:left-4 z-30"
              style={{
                bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <button
                onClick={() => setReportModalOpen(true)}
                aria-label="Report hazard"
                className="w-14 h-14 glass-panel rounded-full flex flex-col items-center justify-center bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-xl hover:scale-110"
              >
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                  Report
                </span>
              </button>
            </div>

            {/* ── Emergency SOS button ────────────────────────────────────────── */}
            <div
              className="absolute right-3 sm:right-4 z-40"
              style={{
                bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <EmergencySOSButton userLocation={userLocation} />
            </div>

            {/* ── Start / End Trip button ─────────────────────────────────────── */}
            <div
              className="absolute left-0 right-0 flex justify-center px-4 z-30"
              style={{
                bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <button
                onClick={tripActive ? endTrip : startTrip}
                className={`btn-premium flex items-center gap-3 text-base sm:text-xl py-4 px-10 sm:py-5 sm:px-16 shadow-2xl transition-all ${tripActive ? "bg-destructive text-white hover:shadow-destructive/40" : ""}`}
              >
                {tripActive ? (
                  <>
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />{" "}
                    End Trip
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 sm:w-6 sm:h-6" /> Start Trip
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Alert Panel ───────────────────────────────────────────────────── */}
      {!tripSummary && (
        <div
          className={`glass-panel border-t border-primary/10 transition-all duration-400 rounded-t-3xl ${panelOpen ? "max-h-72" : "max-h-14"} overflow-hidden z-30 flex-shrink-0`}
        >
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className="w-full flex items-center justify-between px-5 py-4 sm:px-8 group"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span className="font-bold text-sm tracking-tight">
                ALERTS ({mockAlerts.length + backendAlerts.length})
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {panelOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </div>
          </button>

          <div className="px-4 pb-6 space-y-2 overflow-y-auto max-h-56 sm:px-6">
            {mockAlerts.map((alert) => {
              const Icon = alertIcons[alert.type];
              return (
                <button
                  key={alert.id}
                  onClick={() => navigate(`/alert/${alert.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-foreground truncate">
                      {alert.title}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {alert.type} · {alert.timeDetected}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hazard Report Modal ───────────────────────────────────────────── */}
      {reportModalOpen && (
        <HazardReportModal
          onClose={() => setReportModalOpen(false)}
          onReport={handleReportHazard}
        />
      )}
    </VintageLayout>
  );
};

export default LiveMapScreen;
