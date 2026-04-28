import { FeedPage } from "@/components/ruang/FeedPage";
import { Plus } from "lucide-react";

const communities = [
  { id: 1, name: "Hobi Bengkel", members: "1.2k", description: "Bagi bapak yang suka oprek mesin sendiri.", icon: "🔧" },
  { id: 2, name: "Parenting Balita", members: "3.5k", description: "Tips sabar ngadepin anak GTM.", icon: "🧒" },
  { id: 3, name: "Investor Bapak", members: "890", description: "Paham saham biar cicilan aman.", icon: "📈" },
];

const Komunitas = () => {
  return (
    <FeedPage 
      pageKey="komunitas" 
      renderHeader={() => (
        <div className="border-b border-border/40 bg-surface p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Paguyuban Pilihan</h2>
            <button className="text-xs font-bold text-primary hover:underline">Lihat Semua</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {communities.map((comm) => (
              <div key={comm.id} className="flex min-w-[200px] flex-col rounded-2xl border border-border/60 bg-card p-4 transition-transform hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-2xl">{comm.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{comm.name}</p>
                    <p className="text-[11px] text-muted-foreground">{comm.members} Anggota</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{comm.description}</p>
                <button className="mt-4 w-full rounded-full bg-muted py-2 text-xs font-bold text-foreground transition-colors hover:bg-primary-soft hover:text-primary">Gabung</button>
              </div>
            ))}
            <button className="flex min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-4 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
              <Plus size={24} />
              <span className="text-xs font-bold">Buat Baru</span>
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default Komunitas;
