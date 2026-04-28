import { useState } from "react";
import { motion } from "framer-motion";
import { PenLine, EyeOff, Shield } from "lucide-react";
import heroCoffee from "@/assets/hero-coffee.png";

export function HeroCard() {
  const [anon, setAnon] = useState(false);
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full overflow-hidden rounded-3xl bg-card p-6 shadow-card sm:p-8"
    >
      {/* Decorative warm wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-warm opacity-70" />
      {/* Coffee illustration */}
      <img
        src={heroCoffee}
        alt=""
        loading="eager"
        width={768}
        height={512}
        className="pointer-events-none absolute -right-4 -top-2 hidden h-40 w-auto select-none object-contain sm:block md:h-48"
      />

      <div className="relative w-full max-w-xl">
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
          Apa yang lagi berat hari ini?
        </h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Tuliskan, luapkan, atau bagikan. Di sini kamu aman.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-sage px-5 py-3 text-sm font-bold text-primary-foreground shadow-card transition-shadow hover:shadow-lift"
          >
            <PenLine size={16} strokeWidth={2.4} />
            Tulis Curhatan
          </motion.button>

          <button
            onClick={() => setAnon(!anon)}
            className="inline-flex items-center gap-2 rounded-2xl bg-card/80 px-4 py-3 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-muted"
          >
            <EyeOff size={16} strokeWidth={2.2} />
            Anonim
            <span
              className={`relative ml-1 h-5 w-9 rounded-full transition-colors ${
                anon ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${
                  anon ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/60 px-3.5 py-2.5 text-[11px] font-medium text-muted-foreground">
          <Shield size={13} strokeWidth={2.4} className="text-primary" />
          Privasi terjaga. Hanya bapak-bapak di Ruang Bapak yang bisa melihat.
        </div>
      </div>
    </motion.section>
  );
}
