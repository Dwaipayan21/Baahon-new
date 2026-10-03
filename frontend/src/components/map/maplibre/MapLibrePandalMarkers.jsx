import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

// Pandal SVG icon — temple shape, color-coded for selection state
const createPandalSvg = (selected = false) => {
  const color = selected ? "#005bb3" : "#c1121f";
  const size = selected ? 46 : 40;
  const height = selected ? 58 : 50;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${size}" height="${height}" viewBox="0 0 40 50">
      <path d="M20 1.5C9.8 1.5 1.5 9.8 1.5 20
        C1.5 33.8 20 48.8 20 48.8
        C20 48.8 38.5 33.8 38.5 20
        C38.5 9.8 30.2 1.5 20 1.5Z"
        fill="${color}" stroke="#fbbf24" stroke-width="1.8"/>
      <circle cx="20" cy="19.2" r="12.2"
        fill="#fff" stroke="#fef08a" stroke-width=".6"/>
      <path d="M20 8V12M17.5 10C17.5 11.5 20 12 20 12
        C20 12 22.5 11.5 22.5 10"
        fill="none" stroke="#d97706" stroke-width="1.2"/>
      <path d="M20 12C17 14 14 15.5 12 16.5
        C15 17 17 17 20 17
        C23 17 25 17 28 16.5
        C26 15.5 23 14 20 12Z"
        fill="${color}"/>
      <path d="M12 17H28C28 19 25 20 20 20
        C15 20 12 19 12 17Z"
        fill="#780000"/>
      <rect x="12.5" y="20" width="2.5" height="7" fill="${color}"/>
      <rect x="25" y="20" width="2.5" height="7" fill="${color}"/>
      <path d="M15 27V22.5C15 20.5 25 20.5 25 22.5V27Z"
        fill="#780000"/>
      <path d="M20 22C18.5 24 18.5 25 20 26
        C21.5 25 21.5 24 20 22Z"
        fill="#fbbf24"/>
      <rect x="10.5" y="27" width="19" height="1.8" fill="#8b0000"/>
    </svg>
  `;

  return {
    svg,
    width: size,
    height,
  };
};

const MapLibrePandalMarkers = ({
  map,
  pandals = [],
  selectedPandal,
  selectedPandals = [],
  onSelectPandal,
}) => {
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelectPandal);

  useEffect(() => {
    onSelectRef.current = onSelectPandal;
  }, [onSelectPandal]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    const newMarkers = pandals
      .map((pandal) => {
        if (
          !Number.isFinite(pandal.lat) ||
          !Number.isFinite(pandal.lng)
        ) {
          return null;
        }

        const isRouteSelected = selectedPandals.some(
          (selected) => selected.id === pandal.id
        );

        const isOpened = selectedPandal?.id === pandal.id;
        const isSelected = isOpened || isRouteSelected;

        const { svg, width, height } = createPandalSvg(isSelected);
        const element = document.createElement("div");

        element.innerHTML = svg;
        element.style.cursor = "pointer";
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        element.style.zIndex = isOpened
          ? "1000"
          : isRouteSelected
            ? "500"
            : "1";
        element.title = pandal.name;

        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current?.(pandal);
        });

        return new maplibregl.Marker({
          element,
          anchor: "bottom",
        })
          .setLngLat([pandal.lng, pandal.lat])
          .addTo(map);
      })
      .filter(Boolean);

    markersRef.current = newMarkers;

    return () => {
      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];
    };
  }, [map, pandals, selectedPandal, selectedPandals]);

  return null;
};

export default MapLibrePandalMarkers;
