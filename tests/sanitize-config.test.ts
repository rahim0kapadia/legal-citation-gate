// test-isolation-na: standalone npm library test — no Supabase writes, no DB access at all
import { describe, it, expect } from "vitest";
import { reportSanitizeOptions } from "../src/sanitize-config.js";

describe("reportSanitizeOptions", () => {
  it("is defined and is an object", () => {
    expect(reportSanitizeOptions).toBeDefined();
    expect(typeof reportSanitizeOptions).toBe("object");
  });

  it("is frozen (immutable)", () => {
    expect(Object.isFrozen(reportSanitizeOptions)).toBe(true);
  });

  it("includes 'cite' in allowedTags", () => {
    const { allowedTags } = reportSanitizeOptions;
    expect(Array.isArray(allowedTags)).toBe(true);
    expect(allowedTags).toContain("cite");
  });

  it("allows data-entity-id on cite tags", () => {
    const citeAttrs = reportSanitizeOptions.allowedAttributes?.["cite"];
    expect(Array.isArray(citeAttrs)).toBe(true);
    expect(citeAttrs).toContain("data-entity-id");
  });

  it("allows data-entity-type on cite tags", () => {
    const citeAttrs = reportSanitizeOptions.allowedAttributes?.["cite"];
    expect(Array.isArray(citeAttrs)).toBe(true);
    expect(citeAttrs).toContain("data-entity-type");
  });

  it("includes common safe HTML tags", () => {
    const { allowedTags } = reportSanitizeOptions;
    // Spot-check a few basic tags that must survive sanitization
    expect(allowedTags).toContain("p");
    expect(allowedTags).toContain("strong");
    expect(allowedTags).toContain("em");
  });

  it("has allowedAttributes defined", () => {
    expect(reportSanitizeOptions.allowedAttributes).toBeDefined();
  });
});
