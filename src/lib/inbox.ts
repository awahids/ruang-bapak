import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime, getInitials, type Profile } from "@/lib/social";

export type InboxThread = {
  id: number;
  otherId: string;
  otherUsername: string;
  otherName: string;
  otherInitials: string;
  otherColor: string;
  otherVerified: boolean;
  lastBody: string | null;
  lastFromMe: boolean;
  time: string;
  unread: number;
};

export type DirectMessage = {
  id: number;
  body: string;
  mine: boolean;
  createdAt: string;
  time: string;
};

export type NotificationType = "like" | "comment" | "reply";

export type ActivityNotification = {
  id: number;
  type: NotificationType;
  postId: number;
  preview: string;
  unread: boolean;
  time: string;
  actorName: string;
  actorUsername: string;
  actorInitials: string;
  actorColor: string;
};

type ThreadRow = {
  id: number;
  other_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_color: string;
  other_verified: boolean;
  last_body: string | null;
  last_from_me: boolean;
  last_at: string;
  unread_count: number;
};

type NotificationRow = {
  id: number;
  type: NotificationType;
  post_id: number;
  preview: string;
  read_at: string | null;
  created_at: string;
  actor: Pick<Profile, "username" | "display_name" | "avatar_color"> | null;
};

const MESSAGE_LIMIT = 200;
const NOTIFICATION_LIMIT = 50;

function client() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

const toThread = (row: ThreadRow): InboxThread => ({
  id: row.id,
  otherId: row.other_id,
  otherUsername: row.other_username,
  otherName: row.other_display_name,
  otherInitials: getInitials(row.other_display_name),
  otherColor: row.other_avatar_color,
  otherVerified: row.other_verified,
  lastBody: row.last_body,
  lastFromMe: row.last_from_me,
  time: formatRelativeTime(row.last_at),
  unread: row.unread_count,
});

export async function fetchThreads(): Promise<InboxThread[]> {
  const { data, error } = await client().from("inbox_threads").select("*").order("last_at", { ascending: false });
  if (error) throw error;

  return (data as ThreadRow[]).map(toThread);
}

export async function fetchThread(conversationId: number): Promise<InboxThread | null> {
  const { data, error } = await client().from("inbox_threads").select("*").eq("id", conversationId).maybeSingle();
  if (error) throw error;

  return data ? toThread(data as ThreadRow) : null;
}

export async function fetchMessages(conversationId: number, userId: string): Promise<DirectMessage[]> {
  const { data, error } = await client()
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MESSAGE_LIMIT);
  if (error) throw error;

  return (data as { id: number; body: string; sender_id: string; created_at: string }[])
    .map((row) => ({
      id: row.id,
      body: row.body,
      mine: row.sender_id === userId,
      createdAt: row.created_at,
      time: formatRelativeTime(row.created_at),
    }))
    .reverse();
}

export async function sendMessage(conversationId: number, body: string): Promise<void> {
  const { error } = await client().from("messages").insert({ conversation_id: conversationId, body });
  if (error) throw error;
}

/** Returns the conversation with `otherUserId`, creating it on first contact. */
export async function startConversation(otherUserId: string): Promise<number> {
  const { data, error } = await client().rpc("start_conversation", { other_user: otherUserId });
  if (error) throw error;

  return data as number;
}

export async function markConversationRead(conversationId: number): Promise<void> {
  const { error } = await client().rpc("mark_conversation_read", { conversation: conversationId });
  if (error) throw error;
}

export async function fetchNotifications(): Promise<ActivityNotification[]> {
  const { data, error } = await client()
    .from("notifications")
    .select("id, type, post_id, preview, read_at, created_at, actor:profiles!actor_id(username, display_name, avatar_color)")
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);
  if (error) throw error;

  return (data as unknown as NotificationRow[]).map((row) => {
    const actorName = row.actor?.display_name ?? "Bapak";

    return {
      id: row.id,
      type: row.type,
      postId: row.post_id,
      preview: row.preview,
      unread: row.read_at === null,
      time: formatRelativeTime(row.created_at),
      actorName,
      actorUsername: row.actor?.username ?? "",
      actorInitials: getInitials(actorName),
      actorColor: row.actor?.avatar_color ?? "hsl(205 14% 41%)",
    };
  });
}

export async function markNotificationsRead(): Promise<void> {
  const { error } = await client().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) throw error;
}

export async function fetchUnreadCounts(): Promise<{ messages: number; notifications: number }> {
  const [threads, notifications] = await Promise.all([
    client().from("inbox_threads").select("unread_count").gt("unread_count", 0),
    client().from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  if (threads.error) throw threads.error;
  if (notifications.error) throw notifications.error;

  const messages = (threads.data as Pick<ThreadRow, "unread_count">[]).reduce((sum, row) => sum + row.unread_count, 0);
  return { messages, notifications: notifications.count ?? 0 };
}

export const notificationText: Record<NotificationType, string> = {
  like: "bilang aman di postingan Bapak",
  comment: "mengomentari postingan Bapak",
  reply: "membalas komentar Bapak",
};
