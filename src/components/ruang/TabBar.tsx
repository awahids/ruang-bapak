import { motion } from "framer-motion";
import { Flame, Clock, TrendingUp, UserCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: Flame, label: "Lagi Anget Nih" },
  { icon: Clock, label: "Baru Nongol" },
  { icon: TrendingUp, label: "Lagi Rame" },
  { icon: UserCheck, label: "Kawan Akrab" },
];

interface TabBarProps {
  active: number;
  onChange: (i: number) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex w-full items-center bg-surface/80 px-2 py-1 backdrop-blur-md">
      <div className="flex flex-1 items-center overflow-x-auto no-scrollbar">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = active === i;
          return (
            <button
              key={t.label}
              onClick={() => onChange(i)}
              className={cn(
                "relative flex h-12 flex-1 min-w-[120px] items-center justify-center gap-2 text-sm font-medium transition-colors",
                isActive ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02]"
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {t.label}
              {isActive && (
                <motion.div
                  layoutId="active-tab-line"
                  className="absolute bottom-0 h-1 w-20 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <button
        aria-label="Filter"
        className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <SlidersHorizontal size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
