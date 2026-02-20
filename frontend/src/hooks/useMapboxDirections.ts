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

  // Safety check helper
  const isMapReady = useCallback(() => {
    const map = mapRef.current;
    return map && map.getStyle() && map.isStyleLoaded();
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

        // Draw route on map
        const map = mapRef.current;
        if (isMapReady()) {
          const m = map!;
          if (m.getSource("nav-route")) {
            (m.getSource("nav-route") as mapboxgl.GeoJSONSource).setData({
              type: "Feature",
              properties: {},
              geometry: r.geometry,
            });
          } else {
            m.addSource("nav-route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: r.geometry,
              },
            });
            m.addLayer({
              id: "nav-route-line",
              type: "line",
              source: "nav-route",
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#6B4E2E",
                "line-width": 4,
                "line-opacity": 0.8,
              },
            });
          }

          // Fit bounds
          const coords = r.geometry.coordinates as [number, number][];
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0]),
          );
          m.fitBounds(bounds, { padding: 80, duration: 1200 });

          // Add Destination Marker
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
            .addTo(m);
        }
      } catch (e) {
        console.error("Directions error:", e);
      }
      setLoading(false);
    },
    [accessToken, mapRef, isMapReady],
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

    if (isMapReady()) {
      const m = mapRef.current!;
      if (m.getLayer("nav-route-line")) m.removeLayer("nav-route-line");
      if (m.getSource("nav-route")) m.removeSource("nav-route");
    }
  }, [mapRef, isMapReady]);

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

  // Restore route from localStorage on mount
  useEffect(() => {
    const savedRoute = localStorage.getItem("active_nav_route");
    const savedDest = localStorage.getItem("active_nav_dest");

    if (savedRoute && savedDest) {
      const parsedRoute = JSON.parse(savedRoute) as NavigationRoute;
      const savedStep = localStorage.getItem("active_nav_step");

      setRoute(parsedRoute);
      setDestinationName(savedDest);
      if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));

      const map = mapRef.current;
      const drawSavedRoute = () => {
        if (!map || !map.getStyle()) return;
        if (!map.getSource("nav-route")) {
          map.addSource("nav-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: parsedRoute.geometry,
            },
          });
          map.addLayer({
            id: "nav-route-line",
            type: "line",
            source: "nav-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#6B4E2E",
              "line-width": 4,
              "line-opacity": 0.8,
            },
          });

          // Restore bounds
          const coords = parsedRoute.geometry.coordinates as [number, number][];
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0]),
          );
          map.fitBounds(bounds, { padding: 80, duration: 1000 });

          // Restore Marker
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
        }
      };

      if (map) {
        if (map.isStyleLoaded()) {
          drawSavedRoute();
        } else {
          map.once("style.load", drawSavedRoute);
        }
      }
    }
  }, [mapRef]);

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
