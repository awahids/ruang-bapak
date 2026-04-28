import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  sage: "bg-primary-soft text-primary",
  clay: "bg-clay-soft text-clay",
  plum: "bg-[hsl(280_25%_94%)] text-[hsl(280_30%_38%)]",
  blue: "bg-[hsl(210_30%_94%)] text-[hsl(210_30%_38%)]",
  muted: "bg-muted text-muted-foreground",
} as const;

export type TagTone = keyof typeof tones;

interface TagPillProps {
  tone?: TagTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function TagPill({ tone = "sage", icon: Icon, children, className }: TagPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-[1.03]",
        tones[tone],
        className
      )}
    >
      {Icon && <Icon size={13} strokeWidth={2.2} className="shrink-0" aria-hidden />}
      {children}
    </span>
  );
}
