import { Avatar } from "./Avatar";
import { BadgeCheck, Calendar, MapPin, Link as LinkIcon, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string;
  handle: string;
  initials: string;
  color: string;
  bio: string;
  stats: {
    label: string;
    value: string;
  }[];
}

export function ProfileHeader({ name, handle, initials, color, bio, stats }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col border-b border-border/40 bg-surface">
      {/* Banner Placeholder */}
      <div className="h-32 w-full bg-gradient-sage sm:h-48" />
      
      <div className="relative px-4 pb-4 sm:px-6">
        {/* Avatar */}
        <div className="absolute -top-12 left-4 rounded-full border-4 border-surface sm:-top-16 sm:left-6">
          <Avatar initials={initials} color={color} size={window.innerWidth < 640 ? 80 : 120} />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold transition-colors hover:bg-muted/50">
            <Settings size={16} />
            <span>Edit Profil</span>
          </button>
        </div>

        {/* User Info */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{name}</h2>
            <BadgeCheck size={20} className="text-accent fill-accent text-accent-foreground" />
          </div>
          <p className="text-muted-foreground">@{handle}</p>
        </div>

        {/* Bio */}
        <p className="mt-3 text-sm leading-relaxed text-foreground sm:text-base">
          {bio}
        </p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>Jakarta Selatan</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>Bergabung Maret 2024</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex gap-1 text-sm">
              <span className="font-bold text-foreground">{stat.value}</span>
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
