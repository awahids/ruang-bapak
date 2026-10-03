import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "ruang-bapak:mode-rehat";

type CalmMode = {
  /** "Mode Rehat": hides like and comment counts, unread badges and pop-up alerts. */
  calm: boolean;
  toggleCalm: () => void;
};

const CalmModeContext = createContext<CalmMode>({ calm: false, toggleCalm: () => {} });

const readStored = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export function CalmModeProvider({ children }: { children: ReactNode }) {
  const [calm, setCalm] = useState(readStored);

  const toggleCalm = useCallback(() => {
    setCalm((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Private browsing: the choice just lasts for this visit.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ calm, toggleCalm }), [calm, toggleCalm]);
  return <CalmModeContext.Provider value={value}>{children}</CalmModeContext.Provider>;
}

export const useCalmMode = () => useContext(CalmModeContext);
