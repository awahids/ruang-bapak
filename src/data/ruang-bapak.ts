export type Post = {
  id: number;
  name: string;
  initials: string;
  color: string;
  time: string;
  cat: string;
  tag: string;
  tagTone: "sage" | "clay" | "plum" | "blue";
  text: string;
  safe: number;
  reply: number;
  support: number;
  verified?: boolean;
};

export const posts: Post[] = [
  {
    id: 1,
    name: "Bapak Dua Anak",
    initials: "BD",
    color: "hsl(95 22% 38%)",
    time: "Baru saja",
    cat: "Curhat",
    tag: "Stress Kerja",
    tagTone: "clay",
    text: "Hari ini rasanya berat banget di kantor. Pulang malam lagi, anak-anak sudah tidur. Kadang merasa bersalah, tapi lagi-lagi ini yang bisa kulakukan sekarang. Ada bapak yang lagi di fase ini juga?",
    safe: 42,
    reply: 18,
    support: 31,
  },
  {
    id: 2,
    name: "Bapak Petualang",
    initials: "BP",
    color: "hsl(28 33% 41%)",
    time: "2 jam yang lalu",
    cat: "Curhat",
    tag: "Capek Jadi Ayah",
    tagTone: "sage",
    text: "Capek fisik nggak seberapa dibanding capek mikirin masa depan mereka. Tapi lihat senyum anak, semua lelah jadi worth it. Tetap semangat ya para bapak pejuang keluarga!",
    safe: 56,
    reply: 27,
    support: 48,
    verified: true,
  },
  {
    id: 3,
    name: "Ayah dari Zahra",
    initials: "AZ",
    color: "hsl(210 22% 45%)",
    time: "5 jam yang lalu",
    cat: "Curhat",
    tag: "Kekhawatiran",
    tagTone: "plum",
    text: "Lagi overthinking soal kesehatan istri akhir-akhir ini. Doain ya bapak-bapak, semoga semuanya selalu diberi kesehatan dan kekuatan.",
    safe: 33,
    reply: 12,
    support: 29,
    verified: true,
  },
  {
    id: 4,
    name: "Bapak Rumahan",
    initials: "BR",
    color: "hsl(22 56% 50%)",
    time: "8 jam yang lalu",
    cat: "Diskusi",
    tag: "Peran & Ekspektasi",
    tagTone: "blue",
    text: "Kadang merasa nggak cukup. Padahal sudah berusaha jadi suami dan ayah terbaik. Ada tips dari bapak-bapak buat tetap waras di tengah ekspektasi yang banyak?",
    safe: 28,
    reply: 22,
    support: 35,
  },
];

export const topikAman = [
  { emoji: "⭐", label: "Stress Kerja", tone: "clay" as const },
  { emoji: "💤", label: "Capek Jadi Ayah", tone: "sage" as const },
  { emoji: "💙", label: "Kekhawatiran Keluarga", tone: "blue" as const },
  { emoji: "🌿", label: "Kesehatan Mental", tone: "sage" as const },
  { emoji: "💰", label: "Keuangan", tone: "clay" as const },
  { emoji: "🤝", label: "Peran & Ekspektasi", tone: "plum" as const },
  { emoji: "➕", label: "Lainnya", tone: "muted" as const },
];

export const butuhDukungan = [
  { name: "Bapak Siaga", time: "1 jam yang lalu", initials: "BS", color: "hsl(95 22% 38%)" },
  { name: "Ayah dari Nafisa", time: "3 jam yang lalu", initials: "AN", color: "hsl(28 33% 41%)" },
  { name: "Bapak Introvert", time: "4 jam yang lalu", initials: "BI", color: "hsl(210 22% 45%)" },
];

export const stats = [
  { label: "Anggota", val: "8.532 Bapak", icon: "👥" },
  { label: "Online sekarang", val: "312 Bapak", icon: "🟢" },
  { label: "Cek-in minggu ini", val: "3.894", icon: "📬" },
];
