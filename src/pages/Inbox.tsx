import { useMemo, useState, type ReactNode } from "react";
import { Bell, Loader2, MessageSquare, Search } from "lucide-react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { InboxItem } from "@/components/ruang/InboxItem";
import { NotificationRow, ThreadRow } from "@/components/ruang/InboxRows";
import { RuangShell } from "@/components/ruang/RuangShell";
import { useAuth } from "@/contexts/AuthContext";
import { feedPageConfigs } from "@/data/ruang-bapak";
import { useNotifications, useThreads, useUnreadCounts } from "@/hooks/use-inbox";
import { describeError } from "@/lib/social";
import { cn } from "@/lib/utils";

type InboxTab = "pesan" | "notifikasi";

const matches = (query: string, ...fields: (string | null | undefined)[]) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((field) => field?.toLowerCase().includes(q));
};

function TabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-bold transition-all",
        active ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function EmptyState({ tab, searching, title, body }: { tab: InboxTab; searching: boolean; title?: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
        {tab === "pesan" ? <MessageSquare size={32} /> : <Bell size={32} />}
      </div>
      <p className="text-lg font-bold text-foreground">{title ?? (searching ? "Tidak ditemukan" : "Kosong Pak")}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body ?? (searching ? "Coba kata kunci lain." : `Belum ada ${tab} baru.`)}</p>
    </div>
  );
}

function InboxFrame({
  tab,
  onTabChange,
  searchQuery,
  onSearchChange,
  messageBadge,
  notificationBadge,
  children,
}: {
  tab: InboxTab;
  onTabChange: (tab: InboxTab) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  messageBadge?: number;
  notificationBadge?: number;
  children: ReactNode;
}) {
  return (
    <RuangShell>
      <div className="flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border/40 bg-surface/80 px-4 py-3 backdrop-blur-md pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{feedPageConfigs.inbox.title}</h1>
        </header>

        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 border-b border-border/40 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder={tab === "pesan" ? "Cari pesan atau bapak..." : "Cari notifikasi..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-xl bg-muted/50 pl-10 pr-4 text-sm outline-none ring-primary/20 transition-all focus:bg-surface focus:ring-2"
            />
          </div>

          <div className="flex gap-1 rounded-xl bg-muted/30 p-1">
            <TabButton active={tab === "pesan"} onClick={() => onTabChange("pesan")} icon={<MessageSquare size={16} />} label="Pesan" badge={messageBadge} />
            <TabButton active={tab === "notifikasi"} onClick={() => onTabChange("notifikasi")} icon={<Bell size={16} />} label="Notifikasi" badge={notificationBadge} />
          </div>
        </div>

        <div className="flex flex-col">{children}</div>
      </div>
    </RuangShell>
  );
}

function useInboxTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: InboxTab = searchParams.get("tab") === "notifikasi" ? "notifikasi" : "pesan";
  const setTab = (next: InboxTab) => setSearchParams(next === "pesan" ? {} : { tab: next }, { replace: true });
  return [tab, setTab] as const;
}

function DemoInbox() {
  const [tab, setTab] = useInboxTab();
  const [searchQuery, setSearchQuery] = useState("");
  const items = feedPageConfigs.inbox.initialItems;

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => (tab === "pesan" ? item.tag === "Pesan Pribadi" || item.tag === "Undangan" : item.tag === "Notifikasi"))
        .filter((item) => matches(searchQuery, item.name, item.text, item.tag)),
    [tab, items, searchQuery],
  );

  return (
    <InboxFrame
      tab={tab}
      onTabChange={setTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      messageBadge={items.filter((item) => item.tag !== "Notifikasi").length}
    >
      {filteredItems.length > 0 ? (
        filteredItems.map((item) => <InboxItem key={item.id} item={item} />)
      ) : (
        <EmptyState tab={tab} searching={Boolean(searchQuery)} />
      )}
    </InboxFrame>
  );
}

function ThreadList({ searchQuery }: { searchQuery: string }) {
  const navigate = useNavigate();
  const { data: threads = [], isLoading, error } = useThreads();
  const visible = threads.filter((thread) => matches(searchQuery, thread.otherName, thread.otherUsername, thread.lastBody));

  if (isLoading) return <Loading />;
  if (error) return <EmptyState tab="pesan" searching={false} title="Pesan belum bisa dimuat" body={describeError(error)} />;
  if (visible.length === 0) {
    return searchQuery ? (
      <EmptyState tab="pesan" searching />
    ) : (
      <EmptyState tab="pesan" searching={false} body="Buka profil bapak lain lalu tekan “Kirim Pesan” untuk mulai ngobrol." />
    );
  }

  return (
    <>
      {visible.map((thread) => (
        <ThreadRow key={thread.id} thread={thread} onOpen={() => navigate(`/inbox/${thread.id}`)} />
      ))}
    </>
  );
}

function NotificationList({ searchQuery }: { searchQuery: string }) {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, error } = useNotifications();
  const visible = notifications.filter((item) => matches(searchQuery, item.actorName, item.actorUsername, item.preview));

  if (isLoading) return <Loading />;
  if (error) return <EmptyState tab="notifikasi" searching={false} title="Notifikasi belum bisa dimuat" body={describeError(error)} />;
  if (visible.length === 0) {
    return searchQuery ? (
      <EmptyState tab="notifikasi" searching />
    ) : (
      <EmptyState tab="notifikasi" searching={false} body="Dukungan dan komentar dari bapak lain akan muncul di sini." />
    );
  }

  return (
    <>
      {visible.map((item) => (
        <NotificationRow
          key={item.id}
          notification={item}
          onOpen={() => navigate(item.postId === null ? `/u/${item.actorUsername}` : `/post/${item.postId}`)}
        />
      ))}
    </>
  );
}

const Loading = () => (
  <div className="flex justify-center py-20 text-muted-foreground">
    <Loader2 className="animate-spin" aria-label="Memuat" />
  </div>
);

function RemoteInbox() {
  const [tab, setTab] = useInboxTab();
  const [searchQuery, setSearchQuery] = useState("");
  const unread = useUnreadCounts();

  return (
    <InboxFrame
      tab={tab}
      onTabChange={setTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      messageBadge={unread.messages}
      notificationBadge={tab === "notifikasi" ? undefined : unread.notifications}
    >
      {tab === "pesan" ? <ThreadList searchQuery={searchQuery} /> : <NotificationList searchQuery={searchQuery} />}
    </InboxFrame>
  );
}

const Inbox = () => {
  const { enabled, loading, user } = useAuth();
  const location = useLocation();

  if (!enabled) return <DemoInbox />;
  if (loading) {
    return (
      <RuangShell>
        <Loading />
      </RuangShell>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;

  return <RemoteInbox />;
};

export default Inbox;
