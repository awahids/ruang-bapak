import type { LucideIcon } from "lucide-react";
import {
  Coins,
  Hand,
  Heart,
  Home,
  Inbox,
  Leaf,
  MessageCircle,
  Moon,
  Plus,
  Radio,
  Star,
  ThumbsUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";

export type TagTone = "sage" | "clay" | "plum" | "blue" | "muted";

export type ComposerMode =
  | "status"
  | "curhat"
  | "diskusi"
  | "checkin"
  | "komunitas"
  | "pesan"
  | "profil";

export type FeedPageKey =
  | "beranda"
  | "curhat"
  | "diskusi"
  | "aman-pak"
  | "komunitas"
  | "inbox"
  | "profil";

export type FeedItem = {
  id: number;
  name: string;
  initials: string;
  color: string;
  time: string;
  context: "Curhat" | "Diskusi" | "Cek-in" | "Komunitas" | "Inbox" | "Profil";
  tag: string;
  tagTone: Exclude<TagTone, "muted">;
  text: string;
  safe: number;
  reply: number;
  support: number;
  verified?: boolean;
};

export type FeedPageConfig = {
  key: FeedPageKey;
  title: string;
  subtitle: string;
  composerMode: ComposerMode;
  emptyState: string;
  initialItems: FeedItem[];
};

export type PrimaryNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type SecondaryNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
};

type ComposerPreset = {
  title: string;
  placeholder: string;
  cta: string;
  helper: string;
  quickActions: string[];
};

const feedItemsBeranda: FeedItem[] = [
  {
    id: 101,
    name: "Bapak Dua Jagoan",
    initials: "BJ",
    color: "hsl(95 22% 38%)",
    time: "Baru saja",
    context: "Curhat",
    tag: "Tugas Negara",
    tagTone: "clay",
    text: "Baru kelar 'tugas negara' di kantor. Niat hati mau langsung selonjoran, tapi teringat oli mobil belum diganti. Ada yang punya bengkel langganan yang buka sampai malam Pak?",
    safe: 42,
    reply: 18,
    support: 31,
  },
  {
    id: 102,
    name: "Ayahanda Petualang",
    initials: "AP",
    color: "hsl(28 33% 41%)",
    time: "2 jam yang lalu",
    context: "Curhat",
    tag: "Ngopi Dulu",
    tagTone: "sage",
    text: "Capek fisik mah biasa, Pak. Yang penting pikiran tetap adem. Lagi ngopi item tanpa gula biar semangat lanjut dengerin cerita anak-anak soal sekolahnya tadi. Mari ngopi, Pak!",
    safe: 56,
    reply: 27,
    support: 48,
    verified: true,
  },
  {
    id: 103,
    name: "Papanya Zahra",
    initials: "PZ",
    color: "hsl(210 22% 45%)",
    time: "5 jam yang lalu",
    context: "Curhat",
    tag: "Overthinking",
    tagTone: "plum",
    text: "Lagi duduk di teras sambil liatin langit. Overthinking soal pendidikan anak nanti. Padahal anaknya baru bisa jalan. Memang naluri bapak ya begini?",
    safe: 33,
    reply: 12,
    support: 29,
    verified: true,
  },
  {
    id: 104,
    name: "Bapak Penjaga Gawang",
    initials: "BG",
    color: "hsl(22 56% 50%)",
    time: "8 jam yang lalu",
    context: "Diskusi",
    tag: "Ekspektasi Mertua",
    tagTone: "blue",
    text: "Gimana cara ngadepin pertanyaan mertua soal 'kapan punya rumah sendiri' tanpa harus baper? Saya sudah usaha maksimal tapi memang rezekinya bertahap. Share jurusnya, Pak.",
    safe: 28,
    reply: 22,
    support: 35,
  },
];

