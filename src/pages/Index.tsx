import { useState } from "react";
import { Sidebar } from "@/components/ruang/Sidebar";
import { Header } from "@/components/ruang/Header";
import { HeroCard } from "@/components/ruang/HeroCard";
import { TabBar } from "@/components/ruang/TabBar";
import { PostCard } from "@/components/ruang/PostCard";
import { RightPanel } from "@/components/ruang/RightPanel";
import { posts } from "@/data/ruang-bapak";

const Index = () => {
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen bg-surface-deep text-foreground">
      <a href="#feed" className="sr-only focus:not-sr-only">Lewati ke konten</a>

      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col overflow-hidden bg-background shadow-lift sm:my-4 sm:rounded-3xl">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 p-4 lg:flex-row lg:p-6">
              <section id="feed" className="flex min-w-0 flex-1 flex-col gap-4">
                <HeroCard />
                <TabBar active={tab} onChange={setTab} />
                <div className="flex flex-col gap-4">
                  {posts.map((p, i) => (
                    <PostCard key={p.id} post={p} index={i} />
                  ))}
                </div>
              </section>
              <RightPanel />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
