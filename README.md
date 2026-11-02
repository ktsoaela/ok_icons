<div align="center">
  <img src="src/icons/sparkle.svg" alt="ok_icons" width="128" style="background:#ffffff;padding:16px;border-radius:12px" />

  <h1>ok_icons</h1>

  <p><strong>110 icons on a 24 px grid, delivered as one stylesheet of about 5 kB gzipped.</strong></p>

  <p>
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-375348?style=flat-square" /></a>
    <a href="https://ktsoaela.github.io/ok_icons/"><img alt="Docs" src="https://img.shields.io/badge/docs-browse-547f72?style=flat-square" /></a>
    <img alt="Stack" src="https://img.shields.io/badge/CSS-SVG-436659?style=flat-square" />
  </p>
</div>

**Author:** [Khotso Tsoaela](https://github.com/ktsoaela) (`@ktsoaela`)

---

**[Browse all icons →](https://ktsoaela.github.io/ok_icons/)**

**ok_icons** is a crafted set of icons drawn with round, even strokes. One class paints an icon in `currentColor`. There is no icon font to load, no JavaScript, and no extra request after the stylesheet:

```html
<i class="ic ic-heart"></i>
```

---

## Why ok_icons

- **One element, one class.** `font-size` sizes the icon and `color` colours it.
- **Three weights.** `ic-light`, regular, and `ic-bold`, on the icon or once on any container.
- **Duotone.** `ic-duotone` adds a tinted fill. Set the second colour with `--ic-secondary`.
- **Crisp at every size.** The drawings are vector SVGs, so curves stay smooth from 12 px to 512 px.
- **True transparency.** Nothing is faked in white, so an icon sits on any background.
- **Accessible.** Labels stay available to screen readers, animation respects `prefers-reduced-motion`, and icons stay visible in Windows High Contrast.
- **SVG as well.** Every icon also ships as a file, in a `<symbol>` sprite, and in JSON.

---

## Quick start

**Requirements:** a page that can link a stylesheet. Node.js 22 (see `.nvmrc`) to build or run the site.

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ktsoaela/ok_icons@v1/dist/ok-icons.min.css">
<!-- light and bold weights -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ktsoaela/ok_icons@v1/dist/ok-icons-weights.min.css">
```

### npm

```sh
npm install github:ktsoaela/ok_icons
```

```js
import 'ok-icons';               // icons + duotone (regular weight)
import 'ok-icons/weights.css';   // light and bold
```

| Goal | Command |
|------|---------|
| Browse the set | [ktsoaela.github.io/ok_icons](https://ktsoaela.github.io/ok_icons/) |
| Local site | `npm install && npm run dev` → http://localhost:5173 |
| Tests | `npm test` |
| Build `dist/` and `_site/` | `npm run build` |

Light and bold need `ok-icons-weights.css`. Without it, those classes fall back to the regular weight.

---

## Usage

```html
<!-- Decorative, next to visible text -->
<button type="button"><i class="ic ic-pencil" aria-hidden="true"></i> Edit</button>

<!-- Icon-only button: label the button -->
<button type="button" aria-label="Close"><i class="ic ic-close" aria-hidden="true"></i></button>

<!-- The icon carries the meaning -->
<span class="ic ic-warning" role="img" aria-label="Warning"></span>
```

### Weight and style

```html
<i class="ic ic-settings ic-bold"></i>
<nav class="ic-light"> … </nav>
<i class="ic ic-heart ic-duotone"></i>
```

### Customising

```css
.toolbar {
  --ic-size: 20px;
  --ic-color: #5b5bf7;
  --ic-secondary: #e5488f;
  --ic-secondary-opacity: 0.4;
}
```

| Property | Default | Purpose |
|----------|---------|---------|
| `--ic-size` | `1em` | Icon size |
| `--ic-color` | `currentColor` | Icon colour |
| `--ic-secondary` | `currentColor` | Duotone fill colour |
| `--ic-secondary-opacity` | `0.28` | Duotone fill opacity |
| `--ic-align` | `-0.125em` | `vertical-align`, for lining up with text |
| `--ic-duration` | per animation | Animation duration |
| `--ic-hover-opacity` | `0.6` | Hover opacity for `.ic-hover` |

### Helper classes

| Class | Effect |
|-------|--------|
| `ic-light` `ic-regular` `ic-bold` | Stroke weight, on the icon or a container |
| `ic-duotone` `ic-outline` | Turn the duotone fill on or off |
| `ic-xs` `ic-sm` `ic-md` `ic-lg` `ic-xl` `ic-2xl` | 12, 16, 24, 32, 48, 64 px |
| `ic-rotate-90` `ic-rotate-180` `ic-rotate-270` | Rotate |
| `ic-flip-h` `ic-flip-v` | Mirror |
| `ic-spin` `ic-pulse` `ic-beat` `ic-bounce` `ic-shake` | Animations. Off when the user prefers reduced motion |
| `ic-hover` | Fades on hover |

### Plain SVG

For React, Vue, or email, use [`dist/svg/`](dist/svg), the sprite, or the `svg` field in `dist/icons.json`:

```html
<svg width="24" height="24" aria-hidden="true"><use href="sprite.svg#ic-heart"/></svg>
```

The SVGs use `stroke="currentColor"`. Set `stroke-width` to `1.5` or `2.5` for the light or bold look.

---

## Icons

110 icons in 8 categories: interface, arrows, editing and files, communication, media, status, devices and network, and commerce and data.

Aliases kept for older names: `hamburger` → `menu`, `cloud2` → `cloud-upload`, `*-check` → `*-filled`. Common alternatives are included too: `x`, `zap`, `edit`, `delete`, `gear`, `message`, `skip-forward`.

---

## How it works

Each icon is a hand-drawn SVG in [`src/icons/`](src/icons). The build turns every drawing into data-URI CSS masks: one per weight, plus one for the duotone fill. Each `.ic-<name>` class only sets custom properties. The base styles paint them. `::after` draws the glyph in `currentColor` and `::before` draws the optional duotone layer. A single class can switch weight and style, and the whole set compresses to a few kilobytes.

Chrome, Edge and Firefox 100+, and Safari 15.4+ on macOS and iOS. Vendor prefixes are added at build time.

| Path | What it holds |
|------|----------------|
| `src/icons/*.svg` | Drawings (24×24, stroke 2, `currentColor`) |
| `src/icons.json` | Names, categories, search tags, aliases |
| `src/base.css` | Base styles, weights, sizes, animations |
| `site/` | Demo site |
| `scripts/` | Build and dev server |
| `test/` | Checks |
| `dist/` | Build output, committed so the CDN and git installs work |

The demo site deploys to GitHub Pages from `main`. Turn it on once under **Settings → Pages → Source: GitHub Actions**. CI fails if `dist/` is out of date.

---

## Documentation map

| Doc | Purpose |
|-----|---------|
| [Browse](https://ktsoaela.github.io/ok_icons/) | Search the set and copy a class |
| [site/learn.html](site/learn.html) | How to draw an icon |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Drawing guidelines for new icons |
| [LICENSE](LICENSE) | MIT |

---

## License

MIT © Khotso Tsoaela
