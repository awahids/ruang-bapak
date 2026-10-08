import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Flag, Loader2, MessageSquareText, Send, ThumbsUp, Users } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "@/components/ruang/Avatar";
import { CommentTree } from "@/components/ruang/CommentTree";
import { ReportDialog } from "@/components/ruang/ReportDialog";
import { RuangShell } from "@/components/ruang/RuangShell";
import { TagPill } from "@/components/ruang/TagPill";
import { BookmarkButton, PostImage, PostPollView, ShareButton } from "@/components/ruang/PostExtras";
import { useCalmMode } from "@/contexts/CalmModeContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostReply } from "@/data/post-detail";
import type { FeedItem } from "@/data/ruang-bapak";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { ReportTarget } from "@/lib/moderation";
import { usePostDetail } from "@/hooks/use-social";
import { describeError, displayHandle } from "@/lib/social";

type PostDetailLocationState = {
  post?: FeedItem;
};

const countCommentNodes = (items: PostReply[]): number =>
  items.reduce((sum, item) => sum + 1 + countCommentNodes(item.replies), 0);

const PostDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { calm } = useCalmMode();
  const { postId } = useParams();
  const requireAuth = useRequireAuth();

  const parsedPostId = Number(postId);
  const locationState = location.state as PostDetailLocationState | null;

  const { post, isLoading, comments, addComment } = usePostDetail(parsedPostId, locationState?.post);

  const [commentDraft, setCommentDraft] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const { user } = useAuth();

  const openReport = (target: ReportTarget) => {
    if (requireAuth()) setReportTarget(target);
  };

  const totalComments = countCommentNodes(comments);

  const sendComment = async (text: string, parentId: number | null) => {
    if (sending || !requireAuth()) return false;

    setSending(true);
    try {
      await addComment(text, parentId);
      return true;
    } catch (error) {
      toast.error("Komentar gagal dikirim", { description: describeError(error) });
      return false;
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextText = commentDraft.trim();

    if (!nextText) {
      return;
    }

    if (await sendComment(nextText, null)) {
      setCommentDraft("");
    }
  };

  const handleSubmitReply = async (event: FormEvent<HTMLFormElement>, parentId: number) => {
    event.preventDefault();

    const nextText = (replyDrafts[parentId] ?? "").trim();

    if (!nextText) {
      return;
    }

    if (await sendComment(nextText, parentId)) {
      setReplyDrafts((previous) => ({ ...previous, [parentId]: "" }));
      setReplyTargetId(null);
    }
  };

  if (isLoading) {
    return (
      <RuangShell>
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Memuat postingan" />
        </div>
      </RuangShell>
    );
  }

  if (!post) {
    return (
      <RuangShell>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 text-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Postingan tidak ditemukan</h1>
              <p className="mt-2 text-muted-foreground">Post mungkin sudah dihapus atau belum tersedia.</p>
            </div>
          </div>
        </div>
      </RuangShell>
    );
  }

  return (
    <RuangShell>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
            {!post.isMine && (
              <button
                type="button"
                onClick={() => openReport({ postId: post.id })}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <Flag size={13} />
                Laporkan
              </button>
            )}
          </div>
        </header>

        <article className="border-b border-border/40 bg-surface px-4 py-5 sm:px-6">
          <div className="flex gap-4">
            <Avatar initials={post.initials} color={post.color} src={post.avatarUrl} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-foreground">
                  {post.handle && !post.anonymous ? (
                    <Link to={`/u/${post.handle}`} className="hover:underline">{post.name}</Link>
                  ) : (
                    post.name
                  )}
                </h1>
                {post.verified && <CheckCircle2 size={15} className="text-primary" strokeWidth={3} />}
                <span className="truncate text-sm text-muted-foreground">
                  @{displayHandle(post)} · {post.time}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Link to={`/tag/${encodeURIComponent(post.tag)}`} aria-label={`Lihat tag ${post.tag}`}>
                  <TagPill tone={post.tagTone} className="hover:underline">#{post.tag}</TagPill>
                </Link>
                {post.group && (
                  <Link
                    to={`/komunitas/${post.group.slug}`}
                    className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
                  >
                    <Users size={12} strokeWidth={2.5} />
                    {post.group.name}
                  </Link>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{post.text}</p>

              {post.imageUrl && <PostImage src={post.imageUrl} />}
              {post.poll && <PostPollView postId={post.id} poll={post.poll} />}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {!calm && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <ThumbsUp size={15} />
                      {post.safe} aman
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquareText size={15} />
                      {totalComments} komentar
                    </span>
                  </>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <ShareButton post={post} />
                  <BookmarkButton post={post} />
                </div>
              </div>
            </div>
          </div>
        </article>

        <section className="border-b border-border/40 bg-surface px-4 py-5 sm:px-6">
          <h2 className="text-base font-bold text-foreground">Komentar</h2>
          <form onSubmit={handleSubmitComment} className="mt-4 space-y-3">
            <Textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Tulis komentar, Pak..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="gap-2" disabled={sending}>
                <Send size={14} />
                Komentar
              </Button>
            </div>
          </form>
        </section>

        <section className="bg-surface px-4 py-2 sm:px-6">
          {comments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-semibold text-foreground">Belum ada komentar</p>
              <p className="mt-1 text-sm text-muted-foreground">Jadi yang pertama kasih dukungan, Pak.</p>
            </div>
          ) : (
            <CommentTree
              comments={comments}
              replyTargetId={replyTargetId}
              replyDrafts={replyDrafts}
              onToggleReply={(id) => setReplyTargetId((current) => current === id ? null : id)}
              onReplyDraftChange={(id, value) => setReplyDrafts((previous) => ({ ...previous, [id]: value }))}
              onSubmitReply={handleSubmitReply}
              onReport={(id) => openReport({ commentId: id })}
              currentUserId={user?.id ?? null}
            />
          )}
        </section>
      </div>
      <ReportDialog target={reportTarget} onClose={() => setReportTarget(null)} />
    </RuangShell>
  );
};

export default PostDetail;