const feedItemsCurhat: FeedItem[] = [
  {
    id: 201,
    name: "Bapak Sabar",
    initials: "BS",
    color: "hsl(95 20% 34%)",
    time: "23 menit yang lalu",
    context: "Curhat",
    tag: "Kesehatan Mental",
    tagTone: "sage",
    text: "Belakangan gampang marah karena capek. Saya tidak mau energi itu kebawa ke rumah. Lagi latihan tarik napas 4-7-8 sebelum ketemu anak.",
    safe: 19,
    reply: 8,
    support: 17,
  },
  {
    id: 202,
    name: "Ayah Muda 29",
    initials: "AM",
    color: "hsl(24 44% 44%)",
    time: "1 jam yang lalu",
    context: "Curhat",
    tag: "Keuangan",
    tagTone: "clay",
    text: "Nafkah dan cicilan lagi ketat. Saya butuh pola budgeting mingguan yang realistis untuk keluarga kecil.",
    safe: 24,
    reply: 14,
    support: 22,
  },
  {
    id: 203,
    name: "Bapak Introvert",
    initials: "BI",
    color: "hsl(210 22% 45%)",
    time: "4 jam yang lalu",
    context: "Curhat",
    tag: "Capek Jadi Ayah",
    tagTone: "sage",
    text: "Pulang kerja rasanya ingin diam dulu, tapi anak ingin bermain. Lagi belajar transisi 15 menit supaya tetap hadir sebagai ayah.",
    safe: 38,
    reply: 11,
    support: 26,
  },
];

const feedItemsDiskusi: FeedItem[] = [
  {
    id: 301,
    name: "Bapak Tangguh",
    initials: "BT",
    color: "hsl(26 40% 42%)",
    time: "46 menit yang lalu",
    context: "Diskusi",
    tag: "Peran & Ekspektasi",
    tagTone: "blue",
    text: "Bagaimana cara membagi peran domestik yang adil tanpa saling tersinggung? Share pengalaman yang berhasil di rumah masing-masing.",
    safe: 29,
    reply: 31,
    support: 20,
  },
  {
    id: 302,
    name: "Ayah dari Naya",
    initials: "AN",
    color: "hsl(210 25% 44%)",
    time: "2 jam yang lalu",
    context: "Diskusi",
    tag: "Stress Kerja",
    tagTone: "clay",
    text: "Ada yang punya ritual transisi dari mode kerja ke mode keluarga supaya tidak membawa beban kantor ke rumah?",
    safe: 21,
    reply: 17,
    support: 18,
  },
  {
    id: 303,
    name: "Bapak Dua Shift",
    initials: "DS",
    color: "hsl(98 22% 36%)",
    time: "6 jam yang lalu",
    context: "Diskusi",
    tag: "Kekhawatiran",
    tagTone: "plum",
    text: "Anak mulai susah diajak ngobrol akhir-akhir ini. Pendekatan komunikasi apa yang efektif untuk anak usia SD?",
    safe: 33,
    reply: 26,
    support: 24,
  },
];

const feedItemsAmanPak: FeedItem[] = [
  {
    id: 401,
    name: "Bapak Siaga",
    initials: "BS",
    color: "hsl(95 22% 38%)",
    time: "Baru saja",
    context: "Cek-in",
    tag: "Cek-in Harian",
    tagTone: "sage",
    text: "Hari ini saya memilih jujur: energi lagi 60%. Tapi tetap hadir buat keluarga malam ini.",
    safe: 44,
    reply: 9,
    support: 38,
  },
  {
    id: 402,
    name: "Ayah dari Nafisa",
    initials: "AN",
    color: "hsl(28 33% 41%)",
    time: "3 jam yang lalu",
    context: "Cek-in",
    tag: "Dukungan",
    tagTone: "clay",
    text: "Terima kasih untuk bapak-bapak yang kemarin ngecek kabar. Saya merasa lebih kuat hari ini.",
    safe: 32,
    reply: 6,
    support: 30,
  },
  {
    id: 403,
    name: "Bapak Introvert",
    initials: "BI",
    color: "hsl(210 22% 45%)",
    time: "4 jam yang lalu",
    context: "Cek-in",
    tag: "Pemulihan",
    tagTone: "blue",
    text: "Saya lagi fokus tidur cukup 7 jam selama seminggu. Semoga mood dan sabar ke anak ikut membaik.",
    safe: 27,
    reply: 7,
    support: 21,
  },
];

