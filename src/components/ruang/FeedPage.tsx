import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { blockUser, type ReportTarget } from "@/lib/moderation";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/use-social";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { describeError, displayHandle, type FeedFilter, type PostCategory } from "@/lib/social";
import { feedPageConfigs, type ComposerMode, type FeedItem, type FeedPageKey } from "@/data/ruang-bapak";
import { FeedComposer, type ComposerSubmitPayload } from "./FeedComposer";
import { PostCard } from "./PostCard";
import { RuangShell } from "./RuangShell";
import { TabBar } from "./TabBar";
import { AbsenPakCard } from "./AbsenPakCard";
import { CheckInPost } from "./CheckInPost";
import { ReportDialog } from "./ReportDialog";

interface FeedPageProps {
  pageKey: FeedPageKey;
  renderHeader?: () => React.ReactNode;
  /** Overrides which posts are loaded; `null` waits (e.g. until the profile is known). */
  feedFilter?: FeedFilter | null;
  showComposer?: boolean;
  /** Replaces the page's default empty-state title and hint. */
  emptyState?: { title: string; hint: string };
}

const categoryByMode: Record<Exclude<ComposerMode, "pesan">, PostCategory> = {
  status: "status",
  curhat: "curhat",
  diskusi: "diskusi",
  checkin: "checkin",
  komunitas: "komunitas",
  profil: "profil",
};

const fallbackTagByMode: Record<ComposerMode, { tag: string; tone: FeedItem["tagTone"] }> = {
  status: { tag: "Update Bapak", tone: "sage" },
  curhat: { tag: "Curhat Baru", tone: "clay" },
  diskusi: { tag: "Diskusi Baru", tone: "blue" },
  checkin: { tag: "Cek-in Harian", tone: "sage" },
  komunitas: { tag: "Aktivitas Komunitas", tone: "blue" },
  pesan: { tag: "Pesan Baru", tone: "clay" },
  profil: { tag: "Update Profil", tone: "sage" },
};

