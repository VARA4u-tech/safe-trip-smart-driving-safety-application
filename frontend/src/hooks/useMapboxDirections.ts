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
  // Keep a stable ref to the latest route so map drawing is never stale
  const routeRef = useRef<NavigationRoute | null>(null);

  // ─── Core drawing function (purely imperative, no React state deps) ──────────
  const drawRouteOnMap = useCallback(
    (navRoute: NavigationRoute) => {
      const map = mapRef.current;
      if (!map) return;

      const doRender = () => {
        const coords = navRoute.geometry.coordinates as [number, number][];

        // ── Source ──────────────────────────────────────────────────────────
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

        // ── Layer (remove then re-add so it's always on top) ────────────────
        if (map.getLayer("nav-route-line")) {
          map.removeLayer("nav-route-line");
        }
        map.addLayer({
          id: "nav-route-line",
          type: "line",
          source: "nav-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#F59E0B",
            "line-width": 6,
            "line-opacity": 0.9,
          },
        });

        // ── Fit bounds ───────────────────────────────────────────────────────
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coords[0], coords[0]),
        );
        map.fitBounds(bounds, { padding: 80, duration: 1200 });

        // ── Destination marker (use Mapbox built-in for guaranteed visibility) ─
        destMarkerRef.current?.remove();
        destMarkerRef.current = new mapboxgl.Marker({ color: "#EF4444", scale: 1.2 })
          .setLngLat(coords[coords.length - 1])
          .addTo(map);
      };

      // If style is already loaded draw immediately; otherwise wait for it
      if (map.isStyleLoaded()) {
        doRender();
      } else {
        map.once("style.load", doRender);
      }
    },
    [mapRef],
  );

  // ─── Re-draw whenever the map style hot-swaps ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onStyleLoad = () => {
      if (routeRef.current) {
        drawRouteOnMap(routeRef.current);
      }
    };

    map.on("style.load", onStyleLoad);
    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [mapRef, drawRouteOnMap]);

  // ─── Restore route from localStorage on first mount ───────────────────────
  useEffect(() => {
    const savedRouteStr = localStorage.getItem("active_nav_route");
    const savedDest = localStorage.getItem("active_nav_dest");
    if (!savedRouteStr || !savedDest) return;

    const savedRoute = JSON.parse(savedRouteStr) as NavigationRoute;
    const savedStep = localStorage.getItem("active_nav_step");

    routeRef.current = savedRoute;
    setRoute(savedRoute);
    setDestinationName(savedDest);
    if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));

    drawRouteOnMap(savedRoute);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  // ─── Fetch directions from Mapbox API ─────────────────────────────────────
  const fetchRoute = useCallback(
    async (
      origin: [number, number],
      destination: [number, number],
      destName: string,
    ) => {
      setLoading(true);
      try {
        const coordStr = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
        const res = await fetch(
          `${MAPBOX_DIRECTIONS_URL}/${coordStr}?access_token=${accessToken}&geometries=geojson&steps=true&overview=full&language=en`,
        );
        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
          console.warn("No routes returned from Mapbox Directions API");
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

        // Update the ref first (synchronous, no batching delay)
        routeRef.current = navRoute;

        // Persist to localStorage
        localStorage.setItem("active_nav_route", JSON.stringify(navRoute));
        localStorage.setItem("active_nav_dest", destName);
        localStorage.setItem("active_nav_step", "0");

        // Draw on map immediately (drawRouteOnMap handles style-load internally)
        drawRouteOnMap(navRoute);

        // Update React state for UI panels
        setRoute(navRoute);
        setDestinationName(destName);
        setCurrentStepIndex(0);
      } catch (e) {
        console.error("Directions fetch error:", e);
      }
      setLoading(false);
    },
    [accessToken, drawRouteOnMap],
  );

  // ─── Clear everything ──────────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    routeRef.current = null;
    setRoute(null);
    setDestinationName("");
    setCurrentStepIndex(0);
    destMarkerRef.current?.remove();
    destMarkerRef.current = null;

    localStorage.removeItem("active_nav_route");
    localStorage.removeItem("active_nav_dest");
    localStorage.removeItem("active_nav_step");

    const map = mapRef.current;
    if (map) {
      if (map.getLayer("nav-route-line")) map.removeLayer("nav-route-line");
      if (map.getSource("nav-route")) map.removeSource("nav-route");
    }
  }, [mapRef]);

  // ─── Haversine distance (km) ───────────────────────────────────────────────
  const haversine = useCallback(
    (a: [number, number], b: [number, number]): number => {
      const R = 6371;
      const dLat = ((b[1] - a[1]) * Math.PI) / 180;
      const dLon = ((b[0] - a[0]) * Math.PI) / 180;
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[1] * Math.PI) / 180) *
          Math.cos((b[1] * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    },
    [],
  );

  // ─── Find closest point on route to user location ─────────────────────────
  const findClosestPointOnRoute = useCallback(
    (userLoc: [number, number]) => {
      const r = routeRef.current;
      if (!r) return null;
      const coords = r.geometry.coordinates as [number, number][];
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
    },
    [haversine],
  );

  // ─── Map point index → step index ─────────────────────────────────────────
  const getStepIndexFromCoordinate = useCallback(
    (pointIndex: number) => {
      const r = routeRef.current;
      if (!r) return 0;

      let coordCount = 0;
      for (let stepIdx = 0; stepIdx < r.steps.length; stepIdx++) {
        const step = r.steps[stepIdx];
        const stepLength = Math.round(
          (step.distance / r.distance) * r.geometry.coordinates.length,
        );
        coordCount += stepLength;
        if (pointIndex <= coordCount) return stepIdx;
      }
      return r.steps.length - 1;
    },
    [],
  );

  // ─── Update step index based on user GPS position ─────────────────────────
  const updateStepFromLocation = useCallback(
    (userLoc: [number, number]) => {
      if (!routeRef.current) return;

      const closest = findClosestPointOnRoute(userLoc);
      if (!closest || closest.distance > 0.1) return;

      const newStepIndex = getStepIndexFromCoordinate(closest.pointIndex);
      setCurrentStepIndex((prev) => {
        const next = Math.max(prev, newStepIndex);
        if (next !== prev) {
          localStorage.setItem("active_nav_step", next.toString());
        }
        return next;
      });
    },
    [findClosestPointOnRoute, getStepIndexFromCoordinate],
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
