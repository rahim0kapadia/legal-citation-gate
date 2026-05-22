/**
 * badge-transform — render-time transform from <cite> tags to confidence-tier
 * badges + doctrine pull-quote asides.
 *
 * Runs AFTER stripInvalidCiteTags() has already removed invalid citations.
 * Only valid, whitelisted <cite data-entity-id="…"> tags reach this function.
 *
 * Confidence tier collapse (6 DB levels → 3 UI tiers)
 * ----------------------------------------------------
 *   standard, medium     → "basic"          (zinc badge)
 *   high, verified       → "cross-verified" (amber badge)
 *   gold, platinum       → "top-tier"       (gold/amber gradient badge)
 *
 * Pull-quote behaviour
 * --------------------
 * When a doctrine entity has a quote row AND this is the FIRST occurrence of
 * that entity_id in the document, an <aside> pull-quote is rendered immediately
 * after the badge.  Subsequent occurrences of the same doctrine ID get the
 * badge only (no duplicate aside).
 */

import type { EntityConfidenceRow, DoctrineQuoteRow } from "./adapter.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Three-tier collapsed UI confidence level. */
export type UITier = "basic" | "cross-verified" | "top-tier";

/** Confidence level strings as stored in v_entity_confidence. */
export type ConfidenceLevel =
  | "platinum"
  | "gold"
  | "verified"
  | "high"
  | "medium"
  | "standard";

/** Pre-loaded confidence map keyed by entity_id. */
export type EntityConfidenceMap = Map<string, EntityConfidenceRow>;

/** Pre-loaded doctrine quotes map keyed by entity_id. */
export type DoctrineQuotesMap = Map<string, DoctrineQuoteRow>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_CLASSES: Record<UITier, string> = {
  basic: "bg-zinc-800 text-zinc-400 border-zinc-700",
  "cross-verified":
    "bg-amber-900/40 text-amber-200 border-amber-600",
  "top-tier":
    "bg-gradient-to-r from-amber-800/40 to-yellow-700/40 text-yellow-100 border-yellow-400",
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Collapse a 6-level DB confidence value into a 3-tier UI level.
 *
 * Unknown / missing values fall back to "basic".
 */
export function toUITier(level: string): UITier {
  switch (level as ConfidenceLevel) {
    case "platinum":
    case "gold":
      return "top-tier";
    case "verified":
    case "high":
      return "cross-verified";
    case "medium":
    case "standard":
    default:
      return "basic";
  }
}

/** Escape characters that must not appear raw inside HTML text or attributes. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Render one confidence badge span.
 *
 * The badge carries:
 *   - `data-confidence` — raw DB level (for programmatic consumers)
 *   - `data-ui-tier`    — collapsed UI tier
 *   - `aria-describedby` — references the pull-quote aside ID (if present)
 *   - Tailwind classes from TIER_CLASSES
 */
function renderBadge(
  entityId: string,
  entityType: string,
  inner: string,
  level: string,
  uiTier: UITier,
  describedById: string | null
): string {
  const classes = `cite-badge ${TIER_CLASSES[uiTier]} border rounded px-1 text-xs`;
  const ariaAttr = describedById
    ? ` aria-describedby="${escapeAttr(describedById)}"`
    : "";
  return (
    `<span class="${escapeAttr(classes)}"` +
    ` data-entity-id="${escapeAttr(entityId)}"` +
    ` data-entity-type="${escapeAttr(entityType)}"` +
    ` data-confidence="${escapeAttr(level)}"` +
    ` data-ui-tier="${escapeAttr(uiTier)}"` +
    `${ariaAttr}>${escapeHtml(inner)}</span>`
  );
}

/**
 * Render a pull-quote aside for a doctrine citation.
 *
 * Only rendered on the FIRST occurrence of an entity_id.
 */
function renderPullQuote(
  asideId: string,
  quote: DoctrineQuoteRow
): string {
  const attr = quote.attribution
    ? `<footer class="cite-quote-attr">${escapeHtml(quote.attribution)}</footer>`
    : "";
  return (
    `<aside id="${escapeAttr(asideId)}" class="cite-doctrine-quote">` +
    `<blockquote>${escapeHtml(quote.quote_text)}</blockquote>` +
    attr +
    `</aside>`
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Replace whitelisted <cite data-entity-id="…"> tags with confidence-tier
 * badges and optional doctrine pull-quote asides.
 *
 * Call AFTER stripInvalidCiteTags() — only valid citations should reach here.
 *
 * @param html       HTML string that has already passed the stripInvalidCiteTags gate.
 * @param confMap    Confidence rows pre-loaded via adapter.getEntityConfidence().
 * @param quotesMap  Doctrine quote rows pre-loaded via adapter.getDoctrineQuotes().
 * @returns          HTML with <cite> tags replaced by badge spans + asides.
 *
 * @example
 * ```typescript
 * const confRows = await adapter.getEntityConfidence([...whitelist.entityIds]);
 * const confMap: EntityConfidenceMap = new Map(confRows.map(r => [r.entity_id, r]));
 *
 * const doctrineIds = whitelist.entityIds.filter(id => entityMap.get(id)?.entity_type === "doctrine");
 * const quoteRows = await adapter.getDoctrineQuotes(doctrineIds);
 * const quotesMap: DoctrineQuotesMap = new Map(quoteRows.map(r => [r.entity_id, r]));
 *
 * const finalHtml = transformCiteTags(validatedHtml, confMap, quotesMap);
 * ```
 */
export function transformCiteTags(
  html: string,
  confMap: EntityConfidenceMap,
  quotesMap: DoctrineQuotesMap
): string {
  /** Tracks which doctrine entity IDs have already had their aside rendered. */
  const renderedDoctrines = new Set<string>();
  /** Tracks occurrence count per entity_id for unique aria-describedby IDs. */
  const occurrenceById = new Map<string, number>();

  return html.replace(
    /<cite\s+data-entity-id=["']([^"']+)["']\s+data-entity-type=["']([^"']+)["']>([\s\S]*?)<\/cite>/gi,
    (_match: string, entityId: string, entityType: string, inner: string) => {
      // Track occurrences for unique IDs
      const count = (occurrenceById.get(entityId) ?? 0) + 1;
      occurrenceById.set(entityId, count);

      const conf = confMap.get(entityId);
      const level = conf?.confidence_level ?? "standard";
      const uiTier = toUITier(level);

      // Build aside ID — first occurrence: cite-summary-<id>, subsequent: cite-summary-<id>-2, -3, …
      const baseId = `cite-summary-${entityId}`;
      const asideId = count === 1 ? baseId : `${baseId}-${count}`;

      const quote = quotesMap.get(entityId);
      const hasQuote = quote !== undefined;

      // Only render the aside on the FIRST occurrence of each doctrine entity
      const isFirstOccurrence = !renderedDoctrines.has(entityId);
      const shouldRenderAside = hasQuote && isFirstOccurrence;
      if (hasQuote) renderedDoctrines.add(entityId);

      const badge = renderBadge(
        entityId,
        entityType,
        inner.replace(/<[^>]+>/g, ""), // strip nested tags for badge label
        level,
        uiTier,
        hasQuote ? (isFirstOccurrence ? baseId : null) : null
      );

      if (shouldRenderAside && quote) {
        return badge + renderPullQuote(baseId, quote);
      }
      return badge;
    }
  );
}
