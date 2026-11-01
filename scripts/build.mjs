// Builds the icon library and the demo site from src/.
//
//   dist/ok-icons.css               base + every icon (regular weight + duotone)
//   dist/ok-icons.min.css
//   dist/ok-icons-weights.css       optional add-on: light and bold weights
//   dist/ok-icons-weights.min.css
//   dist/icons.json                 metadata + SVG markup for every icon
//   dist/svg/<name>.svg             standalone SVG files
//   dist/sprite.svg                 <symbol> sprite: <svg><use href="sprite.svg#ic-home"/></svg>
//   _site/                          demo site (deployed to GitHub Pages)

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { transform } from 'lightningcss';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

// Minimum supported browsers. Keep in sync with "Browser support" in README.
const v = (major) => major << 16;
const targets = { chrome: v(100), edge: v(100), firefox: v(100), safari: v(15), ios_saf: v(15) };

export const WEIGHTS = { light: 1.5, regular: 2, bold: 2.5 };
const ROOT_ATTRS = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SHAPE_RE = /<(?:path|circle|rect|ellipse|line|polygon|polyline)\b[^>]*\/>/g;
const MARK_RE = /\sdata-(?:fill|duo)="true"/;

const banner = (file) => `/*! ok_icons v${pkg.version} ${file} | MIT License | ${pkg.homepage} */\n`;

// ------------------------------------------------------------------ sources

export async function loadManifest() {
  const icons = JSON.parse(await readFile(join(root, 'src/icons.json'), 'utf8'));
  const seen = new Set();
  for (const icon of icons) {
    for (const name of [icon.name, ...(icon.aliases ?? [])]) {
      if (!NAME_RE.test(name)) throw new Error(`Invalid icon name "${name}"`);
      if (seen.has(name)) throw new Error(`Duplicate icon name "${name}"`);
      seen.add(name);
    }
  }
  return icons;
}

/** Parse src/icons/<name>.svg into its parts. */
export function parseIcon(name, source) {
  const open = source.match(/^\s*<svg\b([^>]*)>/);
  if (!open || !source.trimEnd().endsWith('</svg>')) throw new Error(`${name}.svg: not a single <svg> element`);
  const attrs = open[1];
  for (const required of ['viewBox="0 0 24 24"', 'stroke="currentColor"', 'stroke-width="2"']) {
    if (!attrs.includes(required)) throw new Error(`${name}.svg: root <svg> must have ${required}`);
  }

  let inner = source
    .slice(open[0].length, source.lastIndexOf('</svg>'))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim();

  // Namespace ids so several inline SVGs can share a page.
  inner = inner
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="ok-${name}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#ok-${name}-${id})`);

  const duoShapes = (inner.match(SHAPE_RE) ?? []).filter((s) => MARK_RE.test(s)).map((s) => s.replace(MARK_RE, ''));
  const glyph = inner
    .replace(SHAPE_RE, (s) => (/\sdata-duo="true"/.test(s) ? '' : s))
    .replace(/\sdata-fill="true"/g, '');
  if (/data-(fill|duo)/.test(glyph)) throw new Error(`${name}.svg: data-fill/data-duo must be ="true" on a self-closing shape`);

  return { glyph, duo: duoShapes.join('') };
}

