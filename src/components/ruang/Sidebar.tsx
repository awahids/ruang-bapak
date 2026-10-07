import { Bookmark, Moon, Sprout, PenLine, ChevronDown, LogIn, LogOut, ShieldCheck, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCalmMode } from "@/contexts/CalmModeContext";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "@/data/ruang-bapak";
import { useInboxBadge } from "@/hooks/use-inbox";
import { getInitials } from "@/lib/social";
import { Avatar } from "./Avatar";

function NavItem({
  to,
  label,
  badge,
  end,
  icon: Icon,
}: {
  to: string;
  label: string;
  badge?: number;
  end?: boolean;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-4 rounded-full px-4 py-3 text-left transition-all",
          isActive
            ? "text-primary font-bold"
            : "text-foreground hover:bg-primary-soft/50"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          <span className="hidden text-xl lg:inline">{label}</span>
          {badge && (
            <span className="ml-auto hidden rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground lg:inline">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { calm } = useCalmMode();
  const rawInboxBadge = useInboxBadge(secondaryNavItems.find((item) => item.to === "/inbox")?.badge);
  const inboxBadge = calm ? undefined : rawInboxBadge;
  const { profile } = useAuth();

  return (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="flex flex-col gap-2">
        {/* Logo */}
        <div className="mb-4 px-4">
          <NavLink to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-sage text-primary-foreground shadow-soft">
            <Sprout size={28} strokeWidth={2.5} />
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {primaryNavItems.map((item) => (
            <NavItem
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              icon={item.icon}
              label={item.label}
            />
          ))}
          {secondaryNavItems.map((item) => (
            <NavItem
              key={item.label}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.to === "/inbox" ? inboxBadge : item.badge}
            />
          ))}
          
          {profile?.is_moderator && <NavItem to="/moderasi" icon={ShieldCheck} label="Moderasi" />}
        </nav>

        {/* Post Button */}
        <div className="mt-4 px-2">
          <Link to="/" state={{ compose: true }} className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-sage py-3.5 text-lg font-bold text-primary-foreground shadow-lift transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <PenLine size={20} strokeWidth={2.5} />
            <span className="hidden lg:inline">Tulis</span>
          </Link>
        </div>
      </div>

      <SidebarAccount />
    </div>
  );
}

function SidebarAccount() {
  const { enabled, loading, user, profile, signOut } = useAuth();
  const { calm, toggleCalm } = useCalmMode();
  const navigate = useNavigate();

  if (enabled && loading) return <div className="mt-auto h-16" />;

  if (enabled && !user) {
    return (
      <Link
        to="/login"
        className="mt-auto flex items-center justify-center gap-3 rounded-full border border-border py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted/50"
      >
        <LogIn size={18} />
        <span className="hidden lg:inline">Masuk / Daftar</span>
      </Link>
    );
  }

  // Demo mode has no account: show the sample bapak.
  const name = enabled ? profile?.display_name ?? user?.email ?? "Bapak" : "Ari Pratama";
  const handle = enabled ? profile?.username : "aripratama";

  const handleToggleCalm = () => {
    toggleCalm();
    toast(calm ? "Mode Rehat dimatikan" : "Mode Rehat aktif", {
      description: calm ? "Angka dan notifikasi tampil lagi." : "Angka dukungan, komentar, dan notifikasi disembunyikan dulu. Istirahat yang cukup, Pak.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast("Sampai jumpa lagi, Pak!");
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-auto flex items-center gap-3 rounded-full p-3 text-left transition-colors hover:bg-muted/50">
          <span className="relative shrink-0">
            <Avatar initials={getInitials(name)} color={profile?.avatar_color ?? "hsl(28 33% 41%)"} src={profile?.avatar_url} size={40} />
            {calm && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-surface" title="Mode Rehat aktif">
                <Moon size={11} fill="currentColor" aria-label="Mode Rehat aktif" />
              </span>
            )}
          </span>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-bold leading-none text-foreground">{name}</p>
            {handle && <p className="mt-1 truncate text-xs text-muted-foreground">{calm ? "Mode Rehat aktif" : `@${handle}`}</p>}
          </div>
          <ChevronDown size={16} className="hidden text-muted-foreground lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuItem onSelect={() => navigate("/profil")}>
          <User size={14} className="mr-2" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/profil?tab=tersimpan")}>
          <Bookmark size={14} className="mr-2" />
          Tersimpan
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleToggleCalm}>
          <Moon size={14} className="mr-2" fill={calm ? "currentColor" : "none"} />
          {calm ? "Matikan Mode Rehat" : "Mode Rehat"}
          <span className="ml-auto text-xs text-muted-foreground">{calm ? "Aktif" : "Mati"}</span>
        </DropdownMenuItem>
        {enabled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut size={14} className="mr-2" />
              Keluar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
