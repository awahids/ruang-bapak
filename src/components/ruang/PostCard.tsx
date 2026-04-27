import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Star, MoreHorizontal, ThumbsUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { TagPill } from "./TagPill";
import type { Post } from "@/data/ruang-bapak";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  const [safe, setSafe] = useState(false);
  const [count, setCount] = useState(post.safe);

  const toggleSafe = () => {
    setSafe(!safe);
    setCount((c) => (safe ? c - 1 : c + 1));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card sm:p-6"
    >
      <header className="flex items-start gap-3">
        <Avatar initials={post.initials} color={post.color} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-bold text-foreground">{post.name}</h3>
            {post.verified && (
              <CheckCircle2 size={13} className="text-primary" strokeWidth={2.6} fill="hsl(var(--primary-soft))" />
            )}
            <span className="text-[11px] text-muted-foreground">· {post.time}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span>{post.cat}</span>
            <span className="text-border">·</span>
            <TagPill tone={post.tagTone}>{post.tag}</TagPill>
          </div>
        </div>
        <button
          aria-label="Aksi lainnya"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal size={16} />
        </button>
      </header>

      <p className="mt-4 text-[14px] leading-relaxed text-foreground/90">{post.text}</p>

      <footer className="mt-5 flex flex-wrap items-center gap-2">
        <motion.button
          onClick={toggleSafe}
          whileTap={{ scale: 0.94 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
            safe
              ? "bg-accent text-accent-foreground shadow-soft"
              : "bg-clay-soft text-clay hover:bg-clay/15"
          )}
        >
          <ThumbsUp size={13} strokeWidth={2.4} />
          Aman Pak? {count}
        </motion.button>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary">
          <MessageSquare size={13} strokeWidth={2.4} />
          Balas {post.reply}
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary">
          <Star size={13} strokeWidth={2.4} />
          Dukung {post.support}
        </button>
      </footer>
    </motion.article>
  );
}
