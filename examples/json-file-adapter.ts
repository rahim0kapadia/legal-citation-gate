/**
 * examples/json-file-adapter.ts
 *
 * Example DataAdapter implementation backed by local JSON files.
 *
 * Useful for:
 *   - Tests and CI pipelines where no database is available
 *   - Static-site generation where entity data is committed to the repo
 *   - Demos and prototypes
 *
 * This file is provided as a usage reference — it is NOT part of the
 * published library bundle. Copy it into your project and adapt it.
 *
 * Expected JSON file shapes:
 *
 *   entities.json        — EntityRow[]
 *   confidence.json      — EntityConfidenceRow[]
 *   doctrine_quotes.json — DoctrineQuoteRow[]
 *   charge_map.json      — Record<string, string[]>   (chargeId → entityId[])
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  DataAdapter,
  EntityRow,
  EntityConfidenceRow,
  DoctrineQuoteRow,
} from "legal-citation-gate";

// ---------------------------------------------------------------------------
// Types for the JSON fixture files
// ---------------------------------------------------------------------------

interface ChargeMap {
  [chargeId: string]: string[];
}

// ---------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------

export function createJsonFileAdapter(dataDir: string): DataAdapter {
  // Load all JSON data once at construction time.
  function load<T>(filename: string): T {
    const fullPath = resolve(dataDir, filename);
    return JSON.parse(readFileSync(fullPath, "utf8")) as T;
  }

  const entities = load<EntityRow[]>("entities.json");
  const confidence = load<EntityConfidenceRow[]>("confidence.json");
  const doctrineQuotes = load<DoctrineQuoteRow[]>("doctrine_quotes.json");
  const chargeMap = load<ChargeMap>("charge_map.json");

  // Index for fast lookup
  const entityIndex = new Map(entities.map((e) => [e.entity_id, e]));
  const confidenceIndex = new Map(
    confidence.map((c) => [c.entity_id, c])
  );
  const quoteIndex = new Map(
    doctrineQuotes.map((q) => [q.entity_id, q])
  );

  return {
    async getEntities(entityIds: string[]): Promise<EntityRow[]> {
      return entityIds
        .map((id) => entityIndex.get(id))
        .filter((e): e is EntityRow => e !== undefined);
    },

    async getTopCitedEntities(opts: {
      limit: number;
      entityType?: string;
    }): Promise<EntityRow[]> {
      let filtered = entities;
      if (opts.entityType !== undefined) {
        filtered = entities.filter((e) => e.entity_type === opts.entityType);
      }
      return filtered.slice(0, opts.limit);
    },

    async getChargeEntities(chargeId: string): Promise<EntityRow[]> {
      const ids = chargeMap[chargeId] ?? [];
      return ids
        .map((id) => entityIndex.get(id))
        .filter((e): e is EntityRow => e !== undefined);
    },

    async getEntityConfidence(
      entityIds: string[]
    ): Promise<EntityConfidenceRow[]> {
      return entityIds
        .map((id) => confidenceIndex.get(id))
        .filter((c): c is EntityConfidenceRow => c !== undefined);
    },

    async getDoctrineQuotes(entityIds: string[]): Promise<DoctrineQuoteRow[]> {
      return entityIds
        .map((id) => quoteIndex.get(id))
        .filter((q): q is DoctrineQuoteRow => q !== undefined);
    },
  };
}

// ---------------------------------------------------------------------------
// Sample JSON file content
// ---------------------------------------------------------------------------

/*
// entities.json
[
  { "entity_id": "miranda-v-arizona",  "entity_type": "case",     "display_name": "Miranda v. Arizona",   "primary_citation": "384 U.S. 436 (1966)" },
  { "entity_id": "4th-amendment",      "entity_type": "doctrine", "display_name": "Fourth Amendment",     "primary_citation": null },
  { "entity_id": "exclusionary-rule",  "entity_type": "doctrine", "display_name": "Exclusionary Rule",    "primary_citation": null },
  { "entity_id": "18-usc-922",         "entity_type": "statute",  "display_name": "18 U.S.C. § 922",      "primary_citation": null }
]

// confidence.json
[
  { "entity_id": "miranda-v-arizona",  "confidence_level": "platinum" },
  { "entity_id": "4th-amendment",      "confidence_level": "gold"     },
  { "entity_id": "exclusionary-rule",  "confidence_level": "high"     },
  { "entity_id": "18-usc-922",         "confidence_level": "medium"   }
]

// doctrine_quotes.json
[
  {
    "entity_id": "4th-amendment",
    "quote_text": "The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated.",
    "attribution": "U.S. Const. amend. IV"
  },
  {
    "entity_id": "exclusionary-rule",
    "quote_text": "Evidence obtained by police using methods that violate a defendant's constitutional rights is generally inadmissible in criminal prosecutions.",
    "attribution": null
  }
]

// charge_map.json
{
  "dui-felony": ["miranda-v-arizona", "4th-amendment", "exclusionary-rule"],
  "drug-possession": ["4th-amendment", "exclusionary-rule", "18-usc-922"]
}
*/
