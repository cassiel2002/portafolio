/**
 * cass-charm.js — Llavero 3D chibi de Cass (Three.js, procedural, sin assets externos).
 *
 * Estilo: figura de PVC / vinilo con sombreado toon de 3 tonos y contorno (inverted hull).
 * Todo se genera con primitivas → sin descargas extra, liviano y fácil de retocar.
 *
 * API:
 *   const charm = createCassCharm({ reducedMotion });
 *   scene.add(charm.root);
 *   charm.update(dt, t)          // en cada frame
 *   charm.push(dx, dz)           // impulso de balanceo (rad/s)
 *   charm.spin(v)                // impulso de giro sobre la cadena (rad/s)
 *   charm.look(x)                // -1..1 → hacia dónde "mira" (puntero)
 *   charm.setTwistOffset(rad)    // giro extra controlado por scroll
 *   charm.drop(height)           // lo suelta desde arriba (animación de entrada)
 *   charm.setPose({ax, az, tw})  // pose fija (tests / capturas)
 */
import * as THREE from '../vendor/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export const PALETTE = {
  skin: 0xf3c2a0,
  blush: 0xff8c9e,
  hair: 0x1d1f2e,
  hairShine: 0x6d6a9c,
  eye: 0x2a1812,
  frame: 0x14121e,
  hoodie: 0x2f3556,
  hoodieTrim: 0x46507a,
  tee: 0x2de2e6,
  teeInk: 0x14121e,
  pants: 0x3a3452,
  shoe: 0xf2eee6,
  sole: 0x1f1d2b,
  magenta: 0xff3d7f,
  yellow: 0xffd23f,
  cyan: 0x2de2e6,
  outline: 0x0c0a18,
  metal: 0xd7dbe4,
  gold: 0xf5b82e,
};

/* ---------- materiales ---------- */

function makeGradientMap(steps = [90, 165, 255]) {
  // bandas de luz discretas → look "pintado a mano"
  const tex = new THREE.DataTexture(new Uint8Array(steps), steps.length, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function makeOutlineMaterial(color, thickness) {
  // Inverted hull: caras traseras extruidas a lo largo de la normal en espacio de vista
  // → grosor constante aunque la pieza esté escalada de forma no uniforme.
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uThickness: { value: thickness },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        mv.xyz += n * uThickness;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
  });
}

/* ---------- texturas pixel (sin fuentes externas) ---------- */

const GLYPHS = {
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];

function drawBitmap(ctx, rows, x, y, cw, ch) {
  rows.forEach((row, j) => {
    [...row].forEach((bit, i) => {
      if (bit === '1') ctx.fillRect(Math.round(x + i * cw), Math.round(y + j * ch), Math.ceil(cw), Math.ceil(ch));
    });
  });
}

function drawText(ctx, text, cx, cy, cw, ch, gap = 1) {
  const w = text.length * (5 + gap) * cw - gap * cw;
  let x = cx - w / 2;
  for (const c of text) {
    drawBitmap(ctx, GLYPHS[c] || GLYPHS[' '], x, cy - 3.5 * ch, cw, ch);
    x += (5 + gap) * cw;
  }
}

function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// rectángulo redondeado (ctx.roundRect no existe en Safari < 16)
function rr(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

/* ---------- geometrías ---------- */

// Mechón: gota con base redonda y punta afinada (lathe)
function tuftGeometry(len, radius) {
  const pts = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = radius * Math.sin(Math.PI * t) * (1 - 0.5 * t);
    pts.push(new THREE.Vector2(Math.max(r, 1e-4), len * t));
  }
  return new THREE.LatheGeometry(pts, 16);
}

