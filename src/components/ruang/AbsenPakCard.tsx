import { useMemo, useState } from "react";
import { CalendarCheck2, ClipboardList, Stethoscope, UserCheck, UserMinus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "lembur";

type AttendanceRecord = {
  date: string;
  status: AttendanceStatus;
  note?: string;
  submittedAt: string;
};

const STORAGE_KEY = "ruang-bapak:absen-pak";

const statusOptions: Array<{
  key: AttendanceStatus;
  label: string;
  icon: typeof UserCheck;
  activeClassName: string;
}> = [
  { key: "hadir", label: "Hadir", icon: UserCheck, activeClassName: "bg-primary text-primary-foreground border-primary" },
  { key: "izin", label: "Izin", icon: UserMinus, activeClassName: "bg-[hsl(210_30%_38%)] text-white border-[hsl(210_30%_38%)]" },
  { key: "sakit", label: "Sakit", icon: Stethoscope, activeClassName: "bg-destructive text-destructive-foreground border-destructive" },
  { key: "lembur", label: "Lembur", icon: WalletCards, activeClassName: "bg-clay text-clay-foreground border-clay" },
];

const statusLabelMap: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  lembur: "Lembur",
};

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateKey: string): string => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const parseStoredRecords = (): AttendanceRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is AttendanceRecord => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const candidate = item as Partial<AttendanceRecord>;
        return (
          typeof candidate.date === "string" &&
          typeof candidate.status === "string" &&
          typeof candidate.submittedAt === "string" &&
          ["hadir", "izin", "sakit", "lembur"].includes(candidate.status)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
};

const persistRecords = (records: AttendanceRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export function AbsenPakCard() {
  const today = formatDateKey(new Date());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => parseStoredRecords());
  const [status, setStatus] = useState<AttendanceStatus>("hadir");
  const [note, setNote] = useState("");

  const todayRecord = useMemo(
    () => records.find((record) => record.date === today),
    [records, today]
  );

  const monthPrefix = today.slice(0, 7);
  const monthlyCount = useMemo(
    () => records.filter((record) => record.date.startsWith(monthPrefix)).length,
    [records, monthPrefix]
  );

  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  const handleSubmitAttendance = () => {
    const cleanedNote = note.trim();

    const nextRecord: AttendanceRecord = {
      date: today,
      status,
      note: cleanedNote || undefined,
      submittedAt: new Date().toISOString(),
    };

    setRecords((previous) => {
      const nextRecords = [nextRecord, ...previous.filter((record) => record.date !== today)]
        .sort((a, b) => b.date.localeCompare(a.date));
      persistRecords(nextRecords);
      return nextRecords;
    });

    setNote("");
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-soft">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <CalendarCheck2 size={18} className="text-primary" />
            Absen Pak
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Absen harian untuk cek kondisi dan kehadiran Bapak.</p>
        </div>
        <div className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          Bulan ini: <span className="text-foreground">{monthlyCount} absen</span>
        </div>
      </header>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = status === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setStatus(option.key)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? option.activeClassName
                  : "border-border bg-surface text-foreground hover:bg-muted"
              )}
            >
              <Icon size={15} />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        <label htmlFor="absen-note" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Catatan (opsional)
        </label>
        <Textarea
          id="absen-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Contoh: energi 70%, pulang agak malam karena lembur."
          className="min-h-[74px] resize-none bg-surface"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {todayRecord
            ? `Absen hari ini sudah masuk: ${statusLabelMap[todayRecord.status]}`
            : "Belum absen hari ini."}
        </p>
        <Button type="button" size="sm" onClick={handleSubmitAttendance}>
          {todayRecord ? "Perbarui Absen Hari Ini" : "Kirim Absen Hari Ini"}
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-border/50 bg-surface p-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ClipboardList size={15} className="text-primary" />
          Riwayat Absen
        </h3>

        {recentRecords.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Belum ada riwayat absen.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recentRecords.map((record) => (
              <li key={record.date} className="rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{formatDateLabel(record.date)}</p>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {statusLabelMap[record.status]}
                  </span>
                </div>
                {record.note && <p className="mt-1 text-sm text-muted-foreground">{record.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