const feedItemsKomunitas: FeedItem[] = [
  {
    id: 501,
    name: "Komunitas Ayah Pagi",
    initials: "AP",
    color: "hsl(100 20% 34%)",
    time: "1 jam yang lalu",
    context: "Komunitas",
    tag: "Meetup",
    tagTone: "sage",
    text: "Minggu ini ada kopi pagi bareng di Jakarta Selatan jam 07.30. Fokus bahas komunikasi dengan pasangan.",
    safe: 18,
    reply: 15,
    support: 16,
  },
  {
    id: 502,
    name: "Bapak Productive",
    initials: "BP",
    color: "hsl(26 42% 44%)",
    time: "3 jam yang lalu",
    context: "Komunitas",
    tag: "Keuangan",
    tagTone: "clay",
    text: "Komunitas budgeting keluarga buka sesi audit cashflow mingguan. Siapa yang mau ikut batch berikutnya?",
    safe: 23,
    reply: 10,
    support: 19,
  },
  {
    id: 503,
    name: "Ayah Belajar",
    initials: "AB",
    color: "hsl(211 24% 45%)",
    time: "5 jam yang lalu",
    context: "Komunitas",
    tag: "Belajar Bareng",
    tagTone: "blue",
    text: "Kelas online parenting usia 6-12 dibuka lagi minggu depan. Materi fokus regulasi emosi ayah dan anak.",
    safe: 26,
    reply: 13,
    support: 22,
  },
];

const feedItemsInbox: FeedItem[] = [
  {
    id: 601,
    name: "Moderator Ruang Bapak",
    initials: "MR",
    color: "hsl(96 20% 34%)",
    time: "12 menit yang lalu",
    context: "Inbox",
    tag: "Notifikasi",
    tagTone: "sage",
    text: "Ada 3 balasan baru di thread Curhat Anda. Cek sekarang untuk lanjut diskusi.",
    safe: 12,
    reply: 5,
    support: 9,
  },
  {
    id: 602,
    name: "Bapak Siaga",
    initials: "BS",
    color: "hsl(28 33% 41%)",
    time: "2 jam yang lalu",
    context: "Inbox",
    tag: "Pesan Pribadi",
    tagTone: "clay",
    text: "Pak, terima kasih sudah komentar kemarin. Boleh tanya lebih lanjut soal rutinitas malam anak?",
    safe: 8,
    reply: 4,
    support: 7,
  },
  {
    id: 603,
    name: "Komunitas Ayah Pagi",
    initials: "AP",
    color: "hsl(210 22% 45%)",
    time: "6 jam yang lalu",
    context: "Inbox",
    tag: "Undangan",
    tagTone: "blue",
    text: "Anda diundang ke ruang diskusi privat: Menjaga stamina bapak pekerja shift.",
    safe: 10,
    reply: 3,
    support: 8,
  },
];

const feedItemsProfil: FeedItem[] = [
  {
    id: 701,
    name: "Ari Pratama",
    initials: "AP",
    color: "hsl(28 33% 41%)",
    time: "Baru saja",
    context: "Profil",
    tag: "Update Pribadi",
    tagTone: "sage",
    text: "Minggu ini target saya: 30 menit quality time tanpa gadget setiap malam bersama anak.",
    safe: 20,
    reply: 9,
    support: 15,
    verified: true,
  },
  {
    id: 702,
    name: "Ari Pratama",
    initials: "AP",
    color: "hsl(28 33% 41%)",
    time: "1 hari yang lalu",
    context: "Profil",
    tag: "Catatan Ayah",
    tagTone: "clay",
    text: "Saya mulai jurnal syukur harian 3 poin. Efeknya lumayan menurunkan stres kerja.",
    safe: 28,
    reply: 12,
    support: 21,
    verified: true,
  },
];

