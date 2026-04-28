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
  const [anonymous, _setAnonymous] = useState(mode === "curhat");

  const canSubmit = useMemo(() => text.trim().length > 0, [text]);

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      text: text.trim(),
      anonymous: mode === "curhat" ? anonymous : false,
      quickAction: null,
    });

    setText("");
  };

  return (
    <div className="w-full border-b border-border/40 bg-surface px-4 py-4 sm:px-6">
      <div className="flex gap-4">
        <Avatar initials="AP" color="hsl(28 33% 41%)" size={48} />
        
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={preset.placeholder}
            className="w-full resize-none bg-transparent pt-3 text-xl leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            rows={2}
          />
          
          <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
            <div className="flex items-center gap-1 text-primary">
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <Image size={18} strokeWidth={2} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <Smile size={18} strokeWidth={2} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <BarChart2 size={18} strokeWidth={2} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <Calendar size={18} strokeWidth={2} />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-soft/50">
                <MapPin size={18} strokeWidth={2} />
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
