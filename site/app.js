(() => {
  'use strict';

  const data = window.OK_ICONS;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    for (const child of [].concat(children)) node.append(child);
    return node;
  };

  if (!data || !Array.isArray(data.icons)) {
    $('#empty').hidden = false;
    $('#empty p').textContent = 'Could not load the icon list.';
    return;
  }

  const icons = data.icons;
  const state = { query: '', category: 'All', weight: 'regular', style: 'outline', size: 28, color: '', format: 'html' };
  const gallery = $('#gallery');

  $('#version').textContent = `v${data.version}`;
  $('#hero-count').textContent = icons.length;
  $('#search').placeholder = `Search ${icons.length} icons…`;

  // ------------------------------------------------------------- helpers

  const iconEl = (name, extra = '') => {
    const i = el('i', { className: `ic ic-${name}${extra ? ` ${extra}` : ''}` });
    i.setAttribute('aria-hidden', 'true');
    return i;
  };

  const classesFor = (name) =>
    ['ic', `ic-${name}`, state.weight !== 'regular' && `ic-${state.weight}`, state.style === 'duotone' && 'ic-duotone']
      .filter(Boolean)
      .join(' ');

  const svgFor = (icon) => icon.svg.replace('stroke-width="2"', `stroke-width="${data.weights[state.weight]}"`);

  const tune = {
    color: '',
    size: 120,
    padding: 0,
    flipH: false,
    flipV: false,
    rotate: 0,
    motion: '',
    showCode: true,
  };
  const presets = new Set(['', '#5b5bf7', '#e5488f', '#e8a317', '#14a38b']);
  const motions = ['spin', 'pulse', 'beat', 'bounce', 'shake'];

  function freshTune() {
    tune.color = state.color || '';
    tune.size = 120;
    tune.padding = 0;
    tune.flipH = false;
    tune.flipV = false;
    tune.rotate = 0;
    tune.motion = '';
  }

  const iconClasses = (name) =>
    ['ic', `ic-${name}`, state.weight !== 'regular' && `ic-${state.weight}`, state.style === 'duotone' && 'ic-duotone', tune.motion && `ic-${tune.motion}`]
      .filter(Boolean);

  const poseStyle = () => {
    const parts = [];
    if (tune.padding) parts.push(`padding:${tune.padding}px`);
    const transform = [];
    if (tune.rotate) transform.push(`rotate(${tune.rotate}deg)`);
    if (tune.flipH) transform.push('scaleX(-1)');
    if (tune.flipV) transform.push('scaleY(-1)');
    if (transform.length) parts.push(`transform:${transform.join(' ')}`);
    return parts.join(';');
  };

  const customizedSvg = (icon) => {
    let svg = svgFor(icon)
      .replace('width="24"', `width="${tune.size}"`)
      .replace('height="24"', `height="${tune.size}"`);
    if (tune.color) svg = svg.replaceAll('currentColor', tune.color);

    const group = [];
    if (tune.padding > 0 && tune.size > tune.padding * 2) {
      const inset = (tune.padding / tune.size) * 24;
      const scale = (24 - inset * 2) / 24;
      group.push(`translate(${inset.toFixed(2)} ${inset.toFixed(2)}) scale(${scale.toFixed(3)})`);
    }
    if (tune.rotate) group.push(`rotate(${tune.rotate} 12 12)`);
    if (tune.flipH || tune.flipV) {
      group.push(`translate(12 12) scale(${tune.flipH ? -1 : 1} ${tune.flipV ? -1 : 1}) translate(-12 -12)`);
    }
    if (group.length) svg = svg.replace(/(<svg\b[^>]*>)/, `$1<g transform="${group.join(' ')}">`).replace(/<\/svg>\s*$/, '</g></svg>');
    return svg;
  };

  const snippetFor = (icon) => {
    const classes = iconClasses(icon.name).join(' ');
    const iconStyle = [
      tune.size !== 24 ? `font-size:${tune.size}px` : '',
      tune.color ? `color:${tune.color}` : '',
    ].filter(Boolean).join(';');
    const styleAttr = iconStyle ? ` style="${iconStyle}"` : '';
    const wrap = poseStyle();

    if (state.format === 'svg') return customizedSvg(icon);
    if (state.format === 'react') {
      const style = {
        ...(tune.size !== 24 ? { fontSize: tune.size } : {}),
        ...(tune.color ? { color: tune.color } : {}),
        ...(tune.padding ? { padding: tune.padding } : {}),
        ...(tune.rotate || tune.flipH || tune.flipV
          ? { transform: [tune.rotate && `rotate(${tune.rotate}deg)`, tune.flipH && 'scaleX(-1)', tune.flipV && 'scaleY(-1)'].filter(Boolean).join(' ') }
          : {}),
      };
      const styleText = Object.keys(style).length ? ` style={${JSON.stringify(style).replace(/"([^"]+)":/g, '$1:').replace(/"([^"]+)"/g, "'$1'")}}` : '';
      return `<i\n  className="${classes}"${styleText}\n  aria-hidden\n/>`;
    }
    if (state.format === 'css') {
      return `.ic-${icon.name} {\n${[
        `  /* ${classes} */`,
        tune.size !== 24 ? `  font-size: ${tune.size}px;` : '',
        tune.color ? `  color: ${tune.color};` : '',
        tune.padding ? `  padding: ${tune.padding}px;` : '',
        wrap.includes('transform') ? `  transform: ${wrap.split('transform:')[1]};` : '',
      ].filter(Boolean).join('\n')}\n}`;
    }
    const tag = `<i class="${classes}"${styleAttr} aria-hidden="true"></i>`;
    return wrap ? `<span style="display:inline-flex;${wrap}">\n  ${tag}\n</span>` : tag;
  };

  let toastTimer;
  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  async function copyText(text, label = 'Copied to clipboard') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = el('textarea', { value: text, className: 'visually-hidden' });
        document.body.append(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        if (!ok) throw new Error('copy failed');
      }
      notify(label);
    } catch {
      notify('Copy failed. Select the text and copy it manually.');
    }
  }

  // ------------------------------------------------------------- hero art

  const mosaicIcons = [
    'heart', 'sparkle', 'bell', 'camera', 'settings', 'map-pin', 'star', 'cloud-upload', 'folder',
    'music', 'user', 'lock', 'mail', 'shopping-cart', 'globe', 'comment', 'moon', 'home',
  ];
  const mosaic = $('#mosaic');
  mosaicIcons.forEach((name, n) => {
    const tile = el('span', { className: `tile tile-${n % 6}` }, iconEl(name, n % 3 === 0 ? 'ic-duotone' : ''));
    tile.style.setProperty('--i', n);
    mosaic.append(tile);
  });

  // -------------------------------------------------------------- gallery

  const categories = ['All', ...new Set(icons.map((i) => i.category))];
  const chips = $('#chips');
  for (const category of categories) {
    const count = category === 'All' ? icons.length : icons.filter((i) => i.category === category).length;
    const chip = el('button', { type: 'button', className: 'chip' }, [category, el('span', { className: 'chip-count', textContent: count })]);
    chip.dataset.category = category;
    chip.setAttribute('aria-pressed', String(category === state.category));
    chips.append(chip);
  }

  const tiles = icons.map((icon, index) => {
    const button = el('button', { type: 'button', className: 'card' }, [
      iconEl(icon.name),
      el('span', { className: 'card-label', textContent: icon.name }),
    ]);
    button.dataset.index = index;
    button.setAttribute('aria-label', `${icon.name} icon`);
    gallery.append(button);
    const haystack = [icon.name, icon.category, ...icon.tags, ...(icon.aliases ?? [])].join(' ').toLowerCase();
    return { icon, button, haystack };
  });

  let visible = tiles;
  function applyFilter() {
    const terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
    visible = [];
    for (const tile of tiles) {
      const match =
        (state.category === 'All' || tile.icon.category === state.category) &&
        terms.every((t) => tile.haystack.includes(t));
      tile.button.hidden = !match;
      if (match) visible.push(tile);
    }
    $('#empty').hidden = visible.length > 0;
    $('#empty-term').textContent = state.query;
    $('#count').textContent =
      visible.length === icons.length ? `${icons.length} icons` : `${visible.length} of ${icons.length} icons`;
  }

  function applyAppearance() {
    gallery.style.setProperty('--ic-size', `${state.size}px`);
    gallery.style.setProperty('--tile', `${Math.max(104, state.size * 2 + 48)}px`);
    if (state.color) gallery.style.setProperty('--ic-color', state.color);
    else gallery.style.removeProperty('--ic-color');
    for (const cls of ['ic-light', 'ic-bold', 'ic-duotone']) gallery.classList.remove(cls);
    if (state.weight !== 'regular') gallery.classList.add(`ic-${state.weight}`);
    if (state.style === 'duotone') gallery.classList.add('ic-duotone');
    $('#size-value').textContent = state.size;
    if (dialog.open) renderDetail();
  }

  // --------------------------------------------------------------- inputs

  $('#controls').addEventListener('submit', (e) => e.preventDefault());
  $('#search').addEventListener('input', (e) => {
    state.query = e.target.value.trim();
    applyFilter();
  });
  $('#size').addEventListener('input', (e) => {
    state.size = Number(e.target.value);
    applyAppearance();
  });
  for (const radio of $$('input[name="weight"], input[name="style"]')) {
    radio.addEventListener('change', () => {
      state[radio.name] = radio.value;
      applyAppearance();
    });
  }
  for (const radio of $$('input[name="color"]')) {
    radio.addEventListener('change', () => {
      state.color = radio.value;
      applyAppearance();
    });
  }
  $('#color').addEventListener('input', (e) => {
    for (const radio of $$('input[name="color"]')) radio.checked = false;
    state.color = e.target.value;
    applyAppearance();
  });

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.category = chip.dataset.category;
    for (const c of chips.children) c.setAttribute('aria-pressed', String(c === chip));
    applyFilter();
  });

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      $('#search').focus();
      $('#search').select();
    }
  });

  for (const button of $$('[data-copy]')) {
    button.addEventListener('click', () => copyText($(button.dataset.copy).textContent));
  }

  // --------------------------------------------------------------- detail

  const dialog = $('#detail');
  let current = 0;

  function renderDetail() {
    const icon = icons[current];
    const big = $('#detail-icon');
    big.className = iconClasses(icon.name).join(' ');
    big.style.fontSize = `${Math.min(tune.size, 220)}px`;
    big.style.setProperty('--ic-color', tune.color || 'currentColor');
    const pose = $('#detail-pose');
    pose.style.padding = `${tune.padding}px`;
    const transform = [
      tune.rotate ? `rotate(${tune.rotate}deg)` : '',
      `scale(${tune.flipH ? -1 : 1}, ${tune.flipV ? -1 : 1})`,
    ].filter(Boolean).join(' ');
    pose.style.transform = transform;

    $('#detail-name').textContent = icon.name;
    $('#detail-category').textContent = icon.category;
    $('#tune-size-value').textContent = `${tune.size} px`;
    $('#tune-pad-value').textContent = String(tune.padding);
    $('#tune-rot-value').textContent = `${tune.rotate}°`;
    $('#flip-h').setAttribute('aria-pressed', String(tune.flipH));
    $('#flip-v').setAttribute('aria-pressed', String(tune.flipV));
    $('#tune-motion').value = tune.motion;
    const custom = $('#tune-color-custom');
    for (const input of $$('#tune-colors input[type="radio"]')) input.checked = input.value === tune.color;
    if (!presets.has(tune.color)) custom.value = tune.color || '#5b5bf7';

    const tags = $('#detail-tags');
    tags.replaceChildren(
      ...icon.tags.map((t) => el('span', { className: 'tag', textContent: t })),
      ...(icon.aliases ?? []).map((a) => el('span', { className: 'tag tag-alias', textContent: `alias: ${a}` })),
    );

    const sizes = $('#detail-sizes');
    sizes.replaceChildren(
      ...[16, 20, 24, 32, 48].map((px) => {
        const i = iconEl(icon.name, [state.weight !== 'regular' && `ic-${state.weight}`, state.style === 'duotone' && 'ic-duotone'].filter(Boolean).join(' '));
        i.style.fontSize = `${px}px`;
        if (tune.color) i.style.setProperty('--ic-color', tune.color);
        return el('span', { className: 'size-sample', title: `${px}px` }, i);
      }),
    );

    $('#snippet').textContent = snippetFor(icon);
    $('#detail-code').hidden = !tune.showCode;
    $('#toggle-code').textContent = tune.showCode ? 'Hide code' : 'Show code';
    for (const tab of $$('#detail [role="tab"]')) {
      const selected = tab.dataset.format === state.format;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) $('#snippet-panel').setAttribute('aria-labelledby', tab.id);
    }
    history.replaceState(null, '', `#icon=${icon.name}`);
  }

  function openDetail(index) {
    current = index;
    freshTune();
    renderDetail();
    if (!dialog.open) dialog.showModal();
  }

  function step(delta) {
    const order = visible.length ? visible.map((t) => icons.indexOf(t.icon)) : icons.map((_, i) => i);
    const pos = order.indexOf(current);
    current = order[(pos + delta + order.length) % order.length];
    freshTune();
    renderDetail();
  }

  gallery.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) openDetail(Number(card.dataset.index));
  });

  $('#detail-close').addEventListener('click', () => dialog.close());
  $('#detail-prev').addEventListener('click', () => step(-1));
  $('#detail-next').addEventListener('click', () => step(1));
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // backdrop click
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.target.closest('select, input, textarea, [role="tab"]')) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  dialog.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname + location.search);
    tiles[current].button.focus();
  });

  const tabs = $$('[role="tab"]');
  tabs.forEach((tab, n) => {
    tab.addEventListener('click', () => {
      state.format = tab.dataset.format;
      renderDetail();
    });
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(n + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

  $('#copy-snippet').addEventListener('click', () => copyText($('#snippet').textContent, `Copied ${state.format.toUpperCase()}`));
  $('#download-svg').addEventListener('click', () => {
    const icon = icons[current];
    const url = URL.createObjectURL(new Blob([customizedSvg(icon)], { type: 'image/svg+xml' }));
    const a = el('a', { href: url, download: `${icon.name}.svg` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('#toggle-code').addEventListener('click', () => {
    tune.showCode = !tune.showCode;
    renderDetail();
  });

  $('#tune').addEventListener('change', (event) => {
    const target = event.target;
    if (target.name === 'tune-color') tune.color = target.value;
    if (target.id === 'tune-color-custom') tune.color = target.value;
    if (target.id === 'tune-motion') tune.motion = motions.includes(target.value) ? target.value : '';
    renderDetail();
  });
  $('#tune-color-custom').addEventListener('input', (event) => {
    tune.color = event.target.value;
    renderDetail();
  });

  const bump = (key, delta, min, max, step) => {
    tune[key] = Math.min(max, Math.max(min, tune[key] + delta * step));
    renderDetail();
  };
  $('#size-dec').addEventListener('click', () => bump('size', -1, 16, 256, 8));
  $('#size-inc').addEventListener('click', () => bump('size', 1, 16, 256, 8));
  $('#pad-dec').addEventListener('click', () => bump('padding', -1, 0, 32, 4));
  $('#pad-inc').addEventListener('click', () => bump('padding', 1, 0, 32, 4));
  $('#rot-dec').addEventListener('click', () => {
    tune.rotate = (tune.rotate + 315) % 360;
    renderDetail();
  });
  $('#rot-inc').addEventListener('click', () => {
    tune.rotate = (tune.rotate + 45) % 360;
    renderDetail();
  });
  $('#flip-h').addEventListener('click', () => {
    tune.flipH = !tune.flipH;
    renderDetail();
  });
  $('#flip-v').addEventListener('click', () => {
    tune.flipV = !tune.flipV;
    renderDetail();
  });

  // ---------------------------------------------------------------- theme

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const isDark = () => (root.dataset.theme ?? (media.matches ? 'dark' : 'light')) === 'dark';
  const syncTheme = () => $('#theme-toggle').setAttribute('aria-pressed', String(isDark()));

  $('#theme-toggle').addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try {
      localStorage.setItem('ok-icons-theme', root.dataset.theme);
    } catch {
      /* storage unavailable */
    }
    syncTheme();
  });
  media.addEventListener('change', syncTheme);

  // ----------------------------------------------------------------- init

  applyAppearance();
  applyFilter();
  syncTheme();

  const deepLink = location.hash.match(/^#icon=([a-z0-9-]+)$/);
  if (deepLink) {
    const index = icons.findIndex((i) => i.name === deepLink[1] || i.aliases?.includes(deepLink[1]));
    if (index >= 0) openDetail(index);
  }
})();
