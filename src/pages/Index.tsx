import { useSearchParams } from "react-router-dom";
import { FeedPage } from "@/components/ruang/FeedPage";
import { cn } from "@/lib/utils";

/** Teras Bapak holds every room's posts; the chips narrow it to uneg-uneg or diskusi (and pick what the composer posts). */
const categories = [
  { key: "beranda", param: null, label: "Semua" },
  { key: "curhat", param: "curhat", label: "Uneg-uneg" },
  { key: "diskusi", param: "diskusi", label: "Diskusi" },
] as const;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = categories.find((category) => category.param === searchParams.get("kategori")) ?? categories[0];

  return (
    <FeedPage
      key={active.key}
      pageKey={active.key}
      title="Teras Bapak"
      renderHeader={() => (
        <div className="flex gap-2 overflow-x-auto border-b border-border/40 bg-surface px-4 py-3 no-scrollbar sm:px-6" role="group" aria-label="Saring postingan">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              aria-pressed={category === active}
              onClick={() => setSearchParams(category.param ? { kategori: category.param } : {}, { replace: true })}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
                category === active ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}
    />
  );
};

export default Index;
