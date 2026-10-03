import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { PostComment } from "@/data/post-detail";
import type { ComposerMode, FeedItem, FeedPageKey } from "@/data/ruang-bapak";

export type PostCategory = Exclude<ComposerMode, "pesan">;

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  avatar_color: string;
  verified: boolean;
  is_moderator: boolean;
  created_at: string;
};

export type ProfileUpdate = Pick<Profile, "username" | "display_name" | "bio" | "location">;

type PostFeedRow = {
  id: number;
  category: PostCategory;
  tag: string;
  tag_tone: FeedItem["tagTone"];
  body: string;
  is_anonymous: boolean;
  created_at: string;
  author_id: string | null;
  is_mine: boolean;
  author_username: string | null;
  author_display_name: string | null;
  author_avatar_color: string | null;
  author_verified: boolean;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

type CommentRow = {
  id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_color" | "verified"> | null;
};

type FeedPage = Exclude<FeedPageKey, "profil" | "inbox">;

export type FeedFilter =
  | { kind: "page"; pageKey: FeedPage }
  /** Named posts from the people `followerId` follows, within one page. */
  | { kind: "following"; pageKey: FeedPage; followerId: string }
  | { kind: "author"; authorId: string }
  | { kind: "username"; username: string };

export type NewPost = {
  category: PostCategory;
  tag: string;
  tagTone: FeedItem["tagTone"];
  body: string;
  anonymous: boolean;
};

export const ANONYMOUS_NAME = "Bapak Anonim";
export const ANONYMOUS_COLOR = "hsl(205 14% 41%)";

export const contextByCategory: Record<PostCategory, FeedItem["context"]> = {
  status: "Curhat",
  curhat: "Curhat",
  diskusi: "Diskusi",
  checkin: "Cek-in",
  komunitas: "Komunitas",
  profil: "Profil",
};

const categoryByPage: Record<Exclude<FeedPageKey, "beranda" | "profil" | "inbox">, PostCategory> = {
  curhat: "curhat",
  diskusi: "diskusi",
  "aman-pak": "checkin",
  komunitas: "komunitas",
};

const FEED_LIMIT = 50;

function client() {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  return supabase;
}

export function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  return letters.join("") || "B";
}

/** Handle shown after "@": the username, or the initials-based handle used by the demo data. */
export function displayHandle(item: { handle?: string; initials: string }): string {
  return item.handle ?? `${item.initials.toLowerCase()}bapak`;
}

export function formatRelativeTime(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: localeId });
}

function toFeedItem(row: PostFeedRow): FeedItem {
  const name = row.is_anonymous ? ANONYMOUS_NAME : row.author_display_name ?? ANONYMOUS_NAME;

  return {
    id: row.id,
    name,
    initials: getInitials(name),
    color: row.is_anonymous ? ANONYMOUS_COLOR : row.author_avatar_color ?? ANONYMOUS_COLOR,
    handle: row.author_username ?? "anonim",
    time: formatRelativeTime(row.created_at),
    context: contextByCategory[row.category],
    tag: row.tag,
    tagTone: row.tag_tone,
    text: row.body,
    safe: row.like_count,
    reply: row.comment_count,
    support: 0,
    verified: row.author_verified,
    liked: row.liked_by_me,
    isMine: row.is_mine,
    anonymous: row.is_anonymous,
    authorId: row.author_id,
  };
}

