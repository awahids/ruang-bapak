import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import { MessageSquare, Bell, UserPlus, Info } from "lucide-react";
import type { FeedItem } from "@/data/ruang-bapak";

interface InboxItemProps {
  item: FeedItem;
  onClick?: () => void;
}

export function InboxItem({ item, onClick }: InboxItemProps) {
  const isMessage = item.tag === "Pesan Pribadi" || item.tag === "Undangan";
  
  const getIcon = () => {
    if (item.tag === "Notifikasi") return <Bell size={14} />;
    if (item.tag === "Undangan") return <UserPlus size={14} />;
    if (item.tag === "Pesan Pribadi") return <MessageSquare size={14} />;
    return <Info size={14} />;
  };

  const getTagColor = () => {
    if (item.tag === "Notifikasi") return "bg-blue-soft text-blue-700";
    if (item.tag === "Undangan") return "bg-accent-soft text-accent";
    if (item.tag === "Pesan Pribadi") return "bg-primary-soft text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div 
      onClick={onClick}
      className="group flex cursor-pointer items-start gap-4 border-b border-border/40 bg-surface px-4 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:px-6"
    >
      <div className="relative shrink-0">
        <Avatar initials={item.initials} color={item.color} size={48} />
        <div className={cn(
          "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface shadow-sm",
          getTagColor()
        )}>
          {getIcon()}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <h3 className="truncate text-[15px] font-bold text-foreground">{item.name}</h3>
            {item.verified && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
        </div>

        <p className={cn(
          "mt-1 text-[14px] leading-snug line-clamp-2",
          isMessage ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {item.text}
        </p>

        {isMessage && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
              {item.tag}
            </span>
          </div>
        )}
      </div>
      
      {isMessage && (
        <div className="flex h-full items-center pl-2">
          <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]" />
        </div>
      )}
    </div>
  );
}
