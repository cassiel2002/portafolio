/**
 * stage.js — Escena 3D del llavero (se carga de forma diferida desde main.js).
 *
 * Escritorio: el llavero cuelga a la derecha del hero y, al scrollear, se achica
 * y queda colgando en la esquina superior derecha como "mascota".
 * Mobile: cuelga arriba del hero y se va con el scroll (no tapa el contenido).
 */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { createCassCharm } from './cass-charm.js';

export function createStage({ canvas, hitArea, miniButton, reduced = false }) {
  /* ---------- renderer ---------- */
  const isMobile = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // DPR máx 1.5 en mobile (reduce fillrate ~44 % respecto a DPR 2)
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  // antialias solo si DPR < 2; en pantallas Retina el subpixel ya suaviza suficiente
  const useAA = DPR < 1.8;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: useAA, alpha: true, powerPreference: 'default' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  // En mobile reemplazamos el costoso PMREM por una luz ambiente más fuerte
  if (isMobile) {
    scene.environment = null;
  } else {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.15, 10);

  const hemiIntensity = isMobile ? 2.2 : 1.5;
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x2a1840, hemiIntensity));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 6);
  const rimC = new THREE.DirectionalLight(0x2de2e6, 2.6);
  rimC.position.set(-5, 2, -3);
  const rimM = new THREE.DirectionalLight(0xff3d7f, 2.2);
  rimM.position.set(5, 0.5, -4);
  scene.add(key, rimC, rimM);

  const charm = createCassCharm({ reducedMotion: reduced });
  scene.add(charm.root);

  /* ---------- layout ---------- */
  const L = { wide: true, vs: { w: 1, h: 1 }, hero: { x: 0, y: 2 }, mini: { x: 0, y: 2, s: 0.42 }, hudPx: 64 };
  let pixelSize = 1;
  let scrollY = 0;
  let heroH = window.innerHeight;
  let curX = 0, curY = 0, curS = 1;
  let visible = true;

  // render-on-demand: solo renderizamos si hay energía o input reciente
  let _dirty = true;
  let _lastInputMs = 0;
  const markDirty = () => { _dirty = true; _lastInputMs = performance.now(); };

  function visibleSize() {
    const h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { w: h * camera.aspect, h };
  }

  function layout() {
    // Usamos visualViewport si está disponible para ignorar la barra de dirección
    const vvp = window.visualViewport;
    const w = vvp ? vvp.width : window.innerWidth;
    const h = vvp ? vvp.height : window.innerHeight;
    camera.aspect = w / h;
    L.wide = camera.aspect > 1.05 && w >= 900;
    camera.fov = L.wide ? 30 : 38;
    camera.updateProjectionMatrix();
    L.vs = visibleSize();
    const top = camera.position.y + L.vs.h / 2;
    L.hero.x = L.wide ? Math.min(L.vs.w * 0.2, 2.4) : 0;
    L.hero.y = L.wide ? 2.05 : 2.05 + L.vs.h * 0.17;
    const pxToWorld = L.vs.h / h;
    L.mini.s = 0.4;
    L.mini.x = L.vs.w / 2 - 0.62;
    L.mini.y = top - L.hudPx * pxToWorld - 0.12;
    applyPixelRatio();
    markDirty();
  }

  function applyPixelRatio() {
    const vvp = window.visualViewport;
    const w = vvp ? vvp.width : window.innerWidth;
    const h = vvp ? vvp.height : window.innerHeight;
    renderer.setPixelRatio(DPR / pixelSize);
    renderer.setSize(w, h, false);
    canvas.classList.toggle('is-pixel', pixelSize > 1);
  }

  /* ---------- resize estable (ignora cambios de alto < 150 px en touch) ---------- */
  let _lastW = window.innerWidth;
  let _lastH = window.innerHeight;

  function onResize() {
    const vvp = window.visualViewport;
    const newW = vvp ? vvp.width : window.innerWidth;
    const newH = vvp ? vvp.height : window.innerHeight;
    const dw = Math.abs(newW - _lastW);
    const dh = Math.abs(newH - _lastH);
    // En touch, cambios de alto < 150 px son la barra de dirección → ignorar
    if (isMobile && dw < 4 && dh < 150) return;
    _lastW = newW;
    _lastH = newH;
    layout();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize, { passive: true });
  } else {
    window.addEventListener('resize', onResize, { passive: true });
  }

  /* ---------- interacción ---------- */
  let lastX = null, lastY = null, lastT = 0, dragging = false;
  let _touchDragActive = false; // drag horizontal dentro de charm-hit

  const onMove = (e) => {
    // En touch fuera del hit area o sin drag activo: solo actualizamos posición, sin impulsos
    const isTouch = e.pointerType === 'touch';

    if (isTouch && !_touchDragActive) return;

    const now = performance.now();
    if (lastX !== null) {
      const dt = Math.max(16, now - lastT) / 1000;
      const vx = (e.clientX - lastX) / window.innerWidth / dt;
      const vy = (e.clientY - lastY) / window.innerHeight / dt;
      if (dragging) {
        // spin: solo giro horizontal, clamp conservador
        charm.spin(THREE.MathUtils.clamp(vx * 1.6, -3, 3));
      } else if (!isTouch) {
        // push/look: solo con mouse
        charm.push(THREE.MathUtils.clamp(vy * 0.05, -0.15, 0.15), THREE.MathUtils.clamp(vx * 0.08, -0.2, 0.2));
        charm.look((e.clientX / window.innerWidth) * 2 - 1);
      }
      markDirty();
    }
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  };

  const stopDrag = () => {
    dragging = false;
    _touchDragActive = false;
    document.body.classList.remove('is-dragging');
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);

  hitArea?.addEventListener('pointerdown', (e) => {
    dragging = true;
    if (e.pointerType === 'touch') _touchDragActive = true;
    document.body.classList.add('is-dragging');
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    markDirty();
  });

  // teclado: flechas sobre el área del llavero lo hacen girar (accesible sin mouse)
  hitArea?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { charm.spin(-2.5); e.preventDefault(); markDirty(); }
    if (e.key === 'ArrowRight') { charm.spin(2.5); e.preventDefault(); markDirty(); }
  });

  layout();
  charm.setBaseY(L.hero.y);
  charm.root.position.x = L.hero.x;

  /* ---------- IntersectionObserver: pausar en mobile fuera del hero ---------- */
  let _heroVisible = true;
  if (isMobile && canvas) {
    const heroEl = document.getElementById('top');
    if (heroEl) {
      new IntersectionObserver(
        ([entry]) => { _heroVisible = entry.isIntersecting; if (_heroVisible) markDirty(); },
        { threshold: 0 },
      ).observe(heroEl);
    }
  }

  // Pausar cuando la pestaña está oculta
  document.addEventListener('visibilitychange', () => { if (!document.hidden) markDirty(); });

  /* ---------- API ---------- */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function reveal({ instant = false } = {}) {
    if (instant || reduced) {
      charm.drop(reduced ? 0 : 2);
      markDirty();
      return;
    }
    // Revelado pixelado: un único ciclo de setSize al principio y al final,
    // solo cambiamos pixelRatio (no reasigna el canvas backing store)
    pixelSize = 40;
    renderer.setPixelRatio(DPR / pixelSize);
    canvas.classList.add('is-pixel');
    charm.drop(6.5);
    markDirty();
    for (const s of [40, 28, 20, 14, 10, 7, 5, 3, 2, 1]) {
      pixelSize = s;
      renderer.setPixelRatio(DPR / pixelSize);
      markDirty();
      await wait(115);
    }
    canvas.classList.remove('is-pixel');
    // un solo setSize al terminar para fijar las dimensiones correctas
    applyPixelRatio();
  }

  // Velocidad de scroll anterior para calcular aceleración
  let _prevVelocity = 0;

  function setScroll(y, velocity, heroHeight) {
    scrollY = y;
    heroH = heroHeight || window.innerHeight;

    // Convertir velocidad de scroll en fuerza proporcional a dt (aceleración), no en impulso por frame.
    // Solo aplicar si la velocidad supera un umbral mínimo.
    const absV = Math.abs(velocity);
    if (absV > 0.5) {
      const acc = velocity - _prevVelocity; // delta de velocidad (proporcional al dt del caller)
      charm.push(THREE.MathUtils.clamp(acc * 0.003, -0.12, 0.12), 0);
      charm.spin(THREE.MathUtils.clamp(velocity * 0.004, -0.3, 0.3));
      markDirty();
    }
    _prevVelocity = velocity;
  }

  function update(now, dt) {
    const p = THREE.MathUtils.smoothstep(scrollY / (heroH * 0.75), 0, 1);
    let tx, ty, ts;
    if (L.wide) {
      tx = THREE.MathUtils.lerp(L.hero.x, L.mini.x, p);
      ty = THREE.MathUtils.lerp(L.hero.y, L.mini.y, p);
      ts = THREE.MathUtils.lerp(1, L.mini.s, p);
    } else {
      tx = L.hero.x;
      ty = L.hero.y + scrollY * (L.vs.h / window.innerHeight); // se va con el contenido
      ts = 1;
    }
    const k = Math.min(1, dt * 7);
    curX += (tx - curX) * k;
    curY += (ty - curY) * (L.wide ? k : 1);
    curS += (ts - curS) * k;
    charm.root.position.x = curX;
    charm.root.scale.setScalar(curS);
    charm.setBaseY(curY);

    const isMini = L.wide && p > 0.95;
    document.body.classList.toggle('charm-mini', isMini);
    if (miniButton && isMini) placeMiniButton();

    // fuera de pantalla en mobile → no renderizar
    visible = L.wide || curY - 4.2 < camera.position.y + L.vs.h / 2;
    canvas.classList.toggle('is-hidden', !visible);

    // Pausar si la pestaña está oculta, el llavero no está visible, o en mobile fuera del hero
    if (!visible || document.hidden || (isMobile && !_heroVisible)) return;

    // Render on-demand: renderizar si hay energía reciente (input en los últimos 4 s)
    // o si el sistema físico aún tiene velocidades significativas
    const S = charm.state;
    const energy = Math.abs(S.vx) + Math.abs(S.vz) + Math.abs(S.tv) + Math.abs(S.drop) + Math.abs(S.sq);
    const hasEnergy = energy > 0.001 || (performance.now() - _lastInputMs) < 4000;
    if (!hasEnergy && !_dirty) return;
    _dirty = false;

    charm.update(dt, now / 1000);
    renderer.render(scene, camera);
  }

  const v = new THREE.Vector3();
  function placeMiniButton() {
    charm.parts.figure.getWorldPosition(v);
    v.y += 1.0 * curS;
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    miniButton.style.transform = `translate(${Math.round(x - 40)}px, ${Math.round(y - 70)}px)`;
  }

  return { reveal, setScroll, update, charm, renderer };
}