const allFeedItems: FeedItem[] = [
  ...feedItemsBeranda,
  ...feedItemsCurhat,
  ...feedItemsDiskusi,
  ...feedItemsAmanPak,
  ...feedItemsKomunitas,
  ...feedItemsInbox,
  ...feedItemsProfil,
];

const feedItemById = new Map(allFeedItems.map((item) => [item.id, item]));

export function getFeedItemById(postId: number): FeedItem | undefined {
  return feedItemById.get(postId);
}

export const feedPageConfigs: Record<FeedPageKey, FeedPageConfig> = {
  beranda: {
    key: "beranda",
    title: "Teras Bapak",
    subtitle: "Linimasa terbaru dari curhat, diskusi, dan cek-in komunitas bapak.",
    composerMode: "status",
    emptyState: "Belum ada postingan. Mulai dari cerita kecil hari ini.",
    initialItems: feedItemsBeranda,
  },
  curhat: {
    key: "curhat",
    title: "Uneg-uneg",
    subtitle: "Ruang aman untuk cerita tanpa dihakimi.",
    composerMode: "curhat",
    emptyState: "Belum ada curhat baru. Ceritakan apa yang lagi berat hari ini.",
    initialItems: feedItemsCurhat,
  },
  diskusi: {
    key: "diskusi",
    title: "Diskusi",
    subtitle: "Tukar perspektif dan praktik baik antar bapak.",
    composerMode: "diskusi",
    emptyState: "Belum ada diskusi. Mulai satu pertanyaan yang penting buat Anda.",
    initialItems: feedItemsDiskusi,
  },
  "aman-pak": {
    key: "aman-pak",
    title: "Aman Pak?",
    subtitle: "Cek-in cepat untuk saling peduli setiap hari.",
    composerMode: "checkin",
    emptyState: "Belum ada cek-in hari ini. Mulai dari kabar Anda dulu.",
    initialItems: feedItemsAmanPak,
  },
  komunitas: {
    key: "komunitas",
    title: "Paguyuban",
    subtitle: "Temukan bapak sejalan dan aktivitas yang relevan.",
    composerMode: "komunitas",
    emptyState: "Belum ada aktivitas komunitas. Bagikan agenda atau ajakan Anda.",
    initialItems: feedItemsKomunitas,
  },
  inbox: {
    key: "inbox",
    title: "Inbox",
    subtitle: "Pesan, notifikasi, dan undangan komunitas Anda.",
    composerMode: "pesan",
    emptyState: "Inbox kosong. Anda bisa mulai kirim pesan dukungan.",
    initialItems: feedItemsInbox,
  },
  profil: {
    key: "profil",
    title: "Profil",
    subtitle: "Ruang pribadi untuk update perjalanan Anda sebagai bapak.",
    composerMode: "profil",
    emptyState: "Belum ada update profil. Tulis target kecil minggu ini.",
    initialItems: feedItemsProfil,
  },
};

