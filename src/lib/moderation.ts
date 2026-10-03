import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime } from "@/lib/social";

export type ReportReason = "spam" | "kasar" | "pelecehan" | "tidak_pantas" | "lainnya";

export const reportReasons: { value: ReportReason; label: string; hint: string }[] = [
  { value: "spam", label: "Spam atau promosi", hint: "Iklan, tautan berulang, atau penipuan." },
  { value: "kasar", label: "Kasar atau ujaran kebencian", hint: "Menghina, merendahkan, atau menyerang kelompok." },
  { value: "pelecehan", label: "Pelecehan atau perundungan", hint: "Menyerang atau mengganggu seseorang secara pribadi." },
  { value: "tidak_pantas", label: "Konten tidak pantas", hint: "Kekerasan, pornografi, atau berbahaya." },
  { value: "lainnya", label: "Lainnya", hint: "Jelaskan singkat di kolom keterangan." },
];

export type ReportTarget = { postId: number; commentId?: never } | { commentId: number; postId?: never };

export type ModerationAction = "hide" | "restore" | "dismiss";

export type ModerationItem = {
  reportId: number;
  reason: ReportReason;
  reasonLabel: string;
  details: string;
  status: "open" | "hidden" | "dismissed";
  time: string;
  reporterUsername: string;
  postId: number;
  commentId: number | null;
  body: string;
  authorUsername: string | null;
  anonymous: boolean;
  hidden: boolean;
  reportCount: number;
};

type ModerationRow = {
  report_id: number;
  reason: ReportReason;
  details: string;
  status: ModerationItem["status"];
  created_at: string;
  reporter_username: string;
  post_id: number;
  comment_id: number | null;
  body: string;
  author_username: string | null;
  is_anonymous: boolean;
  hidden: boolean;
  report_count: number;
};

function client() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

const isUniqueViolation = (error: { code?: string }) => error.code === "23505";

/** Files a report; returns false when this user already reported the same content. */
export async function reportContent(target: ReportTarget, reason: ReportReason, details: string): Promise<boolean> {
  const { error } = await client()
    .from("reports")
    .insert({ post_id: target.postId ?? null, comment_id: target.commentId ?? null, reason, details });
  if (error && isUniqueViolation(error)) return false;
  if (error) throw error;
  return true;
}

export async function blockUser(userId: string): Promise<void> {
  const { error } = await client().from("blocks").insert({ blocked_id: userId });
  if (error && !isUniqueViolation(error)) throw error;
}

export async function unblockUser(userId: string): Promise<void> {
  const { error } = await client().from("blocks").delete().eq("blocked_id", userId);
  if (error) throw error;
}

export async function fetchBlockStatus(myId: string, otherId: string): Promise<{ blockedByMe: boolean; blockedMe: boolean }> {
  const { data, error } = await client()
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`and(blocker_id.eq.${myId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${myId})`);
  if (error) throw error;

  const rows = data as { blocker_id: string; blocked_id: string }[];
  return {
    blockedByMe: rows.some((row) => row.blocker_id === myId),
    blockedMe: rows.some((row) => row.blocker_id === otherId),
  };
}

export async function fetchModerationQueue(): Promise<ModerationItem[]> {
  const { data, error } = await client().rpc("moderation_queue");
  if (error) throw error;

  return (data as ModerationRow[]).map((row) => ({
    reportId: row.report_id,
    reason: row.reason,
    reasonLabel: reportReasons.find((reason) => reason.value === row.reason)?.label ?? row.reason,
    details: row.details,
    status: row.status,
    time: formatRelativeTime(row.created_at),
    reporterUsername: row.reporter_username,
    postId: row.post_id,
    commentId: row.comment_id,
    body: row.body,
    authorUsername: row.author_username,
    anonymous: row.is_anonymous,
    hidden: row.hidden,
    reportCount: row.report_count,
  }));
}

export async function moderateReport(reportId: number, action: ModerationAction): Promise<void> {
  const { error } = await client().rpc("moderate_report", { report: reportId, action });
  if (error) throw error;
}
