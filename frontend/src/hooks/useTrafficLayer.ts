import { useEffect, useState, memo } from "react";
import mapboxgl from "mapbox-gl";
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "./useAuth";

export function useTrafficIncidents(
  map: mapboxgl.Map | null,
  userLocation: [number, number],
) {
  const { session } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    if (!map || !userLocation) return;

    // Safety check to ensure we don't call Mapbox methods on an uninitialized/partially-destroyed style
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

        // Event listeners for popup
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

    // 2. Fetch Incidents
    const fetchIncidents = async () => {
      try {
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
              coordinates: [
                inc.geometry.coordinates[0],
                inc.geometry.coordinates[1],
              ],
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
    const interval = setInterval(fetchIncidents, 60000); // refresh every minute

    return () => clearInterval(interval);
  }, [map, userLocation, session]);

  return incidents;
}
