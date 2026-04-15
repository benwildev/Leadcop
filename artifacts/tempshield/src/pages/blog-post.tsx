import React from "react";
import { Link, useParams } from "wouter";
import { Navbar, Footer } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, User, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string | null;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-28 pb-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">This article doesn't exist or may have been removed.</p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All Posts
          </Link>

          {post.coverImage && (
            <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden bg-muted mb-8">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(parseISO(post.publishedAt), "MMMM d, yyyy")}
              </span>
            )}
          </div>

          {post.excerpt && (
            <p className="text-lg text-muted-foreground italic mb-8 leading-relaxed">{post.excerpt}</p>
          )}

          <div
            className="prose prose-invert prose-violet max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
              prose-li:text-muted-foreground
              prose-hr:border-border"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
