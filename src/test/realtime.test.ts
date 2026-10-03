import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { handleMessageInsert, handleNotificationInsert } from "@/hooks/use-realtime";

const seed = () => {
  const client = new QueryClient();
  for (const key of [["messages", 7, "me"], ["thread", 7, "me"], ["threads", "me"], ["unread-counts", "me"], ["notifications", "me"], ["messages", 8, "me"], ["feed", null]]) {
    client.setQueryData(key, "cached");
  }
  return client;
};

const stale = (client: QueryClient) =>
  client
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.isInvalidated)
    .map((query) => JSON.stringify(query.queryKey))
    .sort();

describe("realtime handlers", () => {
  it("refreshes the conversation and inbox caches for a new message", () => {
    const client = seed();
    handleMessageInsert(client, { id: 1, conversation_id: 7, sender_id: "other" }, "me", "/");

    expect(stale(client)).toEqual(['["messages",7,"me"]', '["thread",7,"me"]', '["threads","me"]', '["unread-counts","me"]']);
  });

  it("alerts only for other people's messages outside the open conversation", () => {
    const client = seed();
    expect(handleMessageInsert(client, { id: 1, conversation_id: 7, sender_id: "other" }, "me", "/")).toBe(true);
    expect(handleMessageInsert(client, { id: 2, conversation_id: 7, sender_id: "other" }, "me", "/inbox/7")).toBe(false);
    expect(handleMessageInsert(client, { id: 3, conversation_id: 7, sender_id: "me" }, "me", "/")).toBe(false);
  });

  it("refreshes notifications and the badge for a new notification", () => {
    const client = seed();
    handleNotificationInsert(client);

    expect(stale(client)).toEqual(['["notifications","me"]', '["unread-counts","me"]']);
  });
});
