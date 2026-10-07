import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { blockUser, type ReportTarget } from "@/lib/moderation";
import { useAuth } from "@/contexts/AuthContext";
import { useFeed } from "@/hooks/use-social";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { POST_IMAGES_BUCKET, describeError, displayHandle, removeImage, uploadImage, type FeedFilter, type PostCategory } from "@/lib/social";
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
  /** Replaces the page title in the sticky header. */
  title?: string;
  /** New posts from the composer go into this Paguyuban group. */
  groupId?: number;
  /** Sample posts for demo mode; defaults to the page's own. */
  demoItems?: FeedItem[];
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

export function FeedPage({ pageKey, renderHeader, feedFilter, showComposer = true, emptyState, title, groupId, demoItems }: FeedPageProps) {
  const config = feedPageConfigs[pageKey];
  const [activeTab, setActiveTab] = useState(0);
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const defaultFilter = useMemo<FeedFilter | null>(
    () => (pageKey === "profil" || pageKey === "inbox" ? null : { kind: "page", pageKey }),
    [pageKey],
  );
  const feed = useFeed(feedFilter === undefined ? defaultFilter : feedFilter, demoItems ?? config.initialItems);
  const { items } = feed;

  // "Kawan Akrab" shows posts from followed bapak on the page feeds once signed in.
  const { enabled, user } = useAuth();
  const followingTab = enabled && activeTab === 2 && feedFilter === undefined && defaultFilter?.kind === "page";
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
      return source.sort((a, b) => b.support + b.safe - (a.support + a.safe));
    }

    if (activeTab === 2) {
      return source.filter((item) => item.verified || item.support >= 20);
    }

    return source;
  }, [items, activeTab, followingTab, followingFeed.items]);

  // The sidebar's "Tulis" button lands here with { compose: true }: put the cursor in the composer.
  const location = useLocation();
  const compose = (location.state as { compose?: boolean } | null)?.compose;
  useEffect(() => {
    if (compose) document.getElementById("feed-composer-text")?.focus();
  }, [compose, location.key]);

  const shownEmptyState = followingTab
    ? user
      ? { title: "Belum ada postingan dari kawan", hint: "Ikuti bapak lain dari profilnya, postingan mereka akan muncul di sini." }
      : { title: "Masuk untuk melihat kawan akrab", hint: "Setelah masuk, Bapak bisa mengikuti bapak lain dan melihat postingan mereka di sini." }
    : emptyState;

  const handleSubmitComposer = async (payload: ComposerSubmitPayload) => {
    if (config.composerMode === "pesan" || !requireAuth()) return false;

    const fallback = fallbackTagByMode[config.composerMode];
    let imagePath: string | null = null;

    try {
      if (payload.image && isSupabaseConfigured) {
        if (!user) throw new Error("Silakan masuk dulu, Pak.");
        imagePath = await uploadImage(POST_IMAGES_BUCKET, user.id, payload.image);
      }

      await feed.addPost({
        category: categoryByMode[config.composerMode],
        tag: payload.quickAction || fallback.tag,
        tagTone: fallback.tone,
        body: payload.text,
        anonymous: payload.anonymous,
        imagePath,
        pollOptions: payload.pollOptions,
        groupId: groupId ?? null,
        previewImageUrl: !isSupabaseConfigured && payload.image ? URL.createObjectURL(payload.image) : null,
      });
      setActiveTab(0);
      return true;
    } catch (error) {
      if (imagePath) void removeImage(POST_IMAGES_BUCKET, imagePath);
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title ?? config.title}</h1>
        </header>

        {renderHeader ? renderHeader() : (
          pageKey === "aman-pak" && (
            <div className="border-b border-border/40 bg-surface px-4 py-4 sm:px-6">
              <AbsenPakCard />
            </div>
          )
        )}

        {showComposer && <FeedComposer mode={config.composerMode} onSubmit={handleSubmitComposer} defaultTag={fallbackTagByMode[config.composerMode].tag} />}

        {/* A profile already has its own Postingan · Tersimpan tabs; sorting someone's posts adds nothing. */}
        {pageKey !== "profil" && (
          <div className="border-b border-border/40">
            <TabBar active={activeTab} onChange={setActiveTab} />
          </div>
        )}

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
