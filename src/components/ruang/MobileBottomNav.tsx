import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, MoreHorizontal, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useInboxBadge } from "@/hooks/use-inbox";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "@/data/ruang-bapak";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { enabled, user, signOut } = useAuth();
  const inboxBadge = useInboxBadge(secondaryNavItems.find((item) => item.to === "/inbox")?.badge);
  const [openMore, setOpenMore] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setOpenMore(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!openMore) {
      return;
    }

    const panel = panelRef.current;
    const openerButton = moreButtonRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const firstFocusable = focusableElements()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      panel?.focus();
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenMore(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = focusableElements();
      if (focusables.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = originalOverflow;

      if (openerButton) {
        openerButton.focus();
      } else {
        previouslyFocused?.focus();
      }
    };
  }, [openMore]);

  return (
    <>
      <nav
        aria-label="Navigasi utama mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden"
      >
        <div className="flex w-full items-center justify-between gap-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl text-foreground transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="sr-only">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            ref={moreButtonRef}
            aria-label="Buka menu lainnya"
            aria-expanded={openMore}
            aria-controls="mobile-more-menu"
            onClick={() => setOpenMore(true)}
            className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="relative">
              <MoreHorizontal size={24} strokeWidth={2} />
              {inboxBadge && enabled && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" aria-label="Ada pesan atau notifikasi baru" />
              )}
            </span>
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
          <section
            id="mobile-more-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lift"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 id="mobile-more-title" className="text-sm font-bold text-foreground">Menu Lainnya</h3>
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
                    {(item.to === "/inbox" ? inboxBadge : item.badge) && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                        {item.to === "/inbox" ? inboxBadge : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {enabled && (user ? (
                <button
                  onClick={async () => {
                    setOpenMore(false);
                    await signOut();
                    toast("Sampai jumpa lagi, Pak!");
                    navigate("/");
                  }}
                  className="flex min-h-12 items-center gap-3 rounded-2xl bg-muted/70 px-3 py-2.5 text-left text-destructive transition-colors hover:bg-muted"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-soft">
                    <LogOut size={17} strokeWidth={2.2} />
                  </span>
                  <span className="text-sm font-semibold">Keluar</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpenMore(false)}
                  className="flex min-h-12 items-center gap-3 rounded-2xl bg-primary px-3 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-foreground shadow-soft">
                    <LogIn size={17} strokeWidth={2.2} />
                  </span>
                  <span className="text-sm font-semibold">Masuk / Daftar</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
