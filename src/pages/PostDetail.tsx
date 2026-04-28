import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CornerDownRight, MessageSquareText, Send, ThumbsUp } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Avatar } from "@/components/ruang/Avatar";
import { RuangShell } from "@/components/ruang/RuangShell";
import { TagPill } from "@/components/ruang/TagPill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPostComments, type PostComment, type PostReply } from "@/data/post-detail";
import { getFeedItemById, type FeedItem } from "@/data/ruang-bapak";

type PostDetailLocationState = {
  post?: FeedItem;
};

const getNextCommentId = (items: PostComment[]): number => {
  let maxId = 0;

  for (const comment of items) {
    maxId = Math.max(maxId, comment.id);

    for (const reply of comment.replies) {
      maxId = Math.max(maxId, reply.id);
    }
  }

  return maxId + 1;
};

const PostDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();

  const parsedPostId = Number(postId);
  const locationState = location.state as PostDetailLocationState | null;

  const post = useMemo(() => {
    if (Number.isNaN(parsedPostId)) {
      return undefined;
    }

    if (locationState?.post?.id === parsedPostId) {
      return locationState.post;
    }

    return getFeedItemById(parsedPostId);
  }, [locationState?.post, parsedPostId]);

  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const nextCommentIdRef = useRef(1);

  const totalComments = useMemo(
    () => comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0),
    [comments]
  );

  useEffect(() => {
    if (!post) {
      setComments([]);
      return;
    }

    const initialComments = getPostComments(post);
    setComments(initialComments);
    nextCommentIdRef.current = getNextCommentId(initialComments);
    setCommentDraft("");
    setReplyTargetId(null);
    setReplyDrafts({});
  }, [post]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextText = commentDraft.trim();

    if (!nextText) {
      return;
    }

    const nextComment: PostComment = {
      id: nextCommentIdRef.current,
      author: "Ari Pratama",
      initials: "AP",
      color: "hsl(28 33% 41%)",
      time: "Baru saja",
      text: nextText,
      support: 0,
      verified: true,
      replies: [],
    };

    nextCommentIdRef.current += 1;
    setComments((previous) => [nextComment, ...previous]);
    setCommentDraft("");
  };

  const handleSubmitReply = (event: FormEvent<HTMLFormElement>, parentId: number) => {
    event.preventDefault();

    const nextText = (replyDrafts[parentId] ?? "").trim();

    if (!nextText) {
      return;
    }

    const nextReply: PostReply = {
      id: nextCommentIdRef.current,
      author: "Ari Pratama",
      initials: "AP",
      color: "hsl(28 33% 41%)",
      time: "Baru saja",
      text: nextText,
      support: 0,
      verified: true,
    };

    nextCommentIdRef.current += 1;

    setComments((previous) =>
      previous.map((comment) =>
        comment.id === parentId
          ? {
            ...comment,
            replies: [...comment.replies, nextReply],
          }
          : comment
      )
    );

    setReplyDrafts((previous) => ({ ...previous, [parentId]: "" }));
    setReplyTargetId(null);
  };

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
            {/* <p className="text-sm font-semibold text-muted-foreground">Detail Postingan</p> */}
          </div>
        </header>

        <article className="border-b border-border/40 bg-surface px-4 py-5 sm:px-6">
          <div className="flex gap-4">
            <Avatar initials={post.initials} color={post.color} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-foreground">{post.name}</h1>
                {post.verified && <CheckCircle2 size={15} className="text-primary" strokeWidth={3} />}
                <span className="truncate text-sm text-muted-foreground">
                  @{post.initials.toLowerCase()}bapak · {post.time}
                </span>
              </div>

              <div className="mt-2">
                <TagPill tone={post.tagTone}>{post.tag}</TagPill>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{post.text}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp size={15} />
                  {post.safe} aman
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareText size={15} />
                  {totalComments} komentar
                </span>
              </div>
            </div>
          </div>
        </article>

        <section className="border-b border-border/40 bg-surface px-4 py-5 sm:px-6">
          <h2 className="text-base font-bold text-foreground">Komentar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Thread komentar mendukung balasan bersarang sampai level 2.
          </p>

          <form onSubmit={handleSubmitComment} className="mt-4 space-y-3">
            <Textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Tulis komentar Anda..."
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
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
            <div className="divide-y divide-border/40">
              {comments.map((comment) => (
                <article key={comment.id} className="py-4">
                  <div className="flex gap-3">
                    <Avatar initials={comment.initials} color={comment.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-foreground">{comment.author}</h3>
                        {comment.verified && <CheckCircle2 size={13} className="text-primary" strokeWidth={3} />}
                        <span className="text-xs text-muted-foreground">
                          @{comment.initials.toLowerCase()}bapak · {comment.time}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{comment.text}</p>

                      <div className="mt-2 flex items-center gap-4">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp size={13} />
                          {comment.support}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyTargetId((current) => (current === comment.id ? null : comment.id))
                          }
                          className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                          Balas
                        </button>
                      </div>

                      {replyTargetId === comment.id && (
                        <form
                          onSubmit={(event) => handleSubmitReply(event, comment.id)}
                          className="mt-3 rounded-xl border border-border/50 bg-muted/40 p-3"
                        >
                          <Textarea
                            value={replyDrafts[comment.id] ?? ""}
                            onChange={(event) =>
                              setReplyDrafts((previous) => ({ ...previous, [comment.id]: event.target.value }))
                            }
                            placeholder="Tulis balasan..."
                            rows={2}
                            className="resize-none bg-background"
                          />
                          <div className="mt-3 flex justify-end">
                            <Button type="submit" size="sm" className="gap-2">
                              <Send size={13} />
                              Balasan
                            </Button>
                          </div>
                        </form>
                      )}

                      {comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 border-l border-border/50 pl-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="rounded-xl bg-muted/35 p-3">
                              <div className="flex gap-2.5">
                                <div className="pt-1 text-muted-foreground">
                                  <CornerDownRight size={13} />
                                </div>
                                <Avatar initials={reply.initials} color={reply.color} size={34} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <h4 className="text-sm font-semibold text-foreground">{reply.author}</h4>
                                    {reply.verified && <CheckCircle2 size={12} className="text-primary" strokeWidth={3} />}
                                    <span className="text-xs text-muted-foreground">
                                      @{reply.initials.toLowerCase()}bapak · {reply.time}
                                    </span>
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                    {reply.text}
                                  </p>
                                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <ThumbsUp size={12} />
                                    {reply.support}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </RuangShell>
  );
};

export default PostDetail;
