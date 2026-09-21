// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LANGUAGE_STORAGE_KEY, LanguageProvider, useLanguage } from "../i18n/LanguageProvider";

function Probe() {
  const { locale, setLocale, t } = useLanguage();
  return <><output>{locale}:{t("nav.inbox")}</output><button type="button" onClick={() => setLocale("zh-CN")}>switch</button></>;
}

describe("LanguageProvider", () => {
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

  it("defaults to English and persists Chinese independently", () => {
    act(() => root.render(<LanguageProvider><Probe /></LanguageProvider>));
    expect(container.textContent).toContain("en:Inbox");
    act(() => container.querySelector("button")!.click());
    expect(container.textContent).toContain("zh-CN:收件箱");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
  });

  it("loads a supported preference and rejects unsupported locales", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "zh-CN");
    act(() => root.render(<LanguageProvider><Probe /></LanguageProvider>));
    expect(container.textContent).toContain("zh-CN:收件箱");
    act(() => root.unmount());
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");
    root = createRoot(container);
    act(() => root.render(<LanguageProvider><Probe /></LanguageProvider>));
    expect(container.textContent).toContain("en:Inbox");
  });
});
