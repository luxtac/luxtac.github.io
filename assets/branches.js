// Two thin parallel "branches" in the left margin, one per gel cartridge (Mode 1 / Mode 2),
// like a git graph: one trunk forks at the cartridges in the hero, runs down the page with a
// dot wherever a mode is discussed, and merges again before the BibTeX.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const GAP = 12;            // px between the two branches
  const MIN_GUTTER = 64;     // hide when the side margin is narrower than this

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'mode-branches');
  svg.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svg);

  // elements -> which branch gets a dot: 1, 2, or 'both'
  function targets() {
    const out = [];
    const add = (el, m) => el && out.push({ el, m });
    document.querySelectorAll('.hero-cartridges b').forEach(b =>
      add(b, /shear/i.test(b.textContent) ? 2 : 1));
    document.querySelectorAll('#abstract .lead p').forEach(p => {
      if (/two interchangeable gel cartridges/i.test(p.textContent)) add(p, 'both');
    });
    document.querySelectorAll('#principle p').forEach(p => {
      if (/shear-encoded gel/i.test(p.textContent)) add(p, 2);
    });
    document.querySelectorAll('h3.mode-heading').forEach(h => {
      const t = h.textContent;
      if (/two modes/i.test(t)) add(h, 'both');
      else if (/mode\s*1/i.test(t)) add(h, 1);
      else if (/mode\s*2/i.test(t)) add(h, 2);
    });
    document.querySelectorAll('table td b').forEach(b => {
      if (/^normal cartridge$/i.test(b.textContent.trim())) add(b, 1);
      if (/^shear cartridge$/i.test(b.textContent.trim())) add(b, 2);
    });
    return out;
  }

  const absY = el => { const r = el.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; };

  function draw() {
    const container = document.querySelector('.section .container') || document.querySelector('.container');
    const cRect = container.getBoundingClientRect();
    const gutter = cRect.left;
    const H = document.documentElement.scrollHeight;
    svg.style.height = H + 'px';
    svg.innerHTML = '';
    if (gutter < MIN_GUTTER) return;

    const x1 = Math.round(gutter - 34), x2 = x1 + GAP, xt = x1 + GAP / 2;
    const hero = document.querySelector('.hero-cartridges') || document.querySelector('.hero');
    const bib = document.getElementById('bibtex');
    const yFork = absY(hero) - 40;
    const yTop = (document.querySelector('nav')?.offsetHeight || 60) + 20;
    const yMerge = bib ? bib.getBoundingClientRect().top + window.scrollY - 40 : H - 120;
    const yEnd = Math.min(H - 40, yMerge + 120);
    const bend = 26;

    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<linearGradient id="mb-rainbow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="900" spreadMethod="repeat">' +
      '<stop offset="0" stop-color="#ff2d78"/><stop offset=".2" stop-color="#ff7a18"/><stop offset=".4" stop-color="#ffd60a"/>' +
      '<stop offset=".6" stop-color="#30d158"/><stop offset=".8" stop-color="#0aa5ff"/><stop offset="1" stop-color="#ff2d78"/>' +
      '</linearGradient>';
    svg.appendChild(defs);

    const path = (d, cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.appendChild(p); };
    // trunk, fork, two branches, merge, trunk
    path(`M${xt},${yTop} L${xt},${yFork}`, 'mb-trunk');
    path(`M${xt},${yFork} C${xt},${yFork + bend} ${x1},${yFork + bend} ${x1},${yFork + 2 * bend} L${x1},${yMerge - 2 * bend} C${x1},${yMerge - bend} ${xt},${yMerge - bend} ${xt},${yMerge}`, 'mb-m1');
    path(`M${xt},${yFork} C${xt},${yFork + bend} ${x2},${yFork + bend} ${x2},${yFork + 2 * bend} L${x2},${yMerge - 2 * bend} C${x2},${yMerge - bend} ${xt},${yMerge - bend} ${xt},${yMerge}`, 'mb-m2');
    path(`M${xt},${yMerge} L${xt},${yEnd}`, 'mb-trunk');

    const dot = (x, y, cls, r) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); c.setAttribute('class', cls); svg.appendChild(c); };
    dot(xt, yFork, 'mb-node-trunk', 3.5);
    dot(xt, yMerge, 'mb-node-trunk', 3.5);

    // branch labels just below the fork
    const label = (x, y, text, cls) => { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', cls); t.textContent = text; svg.appendChild(t); };
    label(x1 - 8, yFork + 2 * bend + 14, 'Mode 1', 'mb-label mb-label-1');
    label(x2 + 8, yFork + 2 * bend + 14, 'Mode 2', 'mb-label mb-label-2');

    const lo = yFork + 2 * bend + 4, hi = yMerge - 2 * bend - 4;
    targets().forEach(({ el, m }) => {
      if (!el.offsetParent && el.tagName !== 'B') return;      // hidden
      const y = absY(el);
      if (y < lo || y > hi) return;
      if (m === 1 || m === 'both') dot(x1, y, 'mb-node-1', 3.6);
      if (m === 2 || m === 'both') dot(x2, y, 'mb-node-2', 3.6);
    });
  }

  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  document.fonts && document.fonts.ready.then(schedule);
  schedule();
})();
