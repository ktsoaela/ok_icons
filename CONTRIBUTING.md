# Contributing to ok_icons

Thanks for helping out! Bug reports, icon requests and pull requests are all welcome.

## Setup

```sh
nvm use          # Node 22
npm install
npm run dev      # http://localhost:5173, rebuilds on save
```

## Adding an icon

1. **Draw it** as `src/icons/<name>.svg` (kebab-case name), starting from this template:

   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
     <path d="…"/>
   </svg>
   ```

2. **Register it** in `src/icons.json` with a `category` and a few search `tags`.
3. **Check it** in the demo at 16 px and 64 px, in all three weights and in duotone. Then run `npm test` and commit the regenerated `dist/`.

### Drawing guidelines

These keep the set consistent:

- **Grid:** 24 × 24, with a live area of 2 to 22. Keep strokes off the outer pixel.
- **Strokes:** use the root's `stroke-width="2"` and never override it, because weights are generated from it. Caps and joins are round.
- **Corners:** `rx="2"` on rectangles. Use radius 1 for small details.
- **Dots:** a zero-length stroke (`M12 17h.01`) so the dot scales with the weight.
- **Optical size:** circles use `r="9"` at full size. Squares are about 18 × 18.
- **Duotone:** add `data-fill="true"` to the closed shapes that should get the tinted fill. A shape that should appear *only* in the fill layer gets `data-duo="true"` (see `shopping-cart.svg`). Both attributes go on self-closing shapes.
- **Cut-outs:** never paint white. Use an SVG `<mask>` (see `error-filled.svg`). The build namespaces `id`s automatically.
- **Originality:** draw icons yourself. Don't copy paths from other icon sets, and don't add brand logos.

## Renaming or removing icons

Class names are public API. If you rename an icon, add the old name to `aliases` in `src/icons.json` until the next major version.

## Releasing

1. Update `version` in `package.json` and add an entry to `CHANGELOG.md`.
2. Run `npm test` and commit, including `dist/`.
3. Tag the release (`git tag v1.2.3 && git push --tags`). jsDelivr serves `@v1` from the latest `v1.x.x` tag.