export function FeedPage({ pageKey, renderHeader, feedFilter, showComposer = true, emptyState }: FeedPageProps) {
  const config = feedPageConfigs[pageKey];
  const [activeTab, setActiveTab] = useState(0);
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const defaultFilter = useMemo<FeedFilter | null>(
    () => (pageKey === "profil" || pageKey === "inbox" ? null : { kind: "page", pageKey }),
    [pageKey],
  );
  const feed = useFeed(feedFilter === undefined ? defaultFilter : feedFilter, config.initialItems);
  const { items } = feed;

  // "Kawan Akrab" shows posts from followed bapak on the page feeds once signed in.
  const { enabled, user } = useAuth();
  const followingTab = enabled && activeTab === 3 && feedFilter === undefined && defaultFilter?.kind === "page";
  const followingFilter = useMemo<FeedFilter | null>(
    () => (followingTab && user && defaultFilter?.kind === "page" ? { kind: "following", pageKey: defaultFilter.pageKey, followerId: user.id } : null),
    [followingTab, user, defaultFilter],
  );
  const followingFeed = useFeed(followingFilter);
  const shownFeed = followingTab ? followingFeed : feed;

  const visibleItems = useMemo(() => {
    if (followingTab) return followingFeed.items;

    const source = [...items];

    if (activeTab === 1) {
      return source.sort((a, b) => b.id - a.id);
    }

    if (activeTab === 2) {
      return source.sort((a, b) => b.support + b.safe - (a.support + a.safe));
    }

    if (activeTab === 3) {
      return source.filter((item) => item.verified || item.support >= 20);
    }

    return source;
  }, [items, activeTab, followingTab, followingFeed.items]);

  const shownEmptyState = followingTab
    ? user
      ? { title: "Belum ada postingan dari kawan", hint: "Ikuti bapak lain dari profilnya, postingan mereka akan muncul di sini." }
      : { title: "Masuk untuk melihat kawan akrab", hint: "Setelah masuk, Bapak bisa mengikuti bapak lain dan melihat postingan mereka di sini." }
    : emptyState;

  const handleSubmitComposer = async (payload: ComposerSubmitPayload) => {
    if (config.composerMode === "pesan" || !requireAuth()) return false;

    const fallback = fallbackTagByMode[config.composerMode];

    try {
      await feed.addPost({
        category: categoryByMode[config.composerMode],
        tag: payload.quickAction || fallback.tag,
        tagTone: fallback.tone,
        body: payload.text,
        anonymous: payload.anonymous,
      });
      setActiveTab(0);
      return true;
    } catch (error) {
      toast.error("Postingan gagal dikirim", { description: describeError(error) });
      return false;
    }
  };

  const handleToggleLike = async (item: FeedItem, liked: boolean) => {
    if (!requireAuth()) return false;

    try {
      await feed.toggleLike(item, liked);
      return true;
    } catch (error) {
      toast.error("Gagal menyimpan dukungan", { description: describeError(error) });
      return false;
    }
  };

  const handleReport = (item: FeedItem) => {
    if (requireAuth()) setReportTarget({ postId: item.id });
  };

  const handleBlock = async (item: FeedItem) => {
    if (!requireAuth() || !item.authorId) return;
    if (!window.confirm(`Blokir @${displayHandle(item)}? Postingan dan komentarnya tidak akan tampil untuk Bapak, dan kalian tidak bisa saling kirim pesan.`)) return;

    if (!isSupabaseConfigured) {
      toast("Mode demo", { description: "Blokir aktif setelah Supabase dikonfigurasi." });
      return;
    }

    try {
      await blockUser(item.authorId);
      await queryClient.invalidateQueries();
      toast.success(`@${displayHandle(item)} diblokir`, { description: "Buka profilnya kapan saja untuk membuka blokir." });
    } catch (error) {
      toast.error("Gagal memblokir", { description: describeError(error) });
    }
  };

  const handleDelete = async (item: FeedItem) => {
    try {
      await feed.removePost(item);
      toast.success("Postingan dihapus");
    } catch (error) {
      toast.error("Gagal menghapus postingan", { description: describeError(error) });
    }
  };

  return (
    <RuangShell>
      <div className="flex min-w-0 flex-col">
        {/* Sticky Feed Header */}
        <header className="sticky top-0 z-20 border-b border-border/40 bg-surface/80 px-4 py-3 pb-3 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{config.title}</h1>
        </header>

        {renderHeader ? renderHeader() : (
          pageKey === "aman-pak" && (
            <div className="border-b border-border/40 bg-surface px-4 py-4 sm:px-6">
              <AbsenPakCard />
            </div>
          )
        )}

        {showComposer && <FeedComposer mode={config.composerMode} onSubmit={handleSubmitComposer} />}

        <div className="border-b border-border/40">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {shownFeed.isLoading ? (
          <div className="flex justify-center px-5 py-20 text-muted-foreground">
            <Loader2 className="animate-spin" aria-label="Memuat postingan" />
          </div>
        ) : shownFeed.error ? (
          <div className="px-5 py-20 text-center">
            <p className="text-lg font-bold text-foreground">Postingan belum bisa dimuat</p>
            <p className="mt-2 text-muted-foreground">{describeError(shownFeed.error)}</p>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="flex flex-col">
            {visibleItems.map((item, index) => (
              pageKey === "aman-pak" 
                ? <CheckInPost key={item.id} item={item} />
                : <PostCard key={item.id} post={item} index={index} onToggleLike={handleToggleLike} onDelete={handleDelete} onReport={handleReport} onBlock={handleBlock} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-20 text-center">
            <p className="text-lg font-bold text-foreground">{shownEmptyState?.title ?? config.emptyState}</p>
            <p className="mt-2 text-muted-foreground">{shownEmptyState?.hint ?? "Bapak bisa mulai dari satu kalimat yang jujur dulu."}</p>
          </div>
        )}
      </div>
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
    </RuangShell>
  );
}
