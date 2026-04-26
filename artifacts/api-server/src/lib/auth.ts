import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db, planConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateApiKey(): string {
  return `ts_${uuidv4().replace(/-/g, "")}`;
}

export function getRequestLimit(plan: string): number {
  // 🧠 Brain: We now rely on the database configuration. 
  // This fallback is only used for temporary local sessions or legacy code.
  return 100;
}

export async function getPlanConfig(plan: string) {
  const [config] = await db
    .select()
    .from(planConfigsTable)
    .where(eq(planConfigsTable.plan, plan))
    .limit(1);

  if (!config) {
    // Fallback for plans not yet configured in the DB — should not happen in production.
    // All values here are conservative defaults.
    return {
      plan,
      requestLimit: 100,
      dataLimit: 0,
      websiteLimit: 0,
      price: 0,
      rateLimitPerSecond: 1,
      maxUsers: 1,
      logRetentionDays: 7,
      hasBulkValidation: false,
      bulkEmailLimit: 0,
      hasWebhooks: false,
      hasCustomBlocklist: false,
      hasAdvancedAnalytics: false,
      maxApiKeys: 1,
      description: null,
      features: [],
    };
  }

  // Return the DB config as-is — no overrides. The admin controls everything.
  return config;
}