export async function fetchFeed(filter: FeedFilter): Promise<FeedItem[]> {
  let query = client().from("posts_feed").select("*").order("created_at", { ascending: false }).limit(FEED_LIMIT);

  if (filter.kind === "author" || filter.kind === "username") {
    query = query.eq(...authorColumn(filter));
  } else {
    if (filter.kind === "following") {
      const followees = await fetchFollowingIds(filter.followerId);
      if (followees.length === 0) return [];
      query = query.in("author_id", followees);
    }

    query = filter.pageKey === "beranda" ? query.neq("category", "checkin") : query.eq("category", categoryByPage[filter.pageKey]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as PostFeedRow[]).map(toFeedItem);
}

export type AuthorFilter = Extract<FeedFilter, { kind: "author" | "username" }>;

const authorColumn = (filter: AuthorFilter): [column: string, value: string] =>
  filter.kind === "author" ? ["author_id", filter.authorId] : ["author_username", filter.username];

export async function fetchProfileStats(filter: AuthorFilter): Promise<{ posts: number; support: number }> {
  const { data, error } = await client().from("posts_feed").select("like_count").eq(...authorColumn(filter));
  if (error) throw error;

  const rows = data as Pick<PostFeedRow, "like_count">[];
  return { posts: rows.length, support: rows.reduce((sum, row) => sum + row.like_count, 0) };
}

export async function fetchPost(postId: number): Promise<FeedItem | null> {
  const { data, error } = await client().from("posts_feed").select("*").eq("id", postId).maybeSingle();
  if (error) throw error;

  return data ? toFeedItem(data as PostFeedRow) : null;
}

export async function createPost(post: NewPost): Promise<void> {
  const { error } = await client().from("posts").insert({
    category: post.category,
    tag: post.tag,
    tag_tone: post.tagTone,
    body: post.body,
    is_anonymous: post.anonymous,
  });
  if (error) throw error;
}

export async function deletePost(postId: number): Promise<void> {
  const { error } = await client().from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function setPostLiked(postId: number, userId: string, liked: boolean): Promise<void> {
  const table = client().from("post_likes");
  const { error } = liked
    ? await table.upsert({ post_id: postId, user_id: userId }, { ignoreDuplicates: true })
    : await table.delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

/** Builds the nested thread: newest top-level comments first, replies oldest first. */
export function buildCommentTree(rows: CommentRow[]): PostComment[] {
  const nodes = new Map<number, PostComment>();

  for (const row of rows) {
    const name = row.author?.display_name ?? "Bapak";
    nodes.set(row.id, {
      id: row.id,
      author: name,
      initials: getInitials(name),
      color: row.author?.avatar_color ?? ANONYMOUS_COLOR,
      handle: row.author?.username,
      authorId: row.author?.id,
      time: formatRelativeTime(row.created_at),
      text: row.body,
      support: 0,
      verified: row.author?.verified ?? false,
      replies: [],
    });
  }

  const roots: PostComment[] = [];

  for (const row of rows) {
    const node = nodes.get(row.id)!;
    const parent = row.parent_id === null ? undefined : nodes.get(row.parent_id);

    if (parent) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.reverse();
}

export async function fetchComments(postId: number): Promise<PostComment[]> {
  const { data, error } = await client()
    .from("comments")
    .select("id, parent_id, body, created_at, author:profiles(id, username, display_name, avatar_color, verified)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;

  return buildCommentTree(data as unknown as CommentRow[]);
}

export async function createComment(postId: number, body: string, parentId: number | null): Promise<void> {
  const { error } = await client().from("comments").insert({ post_id: postId, parent_id: parentId, body });
  if (error) throw error;
}

export async function fetchProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await client().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;

  return data as Profile | null;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await client().from("profiles").select("*").eq("username", username).maybeSingle();
  if (error) throw error;

  return data as Profile | null;
}

export async function updateProfile(userId: string, changes: ProfileUpdate): Promise<void> {
  const { error } = await client().from("profiles").update(changes).eq("id", userId);
  if (error) throw error;
}

export async function fetchFollowingIds(followerId: string): Promise<string[]> {
  const { data, error } = await client().from("follows").select("followee_id").eq("follower_id", followerId);
  if (error) throw error;

  return (data as { followee_id: string }[]).map((row) => row.followee_id);
}

export async function fetchFollowStats(userId: string): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    client().from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", userId),
    client().from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;

  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function fetchIsFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { count, error } = await client()
    .from("follows")
    .select("followee_id", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId);
  if (error) throw error;

  return (count ?? 0) > 0;
}

export async function setFollowing(followeeId: string, follow: boolean): Promise<void> {
  const table = client().from("follows");
  const { error } = follow
    ? await table.upsert({ followee_id: followeeId }, { onConflict: "follower_id,followee_id", ignoreDuplicates: true })
    : await table.delete().eq("followee_id", followeeId);
  if (error) throw error;
}

/** Turns Supabase/Postgres errors into short Indonesian messages for toasts. */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";

  if (/invalid login credentials/i.test(message)) return "Email atau password salah, Pak.";
  if (/email not confirmed/i.test(message)) return "Email belum dikonfirmasi. Cek kotak masuk Bapak dulu.";
  if (/already registered/i.test(message)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/password should be at least/i.test(message)) return "Password minimal 6 karakter.";
  if (/profiles_username_key|duplicate key/i.test(message)) return "Username itu sudah dipakai bapak lain.";
  if (/username_check|profiles_username_check/i.test(message)) return "Username hanya boleh huruf kecil, angka, dan _ (3–30 karakter).";
  if (/provider is not enabled/i.test(message)) return "Login Google belum diaktifkan di server.";

  return message || "Terjadi kesalahan. Coba lagi sebentar, Pak.";
}
