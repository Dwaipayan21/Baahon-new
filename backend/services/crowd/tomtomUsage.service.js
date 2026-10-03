import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const MONTHLY_QUOTA = 20000;
const USAGE_FILE = fileURLToPath(
  new URL("../../.cache/tomtom-api-usage.json", import.meta.url)
);

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function readMonthlyUsage(month) {
  try {
    const stored = JSON.parse(readFileSync(USAGE_FILE, "utf8"));

    if (
      stored.month === month &&
      Number.isSafeInteger(stored.requestsUsed) &&
      stored.requestsUsed >= 0
    ) {
      return stored.requestsUsed;
    }
  } catch {
    return 0;
  }

  return 0;
}

export function printTomTomUsageSummary() {
  const requestsUsed = readMonthlyUsage(getCurrentMonth());
  const requestsRemaining = Math.max(0, MONTHLY_QUOTA - requestsUsed);
  const usagePercentage = Number(
    ((requestsUsed / MONTHLY_QUOTA) * 100).toFixed(2)
  );

  console.log("════════════════════════════════");
  console.log("TomTom API Usage");
  console.log("════════════════════════════════");
  console.log(`Monthly quota       : ${MONTHLY_QUOTA.toLocaleString("en-US")}`);
  console.log(`Requests used       : ${requestsUsed.toLocaleString("en-US")}`);
  console.log(
    `Requests remaining  : ${requestsRemaining.toLocaleString("en-US")}`
  );
  console.log(`Usage               : ${usagePercentage.toFixed(2)}%`);
  console.log("════════════════════════════════");
}

export function recordTomTomRequest(label) {
  const month = getCurrentMonth();
  const requestsUsed = readMonthlyUsage(month) + 1;
  const temporaryFile = `${USAGE_FILE}.tmp`;

  try {
    mkdirSync(dirname(USAGE_FILE), { recursive: true });
    writeFileSync(
      temporaryFile,
      JSON.stringify({ month, requestsUsed }, null, 2),
      "utf8"
    );
    renameSync(temporaryFile, USAGE_FILE);
  } catch (error) {
    console.error(
      `[TomTom] Could not persist API usage counter: ${error.message}`
    );
  }

  const requestsRemaining = Math.max(0, MONTHLY_QUOTA - requestsUsed);
  const usagePercentage = Number(
    ((requestsUsed / MONTHLY_QUOTA) * 100).toFixed(2)
  );

  console.log(`[TomTom] API request #${requestsUsed} → ${label}`);
  console.log("════════════════════════════════");
  console.log("TomTom API Usage");
  console.log("════════════════════════════════");
  console.log(`Monthly quota       : ${MONTHLY_QUOTA.toLocaleString("en-US")}`);
  console.log(`Requests used       : ${requestsUsed.toLocaleString("en-US")}`);
  console.log(
    `Requests remaining  : ${requestsRemaining.toLocaleString("en-US")}`
  );
  console.log(`Usage               : ${usagePercentage.toFixed(2)}%`);
  console.log("════════════════════════════════");
}