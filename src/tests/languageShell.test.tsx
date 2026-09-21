// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("bilingual application shell", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it("defaults to English and switches the global shell to Chinese without navigation", () => {
    act(() => root.render(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>));
    expect(container.textContent).toContain("Inbox");
    const chinese = container.querySelector('button[aria-label="切换到中文"]') as HTMLButtonElement;
    expect(chinese).toBeTruthy();
    act(() => chinese.click());
    expect(container.textContent).toContain("收件箱");
    expect(container.textContent).toContain("重置演示");
    expect(container.textContent).toContain("需要你处理的事项");
    expect(window.location.pathname).toBe("/");
    const runs = container.querySelector('a[href="/runs"]') as HTMLAnchorElement;
    act(() => runs.click());
    expect(container.textContent).toContain("运行记录，而不是聊天历史");
  });

  it("switches Agent-owned campaign content while preserving proper nouns", () => {
    act(() => root.render(<MemoryRouter initialEntries={["/campaigns/campaign-cycling-camera"]}><App /></MemoryRouter>));
    expect(container.textContent).toContain("Give me the client materials");
    expect(container.textContent).toContain("Analyze 3 materials");
    expect(container.textContent).toContain("Cycling Camera Launch");
    act(() => (container.querySelector('button[aria-label="切换到中文"]') as HTMLButtonElement).click());
    expect(container.textContent).toContain("把客户材料交给我");
    expect(container.textContent).toContain("分析 3 份材料");
    expect(container.textContent).toContain("Cycling Camera Launch");
  });
});
