import { db, domainsTable, whitelistTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function checkDomain() {
  const domain = "gmil.com";
  
  const [inDisposable] = await db.select().from(domainsTable).where(eq(domainsTable.domain, domain)).limit(1);
  const [inWhitelist] = await db.select().from(whitelistTable).where(eq(whitelistTable.domain, domain)).limit(1);

  console.log({
    domain,
    inDisposable: !!inDisposable,
    inWhitelist: !!inWhitelist
  });
  
  process.exit(0);
}

checkDomain().catch(err => {
  console.error(err);
  process.exit(1);
});
