# Security Policy

## Status

`legal-citation-gate` is in pre-publish extraction (current version `0.0.x`, not yet on npm). Once `0.1.0` ships, this policy governs vulnerability disclosure for all released versions.

## Reporting a Vulnerability

**Do not file public GitHub issues for security vulnerabilities.** They give attackers a window between disclosure and patch.

Report security issues privately to:

- **Email:** `security@<TBD-secondary-domain>` *(placeholder — Rahim sets at first publish; will NOT be a primary brand domain per the project's domain-isolation rule)*
- **GitHub Security Advisories:** once the repo is public, use the "Report a vulnerability" workflow under the **Security** tab — this opens a private advisory thread.

When reporting, please include:

1. The affected version (or `master` commit SHA).
2. A description of the issue and its impact.
3. Steps to reproduce (proof-of-concept code or a minimal failing test is ideal).
4. Any suggested fix, if you have one.

We will acknowledge receipt within **3 business days** and aim to confirm or reject the report within **10 business days**.

## Disclosure Window

We follow a **90-day private disclosure window** by default:

- Day 0: report received, acknowledged.
- Day 0-30: triage, root-cause, patch authored, advisory drafted.
- Day 30-60: patch reviewed, tested, merged to `master`, new patch release published, advisory published to GitHub.
- Day 60-90: downstream adopter window to update before any further public discussion.

If a vulnerability is being actively exploited in the wild, we will accelerate the timeline. If the issue is purely theoretical and a patch lands quickly, we may shorten the window with the reporter's consent.

## Scope

**In scope:**
- The published `legal-citation-gate` npm package and any code in `src/`.
- Documented behaviors of the public API (`src/index.ts` barrel exports).
- Schema reference files in `schema/` (sample SQL is documentation — but if it contains an injection-shaped pattern that adopters would copy unsafely, that's in scope).

**Out of scope:**
- Dependencies of this package. Please report those to their upstream maintainers. We will react quickly to patched upstream releases via dependabot, but the disclosure itself belongs upstream.
- Misuse by adopters (e.g. an adopter implementing `DataAdapter` against an unvalidated user-input query). The library cannot prevent every misuse; documentation flags the integration responsibilities clearly.
- Issues in `examples/` adapters when used in production. Reference adapters are documentation, not production code.

## Hall of Fame

Once the repo is public, we will credit security reporters (with their consent) in a `SECURITY-HALL-OF-FAME.md` file. We do not currently run a paid bug-bounty program.

## Cryptographic Verification

Once the package publishes to npm, releases will use **npm provenance** via GitHub Actions OIDC. Adopters can verify a release came from this repo's CI by running:

```bash
npm audit signatures legal-citation-gate
```

## Questions

For non-security questions (general support, adapter design, integration help), please use public GitHub Discussions or Issues — those are not the right channels for vulnerability reports.
