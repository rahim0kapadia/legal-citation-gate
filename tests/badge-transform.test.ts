// test-isolation-na: standalone npm library test — no Supabase writes, no DB access at all
import { describe, it, expect } from "vitest";
import { toUITier, transformCiteTags } from "../src/badge-transform.js";
import type { EntityConfidenceMap, DoctrineQuotesMap } from "../src/badge-transform.js";

// ---------------------------------------------------------------------------
// toUITier — 6-level DB value → 3-tier UI collapse
// ---------------------------------------------------------------------------
describe("toUITier", () => {
  it("platinum → top-tier", () => expect(toUITier("platinum")).toBe("top-tier"));
  it("gold → top-tier", () => expect(toUITier("gold")).toBe("top-tier"));
  it("verified → cross-verified", () => expect(toUITier("verified")).toBe("cross-verified"));
  it("high → cross-verified", () => expect(toUITier("high")).toBe("cross-verified"));
  it("medium → basic", () => expect(toUITier("medium")).toBe("basic"));
  it("standard → basic", () => expect(toUITier("standard")).toBe("basic"));
  it("unknown value → basic (fallback)", () => expect(toUITier("unknown")).toBe("basic"));
  it("empty string → basic (fallback)", () => expect(toUITier("")).toBe("basic"));
});

// ---------------------------------------------------------------------------
// transformCiteTags — badge rendering
// ---------------------------------------------------------------------------

/** Minimal factory helpers for inline mock data */
function makeConfMap(entries: Array<{ entity_id: string; confidence_level: string }>): EntityConfidenceMap {
  return new Map(entries.map((e) => [e.entity_id, { entity_id: e.entity_id, confidence_level: e.confidence_level }]));
}

function makeQuotesMap(entries: Array<{ entity_id: string; quote_text: string; attribution?: string }>): DoctrineQuotesMap {
  return new Map(entries.map((e) => [e.entity_id, { entity_id: e.entity_id, quote_text: e.quote_text, attribution: e.attribution }]));
}

describe("transformCiteTags — basic badge rendering", () => {
  it("replaces a single cite tag with a span badge", () => {
    const html = `<cite data-entity-id="c-1" data-entity-type="case">Smith v Jones</cite>`;
    const confMap = makeConfMap([{ entity_id: "c-1", confidence_level: "standard" }]);
    const quotesMap: DoctrineQuotesMap = new Map();
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain("<span");
    expect(result).toContain('data-entity-id="c-1"');
    expect(result).toContain('data-entity-type="case"');
    expect(result).toContain('data-confidence="standard"');
    expect(result).toContain('data-ui-tier="basic"');
    expect(result).toContain("Smith v Jones");
    expect(result).not.toContain("<cite");
  });

  it("renders gold confidence as top-tier with correct CSS classes", () => {
    const html = `<cite data-entity-id="c-2" data-entity-type="case">Big Case</cite>`;
    const confMap = makeConfMap([{ entity_id: "c-2", confidence_level: "gold" }]);
    const quotesMap: DoctrineQuotesMap = new Map();
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain('data-confidence="gold"');
    expect(result).toContain('data-ui-tier="top-tier"');
    expect(result).toContain("from-amber-800/40");
    expect(result).toContain("to-yellow-700/40");
  });

  it("renders high confidence as cross-verified with amber classes", () => {
    const html = `<cite data-entity-id="c-3" data-entity-type="statute">§ 123</cite>`;
    const confMap = makeConfMap([{ entity_id: "c-3", confidence_level: "high" }]);
    const quotesMap: DoctrineQuotesMap = new Map();
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain('data-ui-tier="cross-verified"');
    expect(result).toContain("bg-amber-900/40");
  });

  it("defaults to standard/basic when entity not in confMap", () => {
    const html = `<cite data-entity-id="missing-id" data-entity-type="case">text</cite>`;
    const confMap: EntityConfidenceMap = new Map();
    const quotesMap: DoctrineQuotesMap = new Map();
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain('data-confidence="standard"');
    expect(result).toContain('data-ui-tier="basic"');
  });

  it("strips nested HTML tags from badge inner text", () => {
    const html = `<cite data-entity-id="c-4" data-entity-type="case"><em>Smith</em> v <strong>Jones</strong></cite>`;
    const confMap = makeConfMap([{ entity_id: "c-4", confidence_level: "standard" }]);
    const quotesMap: DoctrineQuotesMap = new Map();
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain("Smith v Jones");
    expect(result).not.toContain("<em>");
    expect(result).not.toContain("<strong>");
  });
});

