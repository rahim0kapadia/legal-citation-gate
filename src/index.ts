/**
 * legal-citation-gate — public API
 *
 * AGPL-3.0-or-later. See LICENSE and COMMERCIAL-LICENSE.md.
 *
 * This package provides zero-dependency (no runtime I/O) utilities for
 * annotating legal-report HTML with confidence-tiered citation badges.
 * All database access is mediated through the DataAdapter interface so
 * the library ships with no Supabase / PostgreSQL runtime dependency.
 */

// ---------- DataAdapter interface ------------------------------------------
export type {
  DataAdapter,
  EntityRow,
  EntityConfidenceRow,
  DoctrineQuoteRow,
} from "./adapter.js";

// ---------- Entity whitelist -----------------------------------------------
export type { EntityWhitelist, WhitelistInputs } from "./entity-whitelist.js";
export { buildEntityWhitelist } from "./entity-whitelist.js";

// ---------- <cite> tag utilities -------------------------------------------
export { stripInvalidCiteTags, escapeCiteAttr } from "./cite-tag-transform.js";

// ---------- Badge / confidence transform ------------------------------------
export type {
  UITier,
  ConfidenceLevel,
  EntityConfidenceMap,
  DoctrineQuotesMap,
} from "./badge-transform.js";
export { toUITier, transformCiteTags } from "./badge-transform.js";

// ---------- Sanitize config -------------------------------------------------
export { reportSanitizeOptions } from "./sanitize-config.js";
