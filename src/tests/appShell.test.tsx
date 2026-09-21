import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App shell", () => {
  it("anchors the fixed cycling-camera campaign", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(html).toContain("Cycling Camera Launch");
    expect(html).toContain("US / UK");
    expect(html).toContain("Campaign OS");
    expect(html).toContain("What needs your");
  });
});
