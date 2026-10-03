import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeedPage } from "@/components/ruang/FeedPage";
import { CreateGroupDialog, GroupCard } from "@/components/ruang/Groups";
import { useGroups } from "@/hooks/use-groups";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { describeError } from "@/lib/social";

function GroupsHeader() {
  const { groups, isLoading, error, setMember, create } = useGroups();
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const newGroupButton = (
    <button
      type="button"
      onClick={() => requireAuth() && setCreating(true)}
      className="flex min-h-[10rem] min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      <Plus size={24} />
      <span className="text-xs font-bold">Buat Baru</span>
    </button>
  );

  return (
    <div className="border-b border-border/40 bg-surface p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{showAll ? "Semua Paguyuban" : "Paguyuban Pilihan"}</h2>
        {groups.length > 0 && (
          <button type="button" onClick={() => setShowAll((value) => !value)} className="text-xs font-bold text-primary hover:underline">
            {showAll ? "Tampilkan Sedikit" : `Lihat Semua (${groups.length})`}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat paguyuban" />
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">Paguyuban belum bisa dimuat: {describeError(error)}</p>
      ) : showAll ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onMembershipChange={(join) => setMember(group, join)} />
          ))}
          {newGroupButton}
        </div>
      ) : (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {groups.slice(0, 6).map((group) => (
            <GroupCard key={group.id} group={group} onMembershipChange={(join) => setMember(group, join)} />
          ))}
          {newGroupButton}
        </div>
      )}

      <CreateGroupDialog
        open={creating}
        onOpenChange={setCreating}
        onCreate={async (group) => {
          const slug = await create(group);
          navigate(`/komunitas/${slug}`);
        }}
      />
    </div>
  );
}

const Komunitas = () => <FeedPage pageKey="komunitas" renderHeader={() => <GroupsHeader />} />;

export default Komunitas;
