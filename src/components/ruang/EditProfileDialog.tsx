import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { describeError, type Profile, type ProfileUpdate } from "@/lib/social";

interface EditProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (changes: ProfileUpdate) => Promise<void>;
}

const toForm = (profile: Profile): ProfileUpdate => ({
  display_name: profile.display_name,
  username: profile.username,
  bio: profile.bio,
  location: profile.location,
});

export function EditProfileDialog({ profile, open, onOpenChange, onSave }: EditProfileDialogProps) {
  const [form, setForm] = useState<ProfileUpdate>(() => toForm(profile));
  const [saving, setSaving] = useState(false);

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
