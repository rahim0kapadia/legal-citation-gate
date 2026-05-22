/**
 * examples/supabase-adapter.ts
 *
 * Example DataAdapter implementation backed by Supabase PostgREST.
 *
 * This file is provided as a usage reference — it is NOT part of the
 * published library bundle. Copy it into your project and adapt it to
 * your actual schema.
 *
 * Prerequisites (peer dependency):
 *   pnpm add @supabase/supabase-js
 *
 * Environment variables expected:
 *   SUPABASE_URL            https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE   service-role JWT (never the anon key for server-side)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  DataAdapter,
  EntityRow,
  EntityConfidenceRow,
  DoctrineQuoteRow,
} from "legal-citation-gate";

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createSupabaseAdapter(
  supabaseUrl: string,
  serviceRoleKey: string
): DataAdapter {
  const client: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return {
    // -----------------------------------------------------------------------
    // getEntities — fetch a specific list of entity IDs
    // -----------------------------------------------------------------------
    async getEntities(entityIds: string[]): Promise<EntityRow[]> {
      if (entityIds.length === 0) return [];

      const { data, error } = await client
        .from("entities")
        .select("entity_id, entity_type, display_name, primary_citation")
        .in("entity_id", entityIds);

      if (error) throw new Error(`getEntities: ${error.message}`);
      return (data ?? []) as EntityRow[];
    },

    // -----------------------------------------------------------------------
    // getTopCitedEntities — fallback when no charge-specific list exists
    // -----------------------------------------------------------------------
    async getTopCitedEntities(opts: {
      limit: number;
      entityType?: string;
    }): Promise<EntityRow[]> {
      let query = client
        .from("v_top_cited_entities")
        .select("entity_id, entity_type, display_name, primary_citation")
        .limit(opts.limit);

      if (opts.entityType !== undefined) {
        query = query.eq("entity_type", opts.entityType);
      }

      const { data, error } = await query;
      if (error) throw new Error(`getTopCitedEntities: ${error.message}`);
      return (data ?? []) as EntityRow[];
    },

    // -----------------------------------------------------------------------
    // getChargeEntities — entities mapped to a specific charge type
    // -----------------------------------------------------------------------
    async getChargeEntities(chargeId: string): Promise<EntityRow[]> {
      const { data, error } = await client
        .from("charge_entity_map")
        .select(
          "entities!inner(entity_id, entity_type, display_name, primary_citation)"
        )
        .eq("charge_id", chargeId)
        .order("rank", { ascending: true });

      if (error) throw new Error(`getChargeEntities: ${error.message}`);

      // Unwrap the nested join shape
      return (data ?? []).flatMap(
        (row) => (row as unknown as { entities: EntityRow }).entities
      );
    },

    // -----------------------------------------------------------------------
    // getEntityConfidence — confidence tier rows for the whitelist
    // -----------------------------------------------------------------------
    async getEntityConfidence(
      entityIds: string[]
    ): Promise<EntityConfidenceRow[]> {
      if (entityIds.length === 0) return [];

      const { data, error } = await client
        .from("v_entity_confidence")
        .select("entity_id, confidence_level")
        .in("entity_id", entityIds);

      if (error) throw new Error(`getEntityConfidence: ${error.message}`);
      return (data ?? []) as EntityConfidenceRow[];
    },

    // -----------------------------------------------------------------------
    // getDoctrineQuotes — pull-quote rows for doctrine entities
    // -----------------------------------------------------------------------
    async getDoctrineQuotes(entityIds: string[]): Promise<DoctrineQuoteRow[]> {
      if (entityIds.length === 0) return [];

      const { data, error } = await client
        .from("doctrine_quotes")
        .select("entity_id, quote_text, attribution")
        .in("entity_id", entityIds);

      if (error) throw new Error(`getDoctrineQuotes: ${error.message}`);
      return (data ?? []) as DoctrineQuoteRow[];
    },
  };
}

// ---------------------------------------------------------------------------
// Usage example
// ---------------------------------------------------------------------------

/*
import {
  buildEntityWhitelist,
  stripInvalidCiteTags,
  transformCiteTags,
} from "legal-citation-gate";
import type { EntityConfidenceMap, DoctrineQuotesMap } from "legal-citation-gate";

const adapter = createSupabaseAdapter(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

// 1. Build the whitelist (run once per report generation, before the LLM call
//    if you inject entity context into the prompt, OR just after if you gate
//    the LLM output).
const whitelist = await buildEntityWhitelist(adapter, {
  chargeId: "dui-felony",  // optional
  topCitedLimit: 50,
});

// 2. LLM emits HTML with <cite data-entity-id="…"> tags.
const llmHtml = `... <cite data-entity-id="miranda-v-arizona" data-entity-type="case">Miranda</cite> ...`;

// 3. Hard gate — strip any cite tags whose entity IDs aren't in the whitelist.
const sanitizedHtml = stripInvalidCiteTags(llmHtml, whitelist.validIds);

// 4. Load confidence + doctrine quote data for the surviving entities.
const confRows = await adapter.getEntityConfidence(whitelist.entityIds);
const confMap: EntityConfidenceMap = new Map(
  confRows.map((r) => [r.entity_id, r])
);

const doctrineIds = whitelist.entityIds.filter(
  (id) => whitelist.entityMap.get(id)?.entity_type === "doctrine"
);
const quoteRows = await adapter.getDoctrineQuotes(doctrineIds);
const quotesMap: DoctrineQuotesMap = new Map(
  quoteRows.map((r) => [r.entity_id, r])
);

// 5. Render confidence badges + doctrine asides.
const finalHtml = transformCiteTags(sanitizedHtml, confMap, quotesMap);

// 6. Optionally, sanitize with the bundled sanitize-html config.
import sanitizeHtml from "sanitize-html";
import { reportSanitizeOptions } from "legal-citation-gate";
const safeHtml = sanitizeHtml(finalHtml, reportSanitizeOptions);
*/
