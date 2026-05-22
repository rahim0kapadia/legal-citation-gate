/**
 * entity-whitelist — assembles the set of valid (entity_type, entity_id) pairs
 * for a given report through a swappable DataAdapter.
 *
 * Two-path strategy
 * -----------------
 * 1. Charge-specific path  — entities whose charge_types column overlaps the
 *    caller-supplied charges array (case law directly relevant to the charges).
 * 2. General top-cited fallback — the highest-cited entities across the corpus,
 *    used when no charges are supplied or to supplement a thin charge-specific
 *    result set.
 *
 * Results are deduplicated by entity_id before the whitelist is built.
 */

import type { DataAdapter, EntityRow } from "./adapter.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The assembled whitelist for one report.
 *
 * `validIds`  — the Set passed to stripInvalidCiteTags().
 * `text`      — human-readable summary for logging / debugging.
 * `entityIds` — ordered array of entity_id strings (for getEntityConfidence).
 */
export interface EntityWhitelist {
  /** All validated entity_id strings; passed to stripInvalidCiteTags(). */
  validIds: Set<string>;
  /** Ordered list of entity_id strings (preserves insertion order). */
  entityIds: string[];
  /** All entity rows, keyed by entity_id (for display or further enrichment). */
  entityMap: Map<string, EntityRow>;
  /** Human-readable description for logging. */
  text: string;
}

/** Caller-supplied context for whitelist construction. */
export interface WhitelistInputs {
  /** Charge labels for the defendant's case, e.g. ["DUI", "Reckless Driving"]. */
  charges?: string[];
  /** Short jurisdiction code, e.g. "FL". Omit for federal/unknown. */
  jurisdiction?: string | null;
  /** Maximum case entities to include (default: 50). */
  maxCases?: number;
  /** Maximum statute entities to include (default: 20). */
  maxStatutes?: number;
  /** Maximum doctrine entities to include (default: 30). */
  maxDoctrines?: number;
  /** Maximum agency entities to include (default: 20). */
  maxAgencies?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARGES = 20;
const MAX_CHARGE_LEN = 64;
const MAX_JURIS_LEN = 8;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Sanitise and normalise WhitelistInputs. */
function parseWhitelistInputs(raw: WhitelistInputs): {
  charges: string[];
  jurisdiction: string | null;
  maxCases: number;
  maxStatutes: number;
  maxDoctrines: number;
  maxAgencies: number;
} {
  const charges = (raw.charges ?? [])
    .slice(0, MAX_CHARGES)
    .map((c) => c.trim().slice(0, MAX_CHARGE_LEN))
    .filter(Boolean);

  const jurisdiction =
    raw.jurisdiction
      ? raw.jurisdiction.trim().slice(0, MAX_JURIS_LEN).toUpperCase() || null
      : null;

  return {
    charges,
    jurisdiction,
    maxCases: raw.maxCases ?? 50,
    maxStatutes: raw.maxStatutes ?? 20,
    maxDoctrines: raw.maxDoctrines ?? 30,
    maxAgencies: raw.maxAgencies ?? 20,
  };
}

/**
 * Merge rows from multiple queries into an ordered deduplicated array.
 * First occurrence of each entity_id wins (preserves priority order).
 */
function dedup(batches: EntityRow[][]): EntityRow[] {
  const seen = new Set<string>();
  const out: EntityRow[] = [];
  for (const batch of batches) {
    for (const row of batch) {
      if (!seen.has(row.entity_id)) {
        seen.add(row.entity_id);
        out.push(row);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the entity whitelist for one report.
 *
 * @param adapter  DataAdapter implementation supplied by the caller.
 * @param inputs   Report context (charges, jurisdiction, limits).
 * @returns        EntityWhitelist ready to pass to stripInvalidCiteTags().
 *
 * @example
 * ```typescript
 * const whitelist = await buildEntityWhitelist(adapter, {
 *   charges: ["DUI", "Reckless Driving"],
 *   jurisdiction: "FL",
 * });
 * const validatedHtml = stripInvalidCiteTags(rawHtml, whitelist.validIds);
 * ```
 */
export async function buildEntityWhitelist(
  adapter: DataAdapter,
  inputs: WhitelistInputs
): Promise<EntityWhitelist> {
  const { charges, jurisdiction, maxCases, maxStatutes, maxDoctrines, maxAgencies } =
    parseWhitelistInputs(inputs);

  // ── Cases ──────────────────────────────────────────────────────────────────
  // Fetch charge-specific cases first; always also fetch top-cited as
  // supplemental / fallback.
  const [chargeSpecificCases, topCitedCases] = await Promise.all([
    charges.length > 0
      ? adapter.getCasesForCharges(charges, maxCases)
      : Promise.resolve([] as EntityRow[]),
    adapter.getTopCitedCases(maxCases),
  ]);

  // ── Statutes ───────────────────────────────────────────────────────────────
  const [jurisdictionStatutes, federalStatutes] = await Promise.all([
    jurisdiction
      ? adapter.getStatutesForJurisdiction(jurisdiction, maxStatutes)
      : Promise.resolve([] as EntityRow[]),
    adapter.getFederalStatutes(maxStatutes),
  ]);

  // ── Doctrines + agencies ───────────────────────────────────────────────────
  const [doctrines, agencies] = await Promise.all([
    adapter.getDoctrines(maxDoctrines),
    adapter.getAgencies(maxAgencies),
  ]);

  // ── Deduplicate and build whitelist ────────────────────────────────────────
  const allRows = dedup([
    chargeSpecificCases,
    topCitedCases,
    jurisdictionStatutes,
    federalStatutes,
    doctrines,
    agencies,
  ]);

  const validIds = new Set(allRows.map((r) => r.entity_id));
  const entityIds = allRows.map((r) => r.entity_id);
  const entityMap = new Map(allRows.map((r) => [r.entity_id, r]));

  const casesCount =
    dedup([chargeSpecificCases, topCitedCases]).length;
  const statutesCount =
    dedup([jurisdictionStatutes, federalStatutes]).length;

  const text =
    `Whitelist: ${validIds.size} entities total — ` +
    `${casesCount} cases, ${statutesCount} statutes, ` +
    `${doctrines.length} doctrines, ${agencies.length} agencies` +
    (jurisdiction ? ` (jurisdiction: ${jurisdiction})` : "") +
    (charges.length > 0 ? ` (charges: ${charges.join(", ")})` : "");

  return { validIds, entityIds, entityMap, text };
}
