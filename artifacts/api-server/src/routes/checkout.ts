import { Router } from "express";
import { db, usersTable, planConfigsTable, paymentSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/session.js";
import { getPlanConfig } from "../lib/auth.js";
import Stripe from "stripe";

const router = Router();

// Simple in-memory idempotency guard for PayPal order IDs.
// For a multi-process deployment this should move to Redis or the DB.
const processedPayPalOrders = new Set<string>();

async function getPaymentSettings() {
  const [settings] = await db
    .select()
    .from(paymentSettingsTable)
    .where(eq(paymentSettingsTable.id, 1))
    .limit(1);
  return settings || null;
}

async function getPayPalToken(clientId: string, secret: string, mode: string) {
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json() as { access_token?: string };
  return { token: data.access_token || "", base };
}

// ─── Stripe Checkout ─────────────────────────────────────────────────────────

const checkoutStripeSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PRO", "MAX"]), // Expanded for new tiers
  credits: z.number().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

function calculateDynamicPrice(plan: string, credits: number): number {
  // Logic matches the tiers defined in the frontend pricing.tsx
  if (plan === "BASIC") {
    if (credits <= 5000) return 19;
    if (credits <= 10000) return 29;
    return 49;
  }
  if (plan === "PRO") {
    if (credits <= 50000) return 89;
    if (credits <= 100000) return 149;
    return 299;
  }
  if (plan === "MAX") {
    if (credits <= 500000) return 499;
    if (credits <= 1000000) return 899;
    return 1999;
  }
  return 0;
}

router.post("/stripe", requireAuth, async (req, res) => {
  const result = checkoutStripeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { plan, credits, successUrl, cancelUrl } = result.data;

  const settings = await getPaymentSettings();
  if (!settings || settings.gateway !== "STRIPE" || !settings.stripeEnabled || !settings.stripeSecretKey) {
    res.status(400).json({ error: "Stripe is not configured or not enabled" });
    return;
  }

  const [user] = await db
    .select({ email: usersTable.email, id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Calculate price: if credits is provided, use dynamic price. Else use plan row price.
  let priceInCents = 0;
  let requestLimit = credits || 0;

  if (credits) {
    priceInCents = Math.round(calculateDynamicPrice(plan, credits) * 100);
  } else {
    const [planRow] = await db.select({ price: planConfigsTable.price }).from(planConfigsTable).where(eq(planConfigsTable.plan, plan)).limit(1);
    priceInCents = Math.round((planRow?.price ?? (plan === "BASIC" ? 19 : 89)) * 100);
    if (!requestLimit) {
      const planConfig = await getPlanConfig(plan);
      requestLimit = planConfig.requestLimit;
    }
  }

  const stripe = new Stripe(settings.stripeSecretKey);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `LeadCop ${plan} Plan`,
            description: `${requestLimit.toLocaleString()} requests/month`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: user.email,
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      userId: String(user.id),
      plan,
      credits: String(requestLimit),
      planPriceCents: String(priceInCents),
    },
  });

  res.json({ sessionUrl: session.url });
});

// ─── PayPal Create Order ─────────────────────────────────────────────────────

const paypalCreateSchema = z.object({
  plan: z.enum(["BASIC", "PRO", "MAX"]),
  credits: z.number().optional(),
});

