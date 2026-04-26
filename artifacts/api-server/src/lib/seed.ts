import { db, planConfigsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const DEFAULT_PLAN_CONFIGS = [
  {
    plan: "FREE" as const,
    requestLimit: 10,
    dataLimit: 0,
    websiteLimit: 0,
    price: 0,
  },
  {
    plan: "BASIC" as const,
    requestLimit: 1000,
    dataLimit: 100,
    websiteLimit: 1,
    price: 9,
  },
  {
    plan: "PRO" as const,
    requestLimit: 10000,
    dataLimit: 500,
    websiteLimit: 10,
    price: 29,
  },
];

export async function seedPlanConfigs(): Promise<void> {
  await db
    .insert(planConfigsTable)
    .values(DEFAULT_PLAN_CONFIGS)
    .onConflictDoNothing();
}
