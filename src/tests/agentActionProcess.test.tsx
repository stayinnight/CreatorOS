import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CampaignProvider } from "../app/CampaignProvider";
import { AgentComposer } from "../components/agent/AgentComposer";
import type { AgentTurnController } from "../components/agent/useAgentTurn";

describe("agent action process coverage", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it("routes Analyze 3 materials through the staged action controller", () => {
    const performAction = vi.fn();
    const turn = { activeTurn: null, revealingTurnId: null, submit: vi.fn(), performAction, busy: false } as unknown as AgentTurnController;
    act(() => root.render(<CampaignProvider><AgentComposer turn={turn} /></CampaignProvider>));
    act(() => (container.querySelector(".material-composer > button") as HTMLButtonElement).click());
    expect(performAction).toHaveBeenCalledWith({ type: "LOAD_DEMO_MATERIALS" });
  });
});
