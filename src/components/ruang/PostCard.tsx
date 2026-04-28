import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, ThumbsUp, Share, MoreHorizontal, Bookmark } from "lucide-react";
import { Avatar } from "./Avatar";
import type { FeedItem } from "@/data/ruang-bapak";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: FeedItem;
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex w-full cursor-pointer gap-4 border-b border-border/40 bg-surface px-4 py-4 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] sm:px-6"
    >
      <div className="shrink-0">
        <Avatar initials={post.initials} color={post.color} size={48} />
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
            <h3 className="truncate text-[15px] font-bold text-foreground hover:underline">{post.name}</h3>
            {post.verified && (
              <CheckCircle2 size={14} className="text-primary" strokeWidth={3} />
            )}
            <span className="truncate text-sm text-muted-foreground">@{post.initials.toLowerCase()}bapak · {post.time}</span>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary">
            <MoreHorizontal size={16} />
          </button>
        </header>

        <p className="mt-1 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">{post.text}</p>

        <footer className="mt-3 flex max-w-md items-center justify-between">
          <button className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-primary-soft">
              <MessageSquare size={17} strokeWidth={2} />
            </div>
            <span className="text-xs">{post.reply}</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); toggleSafe(); }}
            className={cn(
              "group flex items-center gap-2 transition-colors",
              safe ? "text-accent" : "text-muted-foreground hover:text-accent"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              safe ? "bg-accent/10" : "group-hover:bg-accent/10"
            )}>
              <ThumbsUp size={17} strokeWidth={safe ? 2.5 : 2} fill={safe ? "currentColor" : "none"} />
            </div>
            <span className="text-xs">{count}</span>
          </button>

          <button className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-primary-soft">
              <Share size={17} strokeWidth={2} />
            </div>
            <span className="text-xs">{post.support}</span>
          </button>

          <button className="group flex items-center text-muted-foreground transition-colors hover:text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-primary-soft">
              <Bookmark size={17} strokeWidth={2} />
            </div>
          </button>
        </footer>
      </div>
    </motion.article>
  );
}
