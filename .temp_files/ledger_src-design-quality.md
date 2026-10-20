# Evidence ledger

Scope: src (all page routes and shared UI); tests/design-quality.spec.ts and existing tests.

## Setup evidence
- Baseline commit: cc4b771; git status was clean before the audit. No AGENTS.md was found in the repository. No unrelated edits were changed.
- Toolchain: package.json and playwright.config.ts specify Next.js 16.4.2, React 19, TypeScript, Biome and Playwright. Installed Playwright and the registry's latest version were both 1.64.1. No UI library or test framework was added.
- Invariants: controls remain reachable at narrow/short viewports; closing a disclosure restores keyboard focus; ordinary and long input states reflow; clipboard results belong to the selected request; UI and code use the requested self-hosted fonts; SVG artwork and palette stay intact.
- Font change is an explicit new user requirement, not a claim that the old font was inherently defective. JetBrains Mono is the only new dependency; unused body-font packages were removed. The SVG wordmark remains unchanged.

## Round 1 — search, mobile navigation and header
### Findings
#### F01 — input-handling — Medium — long search query creates horizontal scrolling
- Location: globals.css .search-empty/.search-results.
- Before: `playwright test tests/design-quality.spec.ts --grep regression --workers=1` failed at scrollWidth <= clientWidth for 180 unbroken characters. The ordinary `notfound` query passed the same containment assertion.
- Root cause: the empty-state text had no unbroken-word wrapping rule; the results pane used a fixed viewport-height cap rather than flex sizing inside the modal.
- Patch: wrap long text, allow flex children to shrink and keep one scroll owner inside the bounded dialog.
- Regression: design-quality.spec.ts, long search query test.

#### F02 — bug — Medium — Escape loses focus after closing the mobile navigation
- Location: navigation.tsx key handler.
- Before: menu dismissal passed, but the trigger was inactive after Escape from a focused navigation link.
- Root cause: unmounting the menu discarded the focused link without restoring its trigger.
- Patch: retain the menu trigger ref, restore focus when Escape originates in the menu, and bound menu scrolling to the viewport.
- Regression: design-quality.spec.ts, mobile menu focus and short-screen test.

#### F03 — bug — Low — compact header squashes the outlined wordmark
- Location: appearance.css max-width:365px rule.
- Before: header controls and symbol were present, but the wordmark measured 32px wide; the broad SVG selector made both logo SVGs square.
- Root cause: symbol dimensions also applied to the much wider wordmark.
- Patch: size only the symbol and use the existing mark-only brand presentation on the narrowest header, retaining its accessible home-link label.
- Regression: design-quality.spec.ts, compact branding and target-size test.

## Round 2 — documentation links and clipboard states
### Findings
#### F04 — bug — Medium — inline documentation reference links rely only on color
- Location: globals.css .doc-footer a, all 13 document routes.
- Before: Axe reported link-in-text-block in light mode at both 375 and 1440px: link/surrounding-text contrast was 2.92:1 with no underline. Home, docs index and other top-level pages were unaffected controls in the same scan.
- Patch: persistent underline with an offset, preserving the existing colors.
- Regression: all-route automated WCAG review in design-quality.spec.ts.

#### F05 — input-handling — Medium — inspector clipboard failure provides no recovery
- Location: home-interactions.tsx InspectorDemo.
- Before: injected clipboard rejection left the ordinary Copy cURL button and sample status unchanged. Request selection and payload rendering passed as controls.
- Patch: explicit pending/success/error feedback and a selectable manual cURL command when clipboard permission is denied.
- Regression: design-quality.spec.ts clipboard-failure test.

#### F06 — ownership — Medium — stale clipboard completion marks a different request copied
- Location: home-interactions.tsx InspectorDemo.
- Before: gate clipboard completion, select a different request, then release the previous completion; the new request incorrectly showed Copied.
- Patch: capture and check an operation generation; invalidate it when selection changes. The regression uses explicit promise release, not a sleep.
- Regression: design-quality.spec.ts gated clipboard completion test.

### Not reproduced (dropped)
- Appearance panel clipping at 768x320: the panel fitted and Escape restored focus. No speculative panel change was made.
- Baseline horizontal page overflow at the nine requested widths: completed light-theme scans passed. The initial wider matrix was interrupted by new user input; its incomplete dark-theme tail is not counted as a completed baseline run.

### Validation
- Before evidence: three confirmed focused failures and one unaffected focused pass; light-theme documentation Axe violations; two inspector failures before its patch.
- Focused fixes: seven checks passed in each of three consecutive runs (5.0s, 4.7s and 5.3s); actual output is saved in ui-proof-runs.log.
- Full browser suite: 70 passed in 3.3 minutes. This includes all 19 HTML routes at 320, 375, 390, 768, 1024, 1280, 1440, 1920 and 2560px in both themes; 76 Axe route/theme/width scans; breakpoint-neighbor and short-landscape checks; existing functional and animation coverage.
- An additional cold-font layout-shift test passed separately (1 passed in 2.2s, CLS budget <= 0.1). The final suite contains 71 tests.
- Production build/static export, TypeScript, Biome and git diff whitespace checks passed. Final lint/type checks are repeated before commit.
- Native browser inspection covered the compact home header and long search at 320px, documentation/code at 1024px, Windows download and brand assets at 375px, and the changelog in dark mode at 1440px. Screenshots are retained in the ignored .qa directory.
- Local verification used audit-preview.config.ts against a separately controlled fresh static preview. Windows stalled during Playwright-managed server teardown, and a diagnostic WMI query returned 0x80041033 (Shutting down). Those interrupted runs are not counted as clean passes. The supplemental config changes only preview ownership/base URL; assertions are unchanged. GitHub retains the standard Linux workflow/configuration; publication evidence is reported separately after push.
- Proof runner: .temp_files/prove_ui_findings.mjs. Repeat verifier: .temp_files/verify_ui_findings.mjs.
- Existing scripts: npm run lint, npm run typecheck, npm run build, npm test.

### Boundaries
- Automated WCAG checks supplement browser/keyboard inspection; they do not certify full screen-reader or physical-device accessibility.
- Native mobile keyboards and physical mobile browsers are not available in this desktop environment. CSS viewport/landscape/reflow checks do not substitute for them.
- Native desktop 200% browser zoom was not independently exercised; narrow CSS viewport reflow was verified.
- No live tunnel, binary execution or backend behavior is part of this design audit.

### Working tree
- All current product/test edits belong to this audit. Commit and push were explicitly authorized by the user after the audit began.
