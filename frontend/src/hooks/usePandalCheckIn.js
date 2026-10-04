import { useCallback, useEffect, useRef, useState } from "react";
import { createCheckIn, getUserCheckIns } from "../services/api";
import { getFoodPlacesForPandal } from "../services/foodService";
import { getDistanceInMeters } from "../utils/distanceUtils";

export const usePandalCheckIn = ({
  pandals,
  userLocation,
  isSignedIn,
  clerkUserId,
  getToken,
  setScorecard,
  showToast,
}) => {
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [selectedFoodPlace, setSelectedFoodPlace] = useState(null);
  const checkedInPandalsRef = useRef(new Set());
  const foodLoadedPandalsRef = useRef(new Set());
  const checkInInProgressRef = useRef(new Set());

  const loadFoodForVisitedPandal = useCallback(
    async (pandal) => {
      if (!pandal?.id) {
        return;
      }

      if (foodLoadedPandalsRef.current.has(pandal.id)) {
        return;
      }

      foodLoadedPandalsRef.current.add(pandal.id);

      try {
        const places = await getFoodPlacesForPandal(pandal.id);

        setFoodPlaces(Array.isArray(places) ? places : []);
        setSelectedFoodPlace(null);
      } catch (error) {
        console.error(
          `Failed to load food places for ${pandal.name}:`,
          error
        );

        foodLoadedPandalsRef.current.delete(pandal.id);

        // Food failure should not affect check-in.
        setFoodPlaces([]);
        setSelectedFoodPlace(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!userLocation || pandals.length === 0 || !isSignedIn) {
      return;
    }

    const processAutomaticCheckIns = async () => {
      for (const pandal of pandals) {
        if (
          !Number.isFinite(pandal.lat) ||
          !Number.isFinite(pandal.lng)
        ) {
          continue;
        }

        if (
          checkedInPandalsRef.current.has(pandal.id)
        ) {
          continue;
        }

        if (
          checkInInProgressRef.current.has(pandal.id)
        ) {
          continue;
        }

        const distance = getDistanceInMeters(
          userLocation.lat,
          userLocation.lng,
          pandal.lat,
          pandal.lng
        );

        if (distance > 100) {
          continue;
        }

        checkInInProgressRef.current.add(
          pandal.id
        );

        try {
          const token = await getToken();

          const result = await createCheckIn(
            {
              pandalId: pandal.id,
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            },
            token
          );

          checkedInPandalsRef.current.add(
            pandal.id
          );

          showToast(
            `📍 ${result.pandalName} visited! +${result.points} points`
          );

          await loadFoodForVisitedPandal(pandal);

          try {
            const token = await getToken();
            const updatedScorecard =
              await getUserCheckIns(token);

            setScorecard({
              totalPoints:
                Number(
                  updatedScorecard?.totalPoints
                ) || 0,
              visits: Array.isArray(
                updatedScorecard?.visits
              )
                ? updatedScorecard.visits
                : [],
            });

            console.log(
              "SCORECARD REFRESHED:",
              updatedScorecard
            );
          } catch (scorecardError) {
            console.error(
              "Check-in succeeded, but failed to refresh Scorecard:",
              scorecardError
            );
          }
        } catch (error) {
          console.error("❌ AUTOMATIC CHECK-IN ERROR:", {
            error,
            status: error?.status,
            message: error?.message,
            response: error?.response,
          });

          if (error?.status === 409) {
            checkedInPandalsRef.current.add(
              pandal.id
            );

            await loadFoodForVisitedPandal(pandal);

            continue;
          } else if (error?.status === 403) {
            console.log(
              `Backend says user is outside the check-in radius for ${pandal.name}`
            );
          } else {
            console.error(
              `Automatic check-in failed for ${pandal.name}:`,
              error
            );
          }
        } finally {
          checkInInProgressRef.current.delete(
            pandal.id
          );
        }
      }
    };

    processAutomaticCheckIns();
  }, [
    userLocation,
    pandals,
    isSignedIn,
    clerkUserId,
    getToken,
    loadFoodForVisitedPandal,
    setScorecard,
    showToast,
  ]);

  return {
    foodPlaces,
    selectedFoodPlace,
    setSelectedFoodPlace,
  };
};