router.post("/paypal/create-order", requireAuth, async (req, res) => {
  const result = paypalCreateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { plan, credits } = result.data;

  const settings = await getPaymentSettings();
  if (!settings || settings.gateway !== "PAYPAL" || !settings.paypalEnabled || !settings.paypalClientId || !settings.paypalSecret) {
    res.status(400).json({ error: "PayPal is not configured or not enabled" });
    return;
  }

  let requestLimit = credits || 0;
  let finalPrice = 0;

  if (credits) {
    finalPrice = calculateDynamicPrice(plan, credits);
  } else {
    const [planRow] = await db.select({ price: planConfigsTable.price }).from(planConfigsTable).where(eq(planConfigsTable.plan, plan)).limit(1);
    finalPrice = planRow?.price ?? (plan === "BASIC" ? 19 : 89);
    if (!requestLimit) {
      const planConfig = await getPlanConfig(plan);
      requestLimit = planConfig.requestLimit;
    }
  }

  const priceStr = finalPrice.toFixed(2);
  const { token, base } = await getPayPalToken(settings.paypalClientId, settings.paypalSecret, settings.paypalMode);

  // Store userId + plan + expectedAmount + credits in custom_id
  const customId = `${req.userId}:${plan}:${priceStr}:${requestLimit}`;

  const orderResp = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: priceStr },
          description: `LeadCop ${plan} Plan (${requestLimit.toLocaleString()} credits)`,
          custom_id: customId,
        },
      ],
    }),
  });

  const order = await orderResp.json() as { id?: string };
  if (!order.id) {
    res.status(500).json({ error: "Failed to create PayPal order" });
    return;
  }

  res.json({ orderId: order.id });
});

// ─── PayPal Capture Order ─────────────────────────────────────────────────────

const paypalCaptureSchema = z.object({
  orderId: z.string().min(1),
});

router.post("/paypal/capture-order", requireAuth, async (req, res) => {
  const result = paypalCaptureSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { orderId } = result.data;

  // Idempotency: reject already-processed orders
  if (processedPayPalOrders.has(orderId)) {
    res.status(409).json({ error: "Order already processed" });
    return;
  }

  const settings = await getPaymentSettings();
  if (!settings || settings.gateway !== "PAYPAL" || !settings.paypalEnabled || !settings.paypalClientId || !settings.paypalSecret) {
    res.status(400).json({ error: "PayPal is not configured or not enabled" });
    return;
  }

  const { token, base } = await getPayPalToken(settings.paypalClientId, settings.paypalSecret, settings.paypalMode);

  // Fetch the order first to verify custom_id BEFORE capturing
  const orderFetchResp = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  type PayPalPurchaseUnit = {
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
  };
  type PayPalOrder = {
    id?: string;
    status?: string;
    purchase_units?: PayPalPurchaseUnit[];
  };

  const orderData = await orderFetchResp.json() as PayPalOrder;
  const purchaseUnit = orderData.purchase_units?.[0];

  if (!purchaseUnit?.custom_id) {
    res.status(400).json({ error: "Order missing custom_id" });
    return;
  }

  // Parse custom_id: "userId:plan:price:credits"
  const parts = purchaseUnit.custom_id.split(":");
  if (parts.length < 3) {
    res.status(400).json({ error: "Malformed order custom_id" });
    return;
  }

  const [orderUserId, orderPlan, orderPrice, orderCredits] = parts;

  // Verify the order belongs to the authenticated user
  if (parseInt(orderUserId) !== req.userId) {
    res.status(403).json({ error: "Order does not belong to this user" });
    return;
  }

  // Double check amount if not using credits (basic tamper check)
  if (!orderCredits) {
    const [captureRow] = await db.select({ price: planConfigsTable.price }).from(planConfigsTable).where(eq(planConfigsTable.plan, orderPlan)).limit(1);
    const expectedPrice = (captureRow?.price ?? (orderPlan === "BASIC" ? 19 : 89)).toFixed(2);
    if (orderPrice !== expectedPrice) {
      res.status(400).json({ error: "Order amount mismatch" });
      return;
    }
  }

  // Now capture the order
  const captureResp = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  type PayPalCapture = { status?: string };
  const capture = await captureResp.json() as PayPalCapture;
  if (capture.status !== "COMPLETED") {
    res.status(400).json({ error: "Payment not completed" });
    return;
  }

  // Mark order as processed
  processedPayPalOrders.add(orderId);

  // Upgrade user
  const config = await getPlanConfig(orderPlan);
  const finalCredits = orderCredits ? parseInt(orderCredits) : config.requestLimit;

  await db
    .update(usersTable)
    .set({ plan: orderPlan, requestLimit: finalCredits, requestCount: 0 })
    .where(eq(usersTable.id, req.userId!));

  res.json({ message: `Plan upgraded to ${orderPlan} via PayPal` });
});

export default router;