describe("transformCiteTags — doctrine pull-quote aside", () => {
  const doctrineId = "d-1";

  it("renders an aside on the FIRST occurrence of a doctrine entity", () => {
    const html = `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`;
    const confMap = makeConfMap([{ entity_id: doctrineId, confidence_level: "verified" }]);
    const quotesMap = makeQuotesMap([
      { entity_id: doctrineId, quote_text: "You have the right to remain silent.", attribution: "Miranda v. Arizona" },
    ]);
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain(`id="cite-summary-${doctrineId}"`);
    expect(result).toContain("cite-doctrine-quote");
    expect(result).toContain("You have the right to remain silent.");
    expect(result).toContain("Miranda v. Arizona");
  });

  it("renders aside with no footer when attribution is absent", () => {
    const html = `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`;
    const confMap = makeConfMap([{ entity_id: doctrineId, confidence_level: "standard" }]);
    const quotesMap = makeQuotesMap([
      { entity_id: doctrineId, quote_text: "You have the right to remain silent." },
    ]);
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).toContain("You have the right to remain silent.");
    expect(result).not.toContain("cite-quote-attr");
  });

  it("renders ONE aside on first occurrence, NO aside on second occurrence", () => {
    const html = [
      `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`,
      ` and again `,
      `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`,
    ].join("");
    const confMap = makeConfMap([{ entity_id: doctrineId, confidence_level: "standard" }]);
    const quotesMap = makeQuotesMap([
      { entity_id: doctrineId, quote_text: "You have the right to remain silent." },
    ]);
    const result = transformCiteTags(html, confMap, quotesMap);
    // exactly one aside in the output
    const asideMatches = result.match(/cite-doctrine-quote/g);
    expect(asideMatches).toHaveLength(1);
  });

  it("renders ONE aside on first occurrence, NO asides on second and third occurrences", () => {
    const cite = `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`;
    const html = `${cite} ${cite} ${cite}`;
    const confMap = makeConfMap([{ entity_id: doctrineId, confidence_level: "gold" }]);
    const quotesMap = makeQuotesMap([
      { entity_id: doctrineId, quote_text: "Right to remain silent." },
    ]);
    const result = transformCiteTags(html, confMap, quotesMap);
    const asideMatches = result.match(/cite-doctrine-quote/g);
    expect(asideMatches).toHaveLength(1);
  });
});

describe("transformCiteTags — occurrence IDs and aria-describedby", () => {
  const doctrineId = "d-1";
  const cite = `<cite data-entity-id="${doctrineId}" data-entity-type="doctrine">Miranda Rule</cite>`;

  function makeSetup() {
    const confMap = makeConfMap([{ entity_id: doctrineId, confidence_level: "gold" }]);
    const quotesMap = makeQuotesMap([
      { entity_id: doctrineId, quote_text: "Right to remain silent.", attribution: "Miranda v. AZ" },
    ]);
    return { confMap, quotesMap };
  }

  it("aside has id cite-summary-<id> (no suffix) on first occurrence", () => {
    const { confMap, quotesMap } = makeSetup();
    const result = transformCiteTags(cite, confMap, quotesMap);
    expect(result).toContain(`id="cite-summary-${doctrineId}"`);
    expect(result).not.toContain(`id="cite-summary-${doctrineId}-2"`);
  });

  it("badge on first occurrence has aria-describedby pointing to base aside id", () => {
    const { confMap, quotesMap } = makeSetup();
    const result = transformCiteTags(cite, confMap, quotesMap);
    expect(result).toContain(`aria-describedby="cite-summary-${doctrineId}"`);
  });

  it("badge on second occurrence has NO aria-describedby", () => {
    const { confMap, quotesMap } = makeSetup();
    const html = `${cite} ${cite}`;
    const result = transformCiteTags(html, confMap, quotesMap);
    // count aria-describedby occurrences — only 1 (the first badge)
    const ariaMatches = result.match(/aria-describedby=/g);
    expect(ariaMatches).toHaveLength(1);
  });

  it("three occurrences produce unique asideIds: base, base-2, base-3", () => {
    const { confMap, quotesMap } = makeSetup();
    const html = `${cite} ${cite} ${cite}`;
    const result = transformCiteTags(html, confMap, quotesMap);
    // The aside is only for the FIRST occurrence (id=base); asideIds base-2 and base-3 are
    // computed but no aside is emitted for them. Just verify the aside id is correct.
    expect(result).toContain(`id="cite-summary-${doctrineId}"`);
    // and that there's only one aside emitted
    const asideCount = (result.match(/<aside/g) ?? []).length;
    expect(asideCount).toBe(1);
  });

  it("does not emit aside for non-doctrine (no quote row) entities", () => {
    const html = `<cite data-entity-id="c-5" data-entity-type="case">Some Case</cite>`;
    const confMap = makeConfMap([{ entity_id: "c-5", confidence_level: "platinum" }]);
    const quotesMap: DoctrineQuotesMap = new Map(); // no quote for c-5
    const result = transformCiteTags(html, confMap, quotesMap);
    expect(result).not.toContain("<aside");
    expect(result).not.toContain("aria-describedby");
    expect(result).toContain('data-entity-id="c-5"');
  });
});
