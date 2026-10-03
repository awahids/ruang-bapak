import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { reportContent, reportReasons, type ReportReason, type ReportTarget } from "@/lib/moderation";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  /** What is being reported; the dialog is open while this is set. */
  target: ReportTarget | null;
  onClose: () => void;
}

export function ReportDialog({ target, onClose }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (target) {
      setReason(null);
      setDetails("");
    }
  }, [target]);

  const kind = target?.commentId ? "komentar" : "postingan";

  const handleSubmit = async () => {
    if (!target || !reason) return;

    if (!isSupabaseConfigured) {
      toast("Mode demo", { description: "Laporan aktif setelah Supabase dikonfigurasi." });
      onClose();
      return;
    }

    setSending(true);
    try {
      const filed = await reportContent(target, reason, details.trim());
      toast.success(filed ? "Laporan terkirim. Terima kasih sudah menjaga ruang ini, Pak." : `Bapak sudah melaporkan ${kind} ini sebelumnya.`);
      onClose();
    } catch (error) {
      toast.error("Laporan gagal dikirim", { description: describeError(error) });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Laporkan {kind}</DialogTitle>
          <DialogDescription>Laporan dikirim ke moderator dan tidak terlihat oleh penulisnya.</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="Alasan laporan" className="grid gap-2">
          {reportReasons.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={reason === option.value}
              onClick={() => setReason(option.value)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                reason === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <span className="block text-sm font-semibold text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </button>
          ))}
        </div>

        <Textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Keterangan tambahan (opsional)"
          aria-label="Keterangan tambahan"
          className="resize-none"
        />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!reason || sending}>
            {sending ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
