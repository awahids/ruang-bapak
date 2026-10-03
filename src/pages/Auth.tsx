import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ArrowRight, Smile, Mail, Lock, User, CheckCircle2, Info, MailCheck, KeyRound } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/social";
import authMascot from "@/assets/bapak.png";

type AuthLocationState = { from?: string } | null;

const inputClassName =
  "h-12 w-full rounded-2xl bg-muted/50 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20";

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { enabled, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(location.pathname === "/signup" ? "signup" : "login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [joke, setJoke] = useState("");
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const redirectTo = (location.state as AuthLocationState)?.from ?? "/";

  if (enabled && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const switchMode = () => {
    const nextMode = mode === "login" ? "signup" : "login";
    setMode(nextMode);
    setStep(1);
    navigate(nextMode === "login" ? "/login" : "/signup", { replace: true, state: location.state });
  };

  const validateCredentials = () => {
    if (mode === "signup" && !name.trim()) return "Nama lengkap wajib diisi, Pak.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Format email belum benar.";
    if (password.length < 6) return "Password minimal 6 karakter.";
    return null;
  };

  const handleNext = async (event?: FormEvent) => {
    event?.preventDefault();

    const problem = validateCredentials();
    if (problem) {
      toast.error(problem);
      setStep(1);
      return;
    }

    if (mode === "signup" && step === 1) {
      setStep(2);
      return;
    }

    if (!supabase) {
      // Demo mode: there is no backend to authenticate against.
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Selamat datang kembali, Pak!");
        navigate(redirectTo, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: name.trim(), joke: joke.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      if (data.session) {
        toast.success("Selamat bergabung di paguyuban, Pak!");
        navigate(redirectTo, { replace: true });
      } else {
        setAwaitingConfirmation(true);
      }
    } catch (error) {
      toast.error(mode === "login" ? "Gagal masuk" : "Gagal mendaftar", { description: describeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (event: FormEvent) => {
    event.preventDefault();

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Format email belum benar.");
      return;
    }

    if (!supabase) {
      toast("Mode demo", { description: "Reset password aktif setelah Supabase dikonfigurasi." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error("Gagal mengirim tautan reset", { description: describeError(error) });
      return;
    }

    setResetSent(true);
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      toast("Mode demo", { description: "Login Google aktif setelah Supabase dikonfigurasi." });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
    if (error) toast.error("Gagal masuk dengan Google", { description: describeError(error) });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-[1000px] overflow-hidden rounded-[2.5rem] bg-surface shadow-lift">
        {/* Left Side - Visual */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-sage p-12 lg:flex">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md">
              <Sprout size={24} strokeWidth={2.5} />
            </span>
            <span className="text-xl font-black tracking-tight text-white">Ruang Bapak</span>
          </Link>

          <div className="relative">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              src={authMascot}
              alt="Maskot Ruang Bapak"
              className="mx-auto h-[400px] w-auto rounded-[2rem] object-cover shadow-lift ring-4 ring-white/20"
            />
            <div className="mt-8 text-center text-white">
              <h2 className="text-3xl font-extrabold leading-tight">Selamat Datang, Pak!</h2>
              <p className="mt-4 text-lg opacity-90">
                Tempat kita berbagi cerita, tawa, dan sedikit kebijaksanaan khas Bapak-bapak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-white/70">
            <span>© 2026 Ruang Bapak</span>
            <span>·</span>
            <span>Privasi</span>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-1/2">
          <div className="mx-auto w-full max-w-[360px]">
            <AnimatePresence mode="wait">
              {awaitingConfirmation ? (
                <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MailCheck size={28} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-3xl font-black text-foreground">Cek Email Bapak</h1>
                  <p className="mt-2 text-muted-foreground">
                    Kami sudah kirim tautan konfirmasi ke <span className="font-bold text-foreground">{email.trim()}</span>. Klik tautannya, lalu Bapak langsung bisa masuk.
                  </p>
                  <button
                    onClick={() => {
                      setAwaitingConfirmation(false);
                      setMode("login");
                      setStep(1);
                      navigate("/login", { replace: true, state: location.state });
                    }}
                    className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90"
                  >
                    Ke halaman masuk
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </motion.div>
              ) : forgotPassword ? (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {resetSent ? <MailCheck size={28} strokeWidth={2.5} /> : <KeyRound size={28} strokeWidth={2.5} />}
                  </div>
                  <h1 className="text-3xl font-black text-foreground">{resetSent ? "Cek Email Bapak" : "Lupa Password?"}</h1>
                  <p className="mt-2 text-muted-foreground">
                    {resetSent ? (
                      <>
                        Kalau <span className="font-bold text-foreground">{email.trim()}</span> terdaftar, tautan untuk membuat password baru sudah dikirim. Cek juga folder spam ya, Pak.
                      </>
                    ) : (
                      "Tenang Pak, masukkan email akun Bapak. Kami kirim tautan untuk membuat password baru."
                    )}
                  </p>

                  {!resetSent && (
                    <form onSubmit={sendPasswordReset} className="mt-8 space-y-4" noValidate>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                          type="email"
                          placeholder="Email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <span>Kirim Tautan Reset</span>
                            <ArrowRight size={18} strokeWidth={2.5} />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(false);
                      setResetSent(false);
                    }}
                    className="mt-6 w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    Kembali ke halaman masuk
                  </button>
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <header className="mb-10">
                    <h1 className="text-3xl font-black text-foreground">
                      {mode === "login" ? "Masuk ke Ruang" : "Gabung Paguyuban"}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                      {mode === "login"
                        ? "Sudah siap ngopi dan dengar cerita hari ini?"
                        : "Mari bergabung dengan ribuan Bapak hebat lainnya."}
                    </p>
                  </header>

                  {!enabled && (
                    <div className="mb-6 flex gap-2 rounded-2xl bg-accent/10 p-3 text-xs text-foreground">
                      <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>Mode demo: backend belum dikonfigurasi, jadi akun tidak benar-benar dibuat.</span>
                    </div>
                  )}

                  <form id="auth-credentials" onSubmit={handleNext} className="space-y-4" noValidate>
                    {mode === "signup" && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          autoComplete="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input
                        type="email"
                        placeholder="Email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <input
                        type="password"
                        placeholder="Password"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    {mode === "login" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setForgotPassword(true)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Lupa password?
                        </button>
                      </div>
                    )}
                  </form>

                  <button
                    type="submit"
                    form="auth-credentials"
                    disabled={loading}
                    className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <span>{mode === "login" ? "Masuk Sekarang" : "Lanjut ke Ujian Bapak"}</span>
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-surface px-4 text-muted-foreground">Atau lanjut dengan</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border/40 bg-white px-4 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted/30 active:scale-[0.98]">
                    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.558c-.806.54-1.836.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.549 0 9s.347 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.483 0 2.443 2.051.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-bold text-primary hover:underline"
                    >
                      {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <header className="mb-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Smile size={28} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-foreground text-balance">Ujian Kelayakan Bapak</h1>
                    <p className="mt-2 text-muted-foreground">
                      Sebelum masuk paguyuban, Bapak harus kasih satu **Jokes Bapak-Bapak** yang paling garing!
                    </p>
                  </header>

                  <div className="space-y-4">
                    <textarea
                      value={joke}
                      onChange={(event) => setJoke(event.target.value)}
                      maxLength={280}
                      placeholder="Contoh: Sayur apa yang paling jago silat? Sayur Kol-li..."
                      className="min-h-[160px] w-full resize-none rounded-2xl bg-muted/50 p-4 text-[15px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                    />
                    <div className="flex items-center gap-2 text-[13px] text-muted-foreground italic">
                      <CheckCircle2 size={14} className="text-primary" />
                      Tenang Pak, garing itu wajib di sini. Jokes ini jadi bio awal profil Bapak.
                    </div>
                  </div>

                  <button
                    onClick={() => void handleNext()}
                    disabled={loading}
                    className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <span>Selesaikan Pendaftaran</span>
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    className="mt-4 w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    Kembali ke data diri
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
