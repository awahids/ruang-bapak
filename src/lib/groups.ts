import { supabase } from "@/integrations/supabase/client";

export const GROUP_ICONS = ["users", "wrench", "baby", "trending-up", "coffee", "book", "heart", "bike"] as const;
export type GroupIcon = (typeof GROUP_ICONS)[number];

export type Group = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: GroupIcon;
  memberCount: number;
  isMember: boolean;
  createdBy: string | null;
};

export type NewGroup = Pick<Group, "name" | "description" | "icon">;

type GroupRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: GroupIcon;
  created_by: string | null;
  member_count: number;
  is_member: boolean;
};

/** Member counts like "1,2rb" for 1.200. */
export const formatMembers = (count: number) =>
  count >= 1000 ? `${(count / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}rb` : count.toLocaleString("id-ID");

function client() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

const toGroup = (row: GroupRow): Group => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  icon: row.icon,
  memberCount: row.member_count,
  isMember: row.is_member,
  createdBy: row.created_by,
});

/** All groups, biggest first. */
export async function fetchGroups(): Promise<Group[]> {
  const { data, error } = await client()
    .from("groups_overview")
    .select("*")
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data as GroupRow[]).map(toGroup);
}

export async function fetchGroup(slug: string): Promise<Group | null> {
  const { data, error } = await client().from("groups_overview").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;

  return data ? toGroup(data as GroupRow) : null;
}

/** Starts a group (the creator joins automatically) and returns its slug. */
export async function createGroup(group: NewGroup): Promise<string> {
  const { data, error } = await client()
    .from("groups")
    .insert({ name: group.name.trim(), description: group.description.trim(), icon: group.icon })
    .select("slug")
    .single();
  if (error) throw error;

  return (data as { slug: string }).slug;
}

export async function setGroupMembership(groupId: number, userId: string, join: boolean): Promise<void> {
  const table = client().from("group_members");
  const { error } = join
    ? await table.upsert({ group_id: groupId, user_id: userId }, { onConflict: "group_id,user_id", ignoreDuplicates: true })
    : await table.delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw error;
}
