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
  avatar_url: string | null;
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
  author_avatar_url: string | null;
  image_path: string | null;
  poll_options: string[] | null;
  poll_counts: number[] | null;
  my_vote: number | null;
  bookmarked_by_me: boolean;
  group_id: number | null;
  group_slug: string | null;
  group_name: string | null;
};

type CommentRow = {
  id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_color" | "avatar_url" | "verified"> | null;
};

type FeedPage = Exclude<FeedPageKey, "profil" | "inbox">;

export type FeedFilter =
  | { kind: "page"; pageKey: FeedPage }
  /** Named posts from the people `followerId` follows, within one page. */
  | { kind: "following"; pageKey: FeedPage; followerId: string }
  | { kind: "author"; authorId: string }
  | { kind: "username"; username: string }
  | { kind: "tag"; tag: string }
  | { kind: "group"; groupId: number }
  | { kind: "search"; query: string }
  /** The viewer's saved posts. */
  | { kind: "bookmarks" };

export type NewPost = {
  category: PostCategory;
  tag: string;
  tagTone: FeedItem["tagTone"];
  body: string;
  anonymous: boolean;
  imagePath?: string | null;
  pollOptions?: string[] | null;
  groupId?: number | null;
  /** Demo mode only: local preview URL shown in place of an uploaded photo. */
  previewImageUrl?: string | null;
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

export const POST_IMAGES_BUCKET = "rb-post-images";
export const AVATARS_BUCKET = "rb-avatars";

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

/** Longest tag a member can type in the composer (the database allows 40). */
export const MAX_TAG_LENGTH = 30;

/**
 * Cleans a tag typed in the composer: drops leading "#", squeezes spaces, caps
 * the length and capitalises each word. Reuses the spelling of a known tag that matches regardless
 * of case, so "ngopi" and "Ngopi" count as one topic in "Topik Hangat".
 */
export function normalizeTag(raw: string, known: readonly string[] = []): string | null {
  const cleaned = raw.replace(/^[#\s]+/, "").replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH).trim();
  if (!cleaned) return null;

  const match = known.find((tag) => tag.toLocaleLowerCase("id-ID") === cleaned.toLocaleLowerCase("id-ID"));
  if (match) return match;

  // Capitalise each word like the preset tags ("Tugas Negara"); keeps acronyms such as "BPJS".
  return cleaned.replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toLocaleUpperCase("id-ID"));
}

/** Handle shown after "@": the username, or the initials-based handle used by the demo data. */
export function displayHandle(item: { handle?: string; initials: string }): string {
  return item.handle ?? `${item.initials.toLowerCase()}bapak`;
}

export function formatRelativeTime(isoDate: string): string {
  return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: localeId });
}

function publicImageUrl(bucket: string, path: string): string {
  return client().storage.from(bucket).getPublicUrl(path).data.publicUrl;
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
    avatarUrl: row.is_anonymous ? null : row.author_avatar_url,
    imagePath: row.image_path,
    imageUrl: row.image_path ? publicImageUrl(POST_IMAGES_BUCKET, row.image_path) : null,
    poll: row.poll_options
      ? { options: row.poll_options, counts: row.poll_counts ?? row.poll_options.map(() => 0), myVote: row.my_vote }
      : null,
    bookmarked: row.bookmarked_by_me,
    group: row.group_slug && row.group_name ? { slug: row.group_slug, name: row.group_name } : null,
  };
}

export async function fetchFeed(filter: FeedFilter): Promise<FeedItem[]> {
  let query = client().from("posts_feed").select("*").order("created_at", { ascending: false }).limit(FEED_LIMIT);

  if (filter.kind === "author" || filter.kind === "username") {
    query = query.eq(...authorColumn(filter));
  } else if (filter.kind === "tag") {
    query = query.eq("tag", filter.tag);
  } else if (filter.kind === "group") {
    query = query.eq("group_id", filter.groupId);
  } else if (filter.kind === "bookmarks") {
    query = query.eq("bookmarked_by_me", true);
  } else if (filter.kind === "search") {
    const pattern = searchPattern(filter.query);
    if (!pattern) return [];
    query = query.or(`body.ilike.${pattern},tag.ilike.${pattern}`);
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
    image_path: post.imagePath ?? null,
    poll_options: post.pollOptions?.length ? post.pollOptions : null,
    group_id: post.groupId ?? null,
  });
  if (error) throw error;
}

export async function deletePost(postId: number, imagePath?: string | null): Promise<void> {
  const { error } = await client().from("posts").delete().eq("id", postId);
  if (error) throw error;

  // Best effort: a leftover image only costs storage.
  if (imagePath) await client().storage.from(POST_IMAGES_BUCKET).remove([imagePath]);
}

const MAX_IMAGE_SIDE = 1600;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Shrinks a photo to at most 1600px on its longest side and re-encodes it as JPEG. */
export async function resizeImage(file: File, maxSide = MAX_IMAGE_SIDE): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Foto gagal diproses."))), "image/jpeg", 0.85),
  );
}

/** Uploads a photo into the member's own folder and returns its storage path. */
export async function uploadImage(bucket: string, userId: string, file: File, maxSide?: number): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa foto.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Ukuran foto maksimal 10 MB.");

  const blob = await resizeImage(file, maxSide);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await client().storage.from(bucket).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;

  return path;
}

export async function removeImage(bucket: string, path: string): Promise<void> {
  await client().storage.from(bucket).remove([path]);
}

/** Sets a new profile photo from an uploaded file. */
export async function updateAvatar(userId: string, file: File): Promise<string> {
  const path = await uploadImage(AVATARS_BUCKET, userId, file, 512);
  const url = publicImageUrl(AVATARS_BUCKET, path);
  const { error } = await client().from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) throw error;

  return url;
}

