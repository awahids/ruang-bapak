import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ruang/Avatar";
import { FeedPage } from "@/components/ruang/FeedPage";
import { TagPill } from "@/components/ruang/TagPill";
import { allFeedItems, type FeedItem } from "@/data/ruang-bapak";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { displayHandle, getInitials, searchPattern, searchProfiles, searchTags, type FeedFilter } from "@/lib/social";

type PersonResult = { key: string; name: string; handle: string; color: string; avatarUrl: string | null; verified: boolean; linkable: boolean };

const matchesQuery = (query: string, ...fields: string[]) => {
  const needle = query.trim().toLowerCase();
  return needle.length >= 2 && fields.some((field) => field.toLowerCase().includes(needle));
};

function useSearchResults(query: string) {
  const ready = searchPattern(query) !== null;

  const people = useQuery({
    queryKey: ["search-people", query],
    queryFn: () => searchProfiles(query),
    enabled: isSupabaseConfigured && ready,
  });
  const tags = useQuery({
    queryKey: ["search-tags", query],
    queryFn: () => searchTags(query),
    enabled: isSupabaseConfigured && ready,
  });

  return useMemo(() => {
    if (!isSupabaseConfigured) {
      const authors = new Map<string, FeedItem>();
      for (const item of allFeedItems) if (!item.anonymous && matchesQuery(query, item.name)) authors.set(item.name, item);
      const tagCounts = new Map<string, number>();
      for (const item of allFeedItems) if (matchesQuery(query, item.tag)) tagCounts.set(item.tag, (tagCounts.get(item.tag) ?? 0) + 1);

      return {
        loading: false,
        people: [...authors.values()].map<PersonResult>((item) => ({
          key: item.name,
          name: item.name,
          handle: displayHandle(item),
          color: item.color,
          avatarUrl: null,
          verified: item.verified ?? false,
          linkable: false,
        })),
        tags: [...tagCounts].map(([tag, posts]) => ({ tag, posts })),
      };
    }

    return {
      loading: people.isLoading || tags.isLoading,
      people: (people.data ?? []).map<PersonResult>((profile) => ({
        key: profile.id,
        name: profile.display_name,
        handle: profile.username,
        color: profile.avatar_color,
        avatarUrl: profile.avatar_url,
        verified: profile.verified,
        linkable: true,
      })),
      tags: tags.data ?? [],
    };
  }, [query, people.data, people.isLoading, tags.data, tags.isLoading]);
}

function SearchHeader({ draft, onDraftChange, onSubmit, query }: { draft: string; onDraftChange: (value: string) => void; onSubmit: (event: FormEvent) => void; query: string }) {
  const results = useSearchResults(query);
  const searched = searchPattern(query) !== null;

  return (
    <div className="border-b border-border/40 bg-surface px-4 py-4 sm:px-6">
      <form onSubmit={onSubmit} role="search" className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="search"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Cari postingan, bapak, atau tag..."
          aria-label="Kata kunci"
          autoFocus
          className="h-12 w-full rounded-full bg-muted/50 pl-11 pr-4 text-[15px] outline-none ring-primary/20 transition-all focus:bg-surface focus:ring-2"
        />
      </form>

      {searched && results.loading && (
        <div className="flex justify-center pt-4 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" aria-label="Mencari" />
        </div>
      )}

      {searched && !results.loading && (
        <div className="mt-4 space-y-4">
          <section aria-label="Hasil bapak">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bapak</h2>
            {results.people.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Tidak ada bapak dengan nama itu.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {results.people.map((person) => {
                  const content = (
                    <>
                      <Avatar initials={getInitials(person.name)} color={person.color} src={person.avatarUrl} size={36} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
                          {person.name}
                          {person.verified && <CheckCircle2 size={13} className="text-primary" strokeWidth={3} />}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">@{person.handle}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={person.key}>
                      {person.linkable ? (
                        <Link to={`/u/${person.handle}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/60">
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-2 py-1.5">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-label="Hasil tag">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tag</h2>
            {results.tags.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">Tidak ada tag yang cocok.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {results.tags.map(({ tag, posts }) => (
                  <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                    <TagPill tone="sage">
                      #{tag} <span className="font-normal opacity-70">· {posts}</span>
                    </TagPill>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Postingan</h2>
        </div>
      )}
    </div>
  );
}

/** Search across posts (text and tag), people and tags: /cari?q=... */
const Cari = () => {
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  const filter = useMemo<FeedFilter | null>(() => (searchPattern(query) ? { kind: "search", query } : null), [query]);
  const demoItems = useMemo(() => allFeedItems.filter((item) => matchesQuery(query, item.text, item.tag)), [query]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    setParams(next ? { q: next } : {}, { replace: false });
  };

  return (
    <FeedPage
      key={query}
      pageKey="beranda"
      title="Cari"
      feedFilter={filter}
      showComposer={false}
      demoItems={demoItems}
      renderHeader={() => <SearchHeader draft={draft} onDraftChange={setDraft} onSubmit={submit} query={query} />}
      emptyState={
        filter
          ? { title: "Tidak ada postingan yang cocok", hint: "Coba kata kunci lain, Pak." }
          : { title: "Mau cari apa, Pak?", hint: "Ketik minimal 2 huruf: isi postingan, nama bapak, atau tag." }
      }
    />
  );
};

export default Cari;
