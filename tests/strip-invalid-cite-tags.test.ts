// test-isolation-na: standalone npm library test — no Supabase writes, no DB access at all
import { describe, it, expect } from "vitest";
import { stripInvalidCiteTags, escapeCiteAttr } from "../src/cite-tag-transform.js";

// ---------------------------------------------------------------------------
// escapeCiteAttr
// ---------------------------------------------------------------------------
describe("escapeCiteAttr", () => {
  it("escapes ampersand", () => {
    expect(escapeCiteAttr("a&b")).toBe("a&amp;b");
  });

  it("escapes double-quote", () => {
    expect(escapeCiteAttr('a"b')).toBe("a&quot;b");
  });

  it("escapes less-than", () => {
    expect(escapeCiteAttr("a<b")).toBe("a&lt;b");
  });

  it("escapes greater-than", () => {
    expect(escapeCiteAttr("a>b")).toBe("a&gt;b");
  });

  it("escapes all four in sequence", () => {
    expect(escapeCiteAttr('&"<>')).toBe("&amp;&quot;&lt;&gt;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeCiteAttr("hello world")).toBe("hello world");
  });

  it("entity-id containing & is re-emitted as &amp; in output attribute", () => {
    // LLM emits an unescaped & in the data-entity-id value (valid in raw HTML parser context)
    const entityId = "entity&type";
    const ids = new Set([entityId]);
    const html = `<cite data-entity-id="${entityId}" data-entity-type="case">text</cite>`;
    const result = stripInvalidCiteTags(html, ids);
    // Output must escape & so attribute value is safe
    expect(result).toContain('data-entity-id="entity&amp;type"');
  });
});

// ---------------------------------------------------------------------------
// stripInvalidCiteTags
// ---------------------------------------------------------------------------
describe("stripInvalidCiteTags", () => {
  const validIds = new Set(["entity-1", "entity-2"]);

  it("keeps a valid cite tag and re-emits canonical two-attribute form", () => {
    const html = `<cite data-entity-id="entity-1" data-entity-type="case">Smith v Jones</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe(
      `<cite data-entity-id="entity-1" data-entity-type="case">Smith v Jones</cite>`
    );
  });

  it("unwraps an invalid (unknown) cite tag but preserves inner text", () => {
    const html = `<cite data-entity-id="unknown-99" data-entity-type="case">some text</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe("some text");
  });

  it("drops extra attributes from valid cite tags", () => {
    const html = `<cite data-entity-id="entity-2" data-entity-type="statute" onclick="evil()" tabindex="0" style="color:red">&sect; 123</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe(
      `<cite data-entity-id="entity-2" data-entity-type="statute">&sect; 123</cite>`
    );
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("style");
    expect(result).not.toContain("tabindex");
  });

  it("is idempotent — running twice on already-canonical output yields same result", () => {
    const html = `<cite data-entity-id="entity-1" data-entity-type="case">Smith v Jones</cite>`;
    const once = stripInvalidCiteTags(html, validIds);
    const twice = stripInvalidCiteTags(once, validIds);
    expect(twice).toBe(once);
  });

  it("handles missing data-entity-type by defaulting to empty string", () => {
    const html = `<cite data-entity-id="entity-1">No type attr</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe(
      `<cite data-entity-id="entity-1" data-entity-type="">No type attr</cite>`
    );
  });

  it("processes multiple cite tags in the same string", () => {
    const html = [
      `<cite data-entity-id="entity-1" data-entity-type="case">Case A</cite>`,
      ` and `,
      `<cite data-entity-id="bad-id" data-entity-type="case">dropped</cite>`,
      ` and `,
      `<cite data-entity-id="entity-2" data-entity-type="statute">&sect; 456</cite>`,
    ].join("");
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toContain(`data-entity-id="entity-1"`);
    expect(result).toContain(`data-entity-id="entity-2"`);
    expect(result).toContain("dropped");
    expect(result).not.toContain("bad-id");
  });

  it("leaves non-cite HTML untouched", () => {
    const html = `<p>Hello <strong>world</strong></p>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe(html);
  });

  it("handles empty validIds set — unwraps all cite tags", () => {
    const html = `<cite data-entity-id="entity-1" data-entity-type="case">text</cite>`;
    const result = stripInvalidCiteTags(html, new Set());
    expect(result).toBe("text");
  });

  it("handles single-quoted attributes", () => {
    const html = `<cite data-entity-id='entity-1' data-entity-type='case'>text</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    // Should be re-emitted with double quotes in canonical form
    expect(result).toBe(
      `<cite data-entity-id="entity-1" data-entity-type="case">text</cite>`
    );
  });

  it("cite tag missing data-entity-id is unwrapped (inner kept)", () => {
    const html = `<cite data-entity-type="case">No id attr</cite>`;
    const result = stripInvalidCiteTags(html, validIds);
    expect(result).toBe("No id attr");
  });
});
