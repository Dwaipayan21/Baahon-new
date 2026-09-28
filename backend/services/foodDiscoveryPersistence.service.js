/**
 * Food Discovery + Persistence Workflow Service (Backend)
 * 
 * Orchestrates food discovery (foodDiscovery.service.js) and food persistence (foodPersistence.service.js)
 * to safely discover and upsert food places for Durga Puja pandals into MongoDB.
 * 
 * Identity for deduplication:
 *   { source, sourceId, pandalId }
 * 
 * Safety Guarantees:
 * - Upsert-only: Never deletes, clears, or replaces existing food places.
 * - Fault isolation: If discovery fails, persistence does not execute with partial data.
 * - Non-leaking errors: Database connection strings and API keys are strictly sanitized.
 * - Controlled sequential execution in batch mode to respect external API boundaries.
 */

const defaultDiscoveryService = require("./foodDiscovery.service.js");
const defaultPersistenceService = require("./foodPersistence.service.js");

/**
 * Executes discovery and persistence for a single pandal object.
 * 
 * @param {object} pandal Pandal object or Mongoose document
 * @param {object} [options]
 * @param {number} [options.radiusMeters] Search radius in meters
 * @param {number} [options.limit] Max places to discover
 * @param {object} [options.discoveryService] Service override for discovery
 * @param {object} [options.persistenceService] Service override for persistence
 * @returns {Promise<{ pandalId: string, pandalName: string, discovered: number, persisted: object }>}
 */
async function discoverAndPersistFoodForPandal(pandal, options = {}) {
  const discoveryService = options.discoveryService || defaultDiscoveryService;
  const persistenceService = options.persistenceService || defaultPersistenceService;

  if (!pandal || typeof pandal !== "object") {
    const err = new Error("Pandal object is required for discovery and persistence");
    err.name = "ValidationError";
    throw err;
  }

  const pandalId = pandal._id ? String(pandal._id) : (pandal.id ? String(pandal.id) : null);
  const pandalName = pandal.name || "Unknown Pandal";

  if (!pandalId) {
    const err = new Error(`Pandal "${pandalName}" must have a valid identifier (_id or id)`);
    err.name = "ValidationError";
    throw err;
  }

  // 1. Pass supported discovery options
  const discoveryOptions = {};
  if (options.radiusMeters !== undefined) discoveryOptions.radiusMeters = options.radiusMeters;
  if (options.limit !== undefined) discoveryOptions.limit = options.limit;
  if (options.apiKey !== undefined) discoveryOptions.apiKey = options.apiKey;

  // 2. Discover nearby food places
  let discoveryResult;
  try {
    discoveryResult = await discoveryService.discoverFoodNearPandal(pandal, discoveryOptions);
  } catch (discErr) {
    const sanitizedMsg = persistenceService.sanitizeDatabaseError
      ? persistenceService.sanitizeDatabaseError(discErr)
      : discErr.message;
    const err = new Error(`Discovery failure for pandal "${pandalName}": ${sanitizedMsg}`);
    err.name = "FoodDiscoveryError";
    err.pandalId = pandalId;
    err.pandalName = pandalName;
    throw err;
  }

  // Handle explicit failure return from discovery service
  if (!discoveryResult || discoveryResult.success === false) {
    const reason = discoveryResult?.error || "Discovery service returned unsuccessful status";
    const err = new Error(`Discovery failed for pandal "${pandalName}": ${reason}`);
    err.name = "FoodDiscoveryError";
    err.pandalId = pandalId;
    err.pandalName = pandalName;
    throw err;
  }

  const places = Array.isArray(discoveryResult.places) ? discoveryResult.places : [];

  // 3. Handle empty discovery results cleanly without unnecessary database operations
  if (places.length === 0) {
    return {
      pandalId,
      pandalName,
      discovered: 0,
      persisted: {
        total: 0,
        created: 0,
        updated: 0,
        failed: 0,
        data: [],
        errors: []
      }
    };
  }

  // 4. Persist discovered food places
  // Pass Model override if provided in options
  const persistenceOptions = {};
  if (options.Model) persistenceOptions.Model = options.Model;

  let persistenceResult;
  try {
    persistenceResult = await persistenceService.persistFoodPlaces(places, persistenceOptions);
  } catch (persistErr) {
    const sanitizedMsg = persistenceService.sanitizeDatabaseError
      ? persistenceService.sanitizeDatabaseError(persistErr)
      : persistErr.message;
    const err = new Error(`Persistence failure for pandal "${pandalName}": ${sanitizedMsg}`);
    err.name = "FoodPersistenceError";
    err.pandalId = pandalId;
    err.pandalName = pandalName;
    throw err;
  }

  return {
    pandalId,
    pandalName,
    discovered: places.length,
    persisted: persistenceResult
  };
}

/**
 * Executes discovery and persistence sequentially for a batch of pandals.
 * Continues processing subsequent pandals if one pandal encounters an error.
 * 
 * @param {object[]} pandals Array of pandals
 * @param {object} [options]
 * @param {number} [options.radiusMeters]
 * @param {number} [options.limit]
 * @param {number} [options.requestDelayMs=0] Optional delay between pandals (ms)
 * @returns {Promise<object>} Batch processing summary
 */
async function discoverAndPersistFoodForPandals(pandals, options = {}) {
  if (!Array.isArray(pandals) || pandals.length === 0) {
    return {
      totalPandals: 0,
      successfulPandals: 0,
      failedPandals: 0,
      totalDiscovered: 0,
      totalCreated: 0,
      totalUpdated: 0,
      results: [],
      errors: []
    };
  }

  const summary = {
    totalPandals: pandals.length,
    successfulPandals: 0,
    failedPandals: 0,
    totalDiscovered: 0,
    totalCreated: 0,
    totalUpdated: 0,
    results: [],
    errors: []
  };

  const delayMs = options.requestDelayMs || 0;

  for (let i = 0; i < pandals.length; i++) {
    const pandal = pandals[i];
    const pandalId = pandal?._id ? String(pandal._id) : (pandal?.id ? String(pandal.id) : `pandal-${i}`);
    const pandalName = pandal?.name || `Pandal ${i + 1}`;

    try {
      const result = await discoverAndPersistFoodForPandal(pandal, options);
      summary.successfulPandals++;
      summary.totalDiscovered += result.discovered;
      summary.totalCreated += result.persisted.created;
      summary.totalUpdated += result.persisted.updated;
      summary.results.push(result);
    } catch (err) {
      summary.failedPandals++;
      summary.errors.push({
        pandalId,
        pandalName,
        error: err.message
      });
    }

    // Optional delay between requests to respect rate limits
    if (delayMs > 0 && i < pandals.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return summary;
}

module.exports = {
  discoverAndPersistFoodForPandal,
  discoverAndPersistFoodForPandals
};
