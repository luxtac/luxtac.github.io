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
    buildPanel(document.getElementById('panelA'), false);
    buildPanel(document.getElementById('panelB'), true);
  }
  // Static figure now: fixed parameters, no sliders, no toggles.
  render();
})();

(function(){
  var stems = ['demo1','demo2','part1','part2','part3','part4'];
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
    screen.addEventListener('play', function(){ if(real.paused) real.play(); });
    real.addEventListener('play', function(){ if(screen.paused) screen.play(); });
    screen.addEventListener('pause', function(){ if(!real.paused) real.pause(); });
    real.addEventListener('pause', function(){ if(!screen.paused) screen.pause(); });
  });
})();


/* Robot experiments carousel: two task slides, each a success row over a failure row.
   Clips on the visible slide play together, fade to black with the outcome, and restart together. */
(function () {
  var track = document.getElementById('expTrack');
  if (!track) return;
  var slides = track.querySelectorAll('.exp-slide');
  var counter = document.getElementById('expCounter');
  var dots = document.querySelectorAll('.exp-dots button');
  var total = slides.length, idx = 0, inView = false;
  var HOLD = 2200; // ms all outcome cards stay up after the longest clip ends

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
    slides.forEach(function (s, j) { (inView && j === idx) ? startSlide(s) : stopSlide(s); });
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

  function show(i) {
    idx = (i + total) % total;
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    if (counter) counter.textContent = (idx + 1) + ' of ' + total;
    dots.forEach(function (d, j) { d.classList.toggle('active', j === idx); });
    syncPlayback();
  }
  document.getElementById('expPrev').addEventListener('click', function () { show(idx - 1); });
  document.getElementById('expNext').addEventListener('click', function () { show(idx + 1); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { show(parseInt(d.getAttribute('data-i'), 10)); });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var now = es[0].isIntersecting;
      if (now !== inView) { inView = now; syncPlayback(); }
    }, { threshold: 0.25 }).observe(track.parentElement); // the viewport stays put; the track slides
  } else { inView = true; }
  show(0);

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