export async function removeAvatar(userId: string): Promise<void> {
  const { error } = await client().from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (error) throw error;
}

/** Votes on a poll (replacing an earlier vote) or withdraws the vote with null. */
export async function setPollVote(postId: number, userId: string, option: number | null): Promise<void> {
  const table = client().from("poll_votes");
  const { error } =
    option === null
      ? await table.delete().eq("post_id", postId).eq("user_id", userId)
      : await table.upsert({ post_id: postId, user_id: userId, option }, { onConflict: "post_id,user_id" });
  if (error) throw error;
}

export async function setBookmarked(postId: number, userId: string, bookmarked: boolean): Promise<void> {
  const table = client().from("bookmarks");
  const { error } = bookmarked
    ? await table.upsert({ post_id: postId, user_id: userId }, { onConflict: "user_id,post_id", ignoreDuplicates: true })
    : await table.delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

/**
 * Turns free text into a PostgREST ilike pattern. Characters that would break
 * the filter syntax (commas, parentheses, quotes, wildcards) become spaces.
 */
export function searchPattern(query: string): string | null {
  const cleaned = query.replace(/[%_*,()"'\\.:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return cleaned.length >= 2 ? `*${cleaned}*` : null;
}

export type ProfileSearchResult = Pick<Profile, "id" | "username" | "display_name" | "avatar_color" | "avatar_url" | "verified" | "bio">;

export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  const pattern = searchPattern(query);
  if (!pattern) return [];

  const { data, error } = await client()
    .from("profiles")
    .select("id, username, display_name, avatar_color, avatar_url, verified, bio")
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .order("display_name")
    .limit(20);
  if (error) throw error;

  return data as ProfileSearchResult[];
}

/** Tags in use that match the query, most used first. */
export async function searchTags(query: string): Promise<{ tag: string; posts: number }[]> {
  const pattern = searchPattern(query);
  if (!pattern) return [];

  const { data, error } = await client().from("posts_feed").select("tag").ilike("tag", pattern).limit(500);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const { tag } of data as { tag: string }[]) counts.set(tag, (counts.get(tag) ?? 0) + 1);

  return [...counts].map(([tag, posts]) => ({ tag, posts })).sort((a, b) => b.posts - a.posts).slice(0, 12);
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
      avatarUrl: row.author?.avatar_url ?? null,
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
    .select("id, parent_id, body, created_at, author:profiles(id, username, display_name, avatar_color, avatar_url, verified)")
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

export type SuggestedProfile = {
  id: string;
  username: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl: string | null;
  verified: boolean;
  bio: string;
  followers: number;
  recentPosts: number;
};

/** People to follow: active members first, excluding yourself, people you follow and blocks. */
export async function fetchSuggestedProfiles(limit: number): Promise<SuggestedProfile[]> {
  const { data, error } = await client().rpc("suggested_profiles", { max_results: limit });
  if (error) throw error;

  const rows = data as {
    id: string;
    username: string;
    display_name: string;
    avatar_color: string;
    verified: boolean;
    bio: string;
    follower_count: number;
    recent_post_count: number;
  }[];

  // suggested_profiles() predates profile photos, so look those up separately.
  const photos = new Map<string, string | null>();
  if (rows.length > 0) {
    const { data: profiles, error: photoError } = await client()
      .from("profiles")
      .select("id, avatar_url")
      .in("id", rows.map((row) => row.id));
    if (photoError) throw photoError;
    for (const profile of profiles as { id: string; avatar_url: string | null }[]) photos.set(profile.id, profile.avatar_url);
  }

  return (
    rows as {
      id: string;
      username: string;
      display_name: string;
      avatar_color: string;
      verified: boolean;
      bio: string;
      follower_count: number;
      recent_post_count: number;
    }[]
  ).map((row) => ({
    id: row.id,
    username: row.username,
    name: row.display_name,
    initials: getInitials(row.display_name),
    color: row.avatar_color,
    avatarUrl: photos.get(row.id) ?? null,
    verified: row.verified,
    bio: row.bio,
    followers: row.follower_count,
    recentPosts: row.recent_post_count,
  }));
}

export type TrendingTag = { tag: string; category: PostCategory; posts: number };

/** Most used tags in the last `windowDays` days (check-ins excluded). */
export async function fetchTrendingTags(windowDays: number, limit: number): Promise<TrendingTag[]> {
  const { data, error } = await client().rpc("trending_tags", { window_days: windowDays, max_results: limit });
  if (error) throw error;

  return (data as { tag: string; category: PostCategory; post_count: number }[]).map((row) => ({
    tag: row.tag,
    category: row.category,
    posts: row.post_count,
  }));
}

/** Check-ins posted since midnight WIB. */
export async function fetchCheckinsToday(): Promise<number> {
  const { data, error } = await client().rpc("checkins_today");
  if (error) throw error;

  return data as number;
}

/** Turns Supabase/Postgres errors into short Indonesian messages for toasts. */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";

  if (/invalid login credentials/i.test(message)) return "Email atau password salah, Pak. Kalau dulu daftar pakai Google, masuk lewat tombol Google.";
  if (/email not confirmed/i.test(message)) return "Email belum dikonfirmasi. Cek kotak masuk Bapak dulu.";
  if (/already registered/i.test(message)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/password should be at least/i.test(message)) return "Password minimal 6 karakter.";
  if (/profiles_username_key|duplicate key/i.test(message)) return "Username itu sudah dipakai bapak lain.";
  if (/username_check|profiles_username_check/i.test(message)) return "Username hanya boleh huruf kecil, angka, dan _ (3–30 karakter).";
  if (/provider is not enabled/i.test(message)) return "Login Google belum diaktifkan di server.";

  return message || "Terjadi kesalahan. Coba lagi sebentar, Pak.";
}
