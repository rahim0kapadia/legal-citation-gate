# legal-citation-gate

Citation-validator infrastructure for legal-tech reports — the layer that decides which `<cite data-entity-id>` tags survive sanitization, which ones get rendered as confidence-tier badges, and which ones get stripped because the cited entity is not in the whitelist.

> **Status: v0.1.5 — released via GitHub. npm publish deferred (see [`docs/deferred-npm-publish.md`](./docs/deferred-npm-publish.md)).**
>
> This is the public release of the citation-validator pipeline extracted from ImNotAnAttorney's production report generator (PR #56 + descendants). Wave A + Wave B shipped 2026-05-22, security-audited (T13) clean — 0 CRITICAL findings, 2 doc-only WARNINGs documented in [`SECURITY.md`](./SECURITY.md) as caller responsibilities. Distribution is currently GitHub-only; npm publish will follow when the maintainer creates an npm account.

## Install

Because this library is not yet on npm, install it directly from GitHub. Pin to a tag for reproducibility:

```bash
# pnpm
pnpm add github:rahim0kapadia/legal-citation-gate#v0.1.5

# npm
npm install github:rahim0kapadia/legal-citation-gate#v0.1.5

# yarn
yarn add github:rahim0kapadia/legal-citation-gate#v0.1.5
```

This clones the repo into your `node_modules` and runs the `prepublishOnly` hook (`tsc`) to build `dist/`. The same `import` shapes work as if it were an npm dependency:

```typescript
import { buildEntityWhitelist, stripInvalidCiteTags, transformCiteTags, reportSanitizeOptions } from 'legal-citation-gate';
import type { DataAdapter, EntityConfidenceRow, UITier } from 'legal-citation-gate';
```

Once this library is published to npm, the install command drops the `github:` prefix and the version pin moves to standard SemVer (`^0.1.5`). No code change required on the consumer side.

## What it does

When a generative-AI pipeline emits a legal report, it tends to invent citations. The citation-validator pipeline is the gate that keeps invented citations out of the rendered output:

1. **`buildEntityWhitelist(adapter, inputs)`** — assembles the set of valid `(entity_type, entity_id)` pairs for a given report, pulling charge-specific cases, top-cited cases, statutes, and other corpus entities through a swappable `DataAdapter` interface.
2. **`stripInvalidCiteTags(html, whitelist)`** — post-generation hard gate. Rewrites or strips `<cite data-entity-id>` tags whose IDs are not in the whitelist. Survives `sanitize-html` because the sanitize config in this package explicitly whitelists the `data-entity-*` attribute family.
3. **`transformCiteTags(html, confidenceMap)`** — render-time transform. Replaces survived `<cite>` tags with confidence-tier badges (platinum / gold / verified / high / medium / standard) so the reader sees which citations carry which weight.
4. **`reportSanitizeOptions`** — frozen `sanitize-html` config that keeps `<cite data-entity-type data-entity-id>` survival as a documented invariant.

The library is **adapter-based**: it does not depend on Supabase, Postgres, or any specific data source. You supply a `DataAdapter` implementation, the library does the validation logic. Reference adapters for Supabase + static-file backends live under `examples/`.

## Why AGPL3 (and the commercial license)

This library is **AGPL-3.0-or-later**. That is a deliberate choice, not an accident.

### The problem this license solves

Criminal defendants are the end-users of every report that a legal-tech AI pipeline produces. When an
AI system invents a citation — cites a case that does not exist, or misrepresents a real holding — and
the validation layer lets it through, the defendant carries the cost: wasted attorney-review time, a
collapsed motion, or worse, an unchallenged misrepresentation in court. The validation infrastructure
that keeps that from happening should be visible, auditable, and improvable by the legal-tech ecosystem
at large. AGPL3 is the license that makes that happen.

### Two specific reasons for this choice

1. **Industry-floor lift.** Every legal-tech vendor building an AI report pipeline faces the same three
   problems this library solves: (a) the LLM invents entity IDs; (b) the LLM emits valid-looking
   `<cite>` tags whose inner text does not match the cited entity; (c) the confidence metadata is buried
   in the DB and never surfaces to the reader. AGPL3 means every adopter's improvements flow back. Bug
   fixes to the whitelist-building path, new adapter shapes, confidence-band tuning, accessibility
   improvements to the badge renderer — all of it compounds into a shared floor that every legal-tech
   vendor and every defendant benefits from. A permissive license would let vendors silently diverge and
   the floor stagnates.

2. **Network-use transparency.** AGPL3 §13 closes the "hosted service" loophole. A SaaS adopter who
   modifies this library and exposes citation-validation functionality over a network must publish their
   modified source. For legal-tech, this is a feature, not a tax. Defendants relying on AI-validated
   citations deserve to know which validator their vendor is running, at which version, with which
   whitelist-building strategy. §13 makes that an obligation rather than a courtesy.

### Three paths if AGPL3's network-use clause is a blocker

- **Path A — Commercial license.** See [`COMMERCIAL-LICENSE.md`](./COMMERCIAL-LICENSE.md). A
  dual-license offering for vendors who cannot ship under AGPL3 — typically because they have a
  proprietary adapter, a custom confidence-level scheme, or a modified badge renderer they are not
  willing to open-source. The commercial license removes the §13 obligation in exchange for a
  negotiated fee.

- **Path B — Adopt the interface, not the implementation.** The `DataAdapter` interface, the
  `EntityConfidenceRow` type definition, and the `schema/v_entity_confidence.sample.sql` reference
  matview are documented specifications. Implement them yourself against your own codebase. An
  integration that only conforms to the interface is not a derivative work of this library.

- **Path C — Rebuild from the documented design.** This README, the inline code comments, and the
  upstream tactical plan document the architecture end-to-end: why the whitelist has two lookup paths
  (charge-specific + general top-cited fallback), why the confidence levels collapse to three UI tiers,
  why `stripInvalidCiteTags` runs post-generation rather than at render time. Bootstrap your own
  implementation. The library's purpose is to improve the industry floor; that goal is served whether
  you adopt, adapt, or rebuild with the knowledge.

### Prior art

Will Chen's **Mike** project (https://github.com/willchen/mike) pursued the same shape — a
defense-in-depth citation validator for AI-generated content — under AGPL3 for the same reasons. Mike
informed the choice of license and the principle of making the interface itself a separately adoptable
surface so teams who cannot use the library can still use the schema design.

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
