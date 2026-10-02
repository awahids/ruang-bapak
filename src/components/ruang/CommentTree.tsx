import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ChevronRight, Send, ThumbsUp } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostComment, PostReply } from "@/data/post-detail";

type CommentTreeProps = {
  comments: PostComment[];
  replyTargetId: number | null;
  replyDrafts: Record<number, string>;
  onToggleReply: (id: number) => void;
  onReplyDraftChange: (id: number, value: string) => void;
  onSubmitReply: (event: FormEvent<HTMLFormElement>, id: number) => void;
};

function ReplyBranch({ replies }: { replies: PostReply[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<number[]>([]);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const top = container.getBoundingClientRect().top;
      setPoints(Array.from(container.children).filter((child) => child instanceof HTMLElement).map((child) => {
        const avatar = child.querySelector("[data-reply-avatar]");
        const rect = (avatar ?? child).getBoundingClientRect();
        return rect.top - top + rect.height / 2;
      }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [replies]);

  const last = points[points.length - 1] ?? 0;
  const path = points.length ? `M1 0 V${last - 8} Q1 ${last} 9 ${last} H23` : "";

  return (
    <div ref={containerRef} role="group" aria-label="Balasan" className="relative ml-5 border-l border-border/60 pl-5 sm:ml-6 sm:pl-6">
      {points.length > 0 && (
        <svg aria-hidden="true" className="pointer-events-none absolute left-[-1px] top-0 overflow-visible text-primary/50" width="24" height={last + 2} viewBox={`0 0 24 ${last + 2}`} fill="none">
          <motion.path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
          {points.slice(0, -1).map((point, index) => (
            <path key={index} d={`M1 ${point - 8} Q1 ${point} 9 ${point} H23`} stroke="currentColor" strokeWidth="1.5" />
          ))}
        </svg>
      )}
      {replies.map((reply) => (
        <article key={reply.id} className="relative py-3 first:pt-2 last:pb-1">
          <div className="flex min-w-0 gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-muted/40">
            <div data-reply-avatar className="shrink-0"><Avatar initials={reply.initials} color={reply.color} size={34} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">{reply.author}</h4>
                {reply.verified && <CheckCircle2 size={12} className="text-primary" strokeWidth={3} />}
                <span className="text-xs text-muted-foreground">@{reply.initials.toLowerCase()}bapak · {reply.time}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{reply.text}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp size={12} />{reply.support}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CommentBranch({ comment, replyTargetId, replyDraft, onToggleReply, onReplyDraftChange, onSubmitReply }: {
  comment: PostComment;
  replyTargetId: number | null;
  replyDraft: string;
  onToggleReply: (id: number) => void;
  onReplyDraftChange: (id: number, value: string) => void;
  onSubmitReply: (event: FormEvent<HTMLFormElement>, id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const previousCount = useRef(comment.replies.length);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (comment.replies.length > previousCount.current) setExpanded(true);
    previousCount.current = comment.replies.length;
  }, [comment.replies.length]);

  return (
    <article className="border-b border-border/40 py-4 last:border-b-0">
      <div className="group relative flex min-w-0 gap-3 rounded-md p-1 transition-colors hover:bg-muted/30">
        <Avatar initials={comment.initials} color={comment.color} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">{comment.author}</h3>
            {comment.verified && <CheckCircle2 size={13} className="text-primary" strokeWidth={3} />}
            <span className="text-xs text-muted-foreground">@{comment.initials.toLowerCase()}bapak · {comment.time}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{comment.text}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground"><ThumbsUp size={13} />{comment.support}</span>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:bg-primary-soft hover:text-primary" onClick={() => onToggleReply(comment.id)}>Balas</Button>
            {comment.replies.length > 0 && (
              <Button type="button" variant="ghost" size="sm" aria-expanded={expanded} aria-label={`${expanded ? "Sembunyikan" : "Tampilkan"} ${comment.replies.length} balasan dari ${comment.author}`} className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-primary-soft hover:text-primary" onClick={() => setExpanded((value) => !value)}>
                <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}><ChevronRight size={13} /></motion.span>
                {comment.replies.length} balasan
              </Button>
            )}
          </div>
          <AnimatePresence initial={false}>
            {replyTargetId === comment.id && (
              <motion.form initial={reduceMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22 }} onSubmit={(event) => onSubmitReply(event, comment.id)} className="mt-2 overflow-hidden">
                <div className="border-l-2 border-primary/40 pl-3">
                  <Textarea autoFocus value={replyDraft} onChange={(event) => onReplyDraftChange(comment.id, event.target.value)} placeholder="Tulis balasan..." aria-label={`Balas ${comment.author}`} rows={2} className="resize-none bg-background" />
                  <div className="mt-2 flex justify-end"><Button type="submit" size="sm" className="gap-2"><Send size={13} />Balasan</Button></div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && comment.replies.length > 0 && (
          <motion.div initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28 }} className="overflow-hidden">
            <ReplyBranch replies={comment.replies} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function CommentTree({ comments, replyTargetId, replyDrafts, onToggleReply, onReplyDraftChange, onSubmitReply }: CommentTreeProps) {
  return (
    <div aria-label="Percakapan komentar">
      {comments.map((comment) => (
        <CommentBranch key={comment.id} comment={comment} replyTargetId={replyTargetId} replyDraft={replyDrafts[comment.id] ?? ""} onToggleReply={onToggleReply} onReplyDraftChange={onReplyDraftChange} onSubmitReply={onSubmitReply} />
      ))}
    </div>
  );
}