import { loadDomainCache, isDisposableDomain } from "../lib/domain-cache.js";
import { logger } from "../lib/logger.js";

async function test() {
  console.log("Loading domain cache...");
  await loadDomainCache();
  
  const testDomains = ["gmail.com", "mailinator.com", "yopmail.com"];
  
  for (const d of testDomains) {
    const result = isDisposableDomain(d);
    console.log(`Is '${d}' disposable? ${result}`);
  }
  
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
