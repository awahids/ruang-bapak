import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Image, Smile, BarChart2, Send, LogIn, Hash, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { composerPresets, type ComposerMode } from "@/data/ruang-bapak";
import { ANONYMOUS_COLOR, MAX_IMAGE_BYTES, MAX_TAG_LENGTH, getInitials, normalizeTag } from "@/lib/social";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export type ComposerSubmitPayload = {
  text: string;
  anonymous: boolean;
  /** Tag the member picked or typed; null falls back to the room's default tag. */
  quickAction: string | null;
  /** Photo to attach (never on anonymous posts). */
  image: File | null;
  /** Poll options, 2-4 filled in; null without a poll. */
  pollOptions: string[] | null;
};

const EMOJIS = ["😀", "😂", "🤣", "😊", "🥲", "😅", "😎", "🤔", "😴", "😤", "😭", "🙏", "👍", "👏", "💪", "🤝", "❤️", "🔥", "☕", "🍵", "🏍️", "🚗", "🛠️", "⚽", "👨‍👧", "👨‍👦", "👶", "🏠", "💰", "📚", "🌙", "✅"];

const MAX_POLL_OPTIONS = 4;

function EmojiButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="Tambah emoji" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
          <Smile size={18} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1" role="listbox" aria-label="Pilih emoji">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-lg hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PollEditor({ options, onChange, onClose }: { options: string[]; onChange: (options: string[]) => void; onClose: () => void }) {
  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-border/60 p-3" role="group" aria-label="Opsi polling">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Polling</span>
        <button type="button" onClick={onClose} aria-label="Hapus polling" className="rounded-full p-1 text-muted-foreground hover:bg-muted">
          <X size={14} />
        </button>
      </div>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={option}
            maxLength={80}
            onChange={(event) => onChange(options.map((value, i) => (i === index ? event.target.value : value)))}
            placeholder={`Pilihan ${index + 1}`}
            aria-label={`Pilihan ${index + 1}`}
            className="h-9 flex-1 rounded-xl border border-border/60 bg-surface px-3 text-sm outline-none ring-primary/20 focus:ring-2"
          />
          {options.length > 2 && (
            <button
              type="button"
              onClick={() => onChange(options.filter((_, i) => i !== index))}
              aria-label={`Hapus pilihan ${index + 1}`}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      {options.length < MAX_POLL_OPTIONS && (
        <button type="button" onClick={() => onChange([...options, ""])} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <Plus size={12} strokeWidth={3} />
          Tambah pilihan
        </button>
      )}
    </div>
  );
}

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
  const [image, setImage] = useState<File | null>(null);
  const [poll, setPoll] = useState<string[] | null>(null);
  const { enabled, user, profile } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagePreview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const pollOptions = poll?.map((option) => option.trim()).filter(Boolean) ?? null;
  const pollReady = poll === null || (pollOptions !== null && pollOptions.length >= 2);
  const canSubmit = text.trim().length > 0 && pollReady && !submitting;

  const toggleAnonymous = () => {
    if (!anonymous && image) {
      setImage(null);
      toast("Foto dilepas", { description: "Postingan anonim tidak bisa memakai foto supaya identitas Bapak tetap terjaga." });
    }
    setAnonymous(!anonymous);
  };

  const pickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa foto.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Ukuran foto maksimal 10 MB.");
      return;
    }
    setImage(file);
  };

  const insertEmoji = (emoji: string) => {
    const field = textareaRef.current;
    if (!field) {
      setText((previous) => previous + emoji);
      return;
    }
    const start = field.selectionStart ?? text.length;
    const end = field.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

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
      image: anonymous ? null : image,
      pollOptions: poll ? pollOptions : null,
    });
    setSubmitting(false);

    if (saved) {
      setText("");
      setTag(null);
      setImage(null);
      setPoll(null);
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
          <Avatar initials={authorInitials} color={authorColor} src={anonymous ? null : profile?.avatar_url} size={48} />
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
              onClick={toggleAnonymous}
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
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={preset.placeholder}
            className="w-full resize-none bg-transparent pt-3 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            rows={mode === "curhat" ? 4 : 2}
          />

          {imagePreview && (
            <div className="relative mt-3 inline-block">
              <img src={imagePreview} alt="Pratinjau foto" className="max-h-64 rounded-2xl border border-border/40 object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Lepas foto"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {poll && <PollEditor options={poll} onChange={setPoll} onClose={() => setPoll(null)} />}

          <div className="mt-2">
            <TagPicker options={preset.quickActions} value={tag} onChange={setTag} fallback={defaultTag} />
          </div>
          
          <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
            <div className="flex items-center gap-1 text-primary">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickImage} aria-label="Pilih foto" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={anonymous}
                aria-label="Tambah foto"
                title={anonymous ? "Postingan anonim tidak bisa memakai foto" : "Tambah foto"}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Image size={18} strokeWidth={2} />
              </button>
              {mode === "diskusi" && (
                <button
                  type="button"
                  onClick={() => setPoll((current) => (current ? null : ["", ""]))}
                  aria-label={poll ? "Hapus polling" : "Tambah polling"}
                  aria-pressed={poll !== null}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50", poll && "bg-primary-soft")}
                >
                  <BarChart2 size={18} strokeWidth={2} />
                </button>
              )}
              <EmojiButton onPick={insertEmoji} />
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
