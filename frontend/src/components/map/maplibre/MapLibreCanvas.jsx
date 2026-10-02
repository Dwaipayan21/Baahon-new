import { useState, forwardRef, useImperativeHandle } from "react";
import MapLibreMap from "./MapLibreMap";
import MapLibrePandalMarkers from "./MapLibrePandalMarkers";
import MapLibreUserLocation from "./MapLibreUserLocation";
import MapLibreMetroLayer from "./MapLibreMetroLayer";
import MapLibreRouteLayer from "./MapLibreRouteLayer";

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
    userLocation,
  },
  ref
) {
  const [mapInstance, setMapInstance] = useState(null);

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
