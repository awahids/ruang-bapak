import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ArrowRight, Smile, Mail, Lock, User, CheckCircle2, Info, MailCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { needsJoke, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";
import authMascot from "@/assets/bapak.png";

type AuthLocationState = { from?: string } | null;

const inputClassName =
  "h-12 w-full rounded-2xl bg-muted/50 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20";
const labelClassName = "mb-1.5 block text-sm font-bold text-foreground";
const iconClassName = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground";
const JOKE_MIN = 10;
const JOKE_MAX = 280;

function SignupSteps({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Langkah {current} dari 2 · {current === 1 ? "Data diri" : "Ujian jokes"}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {[1, 2].map((n) => (
          <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= current ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { enabled, user, signOut } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(location.pathname === "/signup" ? "signup" : "login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [joke, setJoke] = useState("");
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const redirectTo = (location.state as AuthLocationState)?.from ?? "/";
  const jokeLength = joke.trim().length;

  // Signed in but the joke exam is still open (Google sign-ups): show only the exam.
  const jokeOnly = enabled && needsJoke(user);

  if (enabled && user && !jokeOnly) {
    return <Navigate to={redirectTo} replace />;
  }

  const jokeTooShort = () => {
    if (joke.trim().length >= JOKE_MIN) return false;
    toast.error("Jokes-nya belum lulus ujian, Pak.", { description: `Tulis minimal ${JOKE_MIN} karakter, segaring mungkin.` });
    return true;
  };

  const submitJoke = async () => {
    if (!supabase || !user || jokeTooShort()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { joke: joke.trim() } });
      if (error) throw error;
      // The joke becomes the starting bio, unless the member already wrote one.
      await supabase.from("profiles").update({ bio: joke.trim() }).eq("id", user.id).eq("bio", "");
      toast.success("Lulus ujian! Selamat bergabung di paguyuban, Pak!");
      // The updated session clears jokeOnly, which redirects to redirectTo.
    } catch (error) {
      toast.error("Gagal menyimpan jokes", { description: describeError(error) });
    } finally {
      setLoading(false);
    }
  };

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

    if (mode === "signup" && jokeTooShort()) return;

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

      // Supabase answers a sign-up for an email that already has an account
      // (e.g. one made with Google) with an empty identity list and sends no email.
      if (data.user && !data.session && data.user.identities?.length === 0) {
        toast.error("Email ini sudah terdaftar", {
          description: "Silakan masuk. Kalau dulu daftar pakai Google, tekan tombol Google; kalau lupa password, pakai \"Lupa password?\".",
        });
        setMode("login");
        setStep(1);
        navigate("/login", { replace: true, state: location.state });
        return;
      }

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
        <div className="hidden w-1/2 flex-col justify-between gap-8 bg-gradient-sage p-12 lg:flex">
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
            <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
              <img src={authMascot} alt="" className="h-12 w-12 rounded-2xl object-cover object-top ring-2 ring-primary/15" />
              <span>
                <span className="block text-lg font-black leading-tight tracking-tight text-foreground">Ruang Bapak</span>
                <span className="block text-xs text-muted-foreground">Ngopi, cerita, dan jokes garing</span>
              </span>
            </Link>
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
                      <label htmlFor="reset-email" className={labelClassName}>Email</label>
                      <div className="relative">
                          <Mail className={iconClassName} size={18} />
                          <input
                            id="reset-email"
                            type="email"
                            placeholder="bapak@email.com"
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
              ) : step === 1 && !jokeOnly ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {mode === "signup" && <SignupSteps current={1} />}
                  <header className="mb-8">
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
                      <div>
                        <label htmlFor="auth-name" className={labelClassName}>Nama lengkap</label>
                        <div className="relative">
                          <User className={iconClassName} size={18} />
                          <input
                            id="auth-name"
                            type="text"
                            placeholder="Budi Santoso"
                            autoComplete="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className={inputClassName}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label htmlFor="auth-email" className={labelClassName}>Email</label>
                      <div className="relative">
                        <Mail className={iconClassName} size={18} />
                        <input
                          id="auth-email"
                          type="email"
                          placeholder="bapak@email.com"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="auth-password" className={labelClassName}>Password</label>
                      <div className="relative">
                        <Lock className={iconClassName} size={18} />
                        <input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className={cn(inputClassName, "pr-12")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((shown) => !shown)}
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          aria-pressed={showPassword}
                          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
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
                  <SignupSteps current={2} />
                  <header className="mb-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Smile size={28} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-foreground text-balance">Ujian Kelayakan Bapak</h1>
                    <p className="mt-2 text-muted-foreground">
                      Sebelum masuk paguyuban, Bapak harus kasih satu <strong className="text-foreground">Jokes Bapak-Bapak</strong> yang paling garing!
                    </p>
                  </header>

                  <div className="space-y-3">
                    <label htmlFor="auth-joke" className={labelClassName}>Jokes Bapak</label>
                    <textarea
                      id="auth-joke"
                      aria-describedby="auth-joke-hint"
                      value={joke}
                      onChange={(event) => setJoke(event.target.value)}
                      maxLength={JOKE_MAX}
                      placeholder="Contoh: Sayur apa yang paling jago silat? Sayur Kol-li..."
                      className="min-h-[160px] w-full resize-none rounded-2xl bg-muted/50 p-4 text-[15px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
                    />
                    <div id="auth-joke-hint" className="flex items-start justify-between gap-3 text-[13px]">
                      <span className={cn("font-medium", jokeLength >= JOKE_MIN ? "text-primary" : "text-muted-foreground")}>
                        {jokeLength >= JOKE_MIN ? "Sip, sudah layak ikut ujian!" : `Kurang ${JOKE_MIN - jokeLength} karakter lagi (minimal ${JOKE_MIN}).`}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{jokeLength}/{JOKE_MAX}</span>
                    </div>
                    <div className="flex items-start gap-2 rounded-2xl bg-primary/5 p-3 text-[13px] text-muted-foreground">
                      <CheckCircle2 size={18} className="mt-px shrink-0 text-primary" />
                      Tenang Pak, garing itu wajib di sini. Jokes ini jadi bio awal profil Bapak.
                    </div>
                  </div>

                  <button
                    onClick={() => void (jokeOnly ? submitJoke() : handleNext())}
                    disabled={loading || jokeLength < JOKE_MIN}
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
                    onClick={() => (jokeOnly ? void signOut() : setStep(1))}
                    className="mt-4 w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    {jokeOnly ? "Keluar" : "Kembali ke data diri"}
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
