import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatScroll } from "../components/agent/useChatScroll";

function Harness({ initialCount = 1 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const scroll = useChatScroll({ messageCount: count, contentRevision: revision });
  return <>
    <button type="button" onClick={() => setCount((value) => value + 1)}>Append message</button>
    <button type="button" onClick={() => setInspectorOpen((value) => !value)}>Open inspector</button>
    <button type="button" onClick={() => setRevision((value) => value + 1)}>Grow turn</button>
    {scroll.showJumpToLatest && <button type="button" onClick={scroll.jumpToLatest}>回到最新</button>}
    <section ref={scroll.viewportRef} onScroll={scroll.onScroll} data-inspector={inspectorOpen}>
      <div ref={scroll.contentRef}>Messages</div>
    </section>
  </>;
}

describe("chat scroll behavior", () => {
  let root: Root;
  let container: HTMLDivElement;
  let frameCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    frameCallbacks = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frameCallbacks.push(callback); return frameCallbacks.length; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    HTMLElement.prototype.scrollTo = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("scrolls the message viewport to the appended message", () => {
    act(() => root.render(<Harness />));
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });
    const viewport = container.querySelector("section")!;
    Object.defineProperty(viewport, "scrollHeight", { configurable: true, value: 900 });
    const scrollTo = vi.fn();
    viewport.scrollTo = scrollTo;

    act(() => container.querySelectorAll("button")[0].click());
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });

    expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "smooth" });
  });

  it("does not scroll the message viewport when only the inspector opens", () => {
    act(() => root.render(<Harness />));
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });
    const viewport = container.querySelector("section")!;
    const scrollTo = vi.fn();
    viewport.scrollTo = scrollTo;

    act(() => container.querySelectorAll("button")[1].click());
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not steal scroll while a turn grows after the reader scrolls up", () => {
    act(() => root.render(<Harness />));
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });
    const viewport = container.querySelector("section")!;
    Object.defineProperties(viewport, { scrollHeight: { configurable: true, value: 1000 }, scrollTop: { configurable: true, value: 100, writable: true }, clientHeight: { configurable: true, value: 500 } });
    const scrollTo = vi.fn(); viewport.scrollTo = scrollTo;
    act(() => viewport.dispatchEvent(new Event("scroll", { bubbles: true })));
    act(() => container.querySelectorAll("button")[2].click());
    act(() => { frameCallbacks.splice(0).forEach((callback) => callback(0)); });
    expect(scrollTo).not.toHaveBeenCalled();
    expect(container.textContent).toContain("回到最新");
  });
});
