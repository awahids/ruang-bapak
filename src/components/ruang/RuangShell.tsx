import type { ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";

interface RuangShellProps {
  children: ReactNode;
}

export function RuangShell({ children }: RuangShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#feed-content" className="sr-only focus:not-sr-only">
        Lewati ke konten
      </a>

      <div className="flex w-full justify-center pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Left Sidebar - Fixed height sticky */}
        <div className="hidden lg:block lg:w-[275px] xl:w-[300px]">
          <div className="sticky top-0 flex h-screen flex-col border-r border-border/40 py-2 pr-4">
            <Sidebar />
          </div>
        </div>

        {/* Center Feed */}
        <main id="feed-content" className="min-h-screen min-w-0 flex-1 border-x border-border/40 bg-surface">
          <div className="flex flex-col">
            {children}
          </div>
          
          {/* Mobile Right Panel Stack */}
          <div className="mt-4 lg:hidden px-4">
            <RightPanel mode="mobile-stacked" />
          </div>
        </main>

        {/* Right Sidebar - Sticky widgets */}
        <div className="hidden xl:block xl:w-[350px] 2xl:w-[390px]">
          <div className="sticky top-0 h-screen overflow-y-auto py-4 pl-8 no-scrollbar">
            <RightPanel mode="desktop-column" />
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
