import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  color: string;
  /** Profile photo; the initials show while it loads or if it fails. */
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ initials, color, src, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-soft ring-2 ring-background",
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
      {src && !failed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
