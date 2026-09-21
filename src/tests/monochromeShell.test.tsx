import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("monochrome editorial shell", () => {
  it("uses readable monochrome tokens and the editorial shell", () => {
    const html = renderToString(<MemoryRouter><App /></MemoryRouter>);
    expect(html).toContain("agent-shell monochrome-editorial");
  });
});
