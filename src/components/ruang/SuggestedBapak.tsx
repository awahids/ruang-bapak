import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { describeError, fetchSuggestedProfiles, setFollowing, type SuggestedProfile } from "@/lib/social";
import { Avatar } from "./Avatar";

const COLLAPSED = 3;
const EXPANDED = 8;

const describeActivity = (person: SuggestedProfile) => {
  if (person.recentPosts > 0) return `${person.recentPosts} postingan bulan ini`;
  if (person.followers > 0) return `${person.followers} pengikut`;
  return "Bapak baru di paguyuban";
};

/** "Saran Kawan": real members to follow, ranked by recent activity. */
export function SuggestedBapak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const limit = expanded ? EXPANDED : COLLAPSED;
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["suggestions", user?.id ?? null, limit],
    queryFn: () => fetchSuggestedProfiles(limit + 1),
    staleTime: 60_000,
  });

  const visible = people.slice(0, limit);
  const hasMore = people.length > limit;

  const follow = async (person: SuggestedProfile) => {
    if (!requireAuth()) return;

    setPendingId(person.id);
    try {
      await setFollowing(person.id, true);
      toast.success(`Mengikuti @${person.username}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestions"] }),
        queryClient.invalidateQueries({ queryKey: ["follow-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["is-following"] }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
      ]);
    } catch (error) {
      toast.error("Gagal mengikuti", { description: describeError(error) });
    } finally {
      setPendingId(null);
    }
  };

  if (!isLoading && visible.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl bg-muted/30">
      <div className="px-4 py-3">
        <h2 className="text-xl font-extrabold text-foreground">Saran Kawan</h2>
        <p className="text-[13px] text-muted-foreground">Bapak-bapak yang lagi aktif di paguyuban</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" aria-label="Memuat saran" />
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((person) => (
            <div key={person.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
              <Link to={`/u/${person.username}`} className="shrink-0" aria-label={`Profil ${person.name}`}>
                <Avatar initials={person.initials} color={person.color} src={person.avatarUrl} size={40} />
              </Link>
              <Link to={`/u/${person.username}`} className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-bold text-foreground hover:underline">
                  <span className="truncate">{person.name}</span>
                  {person.verified && <BadgeCheck size={14} className="shrink-0 text-primary" />}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  @{person.username} · {describeActivity(person)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => void follow(person)}
                disabled={pendingId === person.id}
                aria-label={`Ikuti @${person.username}`}
                className="flex h-8 shrink-0 items-center rounded-full bg-foreground px-4 text-xs font-bold text-background transition-transform active:scale-95 disabled:opacity-60"
              >
                {pendingId === person.id ? <Loader2 size={14} className="animate-spin" /> : "Ikuti"}
              </button>
            </div>
          ))}
          {(hasMore || expanded) && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="px-4 py-4 text-left text-[15px] text-primary transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            >
              {expanded ? "Tampilkan lebih sedikit" : "Tampilkan lebih banyak"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
