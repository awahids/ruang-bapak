import { motion } from "framer-motion";
import { Shield, ThumbsUp, ChevronRight, Users } from "lucide-react";
import { Avatar } from "./Avatar";
import { TagPill } from "./TagPill";
import { topikAman, butuhDukungan, stats } from "@/data/ruang-bapak";

function PanelCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
    >
      {children}
    </motion.section>
  );
}

function PanelHeader({ icon, title, action }: { icon?: React.ReactNode; title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </h3>
      {action && (
        <button className="text-[11px] font-semibold text-primary transition-colors hover:text-primary/80">
          {action}
        </button>
      )}
    </div>
  );
}

export function RightPanel() {
  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col gap-4 lg:w-[300px]">
      {/* Topik Aman */}
      <PanelCard delay={0.05}>
        <PanelHeader icon={<Shield size={15} className="text-primary" strokeWidth={2.4} />} title="Topik Aman" action="Lihat semua" />
        <p className="mt-1 text-[11px] text-muted-foreground">Ruang untuk bicara tanpa takut dihakimi.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topikAman.map((t) => (
            <TagPill key={t.label} tone={t.tone} emoji={t.emoji}>
              {t.label}
            </TagPill>
          ))}
        </div>
      </PanelCard>

      {/* Butuh Dukungan */}
      <PanelCard delay={0.1}>
        <PanelHeader icon={<ThumbsUp size={15} className="text-accent" strokeWidth={2.4} />} title="Bapak Lagi Butuh Dukungan" />
        <p className="mt-1 text-[11px] text-muted-foreground">Mereka sedang berat. Kirim cek-in yuk.</p>
        <ul className="mt-3 space-y-2">
          {butuhDukungan.map((b) => (
            <li key={b.name} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2 transition-colors hover:bg-muted">
              <Avatar initials={b.initials} color={b.color} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">{b.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">Curhat · {b.time}</p>
              </div>
              <button className="rounded-full border border-clay/30 bg-clay-soft px-2.5 py-1 text-[10px] font-bold text-clay transition-colors hover:bg-clay hover:text-clay-foreground">
                Aman Pak?
              </button>
            </li>
          ))}
        </ul>
        <button className="mt-3 flex w-full items-center justify-between rounded-xl px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-soft">
          Lihat semua (12)
          <ChevronRight size={13} />
        </button>
      </PanelCard>

      {/* Aman Pak? Hari Ini */}
      <PanelCard delay={0.15}>
        <PanelHeader icon={<ThumbsUp size={15} className="text-primary" strokeWidth={2.4} />} title="Aman Pak? Hari Ini" />
        <div className="mt-3 flex items-end justify-between gap-3 rounded-2xl bg-gradient-warm p-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">1.247</span>
              <span className="text-[11px] font-semibold text-muted-foreground">cek-in</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Terima kasih sudah saling peduli.</p>
          </div>
          <span className="text-3xl" aria-hidden>👍</span>
        </div>
      </PanelCard>

      {/* Komunitas Kita */}
      <PanelCard delay={0.2}>
        <PanelHeader icon={<Users size={15} className="text-primary" strokeWidth={2.4} />} title="Komunitas Kita" action="Lihat semua" />
        <ul className="mt-3 space-y-2">
          {stats.map((s) => (
            <li key={s.label} className="flex items-center justify-between rounded-xl px-1 py-1 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span aria-hidden>{s.icon}</span>
                {s.label}
              </span>
              <span className="font-bold text-foreground">{s.val}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-2xl bg-primary-soft px-3 py-2 text-center text-[11px] font-semibold text-primary">
          Bersama, kita jadi lebih kuat.
        </p>
      </PanelCard>
    </aside>
  );
}
