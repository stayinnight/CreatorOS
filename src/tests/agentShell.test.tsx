import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("Agent Desk shell", () => {
  it("uses work-entry navigation instead of feature tabs", () => {
    const html = renderToString(<MemoryRouter initialEntries={["/"]}><App /></MemoryRouter>);
    expect(html).toContain("Waiting for you");
    expect(html).toContain("Campaigns");
    expect(html).toContain("Runs");
    expect(html).not.toContain("Mix Planner</a>");
    expect(html).not.toContain("Search &amp; Candidates</a>");
  });
});