export const composerPresets: Record<ComposerMode, ComposerPreset> = {
  status: {
    title: "Cek Sound Hari Ini, Pak?",
    placeholder: "Ada cerita unik, keluhan halus, atau sekadar pengen sapa...",
    cta: "Kirim",
    helper: "Cerita ringan atau berat, yang penting jujur ya Pak.",
    quickActions: ["Ngopi", "Ronda", "Tugas Negara"],
  },
  curhat: {
    title: "Ruang Curhat Aman",
    placeholder: "Tulis apa yang lagi berat. Anda bisa anonim.",
    cta: "Kirim",
    helper: "Gunakan bahasa apa adanya, kami jaga ruang ini tetap suportif.",
    quickActions: ["Anonim", "Kesehatan Mental", "Stress Kerja"],
  },
  diskusi: {
    title: "Mulai Diskusi Baru",
    placeholder: "Apa pertanyaan atau topik yang ingin dibahas bersama?",
    cta: "Publikasikan Diskusi",
    helper: "Pertanyaan yang jelas biasanya dapat jawaban yang lebih berkualitas.",
    quickActions: ["Peran Ayah", "Komunikasi", "Keuangan"],
  },
  checkin: {
    title: "Cek-in Kondisi Hari Ini",
    placeholder: "Contoh: energi 70%, butuh waktu tenang malam ini.",
    cta: "Cek-in",
    helper: "Satu kalimat jujur bisa jadi pintu dukungan dari bapak lain.",
    quickActions: ["Energi", "Mood", "Dukungan"],
  },
  komunitas: {
    title: "Bagikan Aktivitas Komunitas",
    placeholder: "Ajak bapak lain untuk meetup, kelas, atau obrolan online.",
    cta: "Bagikan Aktivitas",
    helper: "Tuliskan waktu, lokasi, dan tujuan biar mudah diikuti.",
    quickActions: ["Meetup", "Kelas", "Online"],
  },
  pesan: {
    title: "Tulis Pesan Dukungan",
    placeholder: "Kirim pesan singkat yang menguatkan bapak lain.",
    cta: "Kirim",
    helper: "Pesan yang empatik sering lebih berarti dari solusi panjang.",
    quickActions: ["Terima kasih", "Semangat", "Follow up"],
  },
  profil: {
    title: "Update Perjalanan Bapak",
    placeholder: "Tulis pencapaian kecil atau refleksi minggu ini.",
    cta: "Simpan Update",
    helper: "Catatan kecil yang konsisten membantu melihat progres nyata.",
    quickActions: ["Target Mingguan", "Refleksi", "Syukur"],
  },
};

export const primaryNavItems: PrimaryNavItem[] = [
  { label: "Teras Bapak", to: "/", icon: Home },
  { label: "Uneg-uneg", to: "/curhat", icon: MessageCircle },
  { label: "Diskusi", to: "/diskusi", icon: Users },
  { label: "Aman Pak?", to: "/aman-pak", icon: ThumbsUp },
  { label: "Paguyuban", to: "/komunitas", icon: UserCheck },
];

export const secondaryNavItems: SecondaryNavItem[] = [
  { label: "Inbox", to: "/inbox", icon: Inbox, badge: 3 },
  { label: "Profil", to: "/profil", icon: User },
];

type TopikAmanItem = {
  icon: LucideIcon;
  label: string;
  tone: TagTone;
};

export const topikAman: TopikAmanItem[] = [
  { icon: Star, label: "Tugas Negara", tone: "clay" },
  { icon: Moon, label: "Jokes Bapak", tone: "sage" },
  { icon: Heart, label: "Cicilan Aman", tone: "blue" },
  { icon: Leaf, label: "Ngopi Pagi", tone: "sage" },
  { icon: Coins, label: "Ganti Oli", tone: "clay" },
  { icon: Hand, label: "Ronda Malam", tone: "plum" },
  { icon: Plus, label: "Lainnya", tone: "muted" },
];

export const butuhDukungan = [
  { name: "Bapak Dua Jagoan", time: "1 jam yang lalu", initials: "BJ", color: "hsl(95 22% 38%)" },
  { name: "Ayahanda Petualang", time: "3 jam yang lalu", initials: "AP", color: "hsl(28 33% 41%)" },
  { name: "Papanya Zahra", time: "4 jam yang lalu", initials: "PZ", color: "hsl(210 22% 45%)" },
];

type StatItem = {
  label: string;
  val: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export const stats: StatItem[] = [
  { label: "Pasukan Bapak", val: "8.532 Orang", icon: Users },
  { label: "Lagi Ngopi (Online)", val: "312 Orang", icon: Radio, iconClassName: "text-accent" },
  { label: "Saling Cek-in", val: "3.894 Kali", icon: Inbox },
];
