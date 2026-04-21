import { syncDomainsFromGitHub, getCacheSize } from "../lib/domain-cache.js";

async function test() {
  console.log("Triggering multi-source synchronization...");
  const before = getCacheSize();
  
  const { added, total } = await syncDomainsFromGitHub();
  
  console.log(`Sync completed.`);
  console.log(`- New domains added: ${added}`);
  console.log(`- Total domains in cache: ${total}`);
  
  if (total > before) {
    console.log("SUCCESS: New domains were added to the database.");
  } else {
    console.log("INFO: No new unique domains were found (they might already be in the DB).");
  }

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
