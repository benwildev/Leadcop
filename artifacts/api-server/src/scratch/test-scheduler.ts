import { startScheduler, stopScheduler } from "../lib/scheduler.js";
import { logger } from "../lib/logger.js";

async function test() {
  console.log("Starting scheduler test (simulating 10s wait)...");
  
  // Start the scheduler
  // Note: Since we can't easily change the interval of the running scheduler,
  // we'll just check if it initializes and if the initial sync triggers correctly.
  
  await startScheduler();
  
  console.log("Scheduler started. Waiting 10 seconds to see if initial sync triggers (if cache empty)...");
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log("Stopping scheduler...");
  stopScheduler();
  
  console.log("Test finished.");
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
