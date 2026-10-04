import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { describeError, getInitials, type Profile, type ProfileUpdate } from "@/lib/social";
import { Avatar } from "./Avatar";

interface EditProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (changes: ProfileUpdate) => Promise<void>;
  /** Uploads a new profile photo, or removes it with null. */
  onPhotoChange?: (file: File | null) => Promise<void>;
}

const toForm = (profile: Profile): ProfileUpdate => ({
  display_name: profile.display_name,
  username: profile.username,
  bio: profile.bio,
  location: profile.location,
});

export function EditProfileDialog({ profile, open, onOpenChange, onSave, onPhotoChange }: EditProfileDialogProps) {
  const [form, setForm] = useState<ProfileUpdate>(() => toForm(profile));
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const changePhoto = async (file: File | null) => {
    if (!onPhotoChange) return;
    setPhotoBusy(true);
    try {
      await onPhotoChange(file);
      toast.success(file ? "Foto profil diperbarui" : "Foto profil dihapus");
    } catch (error) {
      toast.error("Foto profil gagal disimpan", { description: describeError(error) });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void changePhoto(file);
  };

  useEffect(() => {
    if (open) setForm(toForm(profile));
  }, [open, profile]);

  const update = (field: keyof ProfileUpdate) => (value: string) => setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const changes: ProfileUpdate = {
      display_name: form.display_name.trim(),
      username: form.username.trim().toLowerCase(),
      bio: form.bio.trim(),
      location: form.location.trim(),
    };

    if (!changes.display_name) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(changes.username)) {
      toast.error("Username hanya boleh huruf kecil, angka, dan _ (3–30 karakter).");
      return;
    }

    setSaving(true);
    try {
      await onSave(changes);
      toast.success("Profil diperbarui");
      onOpenChange(false);
    } catch (error) {
      toast.error("Profil gagal disimpan", { description: describeError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>Biar bapak-bapak lain makin kenal.</DialogDescription>
        </DialogHeader>

        {onPhotoChange && (
          <div className="flex items-center gap-4">
            <Avatar initials={getInitials(profile.display_name)} color={profile.avatar_color} src={profile.avatar_url} size={64} />
            <div className="flex flex-wrap gap-2">
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} aria-label="Pilih foto profil" />
              <Button type="button" variant="outline" size="sm" disabled={photoBusy} onClick={() => fileInput.current?.click()}>
                {photoBusy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Camera size={14} className="mr-1.5" />}
                {profile.avatar_url ? "Ganti foto" : "Pasang foto"}
              </Button>
              {profile.avatar_url && (
                <Button type="button" variant="ghost" size="sm" disabled={photoBusy} onClick={() => void changePhoto(null)} className="text-destructive hover:text-destructive">
                  <Trash2 size={14} className="mr-1.5" />
                  Hapus foto
                </Button>
              )}
            </div>
          </div>
        )}

        <form id="edit-profile" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nama</Label>
            <Input id="profile-name" value={form.display_name} maxLength={60} onChange={(event) => update("display_name")(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-username">Username</Label>
            <Input id="profile-username" value={form.username} maxLength={30} onChange={(event) => update("username")(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea id="profile-bio" value={form.bio} maxLength={280} rows={3} className="resize-none" onChange={(event) => update("bio")(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-location">Lokasi</Label>
            <Input id="profile-location" value={form.location} maxLength={60} placeholder="Contoh: Bandung" onChange={(event) => update("location")(event.target.value)} />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="edit-profile" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
