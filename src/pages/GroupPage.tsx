import { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { FeedPage } from "@/components/ruang/FeedPage";
import { GroupIconBadge, MembershipButton } from "@/components/ruang/Groups";
import { formatMembers } from "@/lib/groups";
import { RuangShell } from "@/components/ruang/RuangShell";
import { useGroup } from "@/hooks/use-groups";
import type { FeedFilter } from "@/lib/social";

/** One Paguyuban: its members' posts, and a composer for members. */
const GroupPage = () => {
  const { slug = "" } = useParams();
  const { group, isLoading, setMember } = useGroup(slug);
  const filter = useMemo<FeedFilter | null>(() => (group ? { kind: "group", groupId: group.id } : null), [group]);

  if (isLoading) {
    return (
      <RuangShell>
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat paguyuban" />
        </div>
      </RuangShell>
    );
  }

  if (!group) {
    return (
      <RuangShell>
        <div className="px-5 py-20 text-center">
          <p className="text-lg font-bold text-foreground">Paguyuban tidak ditemukan</p>
          <Link to="/komunitas" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">
            Kembali ke Paguyuban
          </Link>
        </div>
      </RuangShell>
    );
  }

  return (
    <FeedPage
      key={group.id}
      pageKey="komunitas"
      title={group.name}
      feedFilter={filter}
      groupId={group.id}
      showComposer={group.isMember}
      demoItems={[]}
      renderHeader={() => (
        <div className="border-b border-border/40 bg-surface px-4 py-5 sm:px-6">
          <Link to="/komunitas" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft size={16} />
            Semua Paguyuban
          </Link>
          <div className="flex items-start gap-4">
            <GroupIconBadge icon={group.icon} size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold text-foreground">{group.name}</h2>
              <p className="text-sm text-muted-foreground">{formatMembers(group.memberCount)} anggota</p>
              {group.description && <p className="mt-2 text-sm text-foreground/90">{group.description}</p>}
            </div>
            <MembershipButton group={group} onChange={setMember} className="w-32 shrink-0" />
          </div>
          {!group.isMember && (
            <p className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">Gabung dulu untuk ikut posting di paguyuban ini, Pak.</p>
          )}
        </div>
      )}
      emptyState={{ title: "Belum ada obrolan di sini", hint: group.isMember ? "Mulai obrolan pertama, Pak." : "Gabung lalu mulai obrolan pertama, Pak." }}
    />
  );
};

export default GroupPage;
