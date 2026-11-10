// Scroll reveal, same feel as the PhoTac site: replays every pass.
  (function () {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('visible', e.isIntersecting); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  })();

(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var W = 600, H = 340;
  var GX0 = 60, GX1 = 460, PCB_Y = 250;
  var LED_X = 200, DET_X = 320, DEV_Y = 263;
  var DEF = { force: 45, pos: 57, width: 43, rays: 12, glow: 100, gel: 40, walls: true };
  var S = { force: 45, pos: 57, width: 43, rays: 12, glow: 100, gel: 40, walls: true };
  function gelH(){ return 90 + (S.gel / 100) * 80; }
  function gelTop(){ return PCB_Y - gelH(); }
  function pressX(){ return GX0 + (S.pos / 100) * (GX1 - GX0); }
  function sigma(){ return 30 + (S.width / 100) * 110; }
  function maxDent(){ return (S.force / 100) * gelH() * 0.55; }
  // The indenter is a circle of radius sigma(). Its contacting edge is a
  // half circle, and the dent follows that curve: the gel surface is the
  // circle's lower arc where it dips below the flat roof, flat elsewhere.
  function dentAt(x){
    var R = sigma();
    var D = maxDent();
    var dx = x - pressX();
    if (Math.abs(dx) > R) return 0;
    return Math.max(0, D - R + Math.sqrt(Math.max(0, R * R - dx * dx)));
  }
  function roofY(x){ return gelTop() + dentAt(x); }
  function el(name, attrs){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function text(x, y, str, attrs){
    var t = el('text', Object.assign({ x: x, y: y, 'font-size': 13, 'font-family': 'Noto Sans, sans-serif' }, attrs || {}));
    t.textContent = str;
    return t;
  }
  function buildPanel(svg, deformed){
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = document.createElementNS(NS, 'defs');
    if (deformed){
      var marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', 'pdArr');
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('orient', 'auto-start-reverse');
      var mp = document.createElementNS(NS, 'path');
      mp.setAttribute('d', 'M0,0 L10,5 L0,10 z');
      mp.setAttribute('fill', '#ff2d78');
      marker.appendChild(mp);
      defs.appendChild(marker);
    }
    svg.appendChild(defs);
    var top = gelTop();
    // The surface the rays bounce off: the dented roof in the deformed panel,
    // the flat roof in the static (no force) panel. The rays must follow the
    // same surface that is drawn, or the static panel shows deformed rays.
    function surfY(x){ return deformed ? roofY(x) : top; }
    var NPTS = 60, pts = [], i, x;
    for (i = 0; i <= NPTS; i++){
      x = GX0 + (GX1 - GX0) * i / NPTS;
      pts.push([x, deformed ? roofY(x) : top]);
    }
    var d = 'M' + pts[0][0] + ',' + pts[0][1].toFixed(1);
    for (i = 1; i < pts.length; i++) d += ' L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
    d += ' L' + GX1 + ',' + PCB_Y + ' L' + GX0 + ',' + PCB_Y + ' Z';
    svg.appendChild(el('path', { d: d, fill: '#e8e4da', opacity: '0.92' }));
    var rd = 'M' + pts[0][0] + ',' + pts[0][1].toFixed(1);
    for (i = 1; i < pts.length; i++) rd += ' L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
    svg.appendChild(el('path', { d: rd, stroke: '#111111', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }));
    svg.appendChild(text(GX1 + 8, top + 16, 'opaque black film', { fill: '#a8a8ad', 'font-size': 12 }));
    svg.appendChild(text(260, top + 34, 'white scattering silicone (XP-565)', { fill: '#555555', 'text-anchor': 'middle' }));
    svg.appendChild(el('rect', { x: GX0, y: PCB_Y, width: GX1 - GX0, height: 26, rx: 4, fill: '#2a2a2e' }));
    svg.appendChild(el('rect', { x: LED_X - 8, y: DEV_Y - 7, width: 16, height: 14, rx: 2, fill: '#ffd60a' }));
    svg.appendChild(text(LED_X - 14, DEV_Y + 4, 'LED', { fill: '#ffd60a', 'font-weight': 700, 'text-anchor': 'end' }));
    svg.appendChild(el('rect', { x: DET_X - 8, y: DEV_Y - 7, width: 16, height: 14, rx: 2, fill: '#0aa5ff' }));
    svg.appendChild(text(DET_X + 14, DEV_Y + 4, 'TCS34725', { fill: '#0aa5ff', 'font-weight': 700 }));
    svg.appendChild(text(260, 306, 'flex PCB', { fill: '#a8a8ad', 'text-anchor': 'middle' }));
    if (deformed && S.force > 2){
      var R = sigma();
      var D = maxDent();
      var cx = pressX();
      var cy = top + D - R;
      var iy = top - 52;
      var ip = 'M' + (cx - R).toFixed(1) + ',' + iy + ' L' + (cx + R).toFixed(1) + ',' + iy + ' L' + (cx + R).toFixed(1) + ',' + cy.toFixed(1) + ' A' + R.toFixed(1) + ',' + R.toFixed(1) + ' 0 0 1 ' + (cx - R).toFixed(1) + ',' + cy.toFixed(1) + ' Z';
      svg.appendChild(el('path', { d: ip, fill: '#8a8a8e', stroke: '#5a5a5e', 'stroke-width': 1 }));
      svg.appendChild(el('line', { x1: cx, y1: iy - 26, x2: cx, y2: iy - 4, stroke: '#ff2d78', 'stroke-width': 3, 'marker-end': 'url(#pdArr)' }));
      svg.appendChild(text(cx, iy + 20, 'force', { fill: '#ffffff', 'font-weight': 700, 'text-anchor': 'middle' }));
    }
    // Colored sides: the left wall is painted red, the right wall green.
    // The roof is the opaque black film (the thick black stroke above).
    var topL = deformed ? roofY(GX0) : top;
    var topR = deformed ? roofY(GX1) : top;
    svg.appendChild(el('line', { x1: GX0, y1: topL, x2: GX0, y2: PCB_Y, stroke: '#ff3b30', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    svg.appendChild(el('line', { x1: GX1, y1: topR, x2: GX1, y2: PCB_Y, stroke: '#30d158', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    function dist(x1, y1, x2, y2){ return Math.hypot(x2 - x1, y2 - y1); }
    // Desaturate an [r,g,b] color toward mid gray by amt (0..1): the far end
    // of a return is a less vibrant version of the color at the bounce.
    function desat(c, amt){
      return 'rgb(' + Math.round(c[0] + (128 - c[0]) * amt) + ',' +
                      Math.round(c[1] + (128 - c[1]) * amt) + ',' +
                      Math.round(c[2] + (128 - c[2]) * amt) + ')';
    }
    var gradN = 0;
    // Cast one ray from the LED at angleDeg from straight up (negative is to
    // the left). March along it in small steps; the first surface it meets
    // is the bounce point. The dented roof is the black film, so a ray the
    // dent pushes into the ceiling returns black, not a wall color. The
    // reflected lines therefore move with the shape of the indentation.
    function castRay(angleDeg){
      var a = angleDeg * Math.PI / 180;
      var dx = Math.sin(a), dy = -Math.cos(a);
      var step = 1.5, t, x, y;
      for (t = step; t < 800; t += step){
        x = LED_X + dx * t;
        y = DEV_Y + dy * t;
        if (x >= GX0 && x <= GX1 && y <= surfY(x)) return { x: x, y: y, surf: 'top' };
        if (x <= GX0 && y >= surfY(GX0) && y <= PCB_Y) return { x: GX0, y: y, surf: 'left' };
        if (x >= GX1 && y >= surfY(GX1) && y <= PCB_Y) return { x: GX1, y: y, surf: 'right' };
        if (x < GX0 - 5 || x > GX1 + 5) return null;
      }
      return null;
    }
    // A beam goes out white from the LED, bounces, and comes back to the
    // sensor in the color of what it bounced off of. The return is drawn
    // with a strong gradient along its length: pure vibrant color, fully
    // opaque, right at the bounce point, fading steadily to a pale, nearly
    // transparent, desaturated version of that color by the time it
    // reaches the sensor. The fade is meant to be plainly visible.
    // The fade is tied directly to the actual distance the light travels,
    // with a fixed reference, never normalized by the fan. When deformation
    // brings a bounce closer to the sensor, the return leg shortens and the
    // beam that reaches the sensor is brighter. Far bounces stay dim.
    function ray(bx, by, surf){
      var outLen = dist(LED_X, DEV_Y, bx, by);
      var retLen = dist(bx, by, DET_X, DEV_Y);
      var glowF = S.glow / 100;
      var outOp = (0.95 - 0.5 * Math.min(1, outLen / 340)) * glowF;
      svg.appendChild(el('path', { d: 'M' + LED_X + ',' + DEV_Y + ' L' + bx.toFixed(1) + ',' + by.toFixed(1), stroke: '#ffffff', 'stroke-width': 2.2, opacity: outOp, fill: 'none', 'stroke-linecap': 'round' }));
      var col, base;
      if (surf === 'left'){ col = [255, 59, 48]; base = 0.95; }
      else if (surf === 'right'){ col = [48, 209, 88]; base = 0.95; }
      else { col = [0, 0, 0]; base = 0.95; }
      var retOp = base * (1 - 0.7 * Math.min(1, retLen / 340)) * glowF;
      var gid = 'pdg' + (gradN++);
      var g = document.createElementNS(NS, 'linearGradient');
      g.setAttribute('id', gid);
      g.setAttribute('gradientUnits', 'userSpaceOnUse');
      g.setAttribute('x1', bx.toFixed(1)); g.setAttribute('y1', by.toFixed(1));
      g.setAttribute('x2', DET_X); g.setAttribute('y2', DEV_Y);
      var s0 = document.createElementNS(NS, 'stop');
      s0.setAttribute('offset', '0%');
      s0.setAttribute('stop-color', 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')');
      s0.setAttribute('stop-opacity', retOp.toFixed(3));
      // A beam that bounced off the roof/dent stays black and fades in
      // opacity only, so it starts black at the reflection and fades to
      // transparent by the sensor. Wall returns keep their color.
      var sm = document.createElementNS(NS, 'stop');
      sm.setAttribute('offset', '50%');
      sm.setAttribute('stop-color', surf === 'top' ? 'rgb(0,0,0)' : desat(col, 0.45));
      sm.setAttribute('stop-opacity', (retOp * (surf === 'top' ? 0.5 : 0.55)).toFixed(3));
      var s1 = document.createElementNS(NS, 'stop');
      s1.setAttribute('offset', '100%');
      s1.setAttribute('stop-color', surf === 'top' ? 'rgb(0,0,0)' : desat(col, 0.85));
      s1.setAttribute('stop-opacity', (retOp * (surf === 'top' ? 0.05 : 0.2)).toFixed(3));
      g.appendChild(s0); g.appendChild(sm); g.appendChild(s1);
      defs.appendChild(g);
      svg.appendChild(el('path', { d: 'M' + bx.toFixed(1) + ',' + by.toFixed(1) + ' L' + DET_X + ',' + DEV_Y, stroke: 'url(#' + gid + ')', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
    }
    // Cast the rays as a fan from the LED. Each ray finds the first surface
    // it meets, so the bounce points follow the dented roof.
    var n = Math.round(S.rays), j;
    for (j = 0; j < n; j++){
      var ang = -70 + 140 * (n === 1 ? 0.5 : j / (n - 1));
      var hit = castRay(ang);
      if (!hit) continue;
      if (!S.walls && hit.surf !== 'top') continue;
      ray(hit.x, hit.y, hit.surf);
    }
  }
  function render(){
    if (!document.getElementById('panelA')) return;
    buildPanel(document.getElementById('panelA'), false);
    buildPanel(document.getElementById('panelB'), true);
  }
  // Static figure now: fixed parameters, no sliders, no toggles.
  render();
})();

(function(){
  var stems = ['demo1','part1','part2','part3','part4'];
  function play(v){ var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  stems.forEach(function(stem){
    var screen = document.querySelector('video[src*="' + stem + '-screen"]');
    var real = document.querySelector('video[src*="' + stem + '-real"]');
    if(!screen || !real) return;
    var syncing = false;
    function syncFrom(a, b){
      if(syncing) return;
      var d = a.currentTime - b.currentTime;
      if(Math.abs(d) > 0.25){
        syncing = true;
        b.currentTime = a.currentTime;
        setTimeout(function(){ syncing = false; }, 100);
      }
    }
    screen.addEventListener('timeupdate', function(){ syncFrom(screen, real); });
    real.addEventListener('timeupdate', function(){ syncFrom(real, screen); });
    screen.addEventListener('play', function(){ if(real.paused) play(real); });
    real.addEventListener('play', function(){ if(screen.paused) play(screen); });
    screen.addEventListener('pause', function(){ if(!real.paused) real.pause(); });
    real.addEventListener('pause', function(){ if(!screen.paused) screen.pause(); });
  });
})();


/* Robot experiments carousel: two task slides, each a success row over a failure row.
   Clips on the visible slide play together, fade to black with the outcome, and restart together. */
(function () {
  var track = document.getElementById('expTrack');
  if (!track) return;
  var slides = Array.prototype.slice.call(track.querySelectorAll('.exp-slide'));
  var counter = document.getElementById('expCounter');
  var dots = document.querySelectorAll('.exp-dots button');
  var total = slides.length, idx = 0, inView = false, pos = 1, animating = false;
  var HOLD = 2200; // ms all outcome cards stay up after the longest clip ends

  // True carousel: clone the first and last slides so the track always moves in
  // the direction of the arrow pressed, even with only two slides. The clones
  // sit at the ends; after sliding onto one, the track snaps back to the real
  // slide with no animation, so the motion never reverses.
  if (total > 1) {
    track.appendChild(slides[0].cloneNode(true));
    track.insertBefore(slides[total - 1].cloneNode(true), slides[0]);
    track.style.transform = 'translateX(-100%)';
  }

  function clipsOf(slide) { return slide.querySelectorAll('.exp-clip'); }

  // One shared cycle per slide: every clip starts together, each fades to its
  // outcome when it ends, and once the longest has ended the whole slide restarts.
  function stopSlide(s) {
    clearTimeout(s._t);
    clipsOf(s).forEach(function (c) { c.classList.remove('ended'); c.querySelector('video').pause(); });
  }
  function startSlide(s) {
    clearTimeout(s._t);
    clipsOf(s).forEach(function (c) {
      var v = c.querySelector('video');
      c.classList.remove('ended');
      v.currentTime = 0;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  }
  function syncPlayback() {
    if (total < 2) {
      slides.forEach(function (s, j) { (inView && j === idx) ? startSlide(s) : stopSlide(s); });
      return;
    }
    var kids = track.children;
    for (var k = 0; k < kids.length; k++) {
      if (inView && k === pos) startSlide(kids[k]); else stopSlide(kids[k]);
    }
  }

  slides.forEach(function (s) {
    clipsOf(s).forEach(function (c) {
      c.querySelector('video').addEventListener('ended', function () {
        c.classList.add('ended');
        var all = Array.prototype.every.call(clipsOf(s), function (x) { return x.classList.contains('ended'); });
        if (all) s._t = setTimeout(function () { if (inView && s === slides[idx]) startSlide(s); }, HOLD);
      });
    });
  });

  function go(dir) {
    if (animating || total < 2) return;
    animating = true;
    setTimeout(function () { animating = false; }, 500);
    pos += dir;
    idx = (idx + dir + total) % total;
    track.style.transform = 'translateX(' + (-pos * 100) + '%)';
    if (counter) counter.textContent = (idx + 1) + ' of ' + total;
    dots.forEach(function (d, j) { d.classList.toggle('active', j === idx); });
    syncPlayback();
  }
  track.addEventListener('transitionend', function () {
    if (pos === 0 || pos === total + 1) {
      track.style.transition = 'none';
      pos = (pos === 0) ? total : 1;
      track.style.transform = 'translateX(' + (-pos * 100) + '%)';
      void track.offsetWidth;
      track.style.transition = '';
      syncPlayback();
    }
  });
  document.getElementById('expPrev').addEventListener('click', function () { go(-1); });
  document.getElementById('expNext').addEventListener('click', function () { go(1); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-i'), 10) - idx); });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var now = es[0].isIntersecting;
      if (now !== inView) { inView = now; syncPlayback(); }
    }, { threshold: 0.25 }).observe(track.parentElement); // the viewport stays put; the track slides
  } else { inView = true; }
  syncPlayback();

  // enlarge a clip
  var box = document.getElementById('expLightbox');
  var big = box.querySelector('video');
  var lastFocus = null;
  function open(src) {
    lastFocus = document.activeElement;
    big.src = src; box.hidden = false; document.body.style.overflow = 'hidden';
    var p = big.play(); if (p && p.catch) p.catch(function () {});
    box.querySelector('.exp-lightbox-close').focus();
  }
  function close() {
    big.pause(); big.removeAttribute('src'); big.load();
    box.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.exp-frame').forEach(function (f) {
    f.addEventListener('click', function () { open(f.querySelector('video').currentSrc || f.querySelector('video').src); });
  });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  box.querySelector('.exp-lightbox-close').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
})();


/* Real-time demo: sideways carousel, three cards in view (one on phones).
   Arrows and dots move one card at a time and wrap around; only the cards in
   view play, and only while the carousel is on screen. */
(function () {
  var track = document.getElementById('demoTrack');
  if (!track) return;
  var slides = Array.prototype.slice.call(track.children);
  var prev = document.getElementById('demoPrev'), next = document.getElementById('demoNext');
  var dotsBox = document.getElementById('demoDots');
  var idx = 0, onScreen = false;
  function perView() { return window.matchMedia('(max-width: 760px)').matches ? 1 : 3; }
  function maxIdx() { return Math.max(0, slides.length - perView()); }
  var dots = [];
  function buildDots() {
    dotsBox.innerHTML = '';
    dots = [];
    for (var i = 0; i <= maxIdx(); i++) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Show clip ' + (i + 1));
      (function (k) { d.addEventListener('click', function () { show(k); }); })(i);
      dotsBox.appendChild(d); dots.push(d);
    }
  }
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function sync() {
    var n = perView();
    slides.forEach(function (sl, i) {
      var inView = i >= idx && i < idx + n;
      sl.querySelectorAll('video').forEach(function (v) {
        if (inView && onScreen) play(v); else if (!v.paused) v.pause();
      });
    });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
  }
  function show(i) {
    var m = maxIdx();
    idx = i < 0 ? m : i > m ? 0 : i;
    var step = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    track.style.transform = 'translateX(' + (-idx * step) + 'px)';
    sync();
  }
  prev.addEventListener('click', function () { show(idx - 1); });
  next.addEventListener('click', function () { show(idx + 1); });
  var lastN = perView();
  window.addEventListener('resize', function () {
    if (perView() !== lastN) { lastN = perView(); buildDots(); }
    show(Math.min(idx, maxIdx()));
  });
  new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); },
                           { threshold: 0.3 }).observe(track);
  buildDots();
  show(0);
})();


/* Interactive sensing principle: one taxel in cross-section, after the paper figure.
   Normal mode: the slider presses the indenter down; returned white light falls.
   Shear mode: the slider drags the indenter left or right; the colored walls tilt
   and the detector sees more red (right) or more green (left). */
document.querySelectorAll('.pi-panel').forEach(function (panel) {
  var svg = panel.querySelector('svg');
  var slider = panel.querySelector('input');
  var readout = panel.querySelector('.pi-readout');
  var mode = panel.dataset.pi;
  var uid = mode;
  var X0 = 60, X1 = 740, TOP = 170, PCB = 340, DET = { x: 400, y: 318 };
  var LEDS = [190, 610];

  /* Gel surface. Under pure normal load the dent is symmetric. When the
     indenter is dragged (sk = shear in -1..1), friction drags the surface with it:
     the dent's leading side is steep with gel piled up ahead of the indenter,
     the trailing side is stretched into a long, shallow tail. */
  var sk = 0;
  function surf(x, depth, cx) {
    var dx = x - cx, lead = sk * dx > 0;
    var w = 105 * (1 + (lead ? -0.15 : 0.4) * Math.abs(sk));
    var y = depth * Math.exp(-Math.pow(dx / w, 2));
    if (sk !== 0) {
      var dir = sk > 0 ? 1 : -1;
      y -= 12 * Math.abs(sk) * Math.exp(-Math.pow((dx - dir * 135) / 62, 2));
    }
    return TOP + y;
  }
  function surfPath(depth, cx) {
    var d = 'M' + X0 + ',' + TOP;
    for (var x = X0; x <= X1; x += 8) d += ' L' + x + ',' + surf(x, depth, cx).toFixed(1);
    return d;
  }
  function arrow(x1, y1, x2, y2, color, op, dash) {
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
      '" stroke="' + color + '" stroke-width="3" stroke-dasharray="' + (dash || '9 6') + '" opacity="' + op.toFixed(2) +
      '" marker-end="url(#pi-' + uid + '-' + (color === '#ffffff' ? 'w' : color === '#e8302a' ? 'r' : 'g') + ')"/>';
  }
  function heads() {
    return '<defs>' + [['w', '#ffffff'], ['r', '#e8302a'], ['g', '#3aa63a']].map(function (h) {
      return '<marker id="pi-' + uid + '-' + h[0] + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + h[1] + '"/></marker>';
    }).join('') + '</defs>';
  }
  /* Tactile view (top right): a 3x3 patch of taxels around this one, colored the
     way the live viewer would show them. The center taxel carries the full
     reading, neighbors a weaker share of it.
     Normal: gray level = light at the detector (white unpressed, dark pressed).
     Shear: the detector mostly sees white light scattered by the white
     translucent layer; the tilted wall only adds a tint. So no shear is a
     neutral near-white, and full shear is at most light pink (right) or light
     green (left), never saturated. */
  function shearColor(s) {
    var t = Math.min(1, Math.abs(s));
    var base = [238, 238, 236];
    var tint = s > 0 ? [250, 196, 206] : [196, 236, 200];
    return 'rgb(' + base.map(function (b, i) { return Math.round(b + (tint[i] - b) * t); }).join(',') + ')';
  }
  function taxelView(v, shear) {
    // a single taxel (1x1), framed like the live viewer's inset
    var S = 86, x0 = 736 - S, y0 = 20, fill;
    if (mode === 'normal') {
      var lv = Math.round(250 * (1 - 0.78 * v));
      fill = 'rgb(' + lv + ',' + lv + ',' + lv + ')';
    } else {
      fill = shearColor(shear);
    }
    var g = '<rect x="' + (x0 - 5) + '" y="' + (y0 - 5) + '" width="' + (S + 10) + '" height="' + (S + 10) + '" rx="6" fill="#fff" stroke="#222" stroke-width="2"/>';
    g += '<rect x="' + x0 + '" y="' + y0 + '" width="' + S + '" height="' + S + '" rx="3" fill="' + fill + '" stroke="#9a9a9a" stroke-width="1"/>';
    g += '<text x="' + (x0 + S / 2) + '" y="' + (y0 + S + 30) + '" text-anchor="middle" font-size="17" fill="#444" letter-spacing="0.5">PD feedback</text>';
    return g;
  }
  function render() {
    var v = slider.value / 100;
    var out = heads();
    var depth, cx, shear = 0;
    if (mode === 'normal') { depth = 10 + v * 95; cx = 400; }
    else { shear = v * 2 - 1; depth = 45; cx = 400 + shear * 60; }
    sk = shear;
    // gel body
    var body = surfPath(depth, cx) + ' L' + X1 + ',' + PCB + ' L' + X0 + ',' + PCB + ' Z';
    out += '<path d="' + body + '" fill="#c9c9c9"/>';
    // colored walls (shear mode): bottoms fixed, tops lean with the shear
    var lean = shear * 75, red = 0, green = 0;
    if (mode === 'shear') {
      [[250, '#e8302a'], [570, '#3aa63a']].forEach(function (w) {
        var tx = w[0] + 30 + lean, ty = surf(tx, depth, cx) + 4;
        out += '<polygon points="' + (w[0] - 9) + ',' + PCB + ' ' + (w[0] + 9) + ',' + PCB + ' ' + (tx + 9) + ',' + ty.toFixed(1) + ' ' + (tx - 9) + ',' + ty.toFixed(1) + '" fill="' + w[1] + '"/>';
      });
      red = Math.max(0.08, Math.min(1, 0.4 + 0.6 * shear));
      green = Math.max(0.08, Math.min(1, 0.4 - 0.6 * shear));
    }
    // light rays
    var bright = mode === 'normal' ? 1 - 0.78 * v : 0.55;
    LEDS.forEach(function (lx) {
      var side = lx < 400 ? -1 : 1;
      [-60, 40].forEach(function (off) {
        var px = lx + off * side, py = surf(px, depth, cx) + 6;
        out += arrow(lx, PCB - 22, px, py, '#ffffff', 0.9);
      });
      [55, 120].forEach(function (off) {
        var px = lx - side * off, py = surf(px, depth, cx) + 6;
        out += arrow(lx, PCB - 22, px, py, '#ffffff', 0.9);
        out += arrow(px, py, DET.x + side * 22, DET.y - 6, '#ffffff', Math.max(0.12, bright));
      });
    });
    if (mode === 'shear') {
      [[250, '#e8302a', red, 1], [570, '#3aa63a', green, -1]].forEach(function (w) {
        for (var i = 0; i < 3; i++) {
          var t = 0.35 + i * 0.18;
          var wx = w[0] + (30 + lean) * t, wy = PCB + (surf(w[0] + 30 + lean, depth, cx) - PCB) * t;
          out += arrow(wx + 10 * w[3], wy, DET.x - 18 * w[3] + i * 8 * w[3], DET.y - 8, w[1], w[2], '7 5');
        }
      });
    }
    // black film
    out += '<path d="' + surfPath(depth, cx) + '" fill="none" stroke="#111" stroke-width="12" stroke-linejoin="round"/>';
    // indenter, sitting in the dent
    var r = 66, icy = surf(cx, depth, cx) - r - 4;
    out += '<circle cx="' + cx + '" cy="' + icy.toFixed(1) + '" r="' + r + '" fill="#7d7d7d"/>';
    out += '<text x="' + cx + '" y="' + (icy + 8).toFixed(1) + '" text-anchor="middle" font-size="24" fill="#111">indenter</text>';
    // force arrow
    if (mode === 'normal') {
      var ax = cx + 115;
      out += '<line x1="' + ax + '" y1="' + (icy - 80) + '" x2="' + ax + '" y2="' + (icy - 80 + 40 + 70 * v) + '" stroke="#111" stroke-width="4" marker-end="url(#pi-' + uid + '-k)"/>';
    } else if (Math.abs(shear) > 0.05) {
      var len = 140 * shear, ay = icy - r - 24;
      out += '<line x1="' + (cx - len / 2) + '" y1="' + ay + '" x2="' + (cx + len / 2) + '" y2="' + ay + '" stroke="#111" stroke-width="4" marker-end="url(#pi-' + uid + '-k)"/>';
    }
    out = out.replace('</defs>', '<marker id="pi-' + uid + '-k" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>');
    // LEDs, detector, PCB
    LEDS.forEach(function (lx) { out += '<rect x="' + (lx - 38) + '" y="' + (PCB - 22) + '" width="76" height="22" rx="5" fill="#f5c518"/>'; });
    out += '<rect x="' + (DET.x - 62) + '" y="' + (PCB - 30) + '" width="124" height="30" fill="#5f5f5f"/>';
    out += '<rect x="' + X0 + '" y="' + PCB + '" width="' + (X1 - X0) + '" height="64" fill="#9a4f06"/>';
    out += '<text x="400" y="' + (PCB + 45) + '" text-anchor="middle" font-size="34" fill="#fff">PCB</text>';
    out += '<text x="' + (X0 + 4) + '" y="60" font-size="28" fill="#111">' + (mode === 'normal' ? '(a) Normal Force' : '(b) Shear Force') + '</text>';
    out += taxelView(v, shear);
    svg.innerHTML = out;

    if (mode === 'normal') {
      readout.innerHTML = '<span>Light at detector</span><div class="pi-bar"><i style="width:' + Math.round(bright * 100) + '%"></i></div><b>' + Math.round(bright * 100) + '%</b>';
    } else {
      readout.innerHTML = '<span>Red light</span><div class="pi-bar red"><i style="width:' + Math.round(red * 100) + '%"></i></div><b>' + Math.round(red * 100) + '%</b>' +
        '<span>Green light</span><div class="pi-bar green"><i style="width:' + Math.round(green * 100) + '%"></i></div><b>' + Math.round(green * 100) + '%</b>' +
        '<em class="pi-dir">' + (Math.abs(shear) < 0.05 ? 'No shear' : shear > 0 ? 'Shear to the right' : 'Shear to the left') + '</em>';
    }
  }
  slider.addEventListener('input', render);
  render();
});


/* Hero background: an interactive taxel array. The pointer acts as the indenter:
   taxels under it light up (normal), and moving it tilts orange shear arrows
   along the motion, as the real sensor's live viewer does. With no pointer
   (phones, idle) a ghost indenter drifts slowly across the array. */
(function () {
  var cv = document.getElementById('heroTaxels');
  if (!cv) return;
  var hero = cv.closest('.hero');
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cell = 0, ox = 0, oy = 0, gap = 8;
  var P = [], SX = [], SY = [];                    // per-taxel pressure and shear (smoothed)
  var mouse = { x: -1e4, y: -1e4, vx: 0, vy: 0, last: 0, inside: false };
  var ghost = { x: 0, y: 0, px: 0, py: 0 };
  var running = false, visible = true, t0 = performance.now();

  function layout() {
    var r = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W < 700 ? 58 : 84;
    cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
    ox = (W - cols * cell) / 2; oy = (H - rows * cell) / 2;
    var n = cols * rows;
    P = new Float32Array(n); SX = new Float32Array(n); SY = new Float32Array(n);
  }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (mouse.inside) {
      var dt = Math.max(8, now - mouse.last);
      mouse.vx = 0.7 * mouse.vx + 0.3 * (x - mouse.x) / dt * 16;
      mouse.vy = 0.7 * mouse.vy + 0.3 * (y - mouse.y) / dt * 16;
    }
    mouse.x = x; mouse.y = y; mouse.last = now; mouse.inside = true;
    if (!running) loop();
  });
  hero.addEventListener('pointerleave', function () { mouse.inside = false; });

  function indenter(now) {
    // real pointer while it moved in the last 2.5 s, else the ghost
    if (mouse.inside && now - mouse.last < 2500) {
      mouse.vx *= 0.92; mouse.vy *= 0.92;
      return { x: mouse.x, y: mouse.y, vx: mouse.vx, vy: mouse.vy, depth: 1 };
    }
    var t = (now - t0) / 1000;
    ghost.px = ghost.x; ghost.py = ghost.y;
    ghost.x = W * (0.5 + 0.36 * Math.sin(t * 0.23)) ;
    ghost.y = H * (0.5 + 0.30 * Math.sin(t * 0.37 + 1.3));
    var press = 0.55 + 0.45 * Math.sin(t * 0.9);  // slow press and release
    return { x: ghost.x, y: ghost.y, vx: (ghost.x - ghost.px) * 6, vy: (ghost.y - ghost.py) * 6,
             depth: Math.max(0, press) * 0.8 };
  }

  function blue(p) {                               // light to deep blue, like the viewer
    var a = [134, 182, 239], b = [28, 92, 171];
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * p) + ',' + Math.round(a[1] + (b[1] - a[1]) * p) +
           ',' + Math.round(a[2] + (b[2] - a[2]) * p) + ')';
  }

  function draw(now) {
    var ind = indenter(now);
    var sig = cell * 1.3, sig2 = 2 * sig * sig;
    ctx.clearRect(0, 0, W, H);
    var k = 0, s = cell - gap;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++, k++) {
        var x = ox + c * cell, y = oy + r * cell, cx = x + cell / 2, cy = y + cell / 2;
        var dx = cx - ind.x, dy = cy - ind.y;
        var target = ind.depth * Math.exp(-(dx * dx + dy * dy) / sig2);
        P[k] += (target - P[k]) * 0.16;
        SX[k] += (ind.vx * target - SX[k]) * 0.12;
        SY[k] += (ind.vy * target - SY[k]) * 0.12;
        var p = P[k];
        // idle taxel: faint outline and centre dot
        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(x + gap / 2, y + gap / 2, s, s);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
        if (p > 0.02) {
          ctx.globalAlpha = Math.min(1, p * 1.4);
          ctx.fillStyle = blue(Math.min(1, p));
          ctx.fillRect(x + gap / 2, y + gap / 2, s, s);
          ctx.globalAlpha = 1;
        }
        var sl = Math.hypot(SX[k], SY[k]);
        if (p > 0.06 && sl > 0.25) {
          var L = Math.min(cell * 0.85, sl * 5), ux = SX[k] / sl, uy = SY[k] / sl;
          var x0 = cx - ux * L / 2, y0 = cy - uy * L / 2, x1 = cx + ux * L / 2, y1 = cy + uy * L / 2;
          ctx.strokeStyle = 'rgba(240,112,60,' + Math.min(1, p * 1.8).toFixed(3) + ')';
          ctx.fillStyle = ctx.strokeStyle;
          ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          var hs = 9;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - ux * hs - uy * hs * 0.55, y1 - uy * hs + ux * hs * 0.55);
          ctx.lineTo(x1 - ux * hs + uy * hs * 0.55, y1 - uy * hs - ux * hs * 0.55);
          ctx.closePath(); ctx.fill();
        }
      }
    }
  }

  function loop() {
    running = true;
    (function frame(now) {
      if (!visible) { running = false; return; }
      draw(now);
      requestAnimationFrame(frame);
    })(performance.now());
  }

  layout();
  window.addEventListener('resize', layout);
  if (reduce) { draw(performance.now()); return; }  // static frame only
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !running) loop();
  }).observe(hero);
  loop();
})();
