import { db, domainsTable, whitelistTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

async function checkDomains() {
  const domains = ["gmil.com", "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "yahoo.com"];
  
  const results = await Promise.all(domains.map(async (domain) => {
    const [inDisposable] = await db.select().from(domainsTable).where(eq(domainsTable.domain, domain)).limit(1);
    const [inWhitelist] = await db.select().from(whitelistTable).where(eq(whitelistTable.domain, domain)).limit(1);
    return { domain, inDisposable: !!inDisposable, inWhitelist: !!inWhitelist };
  }));

  console.table(results);
  process.exit(0);
}

checkDomains().catch(err => {
  console.error(err);
  process.exit(1);
});
