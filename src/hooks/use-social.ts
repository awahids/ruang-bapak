import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { getPostComments, type PostComment, type PostReply } from "@/data/post-detail";
import { getFeedItemById, type FeedItem } from "@/data/ruang-bapak";
import {
  ANONYMOUS_COLOR,
  ANONYMOUS_NAME,
  contextByCategory,
  createComment,
  createPost,
  deletePost,
  fetchComments,
  fetchFeed,
  fetchPost,
  setPostLiked,
  type FeedFilter,
  type NewPost,
} from "@/lib/social";

export type FeedState = {
  items: FeedItem[];
  isLoading: boolean;
  error: unknown;
  addPost: (post: NewPost) => Promise<void>;
  toggleLike: (item: FeedItem, liked: boolean) => Promise<void>;
  removePost: (item: FeedItem) => Promise<void>;
};

export type PostDetailState = {
  post: FeedItem | undefined;
  isLoading: boolean;
  comments: PostComment[];
  addComment: (text: string, parentId: number | null) => Promise<void>;
};

const DEMO_USER = { name: "Ari Pratama", initials: "AP", color: "hsl(28 33% 41%)" };

function useRemoteFeed(filter: FeedFilter | null): FeedState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["feed", filter, userId],
    queryFn: () => fetchFeed(filter!),
    enabled: filter !== null,
  });

  const refresh = useCallback(
    (postId?: number) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["profile-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["trending-tags"] }),
        queryClient.invalidateQueries({ queryKey: ["checkins-today"] }),
        postId === undefined ? undefined : queryClient.invalidateQueries({ queryKey: ["post", postId] }),
      ]).then(() => undefined),
    [queryClient],
  );

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addPost: async (post) => {
      await createPost(post);
      await refresh();
    },
    toggleLike: async (item, liked) => {
      if (!userId) throw new Error("Silakan masuk dulu, Pak.");
      await setPostLiked(item.id, userId, liked);
      await refresh(item.id);
    },
    removePost: async (item) => {
      await deletePost(item.id);
      await refresh(item.id);
    },
  };
}

function useDemoFeed(_filter: FeedFilter | null, demoItems: FeedItem[] = []): FeedState {
  const [items, setItems] = useState<FeedItem[]>(() => [...demoItems]);
  const nextIdRef = useRef(Math.max(...demoItems.map((item) => item.id), 0) + 1);

  return {
    items,
    isLoading: false,
    error: null,
    addPost: async (post) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;
      const author = post.anonymous ? { name: ANONYMOUS_NAME, initials: "BA", color: ANONYMOUS_COLOR } : DEMO_USER;

      setItems((previous) => [
        {
          id,
          name: author.name,
          initials: author.initials,
          color: author.color,
          time: "Baru saja",
          context: contextByCategory[post.category],
          tag: post.tag,
          tagTone: post.tagTone,
          text: post.body,
          safe: 0,
          reply: 0,
          support: 0,
          verified: !post.anonymous,
          isMine: true,
          anonymous: post.anonymous,
        },
        ...previous,
      ]);
    },
    toggleLike: async () => {},
    removePost: async (item) => {
      setItems((previous) => previous.filter((entry) => entry.id !== item.id));
    },
  };
}

/** Feed posts from Supabase, or the bundled sample data when running in demo mode. */
export const useFeed: (filter: FeedFilter | null, demoItems?: FeedItem[]) => FeedState = isSupabaseConfigured
  ? useRemoteFeed
  : useDemoFeed;

function useRemotePostDetail(postId: number): PostDetailState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const validId = Number.isInteger(postId);

  const postQuery = useQuery({
    queryKey: ["post", postId, user?.id ?? null],
    queryFn: () => fetchPost(postId),
    enabled: validId,
  });

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: validId,
  });

  return {
    post: postQuery.data ?? undefined,
    isLoading: validId && (postQuery.isLoading || commentsQuery.isLoading),
    comments: commentsQuery.data ?? [],
    addComment: async (text, parentId) => {
      await createComment(postId, text, parentId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["comments", postId] }),
        queryClient.invalidateQueries({ queryKey: ["post", postId] }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
      ]);
    },
  };
}

const getNextCommentId = (items: PostReply[]): number => {
  let maxId = 0;

  const visit = (nodes: PostReply[]) => {
    for (const node of nodes) {
      maxId = Math.max(maxId, node.id);
      visit(node.replies);
    }
  };

  visit(items);

  return maxId + 1;
};

const appendReply = (items: PostReply[], parentId: number, reply: PostReply): PostReply[] =>
  items.map((item) => {
    if (item.id === parentId) {
      return { ...item, replies: [...item.replies, reply] };
    }

    return { ...item, replies: appendReply(item.replies, parentId, reply) };
  });

function useDemoPostDetail(postId: number, statePost?: FeedItem): PostDetailState {
  const post = useMemo(
    () => (statePost?.id === postId ? statePost : getFeedItemById(postId)),
    [postId, statePost],
  );

  const [thread, setThread] = useState<{ postId: number | undefined; comments: PostComment[] }>(() => ({
    postId: post?.id,
    comments: post ? getPostComments(post) : [],
  }));

  // Reset the local thread when navigating between posts.
  let comments = thread.comments;
  if (thread.postId !== post?.id) {
    comments = post ? getPostComments(post) : [];
    setThread({ postId: post?.id, comments });
  }

  return {
    post,
    isLoading: false,
    comments,
    addComment: async (text, parentId) => {
      setThread((previous) => {
        const comment: PostComment = {
          id: getNextCommentId(previous.comments),
          author: DEMO_USER.name,
          initials: DEMO_USER.initials,
          color: DEMO_USER.color,
          time: "Baru saja",
          text,
          support: 0,
          verified: true,
          replies: [],
        };

        return {
          ...previous,
          comments: parentId === null ? [comment, ...previous.comments] : appendReply(previous.comments, parentId, comment),
        };
      });
    },
  };
}

/** A single post with its comment thread, from Supabase or the demo data. */
export const usePostDetail: (postId: number, statePost?: FeedItem) => PostDetailState = isSupabaseConfigured
  ? useRemotePostDetail
  : useDemoPostDetail;
