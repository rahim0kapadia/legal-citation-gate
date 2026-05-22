# Commercial License — `legal-citation-gate`

> **DRAFT — awaiting legal review (Rahim Checkpoint A).** This document is the in-flight draft of the dual-license offering. Pricing, contact, choice-of-law, and warranty language all carry placeholders that require Rahim sign-off (with or without outside counsel review) before the library publishes to npm. **Do not treat anything in this document as a binding offer until the DRAFT banner is removed.**

## 1. Why a dual license

`legal-citation-gate` is published under [AGPL-3.0-or-later](./LICENSE) by default. AGPL3 is a deliberate cascade choice — bug fixes and corpus-shape improvements that adopters make have to flow back to the community, which raises the floor for AI-output validation in legal-tech across every adopter, which ultimately serves criminal defendants and self-represented litigants better than a permissive license would.

That choice creates a real friction for one class of adopter: a SaaS vendor (or any party offering the library's functionality over a network) who modifies the library and cannot or will not publish their modified source under AGPL3's §13 "Remote Network Interaction" clause. For those adopters, an honest path forward exists: a **commercial license** that grants the same rights AGPL3 grants, without the network-use source-disclosure obligation.

This document is the offer.

## 2. Who needs the commercial license

You probably need a commercial license if any of these apply:

- You run a closed-source SaaS product that exposes this library's functionality (entity-whitelist validation, cite-tag transform, badge rendering) over a network to your customers, and your legal posture cannot accommodate AGPL3 §13's source-disclosure trigger.
- You distribute a closed-source binary or proprietary application that statically or dynamically links `legal-citation-gate` and cannot ship under AGPL3.
- Your enterprise procurement requires a per-vendor commercial license agreement and "AGPL3 from npm" is not procurement-acceptable.

You probably do **not** need a commercial license if any of these apply:

- You are an individual developer, open-source project, academic researcher, or non-profit using the library for non-commercial purposes — AGPL3 is fine.
- You are willing to publish your modified source under AGPL3 — AGPL3 is fine, and ideally we'd love a contribution back.
- You are using the library's **schema and adapter interface only** (the `DataAdapter` shape, the `EntityConfidenceRow` type, the `schema/v_entity_confidence.sample.sql` reference matview) without copying the library's code. Documented interfaces are specifications, not derivative-work triggers; you are free to implement them however you like.
- You are using the library as an **unmodified npm dependency** in a network-exposed application without modifying it. See § 7 (AGPL3 §13 compatibility) for the analysis.

If you are unsure which side of the line you fall on, please reach out — see § 4.

## 3. What the commercial license grants

When fully executed (per Rahim sign-off), the commercial license will grant:

- A **perpetual, worldwide, non-exclusive** right to use, modify, and distribute the library and derivative works under the licensee's preferred terms (including closed-source distribution and network use without AGPL3 §13 source-disclosure).
- The right to receive **patch releases and security advisories** during the active license term.
- Optionally (negotiated per-license): right of first refusal on bespoke adapter implementations, escalation-window for security disclosures, named credit in the `LICENSED-COMMERCIALLY.md` ledger (or anonymous, at licensee's option).

The commercial license does **not** grant:

- Trademark rights (the project name, logo, or any "ImNotAnAttorney" / "INAA" / publisher marks).
- Patent grants beyond what AGPL3 itself extends — the library's copyright is the scope.
- Warranty (see § 6).

## 4. How to inquire

To inquire about a commercial license, contact:

- **Email:** `licensing@<TBD-secondary-domain>` *(placeholder — Rahim sets at first publish; will NOT be a primary brand domain per `~/.claude/rules/never-cold-email-from-primary-domain.md`. Inbound inquiry to a secondary domain is reputation-safe; outbound replies will use the same domain.)*
- **GitHub:** once the repo is public, open a **Discussion** under the `licensing` category. This is for inquiry routing only — actual license terms are negotiated by email, not in public threads.

Please include in your inquiry:

1. Your name, organization, and a short description of the product or service that will use the library.
2. Approximate scale of use (per-customer-year, per-deployment, per-deployment-instance — these inform the pricing tier).
3. Whether you plan to modify the library or use it as a stock dependency. (Stock-dependency adopters may be able to stay on AGPL3 free — see § 7.)
4. Your preferred choice-of-law jurisdiction (relevant for the final agreement).

We will acknowledge inquiry within **5 business days** and aim to return a first-pass term sheet within **10 business days**.

## 5. Pricing — TBD

Pricing is **TBD** and will be set by Rahim before the first commercial license closes. The current draft posture (subject to revision):

- A **flat per-organization annual fee** structured in tiers based on adopter scale.
- A **free-for-individuals carve-out**: any single named developer using the library in a personal commercial project below a TBD revenue threshold pays $0. The point is to keep the indie-tier alive while keeping the enterprise path commercially viable.
- A **non-profit tier**: 501(c)(3) and equivalent public-defender organizations get the commercial license at a nominal fee or pro-bono, at the publisher's discretion. The cascade rationale: defender-side adoption raises the floor that this library exists to lift, so making it accessible to defenders is consistent with the AGPL3 choice in the first place.
- A **review-annually clause** (§ 9): pricing reviewable annually to track adoption volume and market reality.

Once finalized, the pricing table will be published in this document, replacing this § 5.

## 6. Warranty and liability disclaimer

> **`legal-citation-gate` IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND**, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE LIBRARY OR THE USE OR OTHER DEALINGS IN THE LIBRARY.

This disclaimer applies equally under AGPL3 and under any commercial license issued from this offer. Adopters using the library in legal-tech, criminal-defense, or other safety-critical contexts must perform their own validation, testing, and legal review before relying on the library's output in production.

## 7. AGPL3 §13 compatibility — when you do NOT need this commercial license

The most common question this offer raises is: *"My SaaS product imports `legal-citation-gate` as an npm dependency. Do I need a commercial license?"* The honest, non-lawyerly answer:

- AGPL3 §13's trigger is offering a **modified version of the Program** over a network.
- Importing an unmodified AGPL3 library as an npm dependency and using it through its documented public API is the same legal posture as using any AGPL3 library (e.g., MariaDB, Ghostscript) from a closed-source application: source-disclosure attaches to the **library**, which is already public, not to the consuming application.
- Implementing the documented `DataAdapter` interface in your own code is **integration**, not **modification** — the same way implementing a JDBC driver for a closed-source database against the AGPL3-licensed JDBC interface is integration, not modification. Adapter implementations are not derivative works of the library.
- The grey-zone case is if you **fork the library, modify its internals, and ship that fork in a network-exposed product**. That is the case where AGPL3 §13 triggers, and that is the case the commercial license exists for.

**Practical guidance:** if you are using the library as a stock npm dependency and supplying your own adapter, you very likely do not need the commercial license. If you are forking the library and modifying it, you very likely do. If you fall in between or want certainty for procurement/audit purposes, open an inquiry (§ 4) — we are happy to confirm in writing for your specific use case.

**Residual risk and honest disclosure:** lawyers vary, AGPL3 §13 has limited case-law clarity, and a future precedent could expand the trigger. Some adopters will prefer the commercial license simply for the procurement-audit certainty it provides, even when § 7's analysis says AGPL3 alone would suffice. That is a legitimate reason to license, and we treat those licensees the same as any other.

## 8. Choice of law

Choice of law for the commercial license agreement is **TBD** and will be set with Rahim before the first license closes. Likely candidates: US (a publisher-friendly state — Delaware, Texas, or California), or the licensee's home jurisdiction if mutually negotiated. The final license agreement will name the chosen jurisdiction explicitly.

## 9. Annual review and sunset clause

This commercial license offer is **reviewable annually**. Pricing, scope, exclusions, and the underlying dual-license posture will be re-examined each year against:

- Adoption volume of the AGPL3 library.
- Adoption volume of the commercial license.
- Material changes in AGPL3 case-law interpretation.
- Material changes in INAA's broader project posture (the upstream consumer of the library).

Existing commercial licensees are protected: any term changes apply to **new** licenses or **renewals** only, not to in-force agreements until their renewal date.

If the publisher discontinues the commercial license offer entirely (e.g., relicenses the library to MIT or releases it into the public domain), in-force commercial licenses convert to a perpetual irrevocable grant under their existing terms; licensees are not stranded.

## 10. Contributions

Contributions to the library (PRs, security disclosures, adapter implementations, schema improvements) remain under AGPL3 and are gratefully accepted under standard CLA terms (TBD — likely the DCO sign-off model or a lightweight contributor-license-agreement; Rahim sets at first PR).

Commercial licensees are **encouraged but not required** to contribute back. The commercial license does not impose a contribution obligation — the whole point of the commercial path is that you can keep your modifications private if you need to.

---

## Document status

| Field | Value |
|---|---|
| Document version | DRAFT (pre-Rahim-checkpoint-A) |
| Last edit | 2026-05-22 (Phase 5 Wave A T3) |
| Authored by | Phase 5 Wave A automation (Opus tier per `agent-tier-by-role.md`) |
| Pending review | Rahim Checkpoint A — `docs/plans/2026-05-22-mike-phase5-citation-validator-tactical.md` § 9 Checkpoint A |
| Pending placeholders | § 4 contact email (`licensing@<TBD-secondary-domain>`), § 5 pricing tiers, § 8 choice-of-law, § 10 CLA model |
| Publish gate | Pre-publish — Rahim must remove the DRAFT banner before this document is treated as a binding offer |
