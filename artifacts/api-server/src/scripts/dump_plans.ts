
import { db, planConfigsTable } from "@workspace/db";

async function run() {
  const plans = await db.select().from(planConfigsTable);
  console.log(JSON.stringify(plans, null, 2));
  process.exit(0);
}

run();
