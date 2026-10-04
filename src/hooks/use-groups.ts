import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { createGroup, fetchGroup, fetchGroups, setGroupMembership, type Group, type NewGroup } from "@/lib/groups";

export type GroupsState = {
  groups: Group[];
  isLoading: boolean;
  error: unknown;
  setMember: (group: Group, join: boolean) => Promise<void>;
  /** Resolves to the new group's slug. */
  create: (group: NewGroup) => Promise<string>;
};

export type GroupState = {
  group: Group | null | undefined;
  isLoading: boolean;
  setMember: (join: boolean) => Promise<void>;
};

const DEMO_GROUPS: Group[] = [
  { id: 1, slug: "hobi-bengkel", name: "Hobi Bengkel", description: "Bagi bapak yang suka oprek mesin sendiri.", icon: "wrench", memberCount: 1200, isMember: false, createdBy: null },
  { id: 2, slug: "parenting-balita", name: "Parenting Balita", description: "Tips sabar ngadepin anak GTM.", icon: "baby", memberCount: 3500, isMember: true, createdBy: null },
  { id: 3, slug: "investor-bapak", name: "Investor Bapak", description: "Paham saham biar cicilan aman.", icon: "trending-up", memberCount: 890, isMember: false, createdBy: null },
];

function useMembershipRefresh() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["groups"] }),
      queryClient.invalidateQueries({ queryKey: ["group"] }),
    ]).then(() => undefined);
}

function useRemoteGroups(): GroupsState {
  const { user } = useAuth();
  const refresh = useMembershipRefresh();
  const query = useQuery({ queryKey: ["groups", user?.id ?? null], queryFn: fetchGroups });

  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    setMember: async (group, join) => {
      if (!user) throw new Error("Silakan masuk dulu, Pak.");
      await setGroupMembership(group.id, user.id, join);
      await refresh();
    },
    create: async (group) => {
      const slug = await createGroup(group);
      await refresh();
      return slug;
    },
  };
}

function useDemoGroups(): GroupsState {
  const [groups, setGroups] = useState(DEMO_GROUPS);

  return {
    groups,
    isLoading: false,
    error: null,
    setMember: async (group, join) =>
      setGroups((previous) =>
        previous.map((entry) =>
          entry.id === group.id && entry.isMember !== join
            ? { ...entry, isMember: join, memberCount: entry.memberCount + (join ? 1 : -1) }
            : entry,
        ),
      ),
    create: async (group) => {
      const slug = group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "grup";
      setGroups((previous) => [
        ...previous,
        { ...group, id: previous.length + 1, slug, memberCount: 1, isMember: true, createdBy: null },
      ]);
      return slug;
    },
  };
}

/** Paguyuban groups from Supabase, or a small sample list in demo mode. */
export const useGroups: () => GroupsState = isSupabaseConfigured ? useRemoteGroups : useDemoGroups;

function useRemoteGroup(slug: string): GroupState {
  const { user } = useAuth();
  const refresh = useMembershipRefresh();
  const query = useQuery({ queryKey: ["group", slug, user?.id ?? null], queryFn: () => fetchGroup(slug) });

  return {
    group: query.data,
    isLoading: query.isLoading,
    setMember: async (join) => {
      if (!user || !query.data) throw new Error("Silakan masuk dulu, Pak.");
      await setGroupMembership(query.data.id, user.id, join);
      await refresh();
    },
  };
}

function useDemoGroup(slug: string): GroupState {
  const [group, setGroup] = useState(() => DEMO_GROUPS.find((entry) => entry.slug === slug) ?? null);

  return {
    group,
    isLoading: false,
    setMember: async (join) =>
      setGroup((current) => (current ? { ...current, isMember: join, memberCount: current.memberCount + (join ? 1 : -1) } : current)),
  };
}

export const useGroup: (slug: string) => GroupState = isSupabaseConfigured ? useRemoteGroup : useDemoGroup;
