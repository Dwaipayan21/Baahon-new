const USER_ID_KEY = "pujopath_guest_user_id";

export const getGuestUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
};

const STORAGE_KEY = "pujopath_scorecard";

const DEFAULT_SCORECARD = {
  totalPoints: 0,
  visits: [],
};

// Get the complete scorecard
export const getScorecard = () => {
  try {
    const storedScorecard = localStorage.getItem(STORAGE_KEY);

    if (!storedScorecard) {
      return DEFAULT_SCORECARD;
    }

    return JSON.parse(storedScorecard);
  } catch (error) {
    console.error("Failed to load scorecard:", error);
    return DEFAULT_SCORECARD;
  }
};

// Save the complete scorecard
const saveScorecard = (scorecard) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scorecard));
};

// Add a successful pandal visit
export const addPandalVisit = (visit) => {
  const scorecard = getScorecard();

  // Prevent duplicate visits
  const alreadyVisited = scorecard.visits.some(
    (existingVisit) => existingVisit.pandalId === visit.pandalId
  );

  if (alreadyVisited) {
    return {
      success: false,
      message: "Already visited this pandal",
      scorecard,
    };
  }

  const updatedScorecard = {
    totalPoints: scorecard.totalPoints + visit.points,
    visits: [visit, ...scorecard.visits],
  };

  saveScorecard(updatedScorecard);

  return {
    success: true,
    message: "Pandal added to scorecard",
    scorecard: updatedScorecard,
  };
};

// Clear scorecard - useful during development/testing
export const clearScorecard = () => {
  localStorage.removeItem(STORAGE_KEY);
};
