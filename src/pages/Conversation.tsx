import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/ruang/Avatar";
import { RuangShell } from "@/components/ruang/RuangShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useConversation } from "@/hooks/use-inbox";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";

function ConversationView({ conversationId }: { conversationId: number }) {
  const navigate = useNavigate();
  const { thread, messages, isLoading, error, send } = useConversation(conversationId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      await send(body);
      setDraft("");
    } catch (err) {
      toast.error("Pesan gagal dikirim", { description: describeError(err) });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" aria-label="Memuat percakapan" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-xl font-bold text-foreground">Percakapan tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">{error ? describeError(error) : "Mungkin tautannya salah, Pak."}</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/inbox")}>
          Kembali ke Inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col lg:min-h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/inbox")}
          aria-label="Kembali ke Inbox"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft size={18} />
        </button>
        <Link to={`/u/${thread.otherUsername}`} className="flex min-w-0 items-center gap-3 rounded-full pr-3 transition-colors hover:bg-muted/50">
          <Avatar initials={thread.otherInitials} color={thread.otherColor} src={thread.otherAvatarUrl} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-foreground">{thread.otherName}</p>
            <p className="truncate text-xs text-muted-foreground">@{thread.otherUsername}</p>
          </div>
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:px-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="m-auto max-w-xs text-center text-sm text-muted-foreground">
            Belum ada pesan. Sapa {thread.otherName} duluan, Pak!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={cn("flex", message.mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm",
                  message.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={cn("mt-0.5 text-[10px]", message.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{message.time}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {thread.blockedByMe || thread.blockedMe ? (
        <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] border-t border-border/40 bg-surface px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:bottom-0">
          {thread.blockedByMe ? (
            <>
              Bapak memblokir {thread.otherName}.{" "}
              <Link to={`/u/${thread.otherUsername}`} className="font-bold text-primary hover:underline">
                Buka blokir di profilnya
              </Link>{" "}
              untuk kirim pesan lagi.
            </>
          ) : (
            "Bapak tidak bisa membalas percakapan ini."
          )}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] flex items-end gap-2 border-t border-border/40 bg-surface px-4 py-3 sm:px-6 lg:bottom-0"
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            aria-label={`Pesan untuk ${thread.otherName}`}
            maxLength={2000}
            rows={1}
            className="max-h-32 min-h-10 resize-none"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || sending} aria-label="Kirim pesan" className="shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      )}
    </div>
  );
}

const Conversation = () => {
  const { enabled, loading, user } = useAuth();
  const { conversationId } = useParams();
  const location = useLocation();

  if (!enabled) return <Navigate to="/inbox" replace />;

  return (
    <RuangShell>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat" />
        </div>
      ) : !user ? (
        <Navigate to="/login" replace state={{ from: location.pathname }} />
      ) : (
        <ConversationView key={conversationId} conversationId={Number(conversationId)} />
      )}
    </RuangShell>
  );
};

export default Conversation;
