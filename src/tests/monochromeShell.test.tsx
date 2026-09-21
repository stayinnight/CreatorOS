import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";
// @ts-expect-error Vitest executes in Node; the app intentionally does not ship Node types.
import { readFileSync } from "node:fs";

describe("monochrome editorial shell", () => {
  it("uses readable monochrome tokens and the editorial shell", () => {
    const html = renderToString(<MemoryRouter><App /></MemoryRouter>);
    expect(html).toContain("agent-shell monochrome-editorial");
  });

  it("defines the rounded surface hierarchy and inspector motion", () => {
    const cwd = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
    const tokens = readFileSync(`${cwd}/src/styles/tokens.css`, "utf8");
    const styles = readFileSync(`${cwd}/src/styles.css`, "utf8");
    const motion = readFileSync(`${cwd}/src/styles/motion.css`, "utf8");
    expect(tokens).toContain("--radius-surface: 12px");
    expect(tokens).toContain("--radius-control: 9px");
    expect(tokens).toContain("--radius-compact: 6px");
    expect(styles).toContain(".recommended-next-step");
    expect(motion).toContain(".artifact-inspector.is-opening");
    expect(motion).toContain("prefers-reduced-motion: reduce");
  });
});
