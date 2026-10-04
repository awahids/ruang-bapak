import { FeedPage } from "@/components/ruang/FeedPage";
import type { FeedFilter } from "@/lib/social";

const BOOKMARKS: FeedFilter = { kind: "bookmarks" };

const Tersimpan = () => (
  <FeedPage
    pageKey="beranda"
    title="Tersimpan"
    feedFilter={BOOKMARKS}
    showComposer={false}
    demoItems={[]}
    emptyState={{ title: "Belum ada yang disimpan", hint: "Ketuk ikon simpan di postingan untuk membacanya lagi nanti, Pak." }}
  />
);

export default Tersimpan;
