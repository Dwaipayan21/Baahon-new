import { useEffect, useState } from "react";
import { getLeaderboard, getUserCheckIns } from "../services/api";

export const useScorecardData = ({ isSignedIn, getToken }) => {
  const [scorecard, setScorecard] = useState({
    totalPoints: 0,
    visits: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadScorecard = async () => {
      if (!isSignedIn) {
        setScorecard({
          totalPoints: 0,
          visits: [],
        });
        return;
      }

      try {
        const token = await getToken();
        const data = await getUserCheckIns(token);

        if (cancelled) {
          return;
        }

        setScorecard({
          totalPoints: Number(data?.totalPoints) || 0,
          visits: Array.isArray(data?.visits)
            ? data.visits
            : [],
        });

      } catch (error) {
        console.error(
          "Failed to load Scorecard from backend:",
          error
        );

        if (!cancelled) {
          setScorecard({
            totalPoints: 0,
            visits: [],
          });
        }
      }
    };

    loadScorecard();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();

        setLeaderboard(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to load Scorecard:",
          error
        );

        setLeaderboard([]);
      }
    };

    loadLeaderboard();
  }, []);

  return {
    scorecard,
    setScorecard,
    leaderboard,
  };
};