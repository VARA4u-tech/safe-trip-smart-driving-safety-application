import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "./useAuth";

// Helper to calculate distance
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function useTrafficIncidents(
  map: mapboxgl.Map | null,
  userLocation: [number, number],
) {
  const { session } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const lastFetchRef = useRef<{ lat: number; lon: number; time: number }>({
    lat: 0,
    lon: 0,
    time: 0,
  });

  useEffect(() => {
    if (!map || !userLocation) return;

    const isMapReady = () => map && map.getStyle() && map.isStyleLoaded();

    const initLayer = () => {
      if (!isMapReady()) return;

      if (!map.getSource("traffic-incidents")) {
        map.addSource("traffic-incidents", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        if (!map.getLayer("traffic-incidents-layer")) {
          map.addLayer({
            id: "traffic-incidents-layer",
            type: "circle",
            source: "traffic-incidents",
            minzoom: 11,
            paint: {
              "circle-radius": 8,
              "circle-color": [
                "match",
                ["get", "type"],
                "Accident",
                "#EF4444",
                "Road Works",
                "#F59E0B",
                "Traffic Jam",
                "#DC2626",
                "#3B82F6",
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
            },
          });
        }

        map.on("click", "traffic-incidents-layer", (e) => {
          const props = e.features?.[0]?.properties;
          if (props) {
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="color:black;font-weight:bold;">${props.type}</div><div>${props.description}</div>`,
              )
              .addTo(map);
          }
        });
        map.on(
          "mouseenter",
          "traffic-incidents-layer",
          () => (map.getCanvas().style.cursor = "pointer"),
        );
        map.on(
          "mouseleave",
          "traffic-incidents-layer",
          () => (map.getCanvas().style.cursor = ""),
        );
      }
    };

    if (map.isStyleLoaded()) {
      initLayer();
    } else {
      map.once("style.load", initLayer);
    }

    const distMoved = getDistance(
      lastFetchRef.current.lat,
      lastFetchRef.current.lon,
      userLocation[1],
      userLocation[0],
    );
    const timeElapsed = Date.now() - lastFetchRef.current.time;

    // Only fetch if moved > 500m OR 2 minutes passed
    if (
      lastFetchRef.current.time !== 0 &&
      distMoved < 0.5 &&
      timeElapsed < 120000
    ) {
      return;
    }

    const fetchIncidents = async () => {
      try {
        lastFetchRef.current = {
          lat: userLocation[1],
          lon: userLocation[0],
          time: Date.now(),
        };

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(
          `${BACKEND_URL}/api/traffic/incidents?lat=${userLocation[1]}&lon=${userLocation[0]}&radius=10000`,
          { headers },
        );
        const data = await res.json();

        if (data.incidents && isMapReady()) {
          setIncidents(data.incidents);

          const features = data.incidents.map((inc: any) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: inc.geometry.coordinates,
            },
            properties: {
              type: inc.type,
              description: inc.description,
              severity: inc.severity,
            },
          }));

          const source = map.getSource(
            "traffic-incidents",
          ) as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData({
              type: "FeatureCollection",
              features: features,
            });
          }
        }
      } catch (e) {
        console.error("Traffic incidents fetch error", e);
      }
    };

    fetchIncidents();
  }, [map, userLocation, session]);

  return incidents;
}
