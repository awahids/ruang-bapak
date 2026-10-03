import { useState } from "react";
import { EyeOff, Eye, Flag, Loader2, ShieldCheck, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { RuangShell } from "@/components/ruang/RuangShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchModerationQueue, moderateReport, type ModerationAction, type ModerationItem } from "@/lib/moderation";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";

type QueueTab = "open" | "done";

const statusLabel: Record<ModerationItem["status"], { label: string; className: string }> = {
  open: { label: "Perlu ditinjau", className: "bg-accent/15 text-accent" },
  hidden: { label: "Disembunyikan", className: "bg-destructive/10 text-destructive" },
  dismissed: { label: "Diabaikan", className: "bg-muted text-muted-foreground" },
};

const actionToast: Record<ModerationAction, string> = {
  hide: "Konten disembunyikan dari semua orang",
  restore: "Konten ditampilkan lagi",
  dismiss: "Laporan diabaikan",
};

function ReportCard({ item, onAction, pending }: { item: ModerationItem; onAction: (action: ModerationAction) => void; pending: boolean }) {
  const status = statusLabel[item.status];

  return (
    <article className="border-b border-border/40 bg-surface px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("rounded-full px-2 py-0.5 font-bold", status.className)}>{status.label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
          <Flag size={11} />
          {item.reasonLabel}
        </span>
        <span className="text-muted-foreground">
          {item.commentId ? "Komentar" : "Postingan"} · dilaporkan @{item.reporterUsername} · {item.time}
        </span>
        {item.reportCount > 1 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-bold text-destructive">{item.reportCount} laporan</span>
        )}
      </div>

      <blockquote className="mt-3 whitespace-pre-wrap break-words rounded-xl border-l-4 border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
        {item.body}
      </blockquote>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Oleh {item.anonymous ? "penulis anonim" : `@${item.authorUsername}`} ·{" "}
        <Link to={`/post/${item.postId}`} className="font-semibold text-primary hover:underline">
          Buka postingan
        </Link>
        {item.hidden && " (sedang disembunyikan)"}
      </p>

      {item.details && <p className="mt-2 text-sm text-muted-foreground">Keterangan pelapor: “{item.details}”</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {item.hidden ? (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => onAction("restore")} className="gap-1.5">
            <Eye size={14} />
            Tampilkan lagi
          </Button>
        ) : (
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => onAction("hide")} className="gap-1.5">
            <EyeOff size={14} />
            Sembunyikan
          </Button>
        )}
        {item.status === "open" && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => onAction("dismiss")} className="gap-1.5">
            <X size={14} />
            Abaikan
          </Button>
        )}
      </div>
    </article>
  );
}

function ModerationQueue() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<QueueTab>("open");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { data: items = [], isLoading, error } = useQuery({ queryKey: ["moderation-queue"], queryFn: fetchModerationQueue });

  const visible = items.filter((item) => (tab === "open" ? item.status === "open" : item.status !== "open"));
  const openCount = items.filter((item) => item.status === "open").length;

  const handleAction = async (item: ModerationItem, action: ModerationAction) => {
    setPendingId(item.reportId);
    try {
      await moderateReport(item.reportId, action);
      await queryClient.invalidateQueries();
      toast.success(actionToast[action]);
    } catch (err) {
      toast.error("Aksi moderasi gagal", { description: describeError(err) });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <ShieldCheck size={20} className="text-primary" />
          Moderasi
        </h1>
        <div className="mt-3 flex gap-1 rounded-xl bg-muted/30 p-1">
          {(["open", "done"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
                tab === key ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              {key === "open" ? "Perlu Ditinjau" : "Selesai"}
              {key === "open" && openCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">{openCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat laporan" />
        </div>
      ) : error ? (
        <p className="px-5 py-20 text-center text-muted-foreground">{describeError(error)}</p>
      ) : visible.length === 0 ? (
        <div className="px-5 py-20 text-center">
          <p className="text-lg font-bold text-foreground">{tab === "open" ? "Semua aman, Pak" : "Belum ada laporan selesai"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tab === "open" ? "Tidak ada laporan yang menunggu ditinjau." : "Laporan yang sudah ditangani muncul di sini."}</p>
        </div>
      ) : (
        visible.map((item) => (
          <ReportCard key={item.reportId} item={item} pending={pendingId === item.reportId} onAction={(action) => handleAction(item, action)} />
        ))
      )}
    </div>
  );
}

const Moderasi = () => {
  const { enabled, loading, user, profile } = useAuth();
  const location = useLocation();

  if (!enabled) return <Navigate to="/" replace />;
  if (!loading && !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <RuangShell>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat" />
        </div>
      ) : profile?.is_moderator ? (
        <ModerationQueue />
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
          <ShieldCheck size={36} className="text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold text-foreground">Khusus moderator</h1>
          <p className="mt-1 text-muted-foreground">Halaman ini hanya untuk moderator Ruang Bapak.</p>
        </div>
      )}
    </RuangShell>
  );
};

export default Moderasi;
