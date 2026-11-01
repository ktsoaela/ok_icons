(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const svgNS = 'http://www.w3.org/2000/svg';
  const motions = ['spin', 'pulse', 'beat', 'bounce', 'shake'];
  const check = [
    { x: 20, y: 6 },
    { x: 9, y: 17 },
    { x: 4, y: 12 },
  ];

  const points = [];
  const pad = $('#pad');
  const padPath = $('#pad-path');
  const padPoints = $('#pad-points');
  const stroke = $('#your-stroke');
  const strokePath = stroke.querySelector('path');
  const icon = $('#your-icon');

  const root = document.documentElement;
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ?? (themeMedia.matches ? 'dark' : 'light')) === 'dark';
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
  themeMedia.addEventListener('change', syncTheme);
  syncTheme();

  let toastTimer;
  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.className = 'visually-hidden';
        document.body.append(area);
        area.select();
        const ok = document.execCommand('copy');
        area.remove();
        if (!ok) throw new Error('copy failed');
      }
      notify('Copied');
    } catch {
      notify('Copy failed. Select the text and copy it manually.');
    }
  }

  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', () => copyText($(button.dataset.copy).textContent));
  }

  const clamp = (n) => Math.max(0, Math.min(24, Math.round(Number(n))));

  function iconName() {
    const raw = ($('#icon-name').value || 'my-icon').toLowerCase().trim();
    const name = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return name || 'my-icon';
  }

  function pathD() {
    return points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  }

  function svgMarkup(d) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <path d="${d}"/>\n</svg>\n`;
  }

  function maskUri(d) {
    const raw = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${d}'/></svg>`;
    const encoded = raw.replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E');
    return `url("data:image/svg+xml,${encoded}")`;
  }

  function cssMarkup(d) {
    const name = iconName();
    return `.ic-${name} {\n  --ic-g: ${maskUri(d)};\n}\n`;
  }

  function choice() {
    return document.querySelector('input[name="motion"]:checked')?.value || 'still';
  }

  function playDraw() {
    const len = strokePath.getTotalLength();
    if (!len) return;
    strokePath.style.strokeDasharray = String(len);
    strokePath.style.strokeDashoffset = String(len);
    strokePath.classList.remove('is-drawing');
    strokePath.getBoundingClientRect();
    strokePath.classList.add('is-drawing');
  }

  function applyMotion() {
    stroke.classList.remove(...motions.map((name) => `ic-${name}`));
    icon.className = 'ic';
    strokePath.classList.remove('is-drawing');
    strokePath.style.strokeDasharray = '';
    strokePath.style.strokeDashoffset = '';
    const motion = choice();
    if (points.length < 2) return;
    if (motion === 'draw') playDraw();
    else if (motions.includes(motion)) {
      stroke.classList.add(`ic-${motion}`);
      icon.classList.add(`ic-${motion}`);
    }
  }

  function render() {
    const d = pathD();
    padPath.setAttribute('d', d);
    strokePath.setAttribute('d', d);
    padPoints.replaceChildren();
    for (const point of points) {
      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      dot.setAttribute('r', '0.55');
      padPoints.append(dot);
    }

    const ready = points.length >= 2;
    icon.hidden = !ready;
    if (ready) icon.style.setProperty('--ic-g', maskUri(d));
    else icon.style.removeProperty('--ic-g');

    $('#out-svg').textContent = ready ? svgMarkup(d) : 'Draw at least two points.';
    $('#out-css').textContent = ready ? cssMarkup(d) : 'The class appears once the path has two points.';
    $('#point-count').textContent = points.length
      ? `${points.length} point${points.length === 1 ? '' : 's'} · ${points.map((p) => `${p.x},${p.y}`).join(' → ')}`
      : 'No points yet';

    const status = $('#draw-status');
    const motion = choice();
    if (!ready) {
      status.textContent = 'Click the sheet to place the first points of your icon.';
      status.classList.remove('is-done');
    } else if (motion === 'still') {
      status.textContent = 'Your icon is drawn. Choose a motion to finish the tutorial.';
      status.classList.remove('is-done');
    } else {
      status.textContent = 'You drew an icon and set it in motion.';
      status.classList.add('is-done');
    }
    applyMotion();
  }

  function addPoint(x, y) {
    const point = { x: clamp(x), y: clamp(y) };
    const last = points.at(-1);
    if (last && last.x === point.x && last.y === point.y) return;
    if (points.length >= 16) {
      notify('Sixteen points is enough for a simple icon.');
      return;
    }
    points.push(point);
    render();
  }

  pad.addEventListener('pointerdown', (event) => {
    const box = pad.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 24;
    const y = ((event.clientY - box.top) / box.height) * 24;
    addPoint(x, y);
  });

  $('#point-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addPoint($('#pt-x').value, $('#pt-y').value);
  });

  $('#undo-point').addEventListener('click', () => {
    points.pop();
    render();
  });

  $('#clear-pad').addEventListener('click', () => {
    points.length = 0;
    render();
  });

  $('#use-check').addEventListener('click', () => {
    points.splice(0, points.length, ...check.map((p) => ({ ...p })));
    render();
  });

  $('#icon-name').addEventListener('input', render);
  for (const input of document.querySelectorAll('input[name="motion"]')) {
    input.addEventListener('change', render);
  }

  $('#copy-svg').addEventListener('click', () => {
    if (points.length < 2) return notify('Add two points first.');
    copyText(svgMarkup(pathD()));
  });
  $('#copy-css').addEventListener('click', () => {
    if (points.length < 2) return notify('Add two points first.');
    copyText(cssMarkup(pathD()));
  });

  render();
})();
