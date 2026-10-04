import { Moon, Sprout, PenLine, ChevronDown, LogIn, LogOut, ShieldCheck, User } from "lucide-react";
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
  const { calm, toggleCalm } = useCalmMode();
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

          <button
            onClick={() => {
              toggleCalm();
              toast(calm ? "Mode Rehat dimatikan" : "Mode Rehat aktif", {
                description: calm ? "Angka dan notifikasi tampil lagi." : "Angka dukungan, komentar, dan notifikasi disembunyikan dulu. Istirahat yang cukup, Pak.",
              });
            }}
            aria-pressed={calm}
            title={calm ? "Matikan Mode Rehat" : "Sembunyikan angka dan notifikasi sejenak"}
            className={cn(
              "group flex items-center gap-4 rounded-full px-4 py-3 text-left transition-all hover:bg-primary-soft/50",
              calm ? "bg-primary-soft text-primary" : "text-foreground",
            )}
          >
            <Moon size={24} strokeWidth={2} fill={calm ? "currentColor" : "none"} />
            <span className="hidden text-xl lg:inline">{calm ? "Mode Rehat: Aktif" : "Mode Rehat"}</span>
          </button>
        </nav>

        {/* Post Button */}
        <div className="mt-4 px-2">
          <Link to="/aman-pak" className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-sage py-3.5 text-lg font-bold text-primary-foreground shadow-lift transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <PenLine size={20} strokeWidth={2.5} />
            <span className="hidden lg:inline">Absen Pak</span>
          </Link>
        </div>
      </div>

      <SidebarAccount />
    </div>
  );
}

function SidebarAccount() {
  const { enabled, loading, user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!enabled) {
    return (
      <Link to="/profil" className="mt-auto flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-muted/50">
        <Avatar initials="AP" color="hsl(28 33% 41%)" size={40} />
        <div className="hidden flex-1 text-left lg:block">
          <p className="text-sm font-bold leading-none text-foreground">Ari Pratama</p>
          <p className="mt-1 text-xs text-muted-foreground">@aripratama</p>
        </div>
        <ChevronDown size={16} className="hidden text-muted-foreground lg:block" />
      </Link>
    );
  }

  if (loading) return <div className="mt-auto h-16" />;

  if (!user) {
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

  const name = profile?.display_name ?? user.email ?? "Bapak";

  const handleSignOut = async () => {
    await signOut();
    toast("Sampai jumpa lagi, Pak!");
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-auto flex items-center gap-3 rounded-full p-3 text-left transition-colors hover:bg-muted/50">
          <Avatar initials={getInitials(name)} color={profile?.avatar_color ?? "hsl(28 33% 41%)"} src={profile?.avatar_url} size={40} />
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-bold leading-none text-foreground">{name}</p>
            {profile && <p className="mt-1 truncate text-xs text-muted-foreground">@{profile.username}</p>}
          </div>
          <ChevronDown size={16} className="hidden text-muted-foreground lg:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuItem onSelect={() => navigate("/profil")}>
          <User size={14} className="mr-2" />
          Profil Saya
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut size={14} className="mr-2" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
