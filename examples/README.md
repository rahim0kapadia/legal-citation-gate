# Examples

This directory contains reference implementations of the `DataAdapter` interface
and end-to-end usage walkthroughs.

## Files

| File | Purpose |
|------|---------|
| `supabase-adapter.ts` | Full `DataAdapter` backed by Supabase PostgREST (the production pattern) |
| `json-file-adapter.ts` | `DataAdapter` backed by local JSON files (CI, SSG, demos) |

These files are **not part of the published bundle**. Copy the one that fits
your stack into your project and adapt it to your schema.

## Quick Start

```typescript
import {
  buildEntityWhitelist,
  stripInvalidCiteTags,
  transformCiteTags,
  reportSanitizeOptions,
} from "legal-citation-gate";
import type { EntityConfidenceMap, DoctrineQuotesMap } from "legal-citation-gate";
import sanitizeHtml from "sanitize-html";

// 1. Bring your own adapter (see supabase-adapter.ts or json-file-adapter.ts)
const adapter = createYourAdapter(...);

// 2. Build entity whitelist (before or after LLM call)
const whitelist = await buildEntityWhitelist(adapter, {
  chargeId: "dui-felony",   // optional — enables charge-specific path
  topCitedLimit: 50,        // fallback when no chargeId or it returns nothing
});

// 3. LLM emits HTML with <cite data-entity-id="…" data-entity-type="…"> tags
const llmHtml = getLlmOutput();

// 4. Hard gate — strips any cite whose entity_id is not whitelisted
const gatedHtml = stripInvalidCiteTags(llmHtml, whitelist.validIds);

// 5. Load confidence + doctrine data for surviving entities
const confRows = await adapter.getEntityConfidence(whitelist.entityIds);
const confMap: EntityConfidenceMap = new Map(confRows.map((r) => [r.entity_id, r]));

const doctrineIds = whitelist.entityIds.filter(
  (id) => whitelist.entityMap.get(id)?.entity_type === "doctrine"
);
const quoteRows = await adapter.getDoctrineQuotes(doctrineIds);
const quotesMap: DoctrineQuotesMap = new Map(quoteRows.map((r) => [r.entity_id, r]));

// 6. Render confidence badges + pull-quote asides (synchronous)
const badgedHtml = transformCiteTags(gatedHtml, confMap, quotesMap);

// 7. Sanitize with the bundled safe config (strips injected attrs/scripts)
const finalHtml = sanitizeHtml(badgedHtml, reportSanitizeOptions);
```

## Pipeline Summary

```
LLM output
    │
    ▼
stripInvalidCiteTags(html, whitelist.validIds)
    │  removes cite tags whose entity_id is not in whitelist
    ▼
transformCiteTags(html, confMap, quotesMap)
    │  replaces <cite> with confidence-tier badge spans + doctrine asides
    ▼
sanitizeHtml(html, reportSanitizeOptions)   ← optional but recommended
    │  strips any remaining unsafe attributes
    ▼
Safe HTML ready to store / render
```

## Confidence Tier Mapping

| DB level | UI tier | Tailwind classes |
|----------|---------|-----------------|
| `platinum`, `gold` | `top-tier` | `bg-gradient-to-r from-amber-800/40 to-yellow-700/40 text-yellow-100 border-yellow-400` |
| `verified`, `high` | `cross-verified` | `bg-amber-900/40 text-amber-200 border-amber-600` |
| `medium`, `standard` (default) | `basic` | `bg-zinc-800 text-zinc-400 border-zinc-700` |

## License

Usage of this library is subject to AGPL-3.0-or-later for open-source projects.
For commercial use in closed-source software, see `COMMERCIAL-LICENSE.md`.
