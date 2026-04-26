import { Router } from "express";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { requireAuth } from "../middlewares/session.js";
import { db, usersTable, planConfigsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { getPlanConfig, generateApiKey } from "../lib/auth.js";

const router = Router();

router.get("/team", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ parentId: usersTable.parentId, plan: usersTable.plan })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.parentId) {
    res.status(403).json({ error: "Sub-users cannot manage the team." });
    return;
  }

  const teamMembers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.parentId, req.userId!))
    .orderBy(desc(usersTable.createdAt));

  const planConfig = await getPlanConfig(user.plan);
  const maxSeats = planConfig.maxUsers;
  // Master account counts as 1 seat if maxSeats > 0, so allowed sub-users = maxSeats - 1
  const allowedSubUsers = maxSeats === -1 ? -1 : Math.max(0, maxSeats - 1);

  res.json({
    members: teamMembers.map((m: any) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    total: teamMembers.length,
    allowedSubUsers,
    seatsRemaining: allowedSubUsers === -1 ? -1 : Math.max(0, allowedSubUsers - teamMembers.length),
  });
});

const inviteSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/team/invite", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ parentId: usersTable.parentId, plan: usersTable.plan })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.parentId) {
    res.status(403).json({ error: "Sub-users cannot manage the team." });
    return;
  }

  const result = inviteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input values." });
    return;
  }

  const { name, email, password } = result.data;

  // Check limits
  const planConfig = await getPlanConfig(user.plan);
  const maxSeats = planConfig.maxUsers;
  const allowedSubUsers = maxSeats === -1 ? -1 : Math.max(0, maxSeats - 1);

  if (allowedSubUsers !== -1) {
    const teamMembers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.parentId, req.userId!));

    if (teamMembers.length >= allowedSubUsers) {
      res.status(429).json({ error: `Your ${user.plan} plan limits you to ${maxSeats} user seat(s) total. Please upgrade to invite more.` });
      return;
    }
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "A user with this email already exists." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newApiKey = generateApiKey();

  const [inserted] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      apiKey: newApiKey,
      plan: user.plan, 
      parentId: req.userId!,
    })
    .returning();

  res.status(201).json({
    member: {
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      createdAt: inserted.createdAt.toISOString(),
    },
    message: "Team member added successfully.",
  });
});

router.delete("/team/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id || "0"), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const [user] = await db
    .select({ parentId: usersTable.parentId })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user || user.parentId) {
    res.status(403).json({ error: "Sub-users cannot manage the team." });
    return;
  }

  const [targetUser] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.parentId, req.userId!)))
    .limit(1);

  if (!targetUser) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ message: "Team member removed." });
});

export default router;
