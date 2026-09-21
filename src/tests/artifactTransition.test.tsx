import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CampaignAction } from "../app/campaignReducer";
import { useArtifactTransition } from "../components/agent/useArtifactTransition";

function Harness({ dispatch, initialSelected = null }: { dispatch: (action: CampaignAction) => void; initialSelected?: string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const transition = useArtifactTransition(selected, (action) => {
    dispatch(action);
    if (action.type === "OPEN_ARTIFACT") setSelected(action.artifactId);
    if (action.type === "CLOSE_ARTIFACT") setSelected(null);
  });
  return <button type="button" data-reveal-key={transition.revealKey} aria-busy={Boolean(transition.openingArtifactId)} onClick={() => transition.openArtifact("artifact-mix-draft")}>{transition.openingArtifactId ? "Opening comparison…" : "Open comparison"}</button>;
}

describe("artifact transition", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("shows opening immediately and dispatches once after the shell enters", () => {
    const dispatch = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    act(() => root.render(<Harness dispatch={dispatch} />));
    const button = container.querySelector("button")!;

    act(() => { button.click(); button.click(); });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent).toContain("Opening comparison");
    expect(dispatch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(260));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: "OPEN_ARTIFACT", artifactId: "artifact-mix-draft" });
  });

  it("opens immediately when reduced motion is requested", () => {
    const dispatch = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    act(() => root.render(<Harness dispatch={dispatch} />));
    act(() => container.querySelector("button")!.click());
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("reveals an artifact again when the requested result is already open", () => {
    const dispatch = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    act(() => root.render(<Harness dispatch={dispatch} initialSelected="artifact-mix-draft" />));

    act(() => container.querySelector("button")!.click());

    expect(container.querySelector("button")!.dataset.revealKey).toBe("1");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
