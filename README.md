# legal-citation-gate

Citation-validator infrastructure for legal-tech reports — the layer that decides which `<cite data-entity-id>` tags survive sanitization, which ones get rendered as confidence-tier badges, and which ones get stripped because the cited entity is not in the whitelist.

> **Status: 0.0.1 — extraction in progress. NOT YET RELEASED on npm.**
>
> This repository is the in-flight extraction of the citation-validator pipeline from ImNotAnAttorney's production report generator (PR #56 + descendants) into a standalone library. The first npm release is gated on (a) source extraction (Wave B), (b) test suite pass, (c) `security-auditor` clean, and (d) Rahim legal-review checkpoint A (AGPL3 dual-license sign-off). See the tactical plan at `docs/plans/2026-05-22-mike-phase5-citation-validator-tactical.md` in the upstream consumer repo.

## What it does

When a generative-AI pipeline emits a legal report, it tends to invent citations. The citation-validator pipeline is the gate that keeps invented citations out of the rendered output:

1. **`buildEntityWhitelist(adapter, inputs)`** — assembles the set of valid `(entity_type, entity_id)` pairs for a given report, pulling charge-specific cases, top-cited cases, statutes, and other corpus entities through a swappable `DataAdapter` interface.
2. **`stripInvalidCiteTags(html, whitelist)`** — post-generation hard gate. Rewrites or strips `<cite data-entity-id>` tags whose IDs are not in the whitelist. Survives `sanitize-html` because the sanitize config in this package explicitly whitelists the `data-entity-*` attribute family.
3. **`transformCiteTags(html, confidenceMap)`** — render-time transform. Replaces survived `<cite>` tags with confidence-tier badges (platinum / gold / verified / high / medium / standard) so the reader sees which citations carry which weight.
4. **`reportSanitizeOptions`** — frozen `sanitize-html` config that keeps `<cite data-entity-type data-entity-id>` survival as a documented invariant.

The library is **adapter-based**: it does not depend on Supabase, Postgres, or any specific data source. You supply a `DataAdapter` implementation, the library does the validation logic. Reference adapters for Supabase + static-file backends live under `examples/`.

## Why AGPL3 (and the commercial license)

This library is **AGPL-3.0-or-later**. That is a deliberate choice, not an accident. Two reasons:

1. **Industry-floor lift.** Legal-tech vendors building AI-output validators all face the same problem this library solves. AGPL3 means every adopter improves the floor — bug fixes and corpus-shape improvements have to flow back. That serves criminal defendants (the eventual end-users) better than a permissive license would.
2. **Network-use transparency.** AGPL3 §13 means a SaaS adopter that modifies the library and exposes its functionality over a network must publish their source. For legal-tech, that's a feature: defendants relying on AI-validated citations deserve to know which validator their vendor is running.

**If AGPL3's network-use clause is a blocker for your use case**, three paths exist:

- **Adopt the commercial license** — see [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md). Dual-license offering for vendors who cannot ship under AGPL3.
- **Adopt the schema + adapter interface only** — the `DataAdapter` shape, the `EntityConfidenceRow` type, and the `schema/v_entity_confidence.sample.sql` reference matview are documented specifications. Implement them against your own code; that integration is not a derivative work.
- **Rebuild internally** — the design is documented end-to-end in this README and the upstream tactical plan. Bootstrap your own implementation.

Prior art that informed this choice: Will Chen's Mike project (https://github.com/willchen/mike) — same shape, same license.

## Cited contributors

This library is the open-source extraction of work first shipped in production by **ImNotAnAttorney** (https://imnotanattorney.com), a defendant-empowerment platform for criminal cases. The Phase 2 cite-tag system (entity-whitelist + post-generation strip + confidence-tier badges) has been in production at INAA since 2026-04-22. This package is the lift of that work into a vendor-neutral surface so other legal-tech projects can adopt it instead of rebuilding it.

Per the Cascade Rule: industry-floor lifts compound across the ecosystem. Every adopter who consumes this library raises the bar for AI-output validation in legal-tech, which ultimately serves the defendants and self-represented litigants those tools are built for.

## Installation

```bash
# Once published — NOT YET LIVE
npm install legal-citation-gate
```

## Usage (preview — API is the planned 0.1.0 surface)

```typescript
import {
  buildEntityWhitelist,
  stripInvalidCiteTags,
  transformCiteTags,
  reportSanitizeOptions,
  type DataAdapter,
} from "legal-citation-gate";

const adapter: DataAdapter = /* your implementation */;

const whitelist = await buildEntityWhitelist(adapter, {
  charges: ["DUI", "Reckless Driving"],
  jurisdiction: "FL",
  maxCases: 50,
  maxStatutes: 20,
});

// After LLM emits report HTML with <cite data-entity-id="..."> tags
const validatedHtml = stripInvalidCiteTags(rawHtml, whitelist);

// Optional: render confidence-tier badges
const confidenceMap = await adapter.getEntityConfidence([...whitelist.entityIds]);
const finalHtml = transformCiteTags(validatedHtml, new Map(confidenceMap.map(r => [r.entity_id, r])));
```

See `examples/` for full reference adapters (Supabase + static JSON file).

## Status (current Wave)

| Wave | Status |
|---|---|
| A — Repo scaffold + LICENSE + COMMERCIAL-LICENSE draft | IN PROGRESS |
| B — Source extraction (`entity-whitelist`, `cite-tag-transform`, `badge-transform`, `sanitize-config`) | NOT STARTED |
| C — Test suite port + mock adapter | NOT STARTED |
| D — Schema docs + reference adapters | NOT STARTED |
| E — CI + security-auditor pass | NOT STARTED |
| F — Rahim legal-review checkpoint A | NOT STARTED |
| G — npm publish (v0.1.0) | NOT STARTED |

The first published version on npm will be `0.1.0`. The `0.0.x` series in this repo represents pre-publish scaffold milestones only.

## Contributing

The project is in pre-publish extraction. Issue reports, design feedback, and adapter-interface critique are welcome via GitHub Issues once the repo is public. PRs will open after the first published release lands and a CONTRIBUTING.md is in place.

## Security

See [`SECURITY.md`](./SECURITY.md) for the disclosure policy. In short: please report vulnerabilities privately via the security contact listed there, not via public issues.

## License

[AGPL-3.0-or-later](./LICENSE) — see also [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md) for the dual-license offering.