const svgDoc = (inner, attrs) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${attrs}>${inner}</svg>`;

/** Standalone SVG markup (currentColor). */
export const toSvg = (icon, weight = WEIGHTS.regular) =>
  svgDoc(icon.glyph, `width="24" height="24" ${ROOT_ATTRS} stroke="currentColor" stroke-width="${weight}"`);

/** Mask SVG: alpha is what matters, so paint everything black. */
const maskSvg = (inner, weight) =>
  svgDoc(inner.replace(/currentColor/g, '#000'), `${ROOT_ATTRS} stroke="#000" stroke-width="${weight}"`);
const duoSvg = (inner) => svgDoc(inner, 'fill="#000"');

const dataUri = (svg) =>
  `url("data:image/svg+xml,${svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')}")`;

// --------------------------------------------------------------------- css

function compile(code, file, minify) {
  const { code: out, warnings } = transform({
    filename: file,
    code: Buffer.from(code),
    minify,
    targets,
    errorRecovery: false,
  });
  if (warnings.length) {
    throw new Error(`CSS warnings in ${file}:\n${warnings.map((w) => `  ${w.message} (line ${w.loc.line})`).join('\n')}`);
  }
  return banner(file) + out.toString();
}

const selector = (icon) => [icon.name, ...(icon.aliases ?? [])].map((n) => `.ic-${n}`).join(',\n');

// ------------------------------------------------------------------- build

export async function build({ log = console.log } = {}) {
  const started = performance.now();
  const manifest = await loadManifest();

  const files = (await readdir(join(root, 'src/icons'))).filter((f) => f.endsWith('.svg'));
  const fileNames = new Set(files.map((f) => f.slice(0, -4)));
  const listed = new Set(manifest.map((i) => i.name));
  const unlisted = [...fileNames].filter((n) => !listed.has(n));
  const missing = [...listed].filter((n) => !fileNames.has(n));
  if (unlisted.length) throw new Error(`SVGs not in src/icons.json: ${unlisted.join(', ')}`);
  if (missing.length) throw new Error(`Icons in src/icons.json without an SVG: ${missing.join(', ')}`);

  const icons = [];
  for (const meta of manifest) {
    const parsed = parseIcon(meta.name, await readFile(join(root, 'src/icons', `${meta.name}.svg`), 'utf8'));
    icons.push({ ...meta, ...parsed });
  }

  let core = `${await readFile(join(root, 'src/base.css'), 'utf8')}\n/* Icons (generated from src/icons/*.svg) */\n\n`;
  let weights = '/* Light and bold weights. Use with ok-icons.css: <i class="ic ic-home ic-bold"> */\n\n';
  for (const icon of icons) {
    const props = [`--ic-g: ${dataUri(maskSvg(icon.glyph, WEIGHTS.regular))};`];
    if (icon.duo) props.push(`--ic-d: ${dataUri(duoSvg(icon.duo))};`);
    core += `${selector(icon)} {\n  ${props.join('\n  ')}\n}\n\n`;
    weights +=
      `${selector(icon)} {\n` +
      `  --ic-gl: ${dataUri(maskSvg(icon.glyph, WEIGHTS.light))};\n` +
      `  --ic-gb: ${dataUri(maskSvg(icon.glyph, WEIGHTS.bold))};\n}\n\n`;
  }

  const out = {
    'ok-icons.css': compile(core, 'ok-icons.css', false),
    'ok-icons.min.css': compile(core, 'ok-icons.css', true),
    'ok-icons-weights.css': compile(weights, 'ok-icons-weights.css', false),
    'ok-icons-weights.min.css': compile(weights, 'ok-icons-weights.css', true),
  };

  const metadata = icons.map(({ glyph, duo, ...meta }) => ({ ...meta, svg: toSvg({ glyph }) }));
  const sprite =
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">' +
    icons
      .map(
        (i) =>
          `<symbol id="ic-${i.name}" viewBox="0 0 24 24" ${ROOT_ATTRS} stroke="currentColor" stroke-width="2">${i.glyph}</symbol>`,
      )
      .join('') +
    '</svg>\n';

  const dist = join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await mkdir(join(dist, 'svg'), { recursive: true });
  for (const [file, content] of Object.entries(out)) await writeFile(join(dist, file), content);
  await writeFile(join(dist, 'icons.json'), JSON.stringify(metadata, null, 2) + '\n');
  await writeFile(join(dist, 'sprite.svg'), sprite);
  for (const icon of icons) await writeFile(join(dist, 'svg', `${icon.name}.svg`), toSvg(icon) + '\n');

  // Demo site.
  const site = join(root, '_site');
  await rm(site, { recursive: true, force: true });
  await cp(join(root, 'site'), site, { recursive: true });
  await cp(join(dist, 'ok-icons.min.css'), join(site, 'ok-icons.min.css'));
  await cp(join(dist, 'ok-icons-weights.min.css'), join(site, 'ok-icons-weights.min.css'));
  await writeFile(
    join(site, 'icons.js'),
    `window.OK_ICONS = ${JSON.stringify({ version: pkg.version, weights: WEIGHTS, icons: metadata })};\n`,
  );

  const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB`;
  const gz = (s) => `${(gzipSync(s).length / 1024).toFixed(1)} kB gzip`;
  log(
    `Built ${icons.length} icons in ${Math.round(performance.now() - started)} ms\n` +
      `  ok-icons.min.css          ${kb(out['ok-icons.min.css'])} (${gz(out['ok-icons.min.css'])})\n` +
      `  ok-icons-weights.min.css  ${kb(out['ok-icons-weights.min.css'])} (${gz(out['ok-icons-weights.min.css'])})`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await build();
  } catch (err) {
    console.error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}
