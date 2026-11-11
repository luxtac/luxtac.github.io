// Two thin "git branches", one per gel cartridge. Each line runs through its own mode's content:
// Mode 1 (normal cartridge) through the normal-cartridge photo, panel, column, stack, fabrication
// and results; Mode 2 (shear cartridge) through the shear ones. The SVG sits above the section
// backgrounds but below the page content, so a line disappears behind each block it passes
// through and reappears in the gaps between them. One trunk forks at the top and merges at BibTeX.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const MIN_WIDTH = 900;          // too cramped below this; hide

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'mode-branches');
  svg.setAttribute('aria-hidden', 'true');
  document.body.appendChild(svg);

  const rect = el => {
    const r = el.getBoundingClientRect();
    return { l: r.left + scrollX, r: r.right + scrollX, t: r.top + scrollY, b: r.bottom + scrollY, cx: r.left + scrollX + r.width / 2 };
  };
  const span = (els) => {           // union of several elements
    const rs = els.filter(Boolean).map(rect);
    if (!rs.length) return null;
    const l = Math.min(...rs.map(q => q.l)), r = Math.max(...rs.map(q => q.r));
    return { l, r, t: Math.min(...rs.map(q => q.t)), b: Math.max(...rs.map(q => q.b)), cx: (l + r) / 2 };
  };
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const byText = (sel, re) => qa(sel).find(e => re.test(e.textContent));

  // waypoints: {x, t, b} in page coordinates, in reading order, per mode.
  // Visual blocks (photos, renders, animations, plots) are crossed through the middle, hidden
  // behind them; text-heavy tables are followed along their outer edge instead.
  function waypoints() {
    const w1 = [], w2 = [];
    const through = (arr, el) => { if (el) { const r = rect(el); arr.push({ x: r.cx, t: r.t, b: r.b }); } };
    const edge = (arr, x, t, b) => arr.push({ x, t, b });

    const cart = (arr, c) => { if (!c) return; const L = rect(c.querySelector('.cart-lens') || c), C = rect(c); arr.push({ x: L.cx, t: L.t, b: L.b, out: C.b }); };
    cart(w1, q('.cart-normal')); cart(w2, q('.cart-shear'));

    const vis = el => el && (el.querySelector('svg, img, canvas, video') || el);
    const panels = qa('#principle .pi-panel');
    through(w1, vis(panels[0])); through(w2, vis(panels[1]));

    const mt = q('table.mode-table');
    if (mt) {
      const th = mt.querySelectorAll('tr:first-child th'), T = rect(mt);
      if (th[1]) edge(w1, rect(th[1]).l + 3, T.t, T.b);
      edge(w2, T.r - 3, T.t, T.b);
    }

    qa('#design figure.m1').forEach(f => through(w1, f.querySelector('.fig-card, .corona') || f));
    qa('#design figure.m2').forEach(f => through(w2, f.querySelector('.fig-card, .corona') || f));

    const fab = qa('#fabrication .fab-anim');
    through(w1, fab[0] && fab[0].querySelector('.corona')); through(w2, fab[1] && fab[1].querySelector('.corona'));

    const cards = qa('#results figure.char-fig .fig-card');
    through(w1, cards[0]); through(w2, cards[1]);

    const nb = byText('#results table td b', /^\s*normal cartridge\s*$/i);
    const sb = byText('#results table td b', /^\s*shear cartridge\s*$/i);
    if (nb && sb) {
      const T = rect(nb.closest('table'));
      edge(w1, T.l + 2, rect(nb).t - 8, rect(sb).t - 14);
      edge(w2, T.r - 2, rect(sb).t - 8, T.b);
    }
    return [w1, w2];
  }

  // Each line stays in its own side margin (Mode 1 left, Mode 2 right) and swings into a block
  // right at the block's top edge, runs down through it (hidden behind it), and swings back out at
  // its bottom edge. The swings happen mostly behind the block, so they never cross nearby text.
  function pathThrough(start, pts, end, gx) {
    let d = `M${start.x},${start.y}`;
    let cur = { x: start.x, y: start.y };
    const line = (x, y) => { d += ` L${x},${y}`; cur = { x, y }; };
    const curve = (c1x, c1y, c2x, c2y, x, y) => { d += ` C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`; cur = { x, y }; };
    pts.forEach((p, i) => {
      const E = Math.min(40, (p.b - p.t) / 4);
      if (i === 0) {                                   // from the fork straight into the first block
        const my = (cur.y + p.t) / 2;
        curve(cur.x, my, p.x, my, p.x, p.t + E);
      } else {                                         // turn in below the block's top edge
        line(gx, p.t + E);
        curve(p.x, p.t + E, p.x, p.t + E, p.x, p.t + 2 * E);
      }
      line(p.x, p.b - 2 * E);
      curve(p.x, p.b - E, p.x, p.b - E, gx, p.b - E);  // turn out above the block's bottom edge
    });
    line(gx, end.y - 60);
    curve(gx, end.y, gx, end.y, end.x, end.y);
    return d;
  }

  function draw() {
    const H = document.documentElement.scrollHeight;
    svg.style.height = H + 'px';
    svg.innerHTML = '';
    if (window.innerWidth < MIN_WIDTH) return;

    const [w1, w2] = waypoints();
    if (!w1.length || !w2.length) return;

    const hero = q('.hero .container') || q('.hero');
    const bib = q('#bibtex');
    const cx = document.documentElement.clientWidth / 2;
    const yTop = rect(hero).t + 10;
    const yFork = Math.min(w1[0].t, w2[0].t) - 40;
    const yMerge = bib ? rect(bib).t + 30 : H - 80;
    const yEnd = bib ? rect(bib).t + 70 : H - 40;

    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<linearGradient id="mb-rainbow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1200" spreadMethod="repeat">' +
      '<stop offset="0" stop-color="#ff2d78"/><stop offset=".2" stop-color="#ff7a18"/><stop offset=".4" stop-color="#ffd60a"/>' +
      '<stop offset=".6" stop-color="#30d158"/><stop offset=".8" stop-color="#0aa5ff"/><stop offset="1" stop-color="#ff2d78"/>' +
      '</linearGradient>';
    svg.appendChild(defs);

    const path = (d, cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.appendChild(p); };
    const dot = (x, y, cls, r) => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); c.setAttribute('class', cls); svg.appendChild(c); };

    path(`M${cx},${yTop} L${cx},${yFork}`, 'mb-trunk');
    const C = rect(q('.section > .container') || q('.container'));
    path(pathThrough({ x: cx, y: yFork }, w1, { x: cx, y: yMerge }, C.l - 6), 'mb-m1');
    path(pathThrough({ x: cx, y: yFork }, w2, { x: cx, y: yMerge }, C.r + 6), 'mb-m2');
    path(`M${cx},${yMerge} L${cx},${yEnd}`, 'mb-trunk');
    dot(cx, yFork, 'mb-node-trunk', 3.5);
    dot(cx, yMerge, 'mb-node-trunk', 3.5);
    // small nodes where a line enters a mode block
    w1.forEach(p => dot(p.x, p.t, 'mb-node-1', 3));
    w2.forEach(p => dot(p.x, p.t, 'mb-node-2', 3));
  }

  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  document.fonts && document.fonts.ready.then(schedule);
  // reveal-on-scroll animations shift elements slightly; redraw once they have settled
  setTimeout(schedule, 1500);
  schedule();
})();
