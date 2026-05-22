# Schema Reference

This directory contains DDL samples showing the minimal table/view shapes
that `legal-citation-gate` expects from your data source.

**The library ships with zero database runtime dependencies.** All data access
goes through the `DataAdapter` interface in `src/adapter.ts`. These samples
show ONE possible relational schema you might implement your adapter against.

## Files

| File | Purpose |
|------|---------|
| `v_entity_confidence.sample.sql` | Full DDL for `entities`, `entity_confidence_scores`, `v_entity_confidence` view, `doctrine_quotes`, and `charge_entity_map` with sample data |

## Required Adapter Methods

| Method | Returns | Used By |
|--------|---------|---------|
| `getEntities(entityIds)` | `EntityRow[]` | `buildEntityWhitelist` |
| `getTopCitedEntities(opts)` | `EntityRow[]` | `buildEntityWhitelist` fallback path |
| `getChargeEntities(chargeId)` | `EntityRow[]` | `buildEntityWhitelist` charge path |
| `getEntityConfidence(entityIds)` | `EntityConfidenceRow[]` | `transformCiteTags` |
| `getDoctrineQuotes(entityIds)` | `DoctrineQuoteRow[]` | `transformCiteTags` |

## Confidence Levels

| DB value | UI tier | Badge style |
|----------|---------|-------------|
| `platinum` | `top-tier` | Gold/amber gradient |
| `gold` | `top-tier` | Gold/amber gradient |
| `verified` | `cross-verified` | Amber |
| `high` | `cross-verified` | Amber |
| `medium` | `basic` | Zinc |
| `standard` | `basic` | Zinc |
| (missing) | `basic` | Zinc |

## Supabase Example

See `examples/supabase-adapter.ts` for a full Supabase PostgREST implementation
of the `DataAdapter` interface.

## Adapting to Other Databases

You can implement `DataAdapter` against any data source — Postgres, SQLite,
a JSON file, a REST API. The library never calls the adapter directly;
you pre-load data and pass maps/sets into the pure transform functions.
