import { useEffect, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "@/data/ruang-bapak";

export function MobileBottomNav() {
  const location = useLocation();
  const [openMore, setOpenMore] = useState(false);

  useEffect(() => {
    setOpenMore(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <div className="flex w-full items-center justify-between gap-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl text-foreground transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )
                }
              >
                {({ isActive }) => (
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                )}
              </NavLink>
            );
          })}
          <button
            onClick={() => setOpenMore(true)}
            className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <MoreHorizontal size={24} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {openMore && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu lainnya"
            onClick={() => setOpenMore(false)}
            className="absolute inset-0 bg-foreground/20"
          />
          <section className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card p-4 shadow-lift">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Menu Lainnya</h3>
              <button
                onClick={() => setOpenMore(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                aria-label="Tutup panel lainnya"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-2">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpenMore(false)}
                    className="flex min-h-12 items-center gap-3 rounded-2xl bg-muted/70 px-3 py-2.5 text-foreground transition-colors hover:bg-muted"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-foreground shadow-soft">
                      <Icon size={17} strokeWidth={2.2} />
                    </span>
                    <span className="flex-1 text-left">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {item.label === "Inbox" ? "Pesan & notifikasi" : "Ruang pribadi bapak"}
                      </span>
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
