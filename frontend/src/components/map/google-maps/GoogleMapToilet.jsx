import { useEffect, useRef } from "react";
import { toiletMarkerIcon } from "../../../utils/mapLayerIcons";

const GoogleMapToilet = ({
  map,
  toiletsActive = false,
}) => {
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    let cancelled = false;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });

      markersRef.current = [];

      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };

    if (!toiletsActive) {
      clearMarkers();
      return;
    }

    const loadToilets = async () => {
      try {
        const response = await fetch("/geojson/toilets.geojson");

        if (!response.ok) {
          throw new Error("Failed to load toilets GeoJSON");
        }

        const data = await response.json();

        if (cancelled) return;

        clearMarkers();

        infoWindowRef.current =
          new window.google.maps.InfoWindow();

        const features = Array.isArray(data.features)
          ? data.features
          : [];

        features.forEach((feature) => {
          const coordinates =
            feature?.geometry?.coordinates;

          if (
            !Array.isArray(coordinates) ||
            coordinates.length < 2
          ) {
            return;
          }

          const [lng, lat] = coordinates;

          if (
            !Number.isFinite(lng) ||
            !Number.isFinite(lat)
          ) {
            return;
          }

          const properties = feature.properties || {};

          const marker = new window.google.maps.Marker({
            map,
            position: { lat, lng },
            title: properties.name || "Public Toilet",
            icon: {
              url: toiletMarkerIcon(),
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 22),
            },
            zIndex: 20,
          });

          marker.addListener("click", () => {
            const rows = Object.entries(properties)
              .filter(
                ([key, value]) =>
                  key !== "@id" &&
                  value !== undefined &&
                  value !== null &&
                  String(value).trim() !== ""
              )
              .map(
                ([key, value]) => `
                  <div style="
                    display:flex;
                    gap:8px;
                    margin-top:6px;
                    font-size:12px;
                  ">
                    <strong style="text-transform:capitalize;">
                      ${key.replace(/_/g, " ")}
                    </strong>
                    <span>${String(value)}</span>
                  </div>
                `
              )
              .join("");

            const title =
              properties.name || "Public Toilet";

            infoWindowRef.current.setContent(`
              <div style="
                min-width:180px;
                max-width:260px;
                padding:4px;
                color:#1f2937;
              ">
                <div style="
                  font-size:15px;
                  font-weight:700;
                  margin-bottom:6px;
                ">
                  ${title}
                </div>

                ${rows || `
                  <div style="font-size:12px;color:#6b7280;">
                    Public toilet
                  </div>
                `}
              </div>
            `);

            infoWindowRef.current.open({
              map,
              anchor: marker,
            });
          });

          markersRef.current.push(marker);
        });
      } catch (error) {
        console.error(
          "Failed to load toilet GeoJSON:",
          error
        );
      }
    };

    loadToilets();

    return () => {
      cancelled = true;
      clearMarkers();
    };
  }, [map, toiletsActive]);

  return null;
};

export default GoogleMapToilet;