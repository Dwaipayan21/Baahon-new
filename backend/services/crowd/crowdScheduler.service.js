import { refreshCrowdData } from "./crowdRefresh.service.js";

const REFRESH_INTERVAL = 30 * 60 * 1000; // every 30 minutes

let refreshInProgress = false;

async function runCrowdRefresh() {
  if (refreshInProgress) {
    console.log(
      "Crowd refresh already in progress. Skipping this run."
    );
    return;
  }

  refreshInProgress = true;

  try {
    await refreshCrowdData();
  } catch (error) {
    console.error("Crowd refresh failed:", error.message);
  } finally {
    refreshInProgress = false;
  }
}

export function startCrowdScheduler() {
  // Run once immediately when the server starts
  runCrowdRefresh();

  // Then run every 30 minutes
  setInterval(() => {
    runCrowdRefresh();
  }, REFRESH_INTERVAL);

  console.log("Crowd scheduler started: every 30 minutes");
}