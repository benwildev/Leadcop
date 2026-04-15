import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const blogPostStatusEnum = pgEnum("blog_post_status", ["DRAFT", "PUBLISHED"]);

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  author: text("author").notNull().default("LeadCop Team"),
  coverImage: text("cover_image"),
  status: blogPostStatusEnum("status").notNull().default("DRAFT"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BlogPost = typeof blogPostsTable.$inferSelect;
export type InsertBlogPost = typeof blogPostsTable.$inferInsert;
