import React, { useState } from "react";
import { Link } from "wouter";
import { Navbar, Footer } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, User, ArrowRight, Loader2, BookOpen, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

function useBlogPosts() {
  return useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog/posts"],
    queryFn: async () => {
      const res = await fetch("/api/blog/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });
}

export default function BlogPage() {
  const { data, isLoading } = useBlogPosts();
  const [search, setSearch] = useState("");

  const posts = (data?.posts ?? []).filter(
    p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Blog
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Insights on Email Quality &amp; Lead Protection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tips, guides, and strategies for protecting your forms and improving your lead quality.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-10 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {search ? "No posts match your search." : "No posts published yet. Check back soon!"}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group glass-card rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-all duration-200"
              >
                {post.coverImage ? (
                  <div className="w-full h-44 overflow-hidden bg-muted">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-primary/10 to-violet-500/5 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-heading font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.publishedAt ? format(parseISO(post.publishedAt), "MMM d, yyyy") : ""}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                  >
                    Read article <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
