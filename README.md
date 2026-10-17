# WireRift website

The Next.js website for [wirerift.com](https://wirerift.com). Static export, native SVG identity, responsive layouts from mobile to 4K, accessible appearance picker, searchable documentation and an interactive tunnel/inspector demonstration.

## Develop

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev -- --port 3015
```

## Verify

```sh
npm run lint
npm run build
npm run typecheck
npx playwright install chromium
npm test
```

The test runner starts the actual `out/` export on a dedicated port (47861) and refuses to reuse another running server. It checks command selection and clipboard success/failure, documentation search, example request replay, platform/architecture downloads, appearance persistence and storage failure, keyboard controls, WCAG AA automated checks, reduced motion, internal links, and layouts at 360, 390, 768, 1440 and 3840 pixels. These checks do not run an actual WireRift tunnel or certify a physical mobile device.

The shared layout uses `--layout-max` (1728px), fluid `--page-gutter`, `--layout-gap`, `--section-space` and `--panel-space` tokens in `globals.css`. The terminal, header, main sections and footer share the same frame; prose has a separate 72ch measure. Resource and brand grids use three columns from 1280px, two on tablets and one on mobile. `tests/layout.spec.ts` adds a six-page alignment, overflow, title wrapping and readable-prose matrix at 375, 768, 1024, 1440, 1920 and 2560px. Wide layouts do not enlarge the root font size.

```sh
node scripts/preview.mjs 3015
```

## Publish

Pushes to `main` run `.github/workflows/deploy.yml`. Lint, export, types and browser tests must pass before GitHub Pages deploys `out/`. Enable Pages with GitHub Actions as its source and set the custom domain to `wirerift.com`. `public/CNAME` and the exported CNAME match this domain. DNS must point to GitHub Pages; TLS provisioning is managed by GitHub.

The repository name `wirerift/wirefift-site` follows the name requested for this website. The tunnel engine remains in [WireRift/WireRift](https://github.com/WireRift/WireRift).

## Content and assets

- Product behavior, commands and download assets were checked against the upstream README, Go module, Compose configuration and v1.7.0 release on 2026-10-17. Update `src/lib/site.ts` and verify the release matrix before changing the displayed version.
- The terminal and inspector contain labeled illustrative examples. They do not connect to a tunnel server or send webhook requests.
- The appearance picker and OXOGNET SVG signature are adapted from [CobaltDB's website](https://github.com/cobaltdb/cobaltdb-site) at the user's request. Its MIT notice is retained at `public/licenses/cobaltdb-site.txt`.
- The WireRift symbol is an original SVG interpretation of the supplied brand reference. Logos, social preview and app icon are in `public/`. `npm run brand` regenerates the shared React wordmark, outlined SVG assets, compact favicon and raster previews using Fontkit and Sharp. Geometry lives in `src/lib/brand-geometry.ts`; both the website and downloads use it. Typeface outlines come from the bundled, OFL-licensed Geist font; exported logos do not require a font installation.
- Geist, Geist Mono and Lucide notices are retained in `public/licenses/`.

The website is MIT licensed. Third-party marks retain their respective ownership.
