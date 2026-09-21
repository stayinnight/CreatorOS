import { useEffect, useState } from "react";

export function TypewriterAnswer({ text, active, onComplete }: { text: string; active: boolean; onComplete?: () => void }) {
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [visible, setVisible] = useState(active && !reduced ? 0 : text.length);
  useEffect(() => {
    if (!active || reduced) { setVisible(text.length); onComplete?.(); return; }
    setVisible(0);
    const amount = Math.max(1, Math.ceil(text.length / 50));
    const timer = window.setInterval(() => setVisible((current) => {
      const next = Math.min(text.length, current + amount);
      if (next === text.length) { window.clearInterval(timer); onComplete?.(); }
      return next;
    }), 18);
    return () => window.clearInterval(timer);
  }, [active, onComplete, reduced, text]);
  return <span className="typed-answer">{text.slice(0, visible)}{active && visible < text.length && <span aria-hidden="true" className="typing-caret" />}</span>;
}
