import { db, domainsTable, whitelistTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

async function fixDatabase() {
  const commonProviders = [
    "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", 
    "yahoo.com", "icloud.com", "aol.com", "me.com", "mac.com",
    "gmil.com", "hotmai.com", "yaho.com" // Common typos
  ];

  console.log("🚀 Starting database cleanup...");

  // 1. Remove from disposable table
  const deleteResult = await db.delete(domainsTable)
    .where(inArray(domainsTable.domain, commonProviders));
  console.log(`✅ Removed ${deleteResult.rowCount} entries from disposable table.`);

  // 2. Add to whitelist table
  for (const domain of commonProviders) {
    await db.insert(whitelistTable)
      .values({ domain })
      .onConflictDoNothing();
  }
  console.log(`✅ Whitelisted ${commonProviders.length} domains.`);

  process.exit(0);
}

fixDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
