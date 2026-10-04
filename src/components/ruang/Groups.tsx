import { useState, type FormEvent } from "react";
import { Baby, Bike, BookOpen, Coffee, Heart, Loader2, TrendingUp, Users, Wrench, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { GROUP_ICONS, formatMembers, type Group, type GroupIcon, type NewGroup } from "@/lib/groups";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";

const iconByKey: Record<GroupIcon, LucideIcon> = {
  users: Users,
  wrench: Wrench,
  baby: Baby,
  "trending-up": TrendingUp,
  coffee: Coffee,
  book: BookOpen,
  heart: Heart,
  bike: Bike,
};

const iconLabel: Record<GroupIcon, string> = {
  users: "Umum",
  wrench: "Bengkel",
  baby: "Anak",
  "trending-up": "Keuangan",
  coffee: "Ngopi",
  book: "Belajar",
  heart: "Kesehatan",
  bike: "Olahraga",
};

export function GroupIconBadge({ icon, size = 40 }: { icon: GroupIcon; size?: number }) {
  const Icon = iconByKey[icon] ?? Users;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary" style={{ width: size, height: size }}>
      <Icon size={size / 2} />
    </span>
  );
}

/** Join or leave a group; asks guests to sign in first. */
export function MembershipButton({
  group,
  onChange,
  className,
}: {
  group: Pick<Group, "name" | "isMember">;
  onChange: (join: boolean) => Promise<void>;
  className?: string;
}) {
  const requireAuth = useRequireAuth();
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending || !requireAuth()) return;
    if (group.isMember && !window.confirm(`Keluar dari ${group.name}?`)) return;

    setPending(true);
    try {
      await onChange(!group.isMember);
      toast.success(group.isMember ? `Keluar dari ${group.name}` : `Selamat bergabung di ${group.name}, Pak!`);
    } catch (error) {
      toast.error("Gagal memperbarui keanggotaan", { description: describeError(error) });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={group.isMember}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-colors disabled:opacity-60",
        group.isMember
          ? "border border-border bg-surface text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {pending && <Loader2 size={12} className="animate-spin" />}
      {group.isMember ? "Sudah Gabung" : "Gabung"}
    </button>
  );
}

export function GroupCard({ group, onMembershipChange }: { group: Group; onMembershipChange: (join: boolean) => Promise<void> }) {
  return (
    <div className="flex min-w-[200px] flex-col rounded-2xl border border-border/60 bg-card p-4">
      <Link to={`/komunitas/${group.slug}`} className="flex items-center gap-3 hover:underline">
        <GroupIconBadge icon={group.icon} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{group.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatMembers(group.memberCount)} Anggota</p>
        </div>
      </Link>
      <p className="mt-3 line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">{group.description || "Belum ada deskripsi."}</p>
      <MembershipButton group={group} onChange={onMembershipChange} className="mt-4 w-full" />
    </div>
  );
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (group: NewGroup) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<GroupIcon>("users");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 3) {
      toast.error("Nama paguyuban minimal 3 huruf.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), icon });
      setName("");
      setDescription("");
      setIcon("users");
      onOpenChange(false);
    } catch (error) {
      toast.error("Paguyuban gagal dibuat", { description: describeError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Paguyuban</DialogTitle>
          <DialogDescription>Kumpulkan bapak-bapak dengan minat yang sama. Bapak otomatis jadi anggota pertama.</DialogDescription>
        </DialogHeader>
        <form id="create-group" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Nama</Label>
            <Input id="group-name" value={name} maxLength={60} placeholder="Contoh: Klub Sepeda Pagi" onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="group-description">Deskripsi</Label>
            <Textarea
              id="group-description"
              value={description}
              maxLength={280}
              rows={3}
              className="resize-none"
              placeholder="Untuk siapa paguyuban ini dan apa kegiatannya?"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Ikon</legend>
            <div className="flex flex-wrap gap-2">
              {GROUP_ICONS.map((key) => {
                const Icon = iconByKey[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-pressed={icon === key}
                    aria-label={iconLabel[key]}
                    title={iconLabel[key]}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                      icon === key ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="create-group" disabled={saving}>
            {saving ? "Membuat..." : "Buat Paguyuban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
