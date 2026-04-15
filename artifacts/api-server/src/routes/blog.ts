import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "../middlewares/session.js";

const router = Router();

const createBlogPostSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or hyphens"),
  excerpt: z.string().max(500).default(""),
  content: z.string().default(""),
  author: z.string().max(100).default("LeadCop Team"),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
});

const updateBlogPostSchema = createBlogPostSchema.partial();

// ── Public routes ─────────────────────────────────────────────────────────────

router.get("/blog/posts", async (req: any, res: any) => {
  const posts = await db
    .select({
      id: blogPostsTable.id,
      title: blogPostsTable.title,
      slug: blogPostsTable.slug,
      excerpt: blogPostsTable.excerpt,
      author: blogPostsTable.author,
      coverImage: blogPostsTable.coverImage,
      status: blogPostsTable.status,
      publishedAt: blogPostsTable.publishedAt,
      createdAt: blogPostsTable.createdAt,
    })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "PUBLISHED"))
    .orderBy(desc(blogPostsTable.publishedAt));

  res.json({ posts: posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  })) });
});

router.get("/blog/posts/:slug", async (req: any, res: any) => {
  const slug = req.params.slug as string;

  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(and(eq(blogPostsTable.slug, slug), eq(blogPostsTable.status, "PUBLISHED")))
    .limit(1);

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json({
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get("/admin/blog/posts", requireAdmin, async (req: any, res: any) => {
  const posts = await db
    .select()
    .from(blogPostsTable)
    .orderBy(desc(blogPostsTable.createdAt));

  res.json({ posts: posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  })) });
});

router.post("/admin/blog/posts", requireAdmin, async (req: any, res: any) => {
  const result = createBlogPostSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.issues });
    return;
  }

  const data = result.data;
  const publishedAt = data.status === "PUBLISHED" ? new Date() : null;

  try {
    const [post] = await db
      .insert(blogPostsTable)
      .values({
        ...data,
        publishedAt,
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json({
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A post with that slug already exists" });
    } else {
      throw err;
    }
  }
});

router.patch("/admin/blog/posts/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(String(req.params.id || "0"));
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const result = updateBlogPostSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid input", details: result.error.issues });
    return;
  }

  const data = result.data;

  const [existing] = await db
    .select({ id: blogPostsTable.id, status: blogPostsTable.status, publishedAt: blogPostsTable.publishedAt })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const setPublishedAt =
    data.status === "PUBLISHED" && existing.status !== "PUBLISHED"
      ? new Date()
      : data.status === "DRAFT"
      ? null
      : existing.publishedAt;

  try {
    const [updated] = await db
      .update(blogPostsTable)
      .set({ ...data, publishedAt: setPublishedAt, updatedAt: new Date() })
      .where(eq(blogPostsTable.id, id))
      .returning();

    res.json({
      ...updated,
      publishedAt: updated.publishedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A post with that slug already exists" });
    } else {
      throw err;
    }
  }
});

router.delete("/admin/blog/posts/:id", requireAdmin, async (req: any, res: any) => {
  const id = parseInt(String(req.params.id || "0"));
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }

  const deleted = await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json({ message: "Post deleted" });
});

export default router;
