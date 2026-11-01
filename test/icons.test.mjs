// Run with `npm test` (builds first, then runs these checks).

import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseIcon, toSvg } from '../scripts/build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFile(join(root, p), 'utf8');

const manifest = JSON.parse(await read('src/icons.json'));
const pkg = JSON.parse(await read('package.json'));
const base = await read('src/base.css');
const css = await read('dist/ok-icons.css');
const min = await read('dist/ok-icons.min.css');
const weights = await read('dist/ok-icons-weights.css');
const allNames = manifest.flatMap((i) => [i.name, ...(i.aliases ?? [])]);

const blockFor = (file, name) => {
  const m = file.match(new RegExp(`(?:^|[,\\s])\\.ic-${name}(?![\\w-])[^{]*\\{([^}]*)\\}`));
  return m?.[1];
};

test('manifest entries are well-formed and unique', () => {
  assert.ok(manifest.length >= 100, 'expected at least 100 icons');
  for (const icon of manifest) {
    assert.match(icon.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad name: ${icon.name}`);
    assert.equal(typeof icon.category, 'string', `${icon.name} needs a category`);
    assert.ok(Array.isArray(icon.tags) && icon.tags.length > 0, `${icon.name} needs tags`);
  }
  assert.equal(new Set(allNames).size, allNames.length);
});

test('every manifest icon has exactly one SVG source and vice versa', async () => {
  const files = (await readdir(join(root, 'src/icons'))).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
  assert.deepEqual(files.sort(), manifest.map((i) => i.name).sort());
});

test('SVG sources follow the grid and stroke conventions', async () => {
  for (const { name } of manifest) {
    const src = await read(`src/icons/${name}.svg`);
    const { glyph } = parseIcon(name, src);
    assert.ok(glyph.length > 0, `${name} is empty`);
    assert.doesNotMatch(glyph, /stroke-width=/, `${name}: don't override stroke-width, weights are generated`);
    // Every coordinate pair must stay inside the 24x24 box.
    for (const [, x, y] of glyph.matchAll(/\b(?:cx|x)="(-?[\d.]+)"[^>]*?\b(?:cy|y)="(-?[\d.]+)"/g)) {
      assert.ok(+x >= 0 && +x <= 24 && +y >= 0 && +y <= 24, `${name}: (${x}, ${y}) outside the grid`);
    }
  }
});

test('parseIcon namespaces ids and extracts duotone shapes', () => {
  const src =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<mask id="k"><rect width="24" height="24" fill="#fff"/></mask>' +
    '<circle cx="12" cy="12" r="9" data-fill="true" mask="url(#k)"/>' +
    '<path d="M1 1h2" data-duo="true"/><path d="M2 2h2"/></svg>';
  const { glyph, duo } = parseIcon('demo', src);
  assert.match(glyph, /id="ok-demo-k"/);
  assert.match(glyph, /url\(#ok-demo-k\)/);
  assert.doesNotMatch(glyph, /data-/);
  assert.doesNotMatch(glyph, /M1 1h2/, 'data-duo shapes belong only to the duotone layer');
  assert.match(duo, /<circle cx="12" cy="12" r="9"/);
  assert.match(duo, /M1 1h2/);
  assert.throws(() => parseIcon('bad', '<svg viewBox="0 0 24 24"><path/></svg>'), /stroke="currentColor"/);
});

test('every icon and alias is in the core and weights CSS', () => {
  for (const name of allNames) {
    const core = blockFor(css, name);
    assert.ok(core?.includes('--ic-g:'), `.ic-${name} missing --ic-g`);
    const w = blockFor(weights, name);
    assert.ok(w?.includes('--ic-gl:') && w.includes('--ic-gb:'), `.ic-${name} missing weights`);
    assert.ok(min.includes(`.ic-${name}`), `.ic-${name} missing from min build`);
  }
});

test('icons with duotone shapes get a --ic-d layer', () => {
  for (const name of ['home', 'heart', 'star', 'shopping-cart']) {
    assert.ok(blockFor(css, name).includes('--ic-d:'), `${name} should be duotone-capable`);
  }
  assert.ok(!blockFor(css, 'menu').includes('--ic-d:'), 'line-only icons have no duotone layer');
});

test('base styles never hard-code colors', () => {
  const code = base.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.equal(code.match(/#[0-9a-f]{3,8}\b/gi), null);
  assert.equal(code.match(/\b(rgba?|hsla?)\(/gi), null);
  assert.doesNotMatch(code, /mix-blend-mode/);
});

test('mask data URIs are fully encoded', () => {
  const uris = [...css.matchAll(/url\("data:image\/svg\+xml,([^"]*)"\)/g)].map((m) => m[1]);
  assert.ok(uris.length >= manifest.length);
  for (const uri of uris) {
    assert.doesNotMatch(uri, /[<>#"]/);
    assert.match(decodeURIComponent(uri), /^<svg xmlns='http:\/\/www\.w3\.org\/2000\/svg'.*<\/svg>$/);
  }
});

test('built CSS pairs every mask property with a -webkit- prefix', () => {
  for (const prop of ['mask-image', 'mask-size', 'mask-position', 'mask-repeat']) {
    const unprefixed = css.match(new RegExp(`^\\s*${prop}:`, 'gm'))?.length ?? 0;
    const prefixed = css.match(new RegExp(`^\\s*-webkit-${prop}:`, 'gm'))?.length ?? 0;
    assert.ok(unprefixed > 0, `${prop} not used`);
    assert.equal(prefixed, unprefixed, `${prop} prefix mismatch`);
  }
});

test('animations respect prefers-reduced-motion', () => {
  const block = base.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)[1];
  for (const cls of ['ic-spin', 'ic-pulse', 'ic-beat', 'ic-bounce', 'ic-shake']) {
    assert.ok(base.includes(`.${cls} {`), `${cls} missing`);
    assert.ok(block.includes(`.${cls}`), `${cls} ignores reduced motion`);
  }
});

test('builds carry the version banner and are compact', async () => {
  for (const file of ['ok-icons.css', 'ok-icons.min.css', 'ok-icons-weights.css', 'ok-icons-weights.min.css']) {
    assert.ok((await read(`dist/${file}`)).startsWith(`/*! ok_icons v${pkg.version} `), `${file} banner`);
  }
  assert.ok(min.length < css.length);
});

test('standalone SVGs, sprite and metadata are emitted', async () => {
  const sprite = await read('dist/sprite.svg');
  const meta = JSON.parse(await read('dist/icons.json'));
  assert.equal(meta.length, manifest.length);
  for (const icon of meta) {
    const file = await read(`dist/svg/${icon.name}.svg`);
    assert.equal(file.trim(), icon.svg);
    assert.match(icon.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24" width="24" height="24"/);
    assert.ok(sprite.includes(`<symbol id="ic-${icon.name}"`), `${icon.name} missing from sprite`);
  }
  assert.equal(toSvg({ glyph: '<path d="M0 0"/>' }, 1.5).includes('stroke-width="1.5"'), true);
});

test('package entry points resolve to built files', async () => {
  for (const target of Object.values(pkg.exports)) {
    await stat(join(root, target.includes('*') ? target.replace('*', 'home.svg') : target));
  }
});

test('demo site is assembled', async () => {
  const html = await read('_site/index.html');
  for (const asset of ['ok-icons.min.css', 'ok-icons-weights.min.css', 'site.css', 'icons.js', 'app.js', 'theme.js', 'favicon.svg']) {
    assert.ok(html.includes(asset), `index.html should reference ${asset}`);
    await stat(join(root, '_site', asset));
  }
  assert.match(await read('_site/icons.js'), /^window\.OK_ICONS = /);
});
