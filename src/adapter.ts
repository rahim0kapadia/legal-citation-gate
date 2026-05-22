/**
 * DataAdapter — the single abstraction surface between legal-citation-gate
 * and any backing data store.
 *
 * The library ships with zero I/O dependencies.  Callers supply a concrete
 * implementation (Supabase, static JSON file, in-memory mock, …) and the
 * library operates purely on the typed return values.
 *
 * See `examples/` for reference implementations:
 *   - examples/supabase-adapter.ts   — Supabase service-role client
 *   - examples/json-file-adapter.ts  — static JSON files (offline / testing)
 */

// ---------------------------------------------------------------------------
// Shared row shapes
// ---------------------------------------------------------------------------

/** One entity row returned by any of the whitelist-building queries. */
export interface EntityRow {
  entity_id: string;
  entity_type: string;
  /** Human-readable display label (case name, statute citation, doctrine
   *  short name, agency acronym, …). */
  display_text: string;
}

/** One row from the v_entity_confidence materialised view (or equivalent). */
export interface EntityConfidenceRow {
  entity_id: string;
  entity_type: string;
  /** Raw source count used to derive the confidence level. */
  source_count: number;
  /** Canonical confidence level string.
   *  Recognised values: "platinum" | "gold" | "verified" | "high" | "medium" | "standard"
   *  The library maps these through toUITier() → UITier for badge rendering.
   */
  confidence_level: string;
}

/** One row from the doctrine_quotes table (or equivalent). */
export interface DoctrineQuoteRow {
  entity_id: string;
  /** Short quoted passage used in pull-quote asides. */
  quote_text: string;
  /** Attribution line (attorney name, case, publication, …). */
  attribution: string | null;
}

// ---------------------------------------------------------------------------
// DataAdapter interface
// ---------------------------------------------------------------------------

/**
 * All database calls the library needs, expressed as an interface.
 *
 * Design notes:
 * - Every method is optional-inputs / required-return.
 * - Charge filter is expressed as a string array; the adapter decides how to
 *   turn it into an SQL predicate (e.g. overlaps / contains / exact-match).
 * - Jurisdiction strings are BCP-47-ish short codes ("FL", "federal", …).
 * - Top-cited queries are sorted by source_count DESC; the adapter owns the
 *   ORDER BY and LIMIT; the library does not re-sort.
 */
export interface DataAdapter {
  /**
   * Fetch case entities that overlap the supplied charge array.
   *
   * Called when `inputs.charges` is non-empty.  Should return only rows where
   * the entity's charge_types column overlaps (has any element in common with)
   * the charges array.
   *
   * @param charges  Non-empty array of charge strings.
   * @param limit    Maximum rows to return.
   */
  getCasesForCharges(charges: string[], limit: number): Promise<EntityRow[]>;

  /**
   * Fetch the top-cited case entities across the corpus, regardless of charge.
   *
   * Used as a fallback when `inputs.charges` is empty, or to supplement
   * charge-specific results when that result-set is small.
   *
   * @param limit  Maximum rows to return.
   */
  getTopCitedCases(limit: number): Promise<EntityRow[]>;

  /**
   * Fetch statute entities for a specific jurisdiction.
   *
   * @param jurisdiction  Short jurisdiction code, e.g. "FL".
   * @param limit         Maximum rows to return.
   */
  getStatutesForJurisdiction(
    jurisdiction: string,
    limit: number
  ): Promise<EntityRow[]>;

  /**
   * Fetch federal statute entities (USC / CFR / etc.).
   *
   * @param limit  Maximum rows to return.
   */
  getFederalStatutes(limit: number): Promise<EntityRow[]>;

  /**
   * Fetch doctrine entities (source_system = 'walkerdb' or equivalent).
   *
   * @param limit  Maximum rows to return.
   */
  getDoctrines(limit: number): Promise<EntityRow[]>;

  /**
   * Fetch agency entities.
   *
   * @param limit  Maximum rows to return.
   */
  getAgencies(limit: number): Promise<EntityRow[]>;

  /**
   * Fetch confidence rows for a list of entity IDs.
   *
   * The adapter should query v_entity_confidence (or equivalent) and return
   * one row per found entity_id.  Missing IDs may be omitted from the result.
   *
   * @param entityIds  Array of canonical entity_id strings.
   */
  getEntityConfidence(entityIds: string[]): Promise<EntityConfidenceRow[]>;

  /**
   * Fetch doctrine pull-quotes for a list of entity IDs.
   *
   * Used by transformCiteTags() to render aside pull-quotes for doctrine
   * citations.  Missing IDs may be omitted from the result.
   *
   * @param entityIds  Array of canonical entity_id strings.
   */
  getDoctrineQuotes(entityIds: string[]): Promise<DoctrineQuoteRow[]>;
}
