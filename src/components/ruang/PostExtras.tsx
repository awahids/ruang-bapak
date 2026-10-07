import { useEffect, useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, Share } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedItem, PostPoll } from "@/data/ruang-bapak";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { describeError, setBookmarked, setPollVote } from "@/lib/social";
import { sharePost } from "@/lib/share";
import { cn } from "@/lib/utils";

const stop = (event: MouseEvent) => event.stopPropagation();

/** Photo attached to a post; opens full size in a dialog. */
export function PostImage({ src, className }: { src: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className={cn("mt-3 block w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/40", className)}
        aria-label="Lihat foto"
      >
        <img src={src} alt="Foto postingan" loading="lazy" className="max-h-[28rem] w-full object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none" onClick={stop}>
          <DialogTitle className="sr-only">Foto postingan</DialogTitle>
          <img src={src} alt="Foto postingan" className="max-h-[85vh] w-full rounded-2xl object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}

const withVote = (poll: PostPoll, option: number | null): PostPoll => {
  const counts = [...poll.counts];
  if (poll.myVote !== null) counts[poll.myVote] = Math.max(0, counts[poll.myVote] - 1);
  if (option !== null) counts[option] += 1;
  return { ...poll, counts, myVote: option };
};

/** Poll with live results; tapping your own choice again withdraws the vote. */
export function PostPollView({ postId, poll }: { postId: number; poll: PostPoll }) {
  const { enabled, user } = useAuth();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState(poll);
  const [pending, setPending] = useState(false);

  useEffect(() => setState(poll), [poll]);

  const total = state.counts.reduce((sum, count) => sum + count, 0);
  const voted = state.myVote !== null;

  const vote = async (option: number) => {
    if (pending || !requireAuth()) return;

    const previous = state;
    const next = state.myVote === option ? null : option;
    setState(withVote(state, next));

    if (!enabled || !user) return;

    setPending(true);
    try {
      await setPollVote(postId, user.id, next);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["post", postId] }),
      ]);
    } catch (error) {
      setState(previous);
      toast.error("Suara gagal disimpan", { description: describeError(error) });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-3 space-y-2" onClick={stop} role="group" aria-label="Polling">
      {state.options.map((option, index) => {
        const percent = total > 0 ? Math.round((state.counts[index] / total) * 100) : 0;
        const mine = state.myVote === index;

        return (
          <button
            key={index}
            type="button"
            disabled={pending}
            aria-pressed={mine}
            onClick={() => void vote(index)}
            className={cn(
              "relative flex h-10 w-full items-center justify-between overflow-hidden rounded-xl border px-3 text-left text-sm font-semibold transition-colors disabled:cursor-wait",
              mine ? "border-primary text-primary" : "border-border/70 text-foreground hover:border-primary/50",
            )}
          >
            {voted && (
              <span
                aria-hidden
                className={cn("absolute inset-y-0 left-0 transition-all", mine ? "bg-primary/15" : "bg-muted")}
                style={{ width: `${percent}%` }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {mine && <Check size={14} strokeWidth={3} />}
              {option}
            </span>
            {voted && <span className="relative text-xs font-bold">{percent}%</span>}
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {total} suara{voted ? " · ketuk pilihan Bapak lagi untuk membatalkan" : " · pilih untuk melihat hasil"}
      </p>
    </div>
  );
}

/** "Simpan" toggle; saved posts are listed on the "Tersimpan" tab of your profile. */
export function BookmarkButton({ post, className }: { post: FeedItem; className?: string }) {
  const { enabled, user } = useAuth();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(post.bookmarked ?? false);
  const [pending, setPending] = useState(false);

  useEffect(() => setSaved(post.bookmarked ?? false), [post.bookmarked]);

  const toggle = async (event: MouseEvent) => {
    event.stopPropagation();
    if (pending || !requireAuth()) return;

    const next = !saved;
    setSaved(next);
    if (!enabled || !user) {
      toast(next ? "Disimpan (mode demo)" : "Batal disimpan");
      return;
    }

    setPending(true);
    try {
      await setBookmarked(post.id, user.id, next);
      toast(next ? "Postingan disimpan" : "Postingan dihapus dari Tersimpan");
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (error) {
      setSaved(!next);
      toast.error("Gagal menyimpan", { description: describeError(error) });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void toggle(event)}
      aria-pressed={saved}
      aria-label={saved ? "Hapus dari Tersimpan" : "Simpan postingan"}
      className={cn("group flex items-center transition-colors", saved ? "text-primary" : "text-muted-foreground hover:text-primary", className)}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-primary-soft">
        <Bookmark size={17} strokeWidth={2} fill={saved ? "currentColor" : "none"} />
      </div>
    </button>
  );
}

export function ShareButton({ post }: { post: FeedItem }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void sharePost(post);
      }}
      aria-label="Bagikan postingan"
      className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-primary-soft">
        <Share size={17} strokeWidth={2} />
      </div>
      <span className="hidden text-xs sm:inline">Bagikan</span>
    </button>
  );
}