function roundRectPath(path, w, h, r) {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function glassesFrameGeometry(w, h, border, depth) {
  const shape = roundRectPath(new THREE.Shape(), w, h, h * 0.42);
  shape.holes.push(roundRectPath(new THREE.Path(), w - border * 2, h - border * 2, (h - border * 2) * 0.4));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/* ---------- construcción ---------- */

export function createCassCharm({ reducedMotion = false } = {}) {
  const gradientMap = makeGradientMap();
  const softGradient = makeGradientMap([200, 255]); // piel: sombra suave, sin manchas en la cara
  const outlineMat = makeOutlineMaterial(PALETTE.outline, 0.022);
  const mats = new Map();
  const toon = (color, extra = {}) => {
    const key = color + JSON.stringify(Object.keys(extra));
    if (!extra.map && mats.has(key)) return mats.get(key);
    const m = new THREE.MeshToonMaterial({ color, gradientMap, ...extra });
    if (!extra.map) mats.set(key, m);
    return m;
  };
  const metal = new THREE.MeshStandardMaterial({ color: PALETTE.metal, metalness: 1, roughness: 0.28 });
  const flat = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1 });

  const UP = new THREE.Vector3(0, 1, 0);

  function part(parent, geo, mat, { p, r, s, outline = true, name } = {}) {
    const m = new THREE.Mesh(geo, mat);
    if (p) m.position.set(...p);
    if (r) m.rotation.set(...r);
    if (s !== undefined) Array.isArray(s) ? m.scale.set(...s) : m.scale.setScalar(s);
    if (outline) m.add(new THREE.Mesh(geo, outlineMat));
    if (name) m.name = name;
    parent.add(m);
    return m;
  }

  function between(parent, a, b, radius, mat, opts = {}) {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const len = dir.length();
    const geo = new THREE.CapsuleGeometry(radius, Math.max(len, 1e-3), 6, 16);
    const m = part(parent, geo, mat, opts);
    m.position.copy(A).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }

  function tuft(parent, base, tip, radius, mat) {
    const A = new THREE.Vector3(...base);
    const B = new THREE.Vector3(...tip);
    const dir = B.clone().sub(A);
    const m = part(parent, tuftGeometry(dir.length(), radius), mat);
    m.position.copy(A);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    return m;
  }

  /* ===== jerarquía =====
     root (punto del gancho)
       hook + cable
       swing (péndulo principal; rota en X/Z, twist en Y)
         ring
           coinPivot → ficha arcade
         chainPivot (lag secundario)
           eslabones
           figure (Cass)
  */
  const root = new THREE.Group();
  root.name = 'CassCharm';
  const swing = new THREE.Group();
  swing.rotation.order = 'XZY';
  root.add(swing);

  // --- gancho + cable (no se balancea) ---
  const hook = part(root, new THREE.TorusGeometry(0.11, 0.024, 10, 28, Math.PI * 1.35), metal, {
    p: [0, 0.09, 0],
    r: [0, Math.PI / 2, -Math.PI * 0.18],
    outline: false,
  });
  hook.name = 'hook';
  part(root, new THREE.CylinderGeometry(0.014, 0.014, 10, 8), toon(0x5b6080), {
    p: [0, 0.2 + 5, 0],
    outline: false,
  });

  // --- argolla (split ring doble) ---
  const RING_R = 0.42;
  const ring = new THREE.Group();
  ring.position.set(0, -RING_R, 0);
  ring.rotation.y = 0.55;
  swing.add(ring);
  const ringGeo = new THREE.TorusGeometry(RING_R, 0.032, 12, 80);
  part(ring, ringGeo, metal, { outline: false });
  part(ring, ringGeo, metal, { p: [0, 0, 0.05], outline: false });

  // --- cadena ---
  const chainPivot = new THREE.Group();
  chainPivot.position.set(0, -RING_R * 2 + 0.01, 0);
  swing.add(chainPivot);
  const linkGeo = new THREE.TorusGeometry(0.055, 0.017, 8, 22);
  const LINKS = 5;
  const LINK_STEP = 0.15;
  for (let i = 0; i < LINKS; i++) {
    part(chainPivot, linkGeo, metal, {
      p: [0, -0.1 - i * LINK_STEP, 0],
      r: [0, i % 2 ? 0 : Math.PI / 2, 0],
      s: [1, 1.65, 1],
      outline: false,
    });
  }
  const chainLen = 0.1 + (LINKS - 1) * LINK_STEP + 0.1;

  /* ================= FIGURA ================= */
  const figure = new THREE.Group();
  figure.name = 'Cass';
  const EYE_TOP_Y = 2.3; // centro de la argollita del tornillo
  figure.position.set(0, -chainLen - EYE_TOP_Y + 0.03, 0);
  chainPivot.add(figure);

  // pivote interno para squash & stretch desde los pies
  const body = new THREE.Group();
  figure.add(body);

  const skin = new THREE.MeshToonMaterial({ color: PALETTE.skin, gradientMap: softGradient });
  const hairM = toon(PALETTE.hair);
  const hoodie = toon(PALETTE.hoodie);
  const trim = toon(PALETTE.hoodieTrim);

  /* --- torso (lathe) con remera estampada pintada en la textura --- */
  const profileCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.001, 0.29),
    new THREE.Vector2(0.38, 0.3),
    new THREE.Vector2(0.45, 0.42),
    new THREE.Vector2(0.465, 0.56),
    new THREE.Vector2(0.445, 0.74),
    new THREE.Vector2(0.4, 0.89),
    new THREE.Vector2(0.31, 1.0),
    new THREE.Vector2(0.16, 1.08),
    new THREE.Vector2(0.001, 1.1),
  ]);
  const profile = profileCurve.getSpacedPoints(40);
  // longitud real del perfil para que los píxeles del estampado salgan cuadrados
  let profLen = 0;
  const cum = [0];
  for (let i = 1; i < profile.length; i++) {
    profLen += profile[i].distanceTo(profile[i - 1]);
    cum.push(profLen);
  }
  const vAtY = (y) => {
    // v de la lathe es índice/(n-1); buscamos el punto del perfil frontal con esa altura
    let best = 0;
    for (let i = 0; i < profile.length; i++) if (Math.abs(profile[i].y - y) < Math.abs(profile[best].y - y)) best = i;
    return best / (profile.length - 1);
  };
  const torsoTex = canvasTexture(1024, 512, (ctx, W, H) => {
    ctx.fillStyle = hex(PALETTE.hoodie);
    ctx.fillRect(0, 0, W, H);
    const v0 = vAtY(0.5);
    const v1 = vAtY(1.0);
    // canvas: y=0 arriba ↔ v=1 (flipY por defecto)
    const yTop = (1 - v1) * H;
    const yBot = (1 - v0) * H;
    const circ = 2 * Math.PI * 0.44;
    const half = (0.135 / circ) * W;
    // remera cian (abertura del buzo)
    ctx.fillStyle = hex(PALETTE.tee);
    ctx.beginPath();
    ctx.moveTo(W / 2 - half * 1.25, yTop);
    ctx.lineTo(W / 2 + half * 1.25, yTop);
    ctx.lineTo(W / 2 + half, yBot);
    ctx.lineTo(W / 2 - half, yBot);
    ctx.closePath();
    ctx.fill();
    // bordes del cierre
    ctx.fillStyle = hex(PALETTE.hoodieTrim);
    const edge = (0.022 / circ) * W;
    ctx.fillRect(W / 2 - half - edge, yTop, edge, yBot - yTop);
    ctx.fillRect(W / 2 + half, yTop, edge, yBot - yTop);
    // "</>" en pixel art, celdas cuadradas en el mundo
    const cell = 0.019;
    const cw = (cell / circ) * W;
    const ch = (cell / profLen) * H;
    ctx.fillStyle = hex(PALETTE.teeInk);
    const vText = vAtY(0.8);
    drawText(ctx, '</>', W / 2, (1 - vText) * H, cw, ch, 1);
  });
  const torso = part(
    body,
    new THREE.LatheGeometry(profile, 48, Math.PI, Math.PI * 2),
    toon(0xffffff, { map: torsoTex }),
    { name: 'torso' },
  );
  void torso;
  // cintura del buzo
  part(body, new THREE.TorusGeometry(0.41, 0.045, 10, 40), trim, { p: [0, 0.33, 0], r: [Math.PI / 2, 0, 0] });

  // capucha
  part(body, new THREE.TorusGeometry(0.25, 0.085, 12, 30), hoodie, {
    p: [0, 1.02, -0.07],
    r: [Math.PI / 2 - 0.35, 0, 0],
  });
  part(body, new THREE.SphereGeometry(1, 24, 16), hoodie, { p: [0, 0.98, -0.34], s: [0.3, 0.24, 0.15] });
  // cordones
  for (const sx of [-1, 1]) {
    between(body, [sx * 0.15, 0.97, 0.3], [sx * 0.165, 0.84, 0.405], 0.014, toon(PALETTE.shoe), { outline: false });
    part(body, new THREE.SphereGeometry(0.026, 10, 8), toon(PALETTE.magenta), { p: [sx * 0.166, 0.825, 0.41], outline: false });
  }
  // cuello
  part(body, new THREE.CylinderGeometry(0.12, 0.13, 0.16, 16), skin, { p: [0, 1.1, 0], outline: false });

  /* --- piernas y zapatillas --- */
  const pants = toon(PALETTE.pants);
  for (const sx of [-1, 1]) {
    between(body, [sx * 0.17, 0.33, 0], [sx * 0.19, 0.13, 0.02], 0.13, pants);
    part(body, new THREE.SphereGeometry(1, 22, 14), toon(PALETTE.sole), { p: [sx * 0.2, 0.035, 0.07], s: [0.165, 0.055, 0.25] });
    part(body, new THREE.SphereGeometry(1, 22, 14), toon(PALETTE.shoe), { p: [sx * 0.2, 0.085, 0.06], s: [0.15, 0.1, 0.225] });
    // detalle magenta en la zapatilla
    part(body, new THREE.SphereGeometry(1, 16, 10), toon(PALETTE.magenta), {
      p: [sx * 0.2 + sx * 0.1, 0.09, 0.05],
      s: [0.03, 0.05, 0.11],
      outline: false,
    });
  }

  /* --- notebook abierta (tapa con stickers hacia el frente, pantalla con código hacia él) --- */
  const laptop = new THREE.Group();
  laptop.name = 'laptop';
  laptop.position.set(0, 0.5, 0.62);
  body.add(laptop);
  const alu = toon(0xaab1c2);
  part(laptop, new RoundedBoxGeometry(0.5, 0.035, 0.3, 2, 0.012), alu);
  // teclado
  const keysTex = canvasTexture(256, 160, (ctx, W, H) => {
    ctx.fillStyle = '#23263a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3b3f5c';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) ctx.fillRect(10 + c * 20, 10 + r * 22, 16, 17);
    ctx.fillRect(60, 100, 136, 17);
    ctx.fillStyle = '#353952';
    ctx.fillRect(88, 126, 80, 28);
  });
  part(laptop, new THREE.PlaneGeometry(0.44, 0.26), toon(0xffffff, { map: keysTex }), { p: [0, 0.019, 0], r: [-Math.PI / 2, 0, 0], outline: false });
  const lid = new THREE.Group();
  lid.position.set(0, 0.012, 0.15); // bisagra (lado del frente)
  lid.rotation.x = -0.24;
  laptop.add(lid);
  part(lid, new RoundedBoxGeometry(0.5, 0.32, 0.022, 2, 0.01), alu, { p: [0, 0.16, 0] });
  // pantalla (mira hacia la figura)
  const codeTex = canvasTexture(256, 160, (ctx, W, H) => {
    ctx.fillStyle = '#0e0c1f';
    ctx.fillRect(0, 0, W, H);
    const cols = [hex(PALETTE.magenta), hex(PALETTE.cyan), hex(PALETTE.yellow), '#8f88b8', '#efe9ff'];
    const lines = [[0, 3, 6, 1, 9, 4], [1, 2, 5, 3], [1, 2, 3, 0, 7], [2, 4, 1, 3, 2], [1, 3, 8], [2, 1, 4, 2], [0, 5], [1, 4, 3, 6], [0, 2]];
    lines.forEach((l, i) => {
      let x = 14 + (i % 3 === 0 ? 0 : 14) * (i % 2 ? 1 : 2) * 0.5;
      l.forEach((w, j) => {
        ctx.fillStyle = cols[(i + j) % cols.length];
        ctx.fillRect(x, 12 + i * 16, w * 6, 8);
        x += w * 6 + 6;
      });
    });
    ctx.fillStyle = hex(PALETTE.cyan);
    ctx.fillRect(14, 12 + 9 * 16, 6, 9); // cursor
  });
  part(lid, new THREE.PlaneGeometry(0.44, 0.27), new THREE.MeshBasicMaterial({ map: codeTex }), {
    p: [0, 0.165, -0.0125],
    r: [0, Math.PI, 0],
    outline: false,
  });
  // stickers en la tapa
  const stickerTex = canvasTexture(320, 200, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const sticker = (x, y, w, h, bg, rot, draw) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      rr(ctx, -w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 12);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath();
      rr(ctx, -w / 2, -h / 2, w, h, 9);
      ctx.fill();
      draw();
      ctx.restore();
    };
    sticker(90, 70, 110, 64, hex(PALETTE.magenta), -0.12, () => {
      ctx.fillStyle = '#ffffff';
      drawText(ctx, '</>', 0, 0, 5, 5, 1);
    });
    sticker(225, 120, 70, 70, hex(PALETTE.yellow), 0.18, () => {
      ctx.fillStyle = hex(PALETTE.magenta);
      drawBitmap(ctx, HEART, -3.5 * 7, -3 * 7, 7, 7);
    });
    sticker(110, 155, 96, 36, hex(PALETTE.cyan), 0.06, () => {
      ctx.fillStyle = hex(PALETTE.teeInk);
      drawText(ctx, 'CASS', 0, 0, 3, 3, 1);
    });
  });
  part(lid, new THREE.PlaneGeometry(0.46, 0.29), new THREE.MeshToonMaterial({ map: stickerTex, gradientMap, transparent: true }), {
    p: [0, 0.16, 0.0125],
    outline: false,
  });
  // reflejo de la pantalla en la cara (luz cian muy suave)
  const screenGlow = new THREE.PointLight(0x7ff7ff, 0.6, 1.4, 2);
  screenGlow.position.set(0, 0.2, -0.25);
  lid.add(screenGlow);

  /* --- auriculares al cuello --- */
  const phonesM = toon(0x1a1828);
  part(body, new THREE.TorusGeometry(0.31, 0.03, 10, 30, Math.PI), phonesM, { p: [0, 1.05, 0.02], r: [-Math.PI / 2 + 0.2, 0, 0] });
  for (const sx of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(sx * 0.3, 1.0, 0.1);
    cup.rotation.set(0, sx * 0.5, Math.PI / 2);
    body.add(cup);
    part(cup, new THREE.CylinderGeometry(0.095, 0.095, 0.07, 22), phonesM);
    part(cup, new THREE.CylinderGeometry(0.06, 0.06, 0.075, 18), toon(PALETTE.cyan), { p: [0, sx * 0.002, 0], outline: false });
  }

  /* --- brazos --- */
  for (const sx of [-1, 1]) {
    const shoulder = [sx * 0.37, 0.9, 0.0];
    const hand = [sx * 0.17, 0.555, 0.56];
    between(body, shoulder, hand, 0.115, hoodie);
    // puño
    between(body, [sx * 0.19, 0.6, 0.49], [sx * 0.18, 0.58, 0.52], 0.108, trim, { outline: false });
    part(body, new THREE.SphereGeometry(1, 18, 12), skin, { p: [sx * 0.165, 0.55, 0.6], s: [0.085, 0.06, 0.1] });
  }

  /* --- cabeza --- */
  const head = new THREE.Group();
  head.position.set(0, 1.58, 0);
  body.add(head);
  const HR = [0.62, 0.56, 0.58];
  part(head, new THREE.SphereGeometry(1, 48, 32), skin, { s: HR, name: 'head' });
  // orejas
  for (const sx of [-1, 1]) {
    part(head, new THREE.SphereGeometry(1, 16, 12), skin, { p: [sx * 0.6, -0.06, 0.04], s: [0.085, 0.12, 0.07] });
  }
  // superficie de la cara (elipsoide) → z de apoyo
  const faceZ = (x, y) => HR[2] * Math.sqrt(Math.max(0, 1 - (x / HR[0]) ** 2 - (y / HR[1]) ** 2));

  // ojos
  for (const sx of [-1, 1]) {
    const x = sx * 0.21;
    const y = -0.05;
    const z = faceZ(x, y) - 0.012;
    const eye = part(head, new THREE.SphereGeometry(1, 20, 14), toon(PALETTE.eye), {
      p: [x, y, z],
      s: [0.042, 0.056, 0.03],
      r: [0, sx * 0.35, 0],
      outline: false,
    });
    eye.name = 'eye';
    part(head, new THREE.SphereGeometry(0.011, 8, 6), flat(0xffffff), { p: [x + 0.014, y + 0.02, z + 0.028], outline: false });
    // cejas
    between(head, [x - 0.075, 0.155, faceZ(x - 0.075, 0.155) - 0.004], [x + 0.075, 0.16 + sx * 0.004, faceZ(x + 0.075, 0.16) - 0.004], 0.019, hairM, {
      outline: false,
    });
  }
  // nariz
  part(head, new THREE.SphereGeometry(0.032, 12, 8), toon(0xe9ab86), { p: [0, -0.15, faceZ(0, -0.15) - 0.008], outline: false });
  // sonrisa
  const smile = new THREE.Group();
  smile.position.set(0.02, -0.255, faceZ(0, -0.255) - 0.004);
  smile.rotation.x = 0.45;
  head.add(smile);
  part(smile, new THREE.TorusGeometry(0.05, 0.012, 8, 20, Math.PI * 0.7), toon(0x5a2a2a), {
    r: [0, 0, Math.PI + Math.PI * 0.15],
    outline: false,
  });

  // anteojos
  const glasses = new THREE.Group();
  glasses.name = 'glasses';
  head.add(glasses);
  const frameGeo = glassesFrameGeometry(0.36, 0.27, 0.04, 0.032);
  const frameMat = toon(PALETTE.frame);
  for (const sx of [-1, 1]) {
    const lens = new THREE.Group();
    lens.position.set(sx * 0.215, -0.05, 0.6);
    lens.rotation.y = sx * 0.24;
    glasses.add(lens);
    part(lens, frameGeo, frameMat, { outline: false });
    // vidrio apenas tintado + brillo diagonal
    part(lens, new THREE.PlaneGeometry(0.29, 0.2), flat(0x9ff6ff, 0.12), { outline: false });
    part(lens, new THREE.PlaneGeometry(0.035, 0.2), flat(0xffffff, 0.7), { p: [0.07, 0.0, 0.004], r: [0, 0, 0.6], outline: false });
    part(lens, new THREE.PlaneGeometry(0.015, 0.13), flat(0xffffff, 0.6), { p: [0.11, -0.01, 0.004], r: [0, 0, 0.6], outline: false });
    // patillas
    between(glasses, [sx * 0.39, -0.03, 0.53], [sx * 0.6, -0.02, 0.05], 0.016, frameMat, { outline: false });
  }
  part(glasses, new THREE.BoxGeometry(0.09, 0.035, 0.03), frameMat, { p: [0, -0.02, 0.625], outline: false });

  /* --- pelo --- */
  const hair = new THREE.Group();
  hair.name = 'hair';
  head.add(hair);
  // casco (domo inclinado hacia atrás → nacimiento del pelo alto adelante, bajo atrás)
  const domePts = new THREE.EllipseCurve(0, 0, 0.665, 0.6, Math.PI / 2, -0.12, true)
    .getSpacedPoints(24)
    .map((p) => new THREE.Vector2(Math.max(p.x, 1e-4), p.y));
  domePts.push(new THREE.Vector2(1e-4, domePts[domePts.length - 1].y));
  part(hair, new THREE.LatheGeometry(domePts, 40), hairM, { p: [0, 0.05, -0.04], r: [-0.42, 0, 0] });
  // volumen trasero/lateral corto (evita la nuca "pelada" bajo el casco)
  part(hair, new THREE.SphereGeometry(1, 36, 24), hairM, { p: [0, -0.02, -0.12], s: [0.645, 0.47, 0.53] });

  // mechones: jopo barrido hacia arriba y a la derecha (como en la referencia)
  const T = (b, t, r) => tuft(hair, b, t, r, hairM);
  T([-0.3, 0.34, 0.32], [0.3, 0.76, 0.46], 0.29); // jopo principal, barrido a la derecha
  T([-0.46, 0.26, 0.2], [-0.02, 0.7, 0.4], 0.23);
  T([0.0, 0.4, 0.18], [0.52, 0.62, 0.28], 0.25);
  T([-0.26, 0.42, -0.06], [0.28, 0.72, -0.1], 0.26);
  T([0.2, 0.34, 0.04], [0.64, 0.42, 0.02], 0.2);
  // flequillo que cae sobre la frente (rompe la línea recta del casco)
  T([-0.38, 0.42, 0.36], [0.12, 0.24, 0.55], 0.15);
  T([-0.52, 0.32, 0.26], [-0.24, 0.2, 0.5], 0.12);
  // atrás
  T([-0.05, 0.44, -0.2], [0.16, 0.36, -0.66], 0.25);
  T([-0.32, 0.32, -0.28], [-0.56, 0.1, -0.54], 0.2);
  T([0.32, 0.3, -0.28], [0.58, 0.08, -0.52], 0.19);
  T([0.0, -0.02, -0.45], [0.03, -0.26, -0.63], 0.18);
  // brillo pintado sobre el jopo
  const shine = flat(PALETTE.hairShine);
  part(hair, new THREE.SphereGeometry(1, 12, 8), shine, { p: [0.0, 0.62, 0.53], r: [0, 0, 0.75], s: [0.12, 0.022, 0.03], outline: false });

  // tornillo con argollita (donde engancha la cadena)
  part(head, new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), metal, { p: [0, 0.62, -0.03], outline: false });
  part(head, new THREE.TorusGeometry(0.06, 0.018, 8, 20), metal, {
    p: [0, EYE_TOP_Y - 1.58 - 0.0, -0.03],
    r: [0, 0, 0],
    outline: false,
  });

  /* --- ficha arcade colgando de la argolla --- */
  const coinPivot = new THREE.Group();
  const a = (-162 * Math.PI) / 180;
  coinPivot.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0.02);
  coinPivot.rotation.y = -0.55; // compensa el giro de la argolla
  ring.add(coinPivot);
  const coinHolder = new THREE.Group();
  coinPivot.add(coinHolder);
  part(coinHolder, linkGeo, metal, { p: [0, -0.08, 0], r: [0, Math.PI / 2, 0], s: [1, 1.5, 1], outline: false });
  const COIN_R = 0.27;
  const coinFace = (back) =>
    canvasTexture(256, 256, (ctx, W, H) => {
      const g = ctx.createRadialGradient(W * 0.4, H * 0.35, 10, W / 2, H / 2, W / 2);
      g.addColorStop(0, '#ffe58a');
      g.addColorStop(1, hex(PALETTE.gold));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#b07a12';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#7a4d05';
      ctx.save();
      // el UV del cilindro deja el dibujo rotado; lo compensamos
      ctx.translate(W / 2, H / 2);
      ctx.rotate(back ? Math.PI / 2 : -Math.PI / 2);
      if (back) ctx.scale(-1, 1);
      ctx.translate(-W / 2, -H / 2);
      if (back) {
        ctx.fillStyle = hex(PALETTE.magenta);
        drawBitmap(ctx, HEART, W / 2 - 3.5 * 14, H / 2 - 3 * 14, 14, 14);
      } else {
        drawText(ctx, 'CASS', W / 2, H / 2 - 22, 7, 7, 1);
        drawText(ctx, 'DEV', W / 2, H / 2 + 30, 7, 7, 1);
      }
      ctx.restore();
    });
  const goldM = toon(PALETTE.gold);
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(COIN_R, COIN_R, 0.05, 48), [
    goldM,
    toon(0xffffff, { map: coinFace(false) }),
    toon(0xffffff, { map: coinFace(true) }),
  ]);
  coin.add(new THREE.Mesh(coin.geometry, outlineMat));
  coin.rotation.x = Math.PI / 2;
  coin.position.set(0, -0.08 - 0.08 - 0.04 - COIN_R, 0);
  // agujerito/argollita de la ficha
  part(coinHolder, new THREE.TorusGeometry(0.035, 0.012, 8, 16), metal, { p: [0, -0.18, 0], outline: false });
  coinHolder.add(coin);
  coinHolder.position.z = -0.1;

  /* ================= FÍSICA ================= */
  const S = {
    ax: 0, az: 0, vx: 0, vz: 0, // péndulo principal
    sx: 0, sz: 0, svx: 0, svz: 0, // lag de la cadena
    cx: 0, cz: 0, cvx: 0, cvz: 0, // ficha
    tw: 0, tv: 0, // twist
    drop: 0, dropV: 0,
    sq: 0, sqV: 0,
    look: 0, lookS: 0,
    twistOffset: 0,
    frozen: false,
    _squashed: false,
  };

  function update(dt, t) {
    if (S.frozen) return;
    dt = Math.min(dt, 1 / 30);
    const steps = 3;
    const h = dt / steps;
    const breezeAmp = reducedMotion ? 0.0 : 1;
    for (let i = 0; i < steps; i++) {
      const tt = t + i * h;
      const breeze = breezeAmp * (0.05 * Math.sin(tt * 0.8) + 0.03 * Math.sin(tt * 2.1 + 1.3));
      const axAcc = -4.6 * Math.sin(S.ax) - 0.75 * S.vx + breezeAmp * 0.02 * Math.sin(tt * 1.1);
      const azAcc = -4.6 * Math.sin(S.az) - 0.75 * S.vz + breeze;
      S.vx += axAcc * h;
      S.vz += azAcc * h;
      S.vx = THREE.MathUtils.clamp(S.vx, -3, 3);
      S.vz = THREE.MathUtils.clamp(S.vz, -3, 3);
      S.ax += S.vx * h;
      S.az += S.vz * h;
      S.ax = THREE.MathUtils.clamp(S.ax, -0.9, 0.9);
      S.az = THREE.MathUtils.clamp(S.az, -0.9, 0.9);

      const sxAcc = -34 * S.sx - 4.8 * S.svx - 0.55 * axAcc;
      const szAcc = -34 * S.sz - 4.8 * S.svz - 0.55 * azAcc;
      S.svx += sxAcc * h;
      S.svz += szAcc * h;
      S.sx += S.svx * h;
      S.sz += S.svz * h;

      const cxAcc = -16 * S.cx - 1.6 * S.cvx - 0.9 * axAcc;
      const czAcc = -16 * S.cz - 1.6 * S.cvz - 0.9 * azAcc;
      S.cvx += cxAcc * h;
      S.cvz += czAcc * h;
      S.cx += S.cvx * h;
      S.cz += S.cvz * h;

      S.lookS += (S.look - S.lookS) * Math.min(1, h * 3);
      const idle = breezeAmp * 0.18 * Math.sin(tt * 0.45);
      const target = S.lookS * 0.55 + idle + S.twistOffset;
      const tAcc = -5.5 * (S.tw - target) - 2.4 * S.tv;
      S.tv += tAcc * h;
      S.tv = THREE.MathUtils.clamp(S.tv, -8, 8);
      S.tw += S.tv * h;

      const prevV = S.dropV;
      const dAcc = -55 * S.drop - 8.6 * S.dropV;
      S.dropV += dAcc * h;
      S.drop += S.dropV * h;
      if (!S._squashed && prevV < -0.5 && S.dropV >= 0) {
        // tocó el punto más bajo: squash + balanceo (una sola vez por caída)
        S._squashed = true;
        S.sqV -= Math.min(4, -prevV * 0.35);
        S.vz += (Math.random() - 0.5) * 1.2;
        S.vx += 0.5;
      }
      const qAcc = -160 * S.sq - 9 * S.sqV;
      S.sqV += qAcc * h;
      S.sq += S.sqV * h;
    }
    apply();
  }

  function apply() {
    swing.rotation.set(S.ax, S.tw, S.az);
    chainPivot.rotation.set(S.sx, 0, S.sz);
    coinPivot.rotation.set(-0.0 + S.cx, -0.55, S.cz);
    root.position.y = root.userData.baseY + S.drop;
    const q = THREE.MathUtils.clamp(S.sq, -0.25, 0.25);
    body.scale.set(1 - q * 0.5, 1 + q, 1 - q * 0.5);
  }

  root.userData.baseY = 0;

  return {
    root,
    figure,
    parts: { swing, ring, chainPivot, figure, head, hair, glasses, laptop, coin, hook },
    update,
    push(dx, dz) {
      S.vx += dx;
      S.vz += dz;
    },
    spin(v) {
      S.tv += v;
    },
    look(x) {
      S.look = THREE.MathUtils.clamp(x, -1, 1);
    },
    setTwistOffset(rad) {
      S.twistOffset = rad;
    },
    drop(height) {
      S.drop = height;
      S.dropV = 0;
      S._squashed = false;
    },
    setBaseY(y) {
      root.userData.baseY = y;
      apply();
    },
    setPose({ ax = 0, az = 0, tw = 0, freeze = true } = {}) {
      Object.assign(S, { ax, az, tw, vx: 0, vz: 0, tv: 0, sx: 0, sz: 0, svx: 0, svz: 0, cx: 0, cz: 0, cvx: 0, cvz: 0, drop: 0, dropV: 0, sq: 0, sqV: 0, _squashed: false });
      S.frozen = freeze;
      apply();
    },
    get state() {
      return S;
    },
  };
}
