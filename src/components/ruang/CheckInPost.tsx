import { Avatar } from "./Avatar";
import { ThumbsUp, MessageSquare } from "lucide-react";
import type { FeedItem } from "@/data/ruang-bapak";

export function CheckInPost({ item }: { item: FeedItem }) {
  return (
    <div className="flex items-center gap-4 border-b border-border/40 bg-surface px-4 py-3 sm:px-6">
      <Avatar initials={item.initials} color={item.color} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-bold text-foreground">{item.name}</span>
          <span className="mx-2 text-muted-foreground">melakukan cek-in:</span>
          <span className="italic text-foreground/80">"{item.text}"</span>
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{item.time}</span>
          <span className="flex items-center gap-1"><ThumbsUp size={10} /> {item.safe}</span>
          <span className="flex items-center gap-1"><MessageSquare size={10} /> {item.reply}</span>
        </div>
      </div>
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
    </div>
  );
}
