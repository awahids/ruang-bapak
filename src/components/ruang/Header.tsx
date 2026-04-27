import { Bell, Search, Shield, ChevronDown } from "lucide-react";
import { Avatar } from "./Avatar";

export function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md">
      <a href="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-sage text-primary-foreground shadow-soft">
          <span className="text-lg" aria-hidden>🌿</span>
        </span>
        <span className="text-base font-extrabold tracking-tight text-foreground">Ruang Bapak</span>
      </a>

      <div className="relative ml-2 hidden flex-1 max-w-xl items-center md:flex">
        <Search size={16} className="absolute left-4 text-muted-foreground" strokeWidth={2.2} />
        <input
          type="search"
          placeholder="Cari topik, bapak, atau komunitas..."
          className="h-10 w-full rounded-full border border-border bg-card px-11 text-sm font-medium text-foreground shadow-soft outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
        <kbd className="absolute right-3 hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifikasi"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition-colors hover:bg-muted"
        >
          <Bell size={17} strokeWidth={2.2} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-soft-pulse rounded-full bg-accent ring-2 ring-card" />
        </button>
        <button
          aria-label="Privasi"
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition-colors hover:bg-muted sm:flex"
        >
          <Shield size={17} strokeWidth={2.2} />
        </button>
        <button className="flex items-center gap-2 rounded-full bg-card pl-1 pr-3 shadow-soft transition-colors hover:bg-muted">
          <Avatar initials="AP" color="hsl(28 33% 41%)" size={32} />
          <span className="hidden text-sm font-semibold text-foreground sm:inline">Ari Pratama</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
