import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  color: string;
  size?: number;
  className?: string;
}

export function Avatar({ initials, color, size = 40, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-soft ring-2 ring-background",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, black))`,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}
