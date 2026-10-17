# Validation

Updated on 2026-10-18 using Node.js 24.13.0 on Windows. This layout revision started from clean commit `5100b3c`.

## Local result

- `npm run format` — 33 source/config/test files checked; no remaining diagnostics.
- `npm run build` — Next.js 16.4.2 production export succeeded; 22 generated entries, including the 404, sitemap and robots assets.
- `npm run typecheck` — passed.
- `npm test` — 22 Chromium tests passed; zero skips or retries.
- Responsive matrix — 375, 768, 1024, 1440, 1920 and 2560px across home, documentation index, API reference, downloads, brand assets and changelog. Header, terminal, main and footer edges align; pages stay inside the viewport; prose is narrower than data panels; brand cards occupy three columns on wide screens. Desktop typography no longer scales the entire root.

| Viewport | Shared container | Side gutter |
| --- | --- | --- |
| 375px | 343px | 16px |
| 768px | about 717px | about 26px |
| 1024px | about 956px | about 34px |
| 1440px | 1344px | 48px |
| 1920px | 1728px | 96px |
| 2560px | 1728px | 416px |

The new wide-layout assertions failed on the starting export: 1920px rendered a 1408px frame, while 2560px rendered an oversized 1840px frame. Both pass on the revised layout. Screenshots are generated in ignored `.qa/layout-*.png` files for visual inspection.

The suite exercises selected commands and clipboard success/failure, search results and empty results, inspector selection/replay, platform and CPU download mapping, persistent themes and blocked storage, keyboard dismissal, automated WCAG A/AA checks in both appearances, reduced motion, 360/390/768/1440/3840px overflow checks across four page types, every document route, internal links and the 404 response.

## Evidence boundary

These checks exercise the exported website in a browser. They do not launch the WireRift client/server or certify behavior on physical mobile devices. The inspector is an explicitly labeled local demonstration; replay does not send a network request. Automated accessibility checks are supplemented by keyboard and visual review, but are not a full manual accessibility certification.

Product content was checked against WireRift's current upstream README, Go module, Docker Compose file, brand reference and v1.7.0 release assets. Site preview and tunnel service domains are separate; example tunnel URLs are not advertised as a hosted service.

## Deployment

The GitHub Actions workflow runs lint, build, type check and the same 22 browser tests before deploying `out/`. The live workflow result and custom-domain HTTPS status are verified separately after publication.
