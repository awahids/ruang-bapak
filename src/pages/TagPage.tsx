import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { FeedPage } from "@/components/ruang/FeedPage";
import { allFeedItems } from "@/data/ruang-bapak";
import type { FeedFilter } from "@/lib/social";

/** All posts with one tag, e.g. /tag/Tugas%20Negara. */
const TagPage = () => {
  const { tag = "" } = useParams();
  const filter = useMemo<FeedFilter>(() => ({ kind: "tag", tag }), [tag]);
  const demoItems = useMemo(() => allFeedItems.filter((item) => item.tag === tag), [tag]);

  return (
    <FeedPage
      key={tag}
      pageKey="beranda"
      title={`#${tag}`}
      feedFilter={filter}
      showComposer={false}
      demoItems={demoItems}
      emptyState={{ title: `Belum ada postingan #${tag}`, hint: "Pakai tag ini di kotak tulis supaya obrolannya ramai, Pak." }}
    />
  );
};

export default TagPage;
