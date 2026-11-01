# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-01

First production release. The icon set was redrawn from scratch.

### Added

- 110 icons hand-drawn on a 24 px grid with round, consistent strokes, in 8 categories.
- Three weights: `ic-light`, regular and `ic-bold`. The light and bold glyphs ship separately in `ok-icons-weights.css`.
- Duotone style (`ic-duotone`) with `--ic-secondary` and `--ic-secondary-opacity`.
- Weight and style classes work on the icon or on any container.
- Animations: `ic-spin`, `ic-pulse`, `ic-beat`, `ic-bounce`, `ic-shake` (with `--ic-duration`).
- Helpers: sizes (`ic-xs`…`ic-2xl`), transforms (`ic-rotate-*`, `ic-flip-*`), `ic-hover`.
- Standalone SVGs (`dist/svg/`), a `<symbol>` sprite (`dist/sprite.svg`), and metadata including SVG markup (`dist/icons.json`).
- Support for `prefers-reduced-motion` and Windows High Contrast (`forced-colors`).
- Demo site with search, category filters, live weight, style, size and color controls, and a detail dialog with HTML, SVG and sprite snippets and SVG download.
- Build pipeline, test suite, CI and GitHub Pages deployment.

### Changed (breaking)

- **Icons are SVG drawings embedded in the CSS as masks.** They replace the shapes built from borders and gradients. Markup is unchanged: `<i class="ic ic-name">`.
- **Icons are drawn in `currentColor`** and work on any background. `mix-blend-mode` and the white "knock-out" shapes are gone.
- **The default size is `1em`** (it was a fixed `32px`). Add `ic-lg` or `font-size: 32px` to get the old size.
- **Hover dimming is opt-in** with `ic-hover`, and icons no longer force `cursor: pointer`.
- `style.css` was replaced by `dist/ok-icons.css` / `dist/ok-icons.min.css`.
- Renamed: `hamburger` → `menu`, `cloud2` → `cloud-upload`, `*-check` → `*-filled`. The old names still work as aliases.
