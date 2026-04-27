import { motion } from "framer-motion";
import { Flame, Clock, TrendingUp, UserCheck, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: Flame, label: "Untukmu" },
  { icon: Clock, label: "Terbaru" },
  { icon: TrendingUp, label: "Populer" },
  { icon: UserCheck, label: "Mengikuti" },
];

interface TabBarProps {
  active: number;
  onChange: (i: number) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/70 p-1.5 shadow-soft backdrop-blur">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = active === i;
          return (
            <motion.button
              key={t.label}
              onClick={() => onChange(i)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-sage shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon size={13} strokeWidth={2.4} />
                {t.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      <button
        aria-label="Filter"
        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <SlidersHorizontal size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}
