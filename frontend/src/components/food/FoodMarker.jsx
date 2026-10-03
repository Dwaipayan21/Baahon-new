import { useEffect, useRef } from "react";

console.log("🔥 FOODMARKERS FILE LOADED");

const createFoodIcon = () => {
  const svg = `
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="17"
        cy="17"
        r="13"
        fill="#ffffff"
        stroke="#d97706"
        stroke-width="2"
      />

      <text
        x="17"
        y="22"
        text-anchor="middle"
        font-size="15"
        font-family="Arial, sans-serif"
      >
        🍴
      </text>
    </svg>
  `;

  return {
    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(34, 34),
    anchor: new window.google.maps.Point(17, 17),
  };
};

const FoodMarkers = ({
  map,
  foodPlaces = [],
  selectedFoodPlace,
  onSelectFoodPlace,
}) => {
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelectFoodPlace);

  useEffect(() => {
    onSelectRef.current = onSelectFoodPlace;
  }, [onSelectFoodPlace]);

  useEffect(() => {
    if (!map || !window.google?.maps) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    markersRef.current = [];

    const validPlaces = foodPlaces.filter(
      (place) =>
        Number.isFinite(Number(place.latitude)) &&
        Number.isFinite(Number(place.longitude))
    );

    markersRef.current = validPlaces.map((place) => {
      const isSelected =
        selectedFoodPlace?.id === place.id;

      const marker = new window.google.maps.Marker({
        position: {
          lat: Number(place.latitude),
          lng: Number(place.longitude),
        },
        map,
        title: place.name,
        icon: createFoodIcon(),
        zIndex: isSelected ? 850 : 300,
      });

      marker.addListener("click", () => {
        onSelectRef.current?.(place);
      });

      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });

      markersRef.current = [];
    };
  }, [map, foodPlaces, selectedFoodPlace]);

  return null;
};

export default FoodMarkers;