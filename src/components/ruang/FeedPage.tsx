import { useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { feedPageConfigs, type ComposerMode, type FeedItem, type FeedPageKey } from "@/data/ruang-bapak";
import { FeedComposer, type ComposerSubmitPayload } from "./FeedComposer";
import { PostCard } from "./PostCard";
import { RuangShell } from "./RuangShell";
import { TabBar } from "./TabBar";
import { AbsenPakCard } from "./AbsenPakCard";

interface FeedPageProps {
  pageKey: FeedPageKey;
  renderHeader?: () => React.ReactNode;
}

const contextByMode: Record<ComposerMode, FeedItem["context"]> = {
  status: "Curhat",
  curhat: "Curhat",
  diskusi: "Diskusi",
  checkin: "Cek-in",
  komunitas: "Komunitas",
  pesan: "Inbox",
  profil: "Profil",
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

export function FeedPage({ pageKey, renderHeader }: FeedPageProps) {
  const config = feedPageConfigs[pageKey];
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState<FeedItem[]>(() => [...config.initialItems]);

  const nextIdRef = useRef(Math.max(...config.initialItems.map((item) => item.id), 0) + 1);

  const visibleItems = useMemo(() => {
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
  }, [items, activeTab]);

  const handleSubmitComposer = (payload: ComposerSubmitPayload) => {
    const fallback = fallbackTagByMode[config.composerMode];
    const nextId = nextIdRef.current;
    nextIdRef.current += 1;

    const nextItem: FeedItem = {
      id: nextId,
      name: payload.anonymous ? "Bapak Anonim" : "Ari Pratama",
      initials: payload.anonymous ? "BA" : "AP",
      color: payload.anonymous ? "hsl(205 14% 41%)" : "hsl(28 33% 41%)",
      time: "Baru saja",
      context: contextByMode[config.composerMode],
      tag: payload.quickAction || fallback.tag,
      tagTone: fallback.tone,
      text: payload.text,
      safe: 1,
      reply: 0,
      support: 0,
      verified: !payload.anonymous,
    };

    setItems((previous) => [nextItem, ...previous]);
    setActiveTab(0);
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

        <FeedComposer mode={config.composerMode} onSubmit={handleSubmitComposer} />

        <div className="border-b border-border/40">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {visibleItems.length > 0 ? (
          <div className="flex flex-col">
            {visibleItems.map((item, index) => (
              <PostCard key={item.id} post={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-20 text-center">
            <p className="text-lg font-bold text-foreground">{config.emptyState}</p>
            <p className="mt-2 text-muted-foreground">Bapak bisa mulai dari satu kalimat yang jujur dulu.</p>
          </div>
        )}
      </div>
    </RuangShell>
  );
}
