import { useEffect, useRef } from "react";

const UserLocationMarker = ({ map, position }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Remove marker if there is no location
    if (!position) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    // Create marker
    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        position,
        map,
        title: "Your current location",
        zIndex: 2000,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });
    } else {
      // Update existing marker
      markerRef.current.setPosition(position);
      markerRef.current.setMap(map);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, position]);

  return null;
};

export default UserLocationMarker;