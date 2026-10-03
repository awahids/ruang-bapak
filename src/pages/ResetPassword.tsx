import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/social";

const inputClassName =
  "h-12 w-full rounded-2xl bg-muted/50 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20";

/** Landing page for the password-recovery email; the link signs the user in for this step. */
export default function ResetPassword() {
  const { enabled, loading, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Konfirmasi password belum sama.");
      return;
    }

    setSaving(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast.error("Password gagal diganti", { description: describeError(error) });
      return;
    }

    toast.success("Password baru tersimpan. Selamat datang kembali, Pak!");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px] rounded-[2rem] bg-surface p-8 shadow-lift sm:p-10">
        {!enabled || (!loading && !user) ? (
          <div>
            <h1 className="text-2xl font-black text-foreground">Tautan tidak berlaku</h1>
            <p className="mt-2 text-muted-foreground">
              {enabled
                ? "Tautan reset password sudah kedaluwarsa atau sudah dipakai. Minta tautan baru dari halaman masuk."
                : "Reset password aktif setelah Supabase dikonfigurasi."}
            </p>
            <Link
              to="/login"
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
            >
              Ke halaman masuk
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" aria-label="Memuat" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-foreground">Buat Password Baru</h1>
            <p className="mt-2 text-muted-foreground">Untuk akun {user?.email}.</p>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  placeholder="Password baru"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="password"
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Simpan Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
