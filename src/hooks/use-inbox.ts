import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchMessages,
  fetchNotifications,
  fetchThread,
  fetchThreads,
  fetchUnreadCounts,
  markConversationRead,
  markNotificationsRead,
  sendMessage,
} from "@/lib/inbox";

// Realtime (see use-realtime.ts) pushes new rows; polling is the fallback if that connection drops.
const THREAD_POLL_MS = 15_000;
const INBOX_POLL_MS = 30_000;
const BADGE_POLL_MS = 60_000;

function useSignedInUserId() {
  const { enabled, user } = useAuth();
  return enabled ? user?.id ?? null : null;
}

/** Unread direct messages and notifications for the nav badge; zero for guests and demo mode. */
export function useUnreadCounts() {
  const userId = useSignedInUserId();
  const { data } = useQuery({
    queryKey: ["unread-counts", userId],
    queryFn: fetchUnreadCounts,
    enabled: userId !== null,
    refetchInterval: BADGE_POLL_MS,
  });

  const messages = data?.messages ?? 0;
  const notifications = data?.notifications ?? 0;
  return { messages, notifications, total: messages + notifications };
}

export function useThreads() {
  const userId = useSignedInUserId();
  return useQuery({
    queryKey: ["threads", userId],
    queryFn: fetchThreads,
    enabled: userId !== null,
    refetchInterval: INBOX_POLL_MS,
  });
}

export function useNotifications() {
  const userId = useSignedInUserId();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: fetchNotifications,
    enabled: userId !== null,
    refetchInterval: INBOX_POLL_MS,
  });

  const hasUnread = query.data?.some((notification) => notification.unread) ?? false;

  // Opening the list counts as reading it; the fetched items keep their unread styling until the next refresh.
  useEffect(() => {
    if (!hasUnread) return;

    markNotificationsRead()
      .then(() => queryClient.invalidateQueries({ queryKey: ["unread-counts"] }))
      .catch((error) => console.error("Gagal menandai notifikasi", error));
  }, [hasUnread, queryClient]);

  return query;
}

export function useConversation(conversationId: number) {
  const userId = useSignedInUserId();
  const queryClient = useQueryClient();
  const enabled = userId !== null && Number.isInteger(conversationId);

  const thread = useQuery({
    queryKey: ["thread", conversationId, userId],
    queryFn: () => fetchThread(conversationId),
    enabled,
  });

  const messages = useQuery({
    queryKey: ["messages", conversationId, userId],
    queryFn: () => fetchMessages(conversationId, userId!),
    enabled: enabled && Boolean(thread.data),
    refetchInterval: THREAD_POLL_MS,
  });

  const lastMessageId = messages.data?.at(-1)?.id;

  useEffect(() => {
    if (!enabled || lastMessageId === undefined) return;

    markConversationRead(conversationId)
      .then(() =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["unread-counts"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]),
      )
      .catch((error) => console.error("Gagal menandai pesan", error));
  }, [enabled, conversationId, lastMessageId, queryClient]);

  const send = async (body: string) => {
    await sendMessage(conversationId, body);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      queryClient.invalidateQueries({ queryKey: ["threads"] }),
    ]);
  };

  return {
    thread: thread.data ?? null,
    messages: messages.data ?? [],
    isLoading: enabled && (thread.isLoading || messages.isLoading),
    error: thread.error ?? messages.error,
    send,
  };
}

/** Badge for the Inbox nav item: live unread count, or the sample badge in demo mode. */
export function useInboxBadge(demoBadge?: number): number | undefined {
  const { enabled } = useAuth();
  const { total } = useUnreadCounts();

  if (!enabled) return demoBadge;
  return total > 0 ? total : undefined;
}
