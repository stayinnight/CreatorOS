import { useCallback, useEffect, useLayoutEffect, useRef, useState, type UIEvent } from "react";

const BOTTOM_THRESHOLD = 72;
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function useChatScroll({ messageCount, contentRevision = 0 }: { messageCount: number; contentRevision?: number }) {
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  const frameRef = useRef<number | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const scrollToEnd = useCallback((behavior: ScrollBehavior) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      frameRef.current = null;
    });
  }, []);
  useLayoutEffect(() => {
    if (pinnedToBottomRef.current) scrollToEnd(reducedMotion() ? "auto" : "smooth");
    else setShowJumpToLatest(true);
  }, [messageCount, contentRevision, scrollToEnd]);
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => { if (pinnedToBottomRef.current) { const viewport = viewportRef.current; if (viewport) viewport.scrollTop = viewport.scrollHeight; } });
    observer.observe(content); return () => observer.disconnect();
  }, []);
  useEffect(() => () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); }, []);
  const onScroll = useCallback((event: UIEvent<HTMLElement>) => {
    const viewport = event.currentTarget;
    const pinned = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= BOTTOM_THRESHOLD;
    pinnedToBottomRef.current = pinned; setShowJumpToLatest(!pinned);
  }, []);
  const jumpToLatest = useCallback(() => { pinnedToBottomRef.current = true; setShowJumpToLatest(false); scrollToEnd(reducedMotion() ? "auto" : "smooth"); }, [scrollToEnd]);
  return { viewportRef, contentRef, onScroll, showJumpToLatest, jumpToLatest };
}
