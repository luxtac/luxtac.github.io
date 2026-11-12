// Board carousel ("One design, many sizes"), 3D viewer modal, and download.
const root = document.querySelector('.board-carousel');
const cards = root ? [...root.querySelectorAll('.board-card')] : [];
const dots = root ? root.querySelector('.bc-dots') : null;
const toast = document.getElementById('toast');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let active = 0, timer = null, hovering = false;
const modal = document.getElementById('cadModal');
const stage = document.getElementById('cadStage');
const status = document.getElementById('cadStatus');

function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ---------- carousel ----------
function layout() {
  const n = cards.length;
  cards.forEach((c, i) => {
    let o = i - active;
    if (o > n / 2) o -= n; if (o < -n / 2) o += n;          // wrap around
    const prev = Number(c.dataset.offset ?? o);
    if (Math.abs(o - prev) > 1) {                            // wrapping card: jump behind, don't slide across the front
      c.style.transition = 'none'; c.dataset.offset = Math.max(-2, Math.min(2, o)); void c.offsetWidth; c.style.transition = '';
    }
    c.dataset.offset = Math.max(-2, Math.min(2, o));
    c.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
    c.querySelectorAll('button').forEach(b => b.tabIndex = o === 0 ? 0 : -1);
  });
  [...dots.children].forEach((d, i) => d.setAttribute('aria-selected', i === active ? 'true' : 'false'));

}
function go(i) { active = (i + cards.length) % cards.length; layout(); }
function auto() {
  clearInterval(timer);
  if (reduce) return;
  timer = setInterval(() => { if (!hovering && !document.hidden && !modal.open) go(active + 1); }, 5000);
}

if (root) {
  cards.forEach((c, i) => {
    const d = document.createElement('button');
    d.type = 'button'; d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', c.querySelector('.board-name').textContent + ' board');
    d.addEventListener('click', () => { go(i); auto(); });
    dots.appendChild(d);
    // a side card comes to the front when clicked
    c.addEventListener('click', (e) => { if (c.dataset.offset !== '0') { e.preventDefault(); e.stopPropagation(); go(i); auto(); } }, true);
  });
  root.querySelector('.prev').addEventListener('click', () => { go(active - 1); auto(); });
  root.querySelector('.next').addEventListener('click', () => { go(active + 1); auto(); });
  root.addEventListener('mouseenter', () => hovering = true);
  root.addEventListener('mouseleave', () => hovering = false);
  root.addEventListener('focusin', () => hovering = true);
  root.addEventListener('focusout', () => hovering = false);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { go(active + 1); auto(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(active - 1); auto(); e.preventDefault(); }
  });
  // swipe
  let x0 = null;
  const track = root.querySelector('.bc-track');
  track.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  track.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { go(active + (dx < 0 ? 1 : -1)); auto(); }
  });
  // buttons
  cards.forEach((c) => {
    c.querySelector('[data-act="view"]').addEventListener('click', () => openViewer(c));
    c.querySelector('[data-act="download"]').addEventListener('click', () => download(c));
  });
  layout(); auto();
  // deep link: #view-4x4 / #view-4x8 / #view-8x8 opens that board's 3D view
  const m = location.hash.match(/^#view-(\w+)$/);
  const deep = m && cards.find(c => c.dataset.board === m[1]);
  if (deep) setTimeout(() => { go(cards.indexOf(deep)); openViewer(deep); });
}

// ---------- Gerber download ----------
async function download(c) {
  const url = c.dataset.gerber, name = c.querySelector('.board-name').textContent;
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const a = document.createElement('a');
    a.href = url; a.download = url.split('/').pop();
    document.body.appendChild(a); a.click(); a.remove();
  } catch {
    showToast(`The ${name} design files are not posted yet. They will be available here soon.`);
  }
}

// ---------- 3D viewer ----------
let V = null;            // three.js state, created on first open
let current = null;      // card being shown
const cache = new Map();

modal.querySelector('.cad-close').addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });   // backdrop
modal.addEventListener('close', () => { document.body.classList.remove('modal-open'); if (V) V.running = false; });
modal.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => V && V.frame(b.dataset.cam)));

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

async function openViewer(c) {
  current = c;
  document.getElementById('cadTitle').innerHTML = c.dataset.title || (c.querySelector('.board-name').innerHTML + ' board &middot; 3D model');
  const note = document.getElementById('cadNote');
  if (note) { note.dataset.def ??= note.innerHTML; note.innerHTML = c.dataset.note || note.dataset.def; }
  modal.querySelectorAll('[data-cam]').forEach(b => { b.hidden = !c.dataset.pad; });
  document.body.classList.add('modal-open');
  modal.showModal();
  if (!webglOK()) {
    status.innerHTML = `<img src="${c.dataset.full}" alt="Board layout"><span>3D view needs WebGL, which is turned off in this browser. Showing the flat layout instead.</span>`;
    status.classList.add('fallback'); status.hidden = false;
    return;
  }
  status.classList.remove('fallback'); status.textContent = 'Loading 3D model…'; status.hidden = false;
  try {
    if (!V) V = await createViewer();
    await V.show(c);
    status.hidden = true;
  } catch (err) {
    console.error(err);
    status.innerHTML = `<img src="${c.dataset.full}" alt="Board layout"><span>The 3D model could not be loaded. Showing the flat layout instead.</span>`;
    status.classList.add('fallback');
  }
}

