import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type MessageRow = { id: number; conversation_id: number; sender_id: string };

/** Refreshes the inbox caches for a new message; returns whether to alert the user about it. */
export function handleMessageInsert(queryClient: QueryClient, message: MessageRow, userId: string, pathname: string): boolean {
  void queryClient.invalidateQueries({ queryKey: ["messages", message.conversation_id] });
  void queryClient.invalidateQueries({ queryKey: ["thread", message.conversation_id] });
  void queryClient.invalidateQueries({ queryKey: ["threads"] });
  void queryClient.invalidateQueries({ queryKey: ["unread-counts"] });

  return message.sender_id !== userId && pathname !== `/inbox/${message.conversation_id}`;
}

export function handleNotificationInsert(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  void queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
}

/**
 * Subscribes the signed-in user to new direct messages and notifications via
 * Supabase Realtime. Row-level security decides which rows reach each user, so
 * messages arrive only for conversations they belong to. Polling in the inbox
 * hooks remains as a fallback when the realtime connection drops.
 */
export function useRealtimeInbox() {
  const { enabled, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const userId = enabled ? user?.id ?? null : null;

  useEffect(() => {
    if (!supabase || !userId) return;
    const client = supabase;

    const channel = client
      .channel(`inbox:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as MessageRow;
        if (handleMessageInsert(queryClient, message, userId, pathnameRef.current)) {
          toast("Ada pesan baru, Pak", {
            action: { label: "Buka", onClick: () => navigate(`/inbox/${message.conversation_id}`) },
          });
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` },
        () => handleNotificationInsert(queryClient),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [userId, queryClient, navigate]);
}
