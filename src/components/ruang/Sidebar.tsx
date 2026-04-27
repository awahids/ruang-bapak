import { useState } from "react";
import { Home, MessageCircle, Users, ThumbsUp, UserCheck, Inbox, User, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import lantern from "@/assets/lantern.png";

const navItems = [
  { icon: Home, label: "Beranda", sub: "Linimasa kamu" },
  { icon: MessageCircle, label: "Curhat", sub: "Tempat aman bicara" },
  { icon: Users, label: "Diskusi", sub: "Tukar pikiran" },
  { icon: ThumbsUp, label: "Aman Pak?", sub: "Cek kabar & semangat" },
  { icon: UserCheck, label: "Komunitas", sub: "Temukan bapak sejalan" },
  { icon: Inbox, label: "Inbox", sub: "Pesan & notifikasi", badge: 3 },
  { icon: User, label: "Profil", sub: "Ruang pribadi bapak" },
];

export function Sidebar() {
  const [active, setActive] = useState(0);
  const [tenang, setTenang] = useState(false);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = active === i;
          return (
            <button
              key={item.label}
              onClick={() => setActive(i)}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "bg-background/60 text-sidebar-foreground"
                )}
              >
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-tight">{item.label}</span>
                {item.sub && (
                  <span className="block truncate text-[11px] text-muted-foreground">{item.sub}</span>
                )}
              </span>
              {item.badge && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Motivational card */}
        <div className="relative mt-4 overflow-hidden rounded-3xl border border-sidebar-border bg-card p-4 shadow-soft">
          <img
            src={lantern}
            alt=""
            loading="lazy"
            className="absolute inset-x-0 top-0 h-24 w-full object-cover opacity-90"
          />
          <div className="relative pt-20">
            <p className="text-sm font-bold leading-snug text-foreground">
              Ingat, Bapak tidak sendiri.
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Di sini, kita menguatkan bukan menghakimi.
            </p>
            <button className="mt-3 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted">
              Pelajari lebih lanjut
            </button>
          </div>
        </div>
      </nav>

      {/* Mode Tenang */}
      <button
        onClick={() => setTenang(!tenang)}
        className="mt-2 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card/60 px-3 py-2.5 transition-colors hover:bg-card"
      >
        <Moon size={16} className="text-sidebar-foreground" strokeWidth={2.2} />
        <span className="flex-1 text-left text-sm font-semibold text-sidebar-foreground">Mode Tenang</span>
        <span
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            tenang ? "bg-primary" : "bg-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform",
              tenang ? "translate-x-[18px]" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
    </aside>
  );
}
