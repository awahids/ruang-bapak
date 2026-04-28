import { motion } from "framer-motion";
import { Search, ThumbsUp, MoreHorizontal, Settings, Smile } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import { butuhDukungan, topikAman } from "@/data/ruang-bapak";

interface RightPanelProps {
  mode?: "desktop-column" | "mobile-stacked";
}

export function RightPanel({ mode = "desktop-column" }: RightPanelProps) {
  return (
    <aside className={cn("flex flex-col gap-4", mode === "desktop-column" ? "w-full max-w-[350px]" : "w-full")}>
      {/* Search Bar */}
      {mode === "desktop-column" && (
        <div className="sticky top-2 z-10 bg-background/80 pb-2 backdrop-blur-md">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
            <input
              type="text"
              placeholder="Cari di Ruang Bapak"
              className="h-12 w-full rounded-full bg-muted/50 pl-12 pr-4 text-sm outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
            />
          </div>
        </div>
      )}

      {/* Trending Topics */}
      <section className="rounded-2xl bg-muted/30 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">Topik Hangat</h2>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings size={18} />
          </button>
        </div>
        <div className="flex flex-col">
          {topikAman.slice(0, 4).map((t, i) => (
            <button key={t.label} className="flex flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Trending di {t.label}</span>
                <MoreHorizontal size={14} className="text-muted-foreground" />
              </div>
              <span className="font-bold text-foreground">#Bapak{t.label.replace(/\s/g, '')}</span>
              <span className="text-[13px] text-muted-foreground">{100 + i * 42} postingan</span>
            </button>
          ))}
          <button className="px-4 py-4 text-left text-[15px] text-primary hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
            Tampilkan lebih banyak
          </button>
        </div>
      </section>

      {/* Who to Follow / Support */}
      <section className="rounded-2xl bg-muted/30 overflow-hidden">
        <h2 className="px-4 py-3 text-xl font-extrabold text-foreground">Bapak Butuh Dukungan</h2>
        <div className="flex flex-col">
          {butuhDukungan.slice(0, 3).map((b) => (
            <div key={b.name} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
              <Avatar initials={b.initials} color={b.color} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate hover:underline cursor-pointer">{b.name}</p>
                <p className="text-[13px] text-muted-foreground truncate">@{b.initials.toLowerCase()}bapak</p>
              </div>
              <button className="h-8 rounded-full bg-foreground px-4 text-xs font-bold text-background transition-transform active:scale-95">
                Ikuti
              </button>
            </div>
          ))}
          <button className="px-4 py-4 text-left text-[15px] text-primary hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
            Tampilkan lebih banyak
          </button>
        </div>
      </section>

      {/* Daily Tips */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground shadow-soft">
        <div className="flex items-center gap-2 text-primary">
          <Smile size={18} strokeWidth={2.5} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Tips Bapak Hari Ini</h3>
        </div>
        <p className="mt-3 text-[15px] font-medium leading-relaxed italic">
          "Kalau anak nanya kenapa langit biru, bilang aja: 'Itu lagi dicat, tapi tukangnya belum turun-turun'."
        </p>
        <p className="mt-2 text-right text-[11px] text-muted-foreground">— Bapak Bijak (Level 99)</p>
      </section>

      {/* Daily Check-in */}
      <section className="rounded-2xl bg-gradient-sage p-4 text-primary-foreground shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">Aman Pak? Hari Ini</h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black">1.247</span>
              <span className="text-xs font-medium opacity-80">cek-in</span>
            </div>
          </div>
          <ThumbsUp size={24} strokeWidth={2.5} />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed opacity-90">
          Setiap "Aman Pak?" sangat berarti bagi sesama Bapak.
        </p>
      </section>

      {/* Footer Links */}
      <footer className="px-4 py-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
        <a href="#" className="hover:underline">Persyaratan Layanan</a>
        <a href="#" className="hover:underline">Kebijakan Privasi</a>
        <a href="#" className="hover:underline">Kebijakan Cookie</a>
        <a href="#" className="hover:underline">Aksesibilitas</a>
        <a href="#" className="hover:underline">Informasi Iklan</a>
        <p>© 2026 Ruang Bapak Corp.</p>
      </footer>
    </aside>
  );
}
