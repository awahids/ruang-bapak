import { useMemo, useState } from "react";
import { Image, Smile, MapPin, BarChart2, Calendar, Send } from "lucide-react";
import { composerPresets, type ComposerMode } from "@/data/ruang-bapak";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export type ComposerSubmitPayload = {
  text: string;
  anonymous: boolean;
  quickAction: string | null;
};

interface FeedComposerProps {
  mode: ComposerMode;
  onSubmit: (payload: ComposerSubmitPayload) => void;
}

export function FeedComposer({ mode, onSubmit }: FeedComposerProps) {
  const preset = composerPresets[mode];
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(mode === "curhat");

  const canSubmit = useMemo(() => text.trim().length > 0, [text]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      text: text.trim(),
      anonymous: anonymous,
      quickAction: null,
    });

    setText("");
  };

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
          <Avatar initials={anonymous ? "BA" : "AP"} color={anonymous ? "hsl(205 14% 41%)" : "hsl(28 33% 41%)"} size={48} />
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
