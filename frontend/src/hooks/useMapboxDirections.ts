import { useState, useCallback, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { NavigationRoute } from "@/components/NavigationDirections";

const MAPBOX_DIRECTIONS_URL =
  "https://api.mapbox.com/directions/v5/mapbox/driving";

interface UseMapboxDirectionsProps {
  accessToken: string;
  mapRef: React.RefObject<mapboxgl.Map | null>;
}

export const useMapboxDirections = ({
  accessToken,
  mapRef,
}: UseMapboxDirectionsProps) => {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const destMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Helper to draw route on map
  const drawRouteOnMap = useCallback((navRoute: NavigationRoute) => {
    const map = mapRef.current;
    if (!map || !map.getStyle()) return;

    const coords = navRoute.geometry.coordinates as [number, number][];
    
    // Add/Update Source
    if (map.getSource("nav-route")) {
      (map.getSource("nav-route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        properties: {},
        geometry: navRoute.geometry,
      });
    } else {
      map.addSource("nav-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: navRoute.geometry,
        },
      });
    }

    // Add/Update Layer (ensure it's on top)
    if (map.getLayer("nav-route-line")) {
      map.removeLayer("nav-route-line");
    }
    
    map.addLayer({
      id: "nav-route-line",
      type: "line",
      source: "nav-route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#F59E0B", // High-contrast Amber for navigation
        "line-width": 6,          // Thicker line
        "line-opacity": 0.8,
      },
    });

    // Fit bounds
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );
    map.fitBounds(bounds, { padding: 80, duration: 1200 });

    // Add/Update Destination Marker
    destMarkerRef.current?.remove();
    const el = document.createElement("div");
    el.className = "dest-marker";
    el.style.cssText = `
      width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
      background: #EF4444; transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    const inner = document.createElement("div");
    inner.style.cssText =
      "width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);";
    el.appendChild(inner);

    const lastCoord = coords[coords.length - 1];
    destMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat(lastCoord)
      .addTo(map);
  }, [mapRef]);

  const fetchRoute = useCallback(
    async (
      origin: [number, number],
      destination: [number, number],
      destName: string,
    ) => {
      setLoading(true);
      try {
        const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
        const res = await fetch(
          `${MAPBOX_DIRECTIONS_URL}/${coords}?access_token=${accessToken}&geometries=geojson&steps=true&overview=full&language=en`,
        );
        const data = await res.json();
        if (!data.routes || data.routes.length === 0) {
          setLoading(false);
          return;
        }

        const r = data.routes[0];
        const steps: NavigationRoute["steps"] = r.legs[0].steps.map(
          (s: any) => ({
            instruction: s.maneuver.instruction,
            distance: s.distance,
            duration: s.duration,
            maneuver: {
              type: s.maneuver.type,
              modifier: s.maneuver.modifier,
            },
          }),
        );

        const navRoute: NavigationRoute = {
          distance: r.distance,
          duration: r.duration,
          steps,
          geometry: r.geometry,
        };

        setRoute(navRoute);
        setDestinationName(destName);
        setCurrentStepIndex(0);

        // Persist to localStorage
        localStorage.setItem("active_nav_route", JSON.stringify(navRoute));
        localStorage.setItem("active_nav_dest", destName);
        localStorage.setItem("active_nav_step", "0");

        // Draw route if map is ready
        if (isMapReady()) {
          drawRouteOnMap(navRoute);
        }
      } catch (e) {
        console.error("Directions error:", e);
      }
      setLoading(false);
    },
    [accessToken, isMapReady, drawRouteOnMap],
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setDestinationName("");
    setCurrentStepIndex(0);
    destMarkerRef.current?.remove();
    destMarkerRef.current = null;

    localStorage.removeItem("active_nav_route");
    localStorage.removeItem("active_nav_dest");
    localStorage.removeItem("active_nav_step");

    if (mapRef.current) {
      const m = mapRef.current;
      if (m.getLayer("nav-route-line")) m.removeLayer("nav-route-line");
      if (m.getSource("nav-route")) m.removeSource("nav-route");
    }
  }, [mapRef]);

  // Haversine distance calculation (km)
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

  // Find the closest point on the route line to the user's location
  const findClosestPointOnRoute = (userLoc: [number, number]) => {
    if (!route) return null;
    const coords = route.geometry.coordinates as [number, number][];
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < coords.length; i++) {
      const dist = haversine(userLoc, coords[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    return { pointIndex: closestIndex, distance: minDistance };
  };

  // Determine which step the user is on based on route coordinates
  const getStepIndexFromCoordinate = (pointIndex: number) => {
    if (!route || pointIndex === undefined) return 0;

    // Build coordinate-to-step mapping
    let coordCount = 0;
    for (let stepIdx = 0; stepIdx < route.steps.length; stepIdx++) {
      const step = route.steps[stepIdx];
      const stepLength = Math.round(
        (step.distance / route.distance) * route.geometry.coordinates.length,
      );
      coordCount += stepLength;
      if (pointIndex <= coordCount) {
        return stepIdx;
      }
    }
    return route.steps.length - 1;
  };

  // Sync route with map: Handles initial load and style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleStyleLoad = () => {
      if (route) {
        drawRouteOnMap(route);
      }
    };

    if (map.isStyleLoaded()) {
      if (route) drawRouteOnMap(route);
    } else {
      map.once("style.load", handleStyleLoad);
    }

    // Also handle initial route restoration from localStorage here
    if (!route) {
      const savedRouteStr = localStorage.getItem("active_nav_route");
      const savedDest = localStorage.getItem("active_nav_dest");
      if (savedRouteStr && savedDest) {
        const savedRoute = JSON.parse(savedRouteStr) as NavigationRoute;
        const savedStep = localStorage.getItem("active_nav_step");
        setRoute(savedRoute);
        setDestinationName(savedDest);
        if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));
        // Note: the next render will trigger the drawRouteOnMap in the block above
      }
    }

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [mapRef, route, drawRouteOnMap]);

  // Update step index based on user's GPS location relative to the route
  const updateStepFromLocation = useCallback(
    (userLoc: [number, number]) => {
      if (!route) return;

      const closest = findClosestPointOnRoute(userLoc);
      if (!closest || closest.distance > 0.1) return; // Only update if within 100m

      const newStepIndex = getStepIndexFromCoordinate(closest.pointIndex);

      setCurrentStepIndex((prev) => {
        const next = Math.max(prev, newStepIndex);
        if (next !== prev) {
          localStorage.setItem("active_nav_step", next.toString());
        }
        return next;
      });
    },
    [route],
  );

  return {
    route,
    destinationName,
    currentStepIndex,
    loading,
    fetchRoute,
    clearRoute,
    updateStepFromLocation,
  };
};
