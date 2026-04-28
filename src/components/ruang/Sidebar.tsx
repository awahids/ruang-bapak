import { useState } from "react";
import { Moon, Sprout, PenLine, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { primaryNavItems, secondaryNavItems } from "@/data/ruang-bapak";
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
  const [tenang, setTenang] = useState(false);

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
              badge={item.badge}
            />
          ))}
          
          <button
            onClick={() => setTenang((v) => !v)}
            className="group flex items-center gap-4 rounded-full px-4 py-3 text-left transition-all text-foreground hover:bg-primary-soft/50"
          >
            <Moon size={24} strokeWidth={2} />
            <span className="hidden text-xl lg:inline">{tenang ? "Mode Siaga" : "Mode Rehat"}</span>
          </button>
        </nav>

        {/* Post Button */}
        <div className="mt-4 px-2">
          <button className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-sage py-3.5 text-lg font-bold text-primary-foreground shadow-lift transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <PenLine size={20} strokeWidth={2.5} />
            <span className="hidden lg:inline">Absen Pak</span>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <button className="mt-auto flex items-center gap-3 rounded-full p-3 transition-colors hover:bg-muted/50">
        <Avatar initials="AP" color="hsl(28 33% 41%)" size={40} />
        <div className="hidden flex-1 text-left lg:block">
          <p className="text-sm font-bold leading-none text-foreground">Ari Pratama</p>
          <p className="mt-1 text-xs text-muted-foreground">@aripratama</p>
        </div>
        <ChevronDown size={16} className="hidden text-muted-foreground lg:block" />
      </button>
    </div>
  );
}