async function createViewer() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0e11);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-120, 260, 160); scene.add(sun);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 8;

  const loader = new GLTFLoader(), texLoader = new THREE.TextureLoader();
  const pivot = new THREE.Group(); scene.add(pivot);
  let info = null, tween = null;

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);

  async function build(c) {
    if (!c.dataset.tex) return buildPlain(c);
    const [gltf, tex] = await Promise.all([loader.loadAsync(c.dataset.model), texLoader.loadAsync(c.dataset.tex)]);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const model = gltf.scene; model.scale.setScalar(1000);            // KiCad GLB is in metres
    model.updateMatrixWorld(true);
    const pcb = model.getObjectByName('PCB');
    const box = new THREE.Box3().setFromObject(pcb);
    const [w, h, dx] = c.dataset.frame.split(',').map(Number);
    const xc = (box.min.x + box.max.x) / 2, zc = (box.min.z + box.max.z) / 2;
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.6 });
    const bottom = new THREE.MeshStandardMaterial({ color: 0x8a4a12, roughness: 0.6 });
    const p = new THREE.Vector3();
    pcb.traverse((m) => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position, uv = new Float32Array(pos.count * 2);
      let ymax = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        uv[2 * i] = (p.x + dx - (xc - w / 2)) / w;
        uv[2 * i + 1] = 1 - (p.z - (zc - h / 2)) / h;
        ymax = Math.max(ymax, p.y);
      }
      m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      m.material = ymax - box.min.y < 1e-3 ? bottom : top;                // bottom face stays plain
    });
    // centre on the board, top surface at y = 0
    model.traverse((m) => {                                              // parts: matte, darker sensor bodies
      if (!m.isMesh || m.material === top || m.material === bottom) return;
      m.material.envMapIntensity = 0.6;
      if (m.material.name === 'sensor') { m.material.color.setRGB(0.05, 0.06, 0.06); m.material.roughness = 0.45; }
    });
    model.position.set(-xc, -box.max.y, -zc);
    const pad = c.dataset.pad.split(',').map(Number);
    const head = new THREE.Vector3((pad[0] + pad[2]) / 2 - w / 2 - dx, 0, (pad[1] + pad[3]) / 2 - h / 2);
    const g = new THREE.Group(); g.add(model);
    return { group: g, len: box.max.x - box.min.x, wid: box.max.z - box.min.z, head, padSize: Math.max(pad[2] - pad[0], pad[3] - pad[1]) };
  }

  // boards with their own colours (no copper texture, no sensing pad), e.g. the acquisition board
  async function buildPlain(c) {
    const gltf = await loader.loadAsync(c.dataset.model);
    const model = gltf.scene; model.scale.setScalar(1000); model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model.getObjectByName('PCB'));
    model.traverse((m) => { if (m.isMesh) m.material.envMapIntensity = 0.6; });
    model.position.set(-(box.min.x + box.max.x) / 2, -box.max.y, -(box.min.z + box.max.z) / 2);
    const g = new THREE.Group(); g.add(model);
    return { group: g, len: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 2.1, head: null };
  }

  function frame(which, instant) {
    if (!info) return;
    if (!info.head) which = 'board';
    const t = which === 'head' ? info.head.clone() : new THREE.Vector3(0, 0, 0);
    const size = which === 'head' ? info.padSize * 1.35 : info.len * 0.62;
    const dist = size / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1, camera.aspect) * 1;
    const dir = new THREE.Vector3(-0.35, 0.75, 0.62).normalize();
    const pos = t.clone().addScaledVector(dir, dist);
    controls.maxDistance = info.len * 4;
    if (instant || reduce) { camera.position.copy(pos); controls.target.copy(t); controls.update(); return; }
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: t, s: performance.now() };
  }

  function loop() {
    if (!api.running) return;
    requestAnimationFrame(loop);
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.s) / 700), e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (k === 1) tween = null;
    }
    controls.update(); renderer.render(scene, camera);
  }

  const api = {
    running: false, frame,
    async show(c) {
      resize();
      const key = c.dataset.board;
      if (!cache.has(key)) cache.set(key, build(c));
      const b = await cache.get(key);
      if (current !== c) return;                                         // another card was opened meanwhile
      pivot.clear(); pivot.add(b.group); info = b;
      frame('board', true); if (b.head) frame('head');                    // start wide, glide to the pad
      if (!api.running) { api.running = true; loop(); }
    },
  };
  return api;
}
