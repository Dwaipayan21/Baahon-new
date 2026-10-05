import MapProvider from "../MapProvider";
import ScorecardPage from "../../Pages/ScoreCardPage";
import ProfilePage from "../../Pages/ProfilePage";
import Header from "../UI/Header";
import MapControls from "../map/MapControls";
import PandalDetailsModal from "../pandal/PandalDetailsModal";
import FoodPlaceCard from "../food/FoodPlaceCard";
import BottomNavigation from "../UI/BottomNavigation";
import SearchFilterOverlay from "../UI/search/SearchFilterOverlay";
import PandalRouteOverlay from "../routes/PandalRouteOverlay";
import ToastNotification from "../UI/ToastNotification";
import LoadingScreen from "../LoadingScreen";

const AppLayout = ({
  appReady,
  activeNavTab,
  setActiveNavTab,
  mapRef,
  filteredPandals,
  selectedPandal,
  setSelectedPandal,
  selectedPandals,
  routeSegments,
  routeData,
  metroActive,
  setMetroActive,
  activeLayer,
  userLocation,
  foodPlaces,
  selectedFoodPlace,
  setSelectedFoodPlace,
  searchQuery,
  setSearchQuery,
  searchResults,
  handleSearchPandalSelect,
  scorecard,
  pandals,
  leaderboard,
  activeRouteMode,
  user,
  activeCategory,
  setActiveCategory,
  isDesktop,
  routeModeActive,
  setRouteModeActive,
  toastMessage,
  showToast,
  handleToggleLayer,
  handleRecenter,
  handleZoom,
  modalPandal,
  setModalPandal,
  togglePandalSelection,
  selectedPandalRoute,
  selectedPandalRouteLoading,
  routeError,
  routeLoading,
  clearRoute,
  handleMetroRoute,
  handleRoadRoute,
}) => {
  return (
    <>
      <LoadingScreen ready={appReady} />

      <div
        className="relative w-full h-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-heading)]"
        style={{
          minHeight: "100dvh",
          isolation: "isolate",
        }}
      >
        {/* =========================
          MAP — BACKGROUND
      ========================== */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 0,
          }}
        >
          {activeNavTab !== "scorecard" &&
            activeNavTab !== "profile" && (
            <MapProvider
              mapRef={mapRef}
              pandals={filteredPandals}
              selectedPandal={selectedPandal}
              selectedPandals={selectedPandals}
              routeSegments={routeSegments}
              routeData={routeData}
              onSelectPandal={setSelectedPandal}
              metroActive={metroActive}
              activeLayer={activeLayer}
              userLocation={userLocation}
              foodPlaces={foodPlaces}
              selectedFoodPlace={selectedFoodPlace}
              onSelectFoodPlace={setSelectedFoodPlace}
            />
          )}
        </div>

        {/* =========================
          HEADER
      ========================== */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            zIndex: 300,
            pointerEvents: "auto",
          }}
        >
          {activeNavTab !== "scorecard" &&
            activeNavTab !== "profile" && (
              <Header
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
                searchResults={searchResults}
                onSelectPandal={handleSearchPandalSelect}
              />
            )}
        </div>

        {/* =========================
          SCORECARD
      ========================== */}
        {activeNavTab === "scorecard" && (
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{
              zIndex: 90,
              background: "var(--color-background)",
            }}
          >
            <ScorecardPage
              isActive={activeNavTab === "scorecard"}
              scorecard={scorecard}
              pandals={pandals}
              leaderboard={leaderboard}
              userLocation={userLocation}
              routeData={routeData}
              routeSegments={routeSegments}
              selectedPandals={selectedPandals}
              activeRouteMode={activeRouteMode}
              user={user}
            />
          </div>
        )}

        {/* =========================
                PROFILE
          ========================== */}
        {activeNavTab === "profile" && (
          <div
            className="absolute inset-0 overflow-y-auto"
            style={{
              zIndex: 90,
              background: "var(--color-background)",
            }}
          >
            <ProfilePage
              scorecard={scorecard}
              pandals={pandals}
              routeData={routeData}
              routeSegments={routeSegments}
              selectedPandals={selectedPandals}
              activeRouteMode={activeRouteMode}
            />
          </div>
        )}

        {/* =========================
          SEARCH + FILTER
      ========================== */}
        {activeNavTab !== "scorecard" &&
          activeNavTab !== "profile" && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              zIndex: 200,
              pointerEvents: "auto",
            }}
          >
            <SearchFilterOverlay
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              metroActive={metroActive}
              onToggleMetro={() => setMetroActive((prev) => !prev)}
              visibleCount={filteredPandals.length}
              totalCount={pandals.length}
            />
          </div>
        )}

        {/* =========================
          MAP CONTROLS
      ========================== */}
        {activeNavTab !== "scorecard" &&
          activeNavTab !== "profile" && (
          <div
            className="absolute right-3 sm:right-6"
            style={{
              zIndex: 200,
              bottom: isDesktop ? "100px" : "90px",
              pointerEvents: "auto",
            }}
          >
            <MapControls
              metroActive={metroActive}
              onToggleMetro={() => setMetroActive((prev) => !prev)}
              routeModeActive={routeModeActive}
              onToggleRouteMode={() => {
                setRouteModeActive((prev) => !prev);

                showToast(
                  routeModeActive
                    ? "Route mode disabled"
                    : "Route mode enabled"
                );
              }}
              activeLayer={activeLayer}
              onToggleLayer={handleToggleLayer}
              onRecenter={handleRecenter}
              onZoomIn={() => handleZoom(1)}
              onZoomOut={() => handleZoom(-1)}
            />
          </div>
        )}

        {/* =========================
          PANDAL / ROUTE OVERLAY
      ========================== */}
        {activeNavTab !== "scorecard" &&
          activeNavTab !== "profile" && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 250,
            }}
          >
            <div className="pointer-events-auto">
              <PandalRouteOverlay
                isDesktop={isDesktop}
                selectedPandal={selectedPandal}
                onClosePandal={() => setSelectedPandal(null)}
                onViewDetails={(p) => setModalPandal(p)}
                selectedPandals={selectedPandals}
                onTogglePandalSelection={togglePandalSelection}
                selectedPandalRoute={selectedPandalRoute}
                selectedPandalRouteLoading={selectedPandalRouteLoading}
                routeData={routeData}
                routeError={routeError}
                routeLoading={routeLoading}
                onClearRoute={clearRoute}
                onMetroRoute={handleMetroRoute}
                onRoadRoute={handleRoadRoute}
              />
            </div>
          </div>
        )}

        {activeNavTab !== "scorecard" &&
          activeNavTab !== "profile" &&
          selectedFoodPlace && (
            <FoodPlaceCard
              foodPlace={selectedFoodPlace}
              userLocation={userLocation}
              onClose={() => setSelectedFoodPlace(null)}
            />
          )}

        {/* =========================
          TOAST
      ========================== */}
        {activeNavTab !== "scorecard" &&
          activeNavTab !== "profile" && (
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              zIndex: 400,
            }}
          >
            <ToastNotification message={toastMessage} />
          </div>
        )}

        {/* =========================
          DETAILS MODAL
      ========================== */}
        {modalPandal && (
          <div
            className="absolute inset-0"
            style={{
              zIndex: 1000,
              pointerEvents: "auto",
            }}
          >
            <PandalDetailsModal
              pandal={modalPandal}
              onClose={() => setModalPandal(null)}
            />
          </div>
        )}

        {/* =========================
          BOTTOM NAVIGATION
      ========================== */}
        {!isDesktop && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              zIndex: 500,
              pointerEvents: "auto",
            }}
          >
            <BottomNavigation
              activeTab={activeNavTab}
              onSelectTab={(tab) => setActiveNavTab(tab)}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default AppLayout;