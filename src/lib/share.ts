import { toast } from "sonner";
import type { FeedItem } from "@/data/ruang-bapak";

export const postUrl = (postId: number) => `${window.location.origin}/post/${postId}`;

/** Shares through the phone's share sheet, falling back to copying the link. */
export async function sharePost(post: Pick<FeedItem, "id" | "text">) {
  const url = postUrl(post.id);
  const text = post.text.length > 120 ? `${post.text.slice(0, 117)}...` : post.text;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "Ruang Bapak", text, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Tautan postingan disalin");
  } catch {
    toast.error("Tautan gagal disalin");
  }
}

export const whatsappShareUrl = (post: Pick<FeedItem, "id" | "text">) =>
  `https://wa.me/?text=${encodeURIComponent(`${post.text.slice(0, 200)}\n\n${postUrl(post.id)}`)}`;
