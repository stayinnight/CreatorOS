import { useCallback, useEffect, useLayoutEffect, useRef, type UIEvent } from "react";

const BOTTOM_THRESHOLD = 72;

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useChatScroll(messageCount: number) {
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedToBottomRef = useRef(true);
  const frameRef = useRef<number | null>(null);

  const scrollToEnd = useCallback((behavior: ScrollBehavior) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      frameRef.current = null;
    });
  }, []);

  useLayoutEffect(() => {
    pinnedToBottomRef.current = true;
    scrollToEnd(reducedMotion() ? "auto" : "smooth");
  }, [messageCount, scrollToEnd]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const viewport = viewportRef.current;
      if (viewport && pinnedToBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const onScroll = useCallback((event: UIEvent<HTMLElement>) => {
    const viewport = event.currentTarget;
    pinnedToBottomRef.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= BOTTOM_THRESHOLD;
  }, []);

  return { viewportRef, contentRef, onScroll };
}
