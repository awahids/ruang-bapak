import { RuangShell } from "@/components/ruang/RuangShell";
import { feedPageConfigs } from "@/data/ruang-bapak";
import { InboxItem } from "@/components/ruang/InboxItem";
import { useState, useMemo } from "react";
import { MessageSquare, Bell, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const Inbox = () => {
  const config = feedPageConfigs["inbox"];
  const [activeType, setActiveType] = useState<"pesan" | "notifikasi">("pesan");
  const [searchQuery, setSearchQuery] = useState("");
  const items = config.initialItems;

  const filteredItems = useMemo(() => {
    let source = items;
    
    if (activeType === "pesan") {
      source = items.filter(item => item.tag === "Pesan Pribadi" || item.tag === "Undangan");
    } else {
      source = items.filter(item => item.tag === "Notifikasi");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.text.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    }

    return source;
  }, [activeType, items, searchQuery]);

  return (
    <RuangShell>
      <div className="flex flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{config.title}</h1>
            <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Filter size={18} />
            </button>
          </div>
        </header>

        {/* Search & Tabs */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 border-b border-border/40 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text"
              placeholder="Cari pesan atau bapak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm outline-none ring-primary/20 transition-all focus:bg-surface focus:ring-2"
            />
          </div>
          
          <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
            <button 
              onClick={() => setActiveType("pesan")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
                activeType === "pesan" ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <MessageSquare size={16} />
              <span>Pesan</span>
              {items.filter(i => i.tag !== "Notifikasi").length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
                  {items.filter(i => i.tag !== "Notifikasi").length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveType("notifikasi")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
                activeType === "notifikasi" ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Bell size={16} />
              <span>Notifikasi</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <InboxItem key={item.id} item={item} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                {activeType === "pesan" ? <MessageSquare size={32} /> : <Bell size={32} />}
              </div>
              <p className="text-lg font-bold text-foreground">
                {searchQuery ? "Tidak ditemukan" : "Kosong Pak"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "Coba kata kunci lain." : `Belum ada ${activeType} baru.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </RuangShell>
  );
};

export default Inbox;
