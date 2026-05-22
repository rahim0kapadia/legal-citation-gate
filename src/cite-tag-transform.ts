/**
 * cite-tag-transform — post-generation hard gate.
 *
 * Pure functions; no I/O, no external dependencies.
 *
 * Extracted from the INAA report Edge Function (same logic, zero business
 * context).  The gate runs AFTER the LLM emits report HTML and BEFORE the
 * HTML is stored or served to the reader.
 *
 * Key invariant: every surviving <cite> tag is re-emitted in canonical
 * two-attribute form:
 *
 *   <cite data-entity-id="…" data-entity-type="…">…</cite>
 *
 * Extra attributes (onclick, style, tabindex, …) are dropped.  Entity-ID
 * values are HTML-escaped to prevent attribute injection.
 */

/**
 * Escape a string for safe use inside a double-quoted HTML attribute value.
 *
 * Handles: & " < >
 */
export function escapeCiteAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Strip or canonicalise <cite data-entity-id="…"> tags in an HTML string.
 *
 * - Tags whose data-entity-id is NOT in `validIds` are unwrapped (inner
 *   text is kept; the <cite> wrapper is removed).
 * - Tags whose data-entity-id IS in `validIds` are re-emitted in canonical
 *   two-attribute form, discarding any extra attributes.
 * - The function is idempotent: running it twice on already-canonical output
 *   produces the same result.
 *
 * @param html      Raw HTML emitted by the LLM pipeline.
 * @param validIds  Set of whitelisted entity_id strings from buildEntityWhitelist().
 * @returns         Sanitised HTML safe to store and render.
 */
export function stripInvalidCiteTags(
  html: string,
  validIds: Set<string>
): string {
  return html.replace(
    /<cite\s+([^>]*?)>([\s\S]*?)<\/cite>/gi,
    (_match: string, attrs: string, inner: string) => {
      const idMatch = attrs.match(/data-entity-id=["']([^"']+)["']/);
      const typeMatch = attrs.match(/data-entity-type=["']([^"']+)["']/);
      const entityId = idMatch?.[1];
      if (!entityId || !validIds.has(entityId)) return inner;
      const id = entityId;
      const type = typeMatch?.[1] ?? "";
      return `<cite data-entity-id="${escapeCiteAttr(id)}" data-entity-type="${escapeCiteAttr(type)}">${inner}</cite>`;
    }
  );
}
