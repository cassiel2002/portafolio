/**
 * main.js — Arranque: contenido, Lenis, intro "INSERT COIN", navegación y llavero 3D.
 * El contenido se pinta primero; Three.js (~690 KB) se carga después en paralelo.
 */
import Lenis from '../vendor/lenis.mjs';
import { renderPlayer, renderArcade, createGallery, renderSkills, renderContact } from './sections.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);

/* ---------- contenido ---------- */
renderPlayer();
const gallery = createGallery({ onToggle: (open) => (open ? lenis?.stop() : lenis?.start()) });
renderArcade({ onOpen: (p, i) => gallery.open(p, i) });
renderSkills();
renderContact();
$('#year').textContent = String(new Date().getFullYear());

/* ---------- Lenis (scroll suave) ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
}

// anclas internas con Lenis
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#top' ? 0 : document.querySelector(id);
  if (target === null) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
  else if (target === 0) window.scrollTo({ top: 0 });
  else target.scrollIntoView();
  if (target !== 0) {
    // mueve el foco a la sección (lectores de pantalla / teclado)
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
});

/* ---------- aparición de secciones ---------- */
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }),
  { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- CONTINUE? cuenta regresiva ---------- */
const countdown = $('#countdown');
let cd = 9, cdTimer = null;
new IntersectionObserver(([en]) => {
  if (en.isIntersecting && !cdTimer && !reduced) {
    cdTimer = setInterval(() => {
      cd = cd > 0 ? cd - 1 : 9;
      countdown.textContent = String(cd);
    }, 1000);
  } else if (!en.isIntersecting && cdTimer) { clearInterval(cdTimer); cdTimer = null; }
}).observe(countdown);

/* ---------- llavero 3D + intro ---------- */
const intro = $('#intro');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let stage = null;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

async function loadStage() {
  if (!supportsWebGL()) throw new Error('WebGL no disponible');
  const { createStage } = await import('./stage.js');
  stage = createStage({ canvas: $('#stage'), hitArea: $('#charm-hit'), miniButton: $('#charm-mini'), reduced });
  stage.charm.drop(9); // arranca fuera de cuadro, arriba
}

let seen = false;
try { seen = sessionStorage.getItem('cass-intro') === '1'; } catch { /* storage bloqueado */ }

async function boot() {
  const stageReady = loadStage().catch((err) => {
    console.warn('[cassdev] Sin llavero 3D:', err.message);
    document.body.classList.add('no-webgl');
  });
  const skip = reduced || seen;
  if (!skip) {
    let skipped = false;
    const doSkip = () => (skipped = true);
    intro.addEventListener('click', doSkip, { once: true });
    window.addEventListener('keydown', doSkip, { once: true });
    await Promise.race([Promise.all([stageReady, wait(900)]), wait(2600)]);
    $('#intro-credit').textContent = 'CREDIT 01';
    if (!skipped) await wait(380);
    intro.classList.add('is-power');
    await wait(300);
  } else {
    await Promise.race([stageReady, wait(1500)]);
  }
  intro.classList.add('is-gone');
  intro.setAttribute('aria-hidden', 'true');
  document.body.classList.add('is-ready');
  try { sessionStorage.setItem('cass-intro', '1'); } catch { /* ignorar */ }
  stage?.reveal({ instant: skip });
  setTimeout(() => intro.remove(), 700);
}

/* ---------- loop único ---------- */
let last = performance.now();
const hero = $('#top');
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  lenis?.raf(now);
  if (stage) {
    const y = lenis ? lenis.scroll : window.scrollY;
    const v = lenis ? lenis.velocity : 0;
    stage.setScroll(y, v, hero.offsetHeight);
    stage.update(now, dt);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
boot();

// API mínima para pruebas automatizadas (no afecta el uso normal)
window.__cass = { get stage() { return stage; }, get lenis() { return lenis; } };
