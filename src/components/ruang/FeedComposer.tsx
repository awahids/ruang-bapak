import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Image, Smile, BarChart2, Send, LogIn, Hash, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { composerPresets, type ComposerMode } from "@/data/ruang-bapak";
import { ANONYMOUS_COLOR, MAX_TAG_LENGTH, getInitials, normalizeTag } from "@/lib/social";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export type ComposerSubmitPayload = {
  text: string;
  anonymous: boolean;
  /** Tag the member picked or typed; null falls back to the room's default tag. */
  quickAction: string | null;
};

interface TagPickerProps {
  options: string[];
  value: string | null;
  onChange: (tag: string | null) => void;
  /** Tag the post gets when nothing is picked. */
  fallback?: string;
}

/** Tag chips for the composer: the room's suggestions plus one tag of the member's own. */
function TagPicker({ options, value, onChange, fallback }: TagPickerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const custom = value !== null && !options.includes(value) ? value : null;

  const commitDraft = () => {
    const tag = normalizeTag(draft, options);
    if (tag) onChange(tag);
    setDraft("");
    setEditing(false);
  };

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border/60 bg-surface text-muted-foreground hover:border-primary/40 hover:text-primary",
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Pilih tag">
      <Hash size={14} className="text-muted-foreground" aria-hidden />
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? null : option)}
          className={chipClass(value === option)}
        >
          {option}
        </button>
      ))}

      {custom && (
        <button type="button" aria-pressed onClick={() => onChange(null)} className={chipClass(true)} aria-label={`Hapus tag ${custom}`}>
          {custom}
          <X size={12} strokeWidth={3} aria-hidden />
        </button>
      )}

      {editing ? (
        <input
          autoFocus
          value={draft}
          maxLength={MAX_TAG_LENGTH + 1}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            } else if (event.key === "Escape") {
              setDraft("");
              setEditing(false);
            }
          }}
          placeholder="Tulis tag, Enter"
          aria-label="Tag lain"
          className="h-7 w-36 rounded-full border border-primary/40 bg-surface px-3 text-xs outline-none ring-primary/20 focus:ring-2"
        />
      ) : (
        <button type="button" onClick={() => setEditing(true)} className={chipClass(false)}>
          <Plus size={12} strokeWidth={3} aria-hidden />
          Tag lain
        </button>
      )}

      {value === null && fallback && <span className="text-[11px] text-muted-foreground">Tanpa pilihan: {fallback}</span>}
    </div>
  );
}

interface FeedComposerProps {
  mode: ComposerMode;
  /** Resolves to true when the post was saved, so the draft can be cleared. */
  onSubmit: (payload: ComposerSubmitPayload) => Promise<boolean>;
  /** Tag the post gets when the member picks none, shown as a hint. */
  defaultTag?: string;
}

export function FeedComposer({ mode, onSubmit, defaultTag }: FeedComposerProps) {
  const preset = composerPresets[mode];
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(mode === "curhat");
  const [tag, setTag] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { enabled, user, profile } = useAuth();

  const canSubmit = useMemo(() => text.trim().length > 0 && !submitting, [text, submitting]);

  const authorName = profile?.display_name ?? "Ari Pratama";
  const authorInitials = anonymous ? "BA" : getInitials(authorName);
  const authorColor = anonymous ? ANONYMOUS_COLOR : profile?.avatar_color ?? "hsl(28 33% 41%)";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    const saved = await onSubmit({
      text: text.trim(),
      anonymous: anonymous,
      quickAction: tag,
    });
    setSubmitting(false);

    if (saved) {
      setText("");
      setTag(null);
    }
  };

  if (enabled && !user) {
    return (
      <div className="flex flex-col items-start gap-3 border-b border-border/40 bg-primary/5 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-bold text-foreground">{preset.title}</p>
          <p className="text-sm text-muted-foreground">Masuk dulu untuk ikut posting, komentar, dan kasih dukungan.</p>
        </div>
        <Link
          to="/login"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          <LogIn size={16} />
          Masuk / Daftar
        </Link>
      </div>
    );
  }

  if (mode === "checkin") {
    return (
      <div className="border-b border-border/40 bg-primary/5 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">{preset.title}</h3>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={preset.placeholder}
              className="flex-1 rounded-xl bg-surface px-4 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
            />
            <button 
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {preset.cta}
            </button>
          </div>
          <TagPicker options={preset.quickActions} value={tag} onChange={setTag} fallback={defaultTag} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full border-b border-border/40 px-4 py-4 sm:px-6 transition-colors",
      mode === "curhat" ? "bg-plum/5" : "bg-surface"
    )}>
      <div className="flex gap-4">
        <div className="shrink-0">
          <Avatar initials={authorInitials} color={authorColor} size={48} />
        </div>
        
        <div className="flex-1">
          <div className="mb-2 flex items-center justify-between">
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              mode === "curhat" ? "text-plum" : "text-muted-foreground"
            )}>
              {mode === "curhat" ? "Mode Curhat Aman" : "Postingan Publik"}
            </span>
            <button 
              onClick={() => setAnonymous(!anonymous)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all",
                anonymous 
                  ? (mode === "curhat" ? "bg-plum text-white" : "bg-primary text-primary-foreground") 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {anonymous ? "Anonim: AKTIF" : "Anonim: NON-AKTIF"}
            </button>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={preset.placeholder}
            className="w-full resize-none bg-transparent pt-3 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            rows={mode === "curhat" ? 4 : 2}
          />

          <div className="mt-2">
            <TagPicker options={preset.quickActions} value={tag} onChange={setTag} fallback={defaultTag} />
          </div>
          
          <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
            <div className="flex items-center gap-1 text-primary">
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <Image size={18} strokeWidth={2} />
              </button>
              {mode === "diskusi" && (
                <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                  <BarChart2 size={18} strokeWidth={2} />
                </button>
              )}
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <Smile size={18} strokeWidth={2} />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-5 text-sm font-bold transition-all",
                canSubmit
                  ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                  : "bg-primary/50 text-primary-foreground/50 cursor-not-allowed"
              )}
            >
              <span>{preset.cta}</span>
              <Send size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
