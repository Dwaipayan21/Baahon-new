import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import MapLibreMap from "./MapLibreMap";
import MapLibrePandalMarkers from "./MapLibrePandalMarkers";
import MapLibreFoodMarkers from "./MapLibreFoodMarker";
import MapLibreUserLocation from "./MapLibreUserLocation";
import MapLibreMetroLayer from "./MapLibreMetroLayer";
import MapLibreRouteLayer from "./MapLibreRouteLayer";
import MapLibreToilet from "./MapLibreToilet";
import MapLibreMedicine from "./MapLibreMedicine";

/**
 * MapLibreCanvas
 *
 * Drop-in replacement for GoogleMapCanvas.
 * Exposes flyTo / zoomIn / zoomOut via forwardRef for App.jsx.
 */
const MapLibreCanvas = forwardRef(function MapLibreCanvas(
  {
    pandals = [],
    selectedPandal,
    selectedPandals = [],
    routeSegments = [],
    routeData = null,
    onSelectPandal,
    metroActive = true,
    toiletsActive = false,
    medicinesActive = false,
    userLocation,
    foodPlaces = [],
    selectedFoodPlace = null,
    onSelectFoodPlace,
  },
  ref
) {
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (!mapInstance || !selectedPandal) {
      return;
    }

    if (
      !Number.isFinite(selectedPandal.lat) ||
      !Number.isFinite(selectedPandal.lng)
    ) {
      return;
    }

    mapInstance.flyTo({
      center: [
        selectedPandal.lng,
        selectedPandal.lat,
      ],
      duration: 600,
    });
  }, [mapInstance, selectedPandal]);

  useEffect(() => {
    if (!mapInstance || !userLocation) {
      return;
    }

    if (
      !Number.isFinite(userLocation.lat) ||
      !Number.isFinite(userLocation.lng)
    ) {
      return;
    }

    mapInstance.flyTo({
      center: [
        userLocation.lng,
        userLocation.lat,
      ],
      zoom: 14,
      duration: 700,
    });
  }, [mapInstance, userLocation]);

  // Expose map controls to parent (App.jsx handleZoom / handleRecenter)
  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance,
    flyTo: (options) => mapInstance?.flyTo(options),
    zoomIn: () => mapInstance?.zoomIn(),
    zoomOut: () => mapInstance?.zoomOut(),
  }), [mapInstance]);

  return (
    <>
      {/* The MapLibre DOM container fills the parent absolutely */}
      <MapLibreMap onMapReady={setMapInstance} />

      {/* Imperative layer components — return null, operate on map instance */}
      {mapInstance && (
        <>
          <MapLibreMetroLayer
            map={mapInstance}
            metroActive={metroActive}
          />

          <MapLibreToilet
            map={mapInstance}
            toiletsActive={toiletsActive}
          />

          <MapLibreMedicine
            map={mapInstance}
            medicinesActive={medicinesActive}
          />

          <MapLibreRouteLayer
            map={mapInstance}
            routeData={routeData}
            routeSegments={routeSegments}
          />

          <MapLibrePandalMarkers
            map={mapInstance}
            pandals={pandals}
            selectedPandal={selectedPandal}
            selectedPandals={selectedPandals}
            onSelectPandal={onSelectPandal}
          />

          <MapLibreFoodMarkers
            map={mapInstance}
            foodPlaces={foodPlaces}
            selectedFoodPlace={selectedFoodPlace}
            onSelectFoodPlace={onSelectFoodPlace}
          />

          <MapLibreUserLocation
            map={mapInstance}
            position={userLocation}
          />
        </>
      )}
    </>
  );
});

export default MapLibreCanvas;
