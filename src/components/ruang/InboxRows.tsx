import { CornerDownRight, MessageSquare, ThumbsUp } from "lucide-react";
import type { ActivityNotification, InboxThread, NotificationType } from "@/lib/inbox";
import { notificationText } from "@/lib/inbox";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

const rowClassName =
  "group flex w-full cursor-pointer items-start gap-4 border-b border-border/40 px-4 py-4 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] sm:px-6";

export function ThreadRow({ thread, onOpen }: { thread: InboxThread; onOpen: () => void }) {
  const unread = thread.unread > 0;

  return (
    <button type="button" onClick={onOpen} className={cn(rowClassName, unread ? "bg-primary/5" : "bg-surface")}>
      <Avatar initials={thread.otherInitials} color={thread.otherColor} size={48} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h3 className="truncate text-[15px] font-bold text-foreground">{thread.otherName}</h3>
            <span className="truncate text-xs text-muted-foreground">@{thread.otherUsername}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{thread.time}</span>
        </div>

        <p className={cn("mt-1 line-clamp-2 text-[14px] leading-snug", unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
          {thread.lastBody === null ? (
            <span className="italic">Belum ada pesan. Sapa duluan, Pak!</span>
          ) : (
            <>
              {thread.lastFromMe && <span className="text-muted-foreground">Anda: </span>}
              {thread.lastBody}
            </>
          )}
        </p>
      </div>

      {unread && (
        <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
          {thread.unread}
        </span>
      )}
    </button>
  );
}

const notificationIcon: Record<NotificationType, { icon: typeof ThumbsUp; className: string }> = {
  like: { icon: ThumbsUp, className: "bg-accent-soft text-accent" },
  comment: { icon: MessageSquare, className: "bg-primary-soft text-primary" },
  reply: { icon: CornerDownRight, className: "bg-blue-soft text-blue-700" },
};

export function NotificationRow({ notification, onOpen }: { notification: ActivityNotification; onOpen: () => void }) {
  const { icon: Icon, className } = notificationIcon[notification.type];

  return (
    <button type="button" onClick={onOpen} className={cn(rowClassName, notification.unread ? "bg-primary/5" : "bg-surface")}>
      <div className="relative shrink-0">
        <Avatar initials={notification.actorInitials} color={notification.actorColor} size={48} />
        <span className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface", className)}>
          <Icon size={11} strokeWidth={2.5} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] leading-snug text-foreground">
            <span className="font-bold">{notification.actorName}</span> {notificationText[notification.type]}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{notification.time}</span>
        </div>
        {notification.preview && (
          <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">"{notification.preview}"</p>
        )}
      </div>

      {notification.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Belum dibaca" />}
    </button>
  );
}
