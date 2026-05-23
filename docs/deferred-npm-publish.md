# Deferred: npm publish

**Status:** Deferred 2026-05-22. Phase 5 acceptance gate #1 ("Library published to npm") is intentionally not satisfied at v0.1.5 release.

## Why deferred

The maintainer (`rahim0kapadia`) does not currently hold an npm account. Publishing the first version of an unscoped package via CI/CD without one is not supported by npm in 2026:

- Classic auth tokens are revoked as of December 2025.
- Granular Access Tokens cannot be scoped to a package name that does not yet exist on the registry (per [npm community discussion #182672](https://github.com/orgs/community/discussions/182672)).
- Trusted Publishing (OIDC) requires the package to exist before configuration (per [npm docs — Trusted Publishers](https://docs.npmjs.com/trusted-publishers/)).
- The canonical first-publish path requires an interactive `npm login` + `npm publish --access public` session from a logged-in maintainer machine.

Rather than block the v0.1.5 release on the chicken-and-egg, we ship GitHub-only and document the deferred publish as a tracked task.

## Cascade mapping (Cascade Rule, atlas-identity.md)

- **Us:** Ship Phase 5 today with no cost. The library is fully functional, license is enforceable, INAA can consume it. No npm account creation friction blocks the broader expansion.
- **Direct counterparty (legal-tech vendor adopting the library):** Still gets the library, AGPL3 terms, COMMERCIAL-LICENSE option, security audit. Install path is one extra word (`github:` prefix); functionality identical. The deferral does not raise their adoption cost meaningfully.
- **Downstream (defendants whose vendors use this library):** Same — citation-validator quality is unchanged. No user-visible difference from npm vs GitHub source.
- **Ecosystem (legal-tech industry floor):** Library is public and AGPL3 from day one. Discovery is slightly narrower (no npm search) but the GitHub repo is indexed by Google, GitHub Search, and aggregators like libraries.io. The industry-floor lift goal still operates.
- **Future-us:** Closing this deferred gate is a 10-minute task whenever the maintainer decides to claim an npm presence. No code change required in adopters when the switch happens — `import` shapes are stable. The deferred task is itself a feature: it forces the npm-account decision to be intentional rather than reactive.

No node loses. The deferral is cascade-positive vs the alternative of either (a) blocking Phase 5 ship on operator-time-to-create-npm-account or (b) paying the cost of running a sub-optimal release to satisfy a paper gate.

## Impact on the Phase 5 acceptance gates

| Gate | Status |
|---|---|
| 1. Library published to npm | **DEFERRED** (this document) |
| 2. INAA + BR consuming the library | Met — INAA consumes via `github:` dep (see T14 swap-in PR). BR consumption deferred per Phase 5 plan § 0. |
| 3. Zero INAA regressions after swap-in | Met — snapshot diff verification (T15). |
| 4. Security-auditor clean | Met — T13 audit shipped, 0 CRITICAL. |
| 5. SECURITY.md + LICENSE in repo | Met. |
| 6. Quality-gate clean | Met. |
| 7. LICENSE byte-equal canonical FSF AGPL3 | Met — SHA256 0D96A4FF68AD6D4B6F1F30F713B18D5184912BA8DD389F86AA7710DB079ABCB0. |
| 8. COMMERCIAL-LICENSE.md published | Met (draft pending counsel review). |
| 9. README "Why AGPL3" with three adopter paths | Met. |
| 10. INAA network-use AGPL3-compatible (legal review) | Met — Rahim sign-off via runbook Checkpoint A. |
| 11. Cross-portfolio coordination notified | Met — T17. |

**One gate deferred; ten met.** Per `atlas-identity.md` § Pristine-Or-Nothing, gate-deferral with documented justification + tracked task is the legitimate exception. This is that documentation.

## Path to closing the deferred gate

When the maintainer is ready to create an npm account:

1. Create npm account at https://www.npmjs.com/signup (free; ~2 minutes).
2. Run `npm login` from the maintainer's machine. Stores auth token in `~/.npmrc`.
3. From the repo root:
   ```bash
   cd C:\Users\email\projects\legal-citation-gate
   pnpm install
   pnpm run build
   npm publish --access public
   ```
4. Configure Trusted Publishing on the npmjs.com package page so subsequent versions publish from GHA via OIDC:
   - https://www.npmjs.com/package/legal-citation-gate/access (after first publish)
   - Add GitHub Actions trusted publisher: repo `rahim0kapadia/legal-citation-gate`, workflow `publish.yml`, allow `npm publish`.
5. Restore the `publish.yml` workflow that was removed at v0.1.5 (it had the OIDC `id-token: write` permission + `npm publish --access public` shape; only the auth path needs to swap from NPM_TOKEN to OIDC). The git history at commit `80a6b8c` is a reference.
6. Update README to remove the "Install" GitHub-dep section in favor of the standard `pnpm add legal-citation-gate`.
7. Tag + release v0.2.0 to fire the now-OIDC publish workflow.

No code changes are required in INAA when this swap happens — `import` shapes are identical. The `github:` URL dep simply becomes a SemVer dep.

## Why this is recoverable

The library is fully functional today via GitHub. Adopters (including INAA itself) install via `github:` syntax. AGPL3 license is enforceable from the GitHub source tree just as it would be from an npm tarball. The Phase 5 industry-floor-lift cascade still operates — anyone who finds the library can adopt + contribute back, with or without npm in the loop.

## Tracking

- **Owner:** maintainer (rahim0kapadia)
- **Trigger to close:** maintainer decides to claim an npm presence (no fixed deadline)
- **Effort:** ~10 minutes total when triggered
