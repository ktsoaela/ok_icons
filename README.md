# ok_icons

<i><b>Beautiful icons, delivered as pure CSS.</b></i>

[![CI](https://github.com/ktsoaela/ok_icons/actions/workflows/ci.yml/badge.svg)](https://github.com/ktsoaela/ok_icons/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[Browse all icons →](https://ktsoaela.github.io/ok_icons/)**

**ok_icons** is a crafted set of 110 icons drawn on a 24 px grid with round, even strokes, and delivered as **one stylesheet of about 5 kB gzipped**. There are no icon fonts to load, no JavaScript and no extra HTTP requests:

```html
<i class="ic ic-heart"></i>
```

- **One element, one class.** Icons are painted with `currentColor`, so `font-size` sizes them and `color` colors them.
- **Three weights.** `ic-light`, regular and `ic-bold`, on the icon or once on any container.
- **Duotone built in.** `ic-duotone` adds a tinted fill; choose the second color with `--ic-secondary`.
- **Crisp at every size.** The icons are vector SVGs, not border and gradient tricks, so curves are smooth from 12 px to 512 px.
- **Any background.** Icons have true transparency, with nothing faked in white.
- **Accessible.** Labels stay available to screen readers, animations respect `prefers-reduced-motion`, and icons stay visible in Windows High Contrast mode.
- **SVG too.** Every icon also ships as a standalone SVG, in a `<symbol>` sprite and as JSON.

## Getting started

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ktsoaela/ok_icons@v1/dist/ok-icons.min.css">
<!-- optional: light and bold weights -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ktsoaela/ok_icons@v1/dist/ok-icons-weights.min.css">
```

### npm

```sh
npm install github:ktsoaela/ok_icons
```

```js
import 'ok-icons';               // icons + duotone (regular weight)
import 'ok-icons/weights.css';   // optional: light and bold
```

## Usage

```html
<!-- Decorative, next to visible text: hide it from screen readers -->
<button type="button"><i class="ic ic-pencil" aria-hidden="true"></i> Edit</button>

<!-- Icon-only button: label the button, hide the icon -->
<button type="button" aria-label="Close"><i class="ic ic-close" aria-hidden="true"></i></button>

<!-- The icon carries meaning on its own -->
<span class="ic ic-warning" role="img" aria-label="Warning"></span>
```

### Weight and style

```html
<i class="ic ic-settings ic-bold"></i>        <!-- per icon -->
<nav class="ic-light"> … </nav>               <!-- every icon inside -->
<i class="ic ic-heart ic-duotone"></i>        <!-- tinted fill -->
```

Light and bold need `ok-icons-weights.css`. Without it, those classes fall back to the regular weight.

### Customizing

```css
.toolbar {
  --ic-size: 20px;
  --ic-color: #5b5bf7;
  --ic-secondary: #e5488f;      /* duotone fill color */
  --ic-secondary-opacity: 0.4;
}
```

| Property                 | Default        | Purpose                                    |
| ------------------------ | -------------- | ------------------------------------------ |
| `--ic-size`              | `1em`          | Icon size                                  |
| `--ic-color`             | `currentColor` | Icon color                                 |
| `--ic-secondary`         | `currentColor` | Duotone fill color                         |
| `--ic-secondary-opacity` | `0.28`         | Duotone fill opacity                       |
| `--ic-align`             | `-0.125em`     | `vertical-align`, for lining up with text  |
| `--ic-duration`          | per animation  | Animation duration                         |
| `--ic-hover-opacity`     | `0.6`          | Hover opacity for `.ic-hover`              |

### Helper classes

| Class                                                        | Effect                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `ic-light` `ic-regular` `ic-bold`                            | Stroke weight (icon or container)                          |
| `ic-duotone` `ic-outline`                                    | Turn the duotone fill on or off (icon or container)        |
| `ic-xs` `ic-sm` `ic-md` `ic-lg` `ic-xl` `ic-2xl`             | 12, 16, 24, 32, 48, 64 px                                  |
| `ic-rotate-90` `ic-rotate-180` `ic-rotate-270`               | Rotate                                                     |
| `ic-flip-h` `ic-flip-v`                                      | Mirror                                                     |
| `ic-spin` `ic-pulse` `ic-beat` `ic-bounce` `ic-shake`        | Animations, off for users who prefer reduced motion        |
| `ic-hover`                                                   | Fades on hover                                             |

### Plain SVG

Prefer inline SVG (for React, Vue or email)? Use the files in [`dist/svg/`](dist/svg), the sprite, or the `svg` field in `dist/icons.json`:

```html
<svg width="24" height="24" aria-hidden="true"><use href="sprite.svg#ic-heart"/></svg>
```

The SVGs use `stroke="currentColor"`. Change `stroke-width` to `1.5` or `2.5` for the light or bold look.

## Icons

110 icons in 8 categories: interface, arrows, editing and files, communication, media, status, devices and network, and commerce and data. **[See them all, with search and copy-paste →](https://ktsoaela.github.io/ok_icons/)**

Aliases kept for backwards compatibility: `hamburger` → `menu`, `cloud2` → `cloud-upload`, `*-check` → `*-filled`. There are also common alternative names: `x`, `zap`, `edit`, `delete`, `gear`, `message`, `skip-forward`.

## How it works

Each icon is a hand-drawn SVG in [`src/icons/`](src/icons). The build turns every drawing into data-URI CSS masks: one per weight, plus one for the duotone fill. Each `.ic-<name>` class only sets custom properties (`--ic-g`, `--ic-d`, …). The base styles paint them: `::after` draws the glyph in `currentColor` and `::before` draws the optional duotone layer. That is why a single class name can switch weight and style, and why the whole set compresses to a few kilobytes.

## Browser support

Chrome/Edge 100+, Firefox 100+, Safari 15.4+ (macOS and iOS). Vendor prefixes are added at build time.

## Development

Requires Node.js 22 (see `.nvmrc`).

```sh
npm install
npm run dev     # builds, serves the site at http://localhost:5173 and rebuilds on change
npm test        # builds, then runs the test suite
npm run build   # writes dist/ and _site/
```

```
src/icons/*.svg    icon drawings (24x24, stroke 2, currentColor)
src/icons.json     names, categories, search tags, aliases
src/base.css       base styles, weights, sizes, animations
site/              demo site
scripts/           build and dev server
test/              checks
dist/              build output (committed so the CDN and git installs work)
```

The demo site deploys to GitHub Pages from `main`. Enable it once under **Settings → Pages → Source: GitHub Actions**. CI fails if `dist/` is out of date.

## Contributing

New icons, fixes and ideas are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the drawing guidelines.

## Acknowledgments

Special thanks to [Drew Vosburg](https://blog.truthlabs.com/how-to-make-complex-icons-with-only-css-e135e6dc2c5e) from Perficient Digital Labs, whose writing on CSS icons started this project.

## License

[MIT](LICENSE) © Khotso Tsoaela
