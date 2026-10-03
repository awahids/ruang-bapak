import { describe, expect, it } from "vitest";
import { buildCommentTree, displayHandle, getInitials, MAX_TAG_LENGTH, normalizeTag, searchPattern } from "@/lib/social";

const author = { id: "u-ari", username: "ari", display_name: "Ari Pratama", avatar_color: "hsl(1 1% 1%)", avatar_url: null, verified: false };
const at = (minute: number) => new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString();

describe("buildCommentTree", () => {
  it("nests replies under their parent, newest roots first and replies oldest first", () => {
    const tree = buildCommentTree([
      { id: 1, parent_id: null, body: "root 1", created_at: at(1), author },
      { id: 2, parent_id: 1, body: "reply 1", created_at: at(2), author },
      { id: 3, parent_id: null, body: "root 2", created_at: at(3), author },
      { id: 4, parent_id: 2, body: "reply 1.1", created_at: at(4), author },
      { id: 5, parent_id: 1, body: "reply 2", created_at: at(5), author },
    ]);

    expect(tree.map((node) => node.text)).toEqual(["root 2", "root 1"]);
    expect(tree[1].replies.map((node) => node.text)).toEqual(["reply 1", "reply 2"]);
    expect(tree[1].replies[0].replies.map((node) => node.text)).toEqual(["reply 1.1"]);
    expect(tree[0]).toMatchObject({ author: "Ari Pratama", initials: "AP", handle: "ari", authorId: "u-ari" });
  });
});

describe("display helpers", () => {
  it("derives initials and handles", () => {
    expect(getInitials("Ari Pratama Putra")).toBe("AP");
    expect(getInitials("  budi ")).toBe("B");
    expect(getInitials("")).toBe("B");
    expect(displayHandle({ handle: "ari", initials: "AP" })).toBe("ari");
    expect(displayHandle({ initials: "BJ" })).toBe("bjbapak");
  });
});

describe("normalizeTag", () => {
  it("cleans typed tags and reuses known spellings", () => {
    expect(normalizeTag("  #ngopi   pagi ")).toBe("Ngopi Pagi");
    expect(normalizeTag("klaim BPJS")).toBe("Klaim BPJS");
    expect(normalizeTag("tugas negara", ["Ngopi", "Tugas Negara"])).toBe("Tugas Negara");
    expect(normalizeTag(" # ")).toBeNull();
    expect(normalizeTag("x".repeat(60))).toHaveLength(MAX_TAG_LENGTH);
  });
});

describe("searchPattern", () => {
  it("builds a safe ilike pattern from free text", () => {
    expect(searchPattern("  ngopi  pagi ")).toBe("*ngopi pagi*");
    expect(searchPattern("kopi,(hitam)")).toBe("*kopi hitam*");
    expect(searchPattern("50%_off*")).toBe("*50 off*");
    expect(searchPattern("a")).toBeNull();
    expect(searchPattern(" , ")).toBeNull();
  });
});
