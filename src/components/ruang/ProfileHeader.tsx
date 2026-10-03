import { Avatar } from "./Avatar";
import { BadgeCheck, Calendar, Loader2, MapPin, Mail, Settings } from "lucide-react";

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
  location?: string;
  joinedLabel?: string;
  verified?: boolean;
  /** Shows the "Edit Profil" button when provided. */
  onEdit?: () => void;
  /** Shows the "Kirim Pesan" button when provided. */
  onMessage?: () => void;
  messagePending?: boolean;
}

export function ProfileHeader({
  name,
  handle,
  initials,
  color,
  bio,
  stats,
  location = "Jakarta Selatan",
  joinedLabel = "Bergabung Maret 2024",
  verified = true,
  onEdit,
  onMessage,
  messagePending = false,
}: ProfileHeaderProps) {
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
        <div className="flex min-h-[3.25rem] justify-end pt-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold transition-colors hover:bg-muted/50"
            >
              <Settings size={16} />
              <span>Edit Profil</span>
            </button>
          )}
          {onMessage && (
            <button
              onClick={onMessage}
              disabled={messagePending}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {messagePending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              <span>Kirim Pesan</span>
            </button>
          )}
        </div>

        {/* User Info */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{name}</h2>
            {verified && <BadgeCheck size={20} className="text-accent fill-accent text-accent-foreground" />}
          </div>
          <p className="text-muted-foreground">@{handle}</p>
        </div>

        {/* Bio */}
        {bio && (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
            {bio}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {location && (
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{joinedLabel}</span>
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
