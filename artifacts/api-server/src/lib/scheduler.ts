import { logger } from "./logger.js";
import { syncDomainsFromGitHub, getLastLoaded, getCacheSize } from "./domain-cache.js";

/**
 * Background scheduler for periodic system tasks.
 * Currently handles:
 * - Automatic disposable domain blocklist synchronization (every 24 hours)
 */

const DOMAIN_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

let domainSyncTimer: NodeJS.Timeout | null = null;

async function runDomainSync() {
  logger.info("Starting automatic domain database synchronization...");
  try {
    const { added, total } = await syncDomainsFromGitHub();
    logger.info({ added, total }, "Automatic domain database synchronization completed successfully.");
  } catch (err) {
    logger.error({ err }, "Automatic domain database synchronization failed.");
  }
}

export async function startScheduler() {
  logger.info("Background scheduler system starting...");

  // 1. Domain Blocklist Sync Scheduling
  // If the cache is empty or hasn't been loaded, load it during startup
  const cacheSize = getCacheSize();
  const lastLoaded = getLastLoaded();

  if (cacheSize === 0 || !lastLoaded) {
    logger.info("Domain cache appears empty at startup, triggering initial sync...");
    // Run initial sync after a short delay to not block main thread startup
    setTimeout(() => runDomainSync().catch(() => {}), 5000);
  }

  // Set up periodic sync
  domainSyncTimer = setInterval(runDomainSync, DOMAIN_SYNC_INTERVAL_MS);

  logger.info("Background scheduler system initialized.");
}

export function stopScheduler() {
  if (domainSyncTimer) {
    clearInterval(domainSyncTimer);
    domainSyncTimer = null;
  }
  logger.info("Background scheduler system stopped.");
}
