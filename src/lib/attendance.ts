import { supabase } from "@/integrations/supabase/client";

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "lembur";

export type AttendanceRecord = {
  /** Day in WIB, as YYYY-MM-DD. */
  date: string;
  status: AttendanceStatus;
  note?: string;
  submittedAt: string;
};

const HISTORY_DAYS = 62;

function client() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

/** Today's date in Western Indonesia Time, matching the database default. */
export function todayWib(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The member's attendance over roughly the last two months, newest first. */
export async function fetchAttendance(userId: string): Promise<AttendanceRecord[]> {
  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const { data, error } = await client()
    .from("attendance")
    .select("day, status, note, updated_at")
    .eq("user_id", userId)
    .gte("day", todayWib(since))
    .order("day", { ascending: false });
  if (error) throw error;

  return (data as { day: string; status: AttendanceStatus; note: string; updated_at: string }[]).map((row) => ({
    date: row.day,
    status: row.status,
    note: row.note || undefined,
    submittedAt: row.updated_at,
  }));
}

/** Records today's attendance, replacing an earlier entry for today. */
export async function saveAttendance(userId: string, status: AttendanceStatus, note: string): Promise<void> {
  const { error } = await client()
    .from("attendance")
    .upsert(
      { user_id: userId, day: todayWib(), status, note, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" },
    );
  if (error) throw error;
}
