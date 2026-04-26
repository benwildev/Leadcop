
import { drizzle } from "drizzle-orm/node-postgres";
// @ts-ignore
import pg from "pg";
import { planConfigsTable } from "@workspace/db";

const DATABASE_URL = "postgres://tempshield:tempshield_pass@127.0.0.1:5432/leadcop_prod";

async function run() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);
  console.log("Cleaning up existing plans...");
  await db.delete(planConfigsTable).execute();

  console.log("Seeding requested plans: FREE, PRO, ENTERPRISE...");
  
  await db.insert(planConfigsTable).values([
    {
      plan: "FREE",
      price: 0,
      requestLimit: 1000,
      dataLimit: 0,
      websiteLimit: 1,
      maxUsers: 2,
      logRetentionDays: 7,
      hasBulkValidation: false,
      hasWebhooks: false,
      hasCustomBlocklist: false,
      hasAdvancedAnalytics: false,
      description: "Perfect for small projects or to try LeadCop",
      features: [
        "1,000 credits per month",
        "1 request per second",
        "Limited request log",
        "2 user seats"
      ]
    },
    {
      plan: "BASIC",
      price: 9,
      requestLimit: 10000,
      dataLimit: 0,
      websiteLimit: 1,
      maxUsers: 3,
      logRetentionDays: 30,
      hasBulkValidation: false,
      hasWebhooks: false,
      hasCustomBlocklist: false,
      hasAdvancedAnalytics: true,
      description: "For growing teams and projects",
      features: [
        "10,000 credits per month",
        "5 requests per second",
        "Standard request log",
        "3 user seats",
        "Email support"
      ]
    },
    {
      plan: "PRO",
      price: 49.99,
      requestLimit: 1000000, // 1M as "Unlimited"
      dataLimit: -1, // Unlimited Bulk
      websiteLimit: -1,
      maxUsers: -1,
      logRetentionDays: -1,
      hasBulkValidation: true,
      hasWebhooks: true,
      hasCustomBlocklist: true,
      hasAdvancedAnalytics: true,
      description: "Tailored solutions for enterprise-level scale",
      features: [
        "Unlimited credits per month",
        "Unlimited request per second",
        "Unlimited request log",
        "Unlimited user seats",
        "Bulk email & domain validation",
        "Custom blocklist",
        "Webhooks",
        "Early access to new features"
      ]
    },
    {
      plan: "ENTERPRISE",
      price: 0, // Shows as Custom
      requestLimit: 999999999,
      dataLimit: -1,
      websiteLimit: -1,
      maxUsers: -1,
      logRetentionDays: -1,
      hasBulkValidation: true,
      hasWebhooks: true,
      hasCustomBlocklist: true,
      hasAdvancedAnalytics: true,
      description: "Custom infrastructure for massive volume",
      features: [
        "Everything in Pro",
        "Custom credit limits",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom integration support",
        "Priority support"
      ]
    }
  ]);

  console.log("Done!");
  process.exit(0);
}

run();
