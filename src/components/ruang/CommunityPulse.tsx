import { useState } from "react";
import { Loader2, ThumbsUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchCheckinsToday, fetchTrendingTags, type PostCategory } from "@/lib/social";

const TRENDING_WINDOW_DAYS = 7;
const COLLAPSED = 6;
const EXPANDED = 12;
const REFRESH_MS = 5 * 60_000;

const roomByCategory: Record<PostCategory, { label: string; path: string }> = {
  status: { label: "Teras Bapak", path: "/" },
  curhat: { label: "Uneg-uneg", path: "/?kategori=curhat" },
  diskusi: { label: "Diskusi", path: "/?kategori=diskusi" },
  checkin: { label: "Aman Pak?", path: "/aman-pak" },
  komunitas: { label: "Paguyuban", path: "/komunitas" },
  profil: { label: "Teras Bapak", path: "/" },
};

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const hashtag = (tag: string) => `#${tag.replace(/[^\p{L}\p{N}]+/gu, "")}`;

/** "Topik Hangat": the tags people actually used this week. */
export function TrendingTopics() {
  const [expanded, setExpanded] = useState(false);
  const limit = expanded ? EXPANDED : COLLAPSED;
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["trending-tags", TRENDING_WINDOW_DAYS, limit],
    queryFn: () => fetchTrendingTags(TRENDING_WINDOW_DAYS, limit + 1),
    refetchInterval: REFRESH_MS,
  });

  const visible = topics.slice(0, limit);
  const hasMore = topics.length > limit;

  return (
    <section className="overflow-hidden rounded-2xl bg-muted/30">
      <div className="px-4 py-3">
        <h2 className="text-xl font-extrabold text-foreground">Topik Hangat</h2>
        <p className="text-[13px] text-muted-foreground">Paling ramai {TRENDING_WINDOW_DAYS} hari terakhir</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" aria-label="Memuat topik" />
        </div>
      ) : visible.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">Belum ada obrolan minggu ini. Yuk, mulai duluan, Pak!</p>
      ) : (
        <div className="flex flex-col">
          {visible.map((topic) => {
            const room = roomByCategory[topic.category];
            return (
              <Link
                key={topic.tag}
                to={`/tag/${encodeURIComponent(topic.tag)}`}
                className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              >
                <span className="text-[13px] text-muted-foreground">Ramai di {room.label}</span>
                <span className="font-bold text-foreground">{hashtag(topic.tag)}</span>
                <span className="text-[13px] text-muted-foreground">{formatNumber(topic.posts)} postingan</span>
              </Link>
            );
          })}
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

/** "Aman Pak? Hari Ini": how many check-ins were posted since midnight WIB. */
export function CheckinToday() {
  const { data: count, isLoading } = useQuery({
    queryKey: ["checkins-today"],
    queryFn: fetchCheckinsToday,
    refetchInterval: REFRESH_MS,
  });

  return (
    <Link to="/aman-pak" className="block rounded-2xl bg-gradient-sage p-4 text-primary-foreground shadow-soft transition-transform hover:scale-[1.01]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">Aman Pak? Hari Ini</h3>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-black">{isLoading ? "…" : formatNumber(count ?? 0)}</span>
            <span className="text-xs font-medium opacity-80">absen</span>
          </div>
        </div>
        <ThumbsUp size={24} strokeWidth={2.5} />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed opacity-90">
        {count ? 'Setiap "Aman Pak?" sangat berarti bagi sesama Bapak.' : "Belum ada yang absen hari ini. Jadi yang pertama, Pak!"}
      </p>
    </Link>
  );
}
