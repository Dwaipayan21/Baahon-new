import { refreshCrowdData } from "./crowdRefresh.service.js";

const REFRESH_INTERVAL = 15 * 60 * 1000; //every 15 min

export function startCrowdScheduler() {
  refreshCrowdData().catch((error) => {
    console.error("Initial crowd refresh failed:", error.message);
  });

  setInterval(() => {
    refreshCrowdData().catch((error) => {
      console.error("Crowd refresh failed:", error.message);
    });
  }, REFRESH_INTERVAL);

  console.log("Crowd scheduler started: every 15 minutes");
}