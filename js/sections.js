/**
 * sections.js — Renderiza el contenido dinámico (máquinas, galería, skills, contacto)
 * a partir de data.js. Todo se construye con nodos DOM (textContent) → sin innerHTML
 * con datos, sin riesgo de inyección.
 */
import { PROFILE, CONTACT, PROJECTS, FILTERS, SKILL_GROUPS } from './data.js';
import { createImg } from './media.js';

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
};

/* ================= PLAYER ================= */
export function renderPlayer() {
  const about = document.getElementById('about-text');
  PROFILE.about.forEach((p) => about.append(h('p', { text: p })));

  const stats = document.getElementById('stats');
  PROFILE.stats.forEach(([k, v]) => stats.append(h('dt', { text: k }), h('dd', { text: v })));

  const ach = document.getElementById('achievements');
  PROFILE.achievements.forEach((a) =>
    ach.append(
      h('li', { class: a.isNew ? 'is-new' : '' },
        h('span', { class: 'ach__star', 'aria-hidden': 'true', text: '★' }),
        h('span', { class: 'ach__label', text: a.label }),
        h('span', { class: 'ach__meta', text: [a.where, a.year].filter(Boolean).join(' · ') }),
        a.isNew ? h('span', { class: 'ach__new', text: 'NEW' }) : null,
      ),
    ),
  );
}

/* ================= ARCADE ================= */
const CATEGORY_LABEL = { web: 'WEB', sistema: 'SISTEMA', fullstack: 'FULL-STACK' };

export function renderArcade({ onOpen }) {
  const grid = document.getElementById('cabinets');
  const filters = document.getElementById('filters');
  const cards = [];

  PROJECTS.forEach((p, i) => {
    const screenImg = createImg(p.images[0], { className: 'cab__img' });
    const count = h('span', { class: 'cab__count', text: `1/${p.images.length}` });
    const screen = h(
      'button',
      { class: 'cab__screen', type: 'button', 'aria-label': `Ver galería de ${p.title}: ${p.images.length} imágenes`, onclick: () => onOpen(p, 0) },
      screenImg,
      h('span', { class: 'cab__scan', 'aria-hidden': 'true' }),
      count,
    );

    const actions = h('div', { class: 'cab__actions' });
    if (p.links.live) actions.append(h('a', { class: 'coin-btn', href: p.links.live, target: '_blank', rel: 'noopener', text: '▶ JUGAR · VER WEB' }));
    if (p.links.video) actions.append(h('a', { class: 'coin-btn', href: p.links.video, target: '_blank', rel: 'noopener', text: '▶ VER VIDEO' }));
    actions.append(h('button', { class: 'ghost-btn', type: 'button', onclick: () => onOpen(p, 0), text: `GALERÍA (${p.images.length})` }));

    const card = h(
      'article',
      { class: 'cab reveal', 'data-category': p.category, 'aria-labelledby': `cab-${p.id}` },
      h('div', { class: 'cab__marquee' },
        p.badge ? h('span', { class: 'cab__badge', text: p.badge }) : null,
        h('h3', { id: `cab-${p.id}`, text: p.title }),
        h('p', { text: p.subtitle }),
      ),
      h('div', { class: 'cab__bezel' }, screen),
      h('div', { class: 'cab__panel', 'aria-hidden': 'true' },
        h('span', { class: 'stick' }), h('span', { class: 'b b1' }), h('span', { class: 'b b2' }), h('span', { class: 'b b3' }),
      ),
      h('div', { class: 'cab__body' },
        h('p', { class: 'cab__cat', text: `${String(i + 1).padStart(2, '0')} · ${CATEGORY_LABEL[p.category]}` }),
        h('p', { class: 'cab__desc', text: p.description }),
        h('ul', { class: 'chips', 'aria-label': 'Tecnologías' }, p.tech.map((t) => h('li', { text: t }))),
        actions,
      ),
    );
    card.style.setProperty('--c', p.color);

    // "attract mode": al pasar el mouse la pantalla recorre las capturas
    let current = screenImg;
    let timer = null;
    let idx = 0;
    const showFrame = (i) => {
      idx = i;
      const next = createImg(p.images[i], { className: 'cab__img', eager: true });
      current.replaceWith(next);
      current = next;
      count.textContent = `${i + 1}/${p.images.length}`;
    };
    const cycle = () => {
      screen.classList.add('is-glitch');
      setTimeout(() => {
        showFrame((idx + 1) % p.images.length);
        screen.classList.remove('is-glitch');
      }, 120);
    };
    const start = () => { if (p.images.length > 1 && !timer) timer = setInterval(cycle, 1300); };
    const stop = () => {
      clearInterval(timer);
      timer = null;
      if (idx !== 0) showFrame(0);
    };
    card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') start(); });
    card.addEventListener('pointerleave', stop);
    cards.push(card);
    grid.append(card);
  });

  FILTERS.forEach(([key, label], i) => {
    const btn = h('button', { type: 'button', class: 'filter', 'aria-pressed': i === 0 ? 'true' : 'false', text: label });
    btn.addEventListener('click', () => {
      filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      cards.forEach((c) => {
        const on = key === 'all' || c.dataset.category === key;
        c.hidden = !on;
        if (on) shown++;
      });
      document.getElementById('arcade-status').textContent = `${shown} máquinas encendidas`;
    });
    filters.append(btn);
  });
  document.getElementById('arcade-status').textContent = `${PROJECTS.length} máquinas encendidas`;
  document.getElementById('project-count').textContent = String(PROJECTS.length).padStart(2, '0');
}

/* ================= GALERÍA (dialog) ================= */
export function createGallery({ onToggle }) {
  const dlg = document.getElementById('gallery');
  const imgWrap = dlg.querySelector('.gal__screen');
  const title = dlg.querySelector('#gal-title');
  const sub = dlg.querySelector('.gal__sub');
  const counter = dlg.querySelector('.gal__count');
  const desc = dlg.querySelector('.gal__desc');
  const chips = dlg.querySelector('.gal__chips');
  const links = dlg.querySelector('.gal__links');
  const caption = dlg.querySelector('.gal__caption');
  let project = null, idx = 0;

  function show(i) {
    idx = (i + project.images.length) % project.images.length;
    const img = project.images[idx];
    imgWrap.querySelector('img')?.remove();
    imgWrap.prepend(createImg(img, { eager: true, sizes: '(max-width: 900px) 94vw, 860px' }));
    counter.textContent = `${idx + 1} / ${project.images.length}`;
    caption.textContent = img.alt;
    dlg.querySelectorAll('.gal__nav').forEach((b) => (b.hidden = project.images.length < 2));
  }

  function open(p, i = 0) {
    project = p;
    dlg.style.setProperty('--c', p.color);
    title.textContent = p.title;
    sub.textContent = p.subtitle;
    desc.textContent = p.description;
    chips.replaceChildren(...p.tech.map((t) => h('li', { text: t })));
    links.replaceChildren();
    if (p.links.live) links.append(h('a', { class: 'coin-btn', href: p.links.live, target: '_blank', rel: 'noopener', text: '▶ VER WEB' }));
    if (p.links.video) links.append(h('a', { class: 'coin-btn', href: p.links.video, target: '_blank', rel: 'noopener', text: '▶ VER VIDEO' }));
    show(i);
    dlg.showModal();
    onToggle?.(true);
  }

  dlg.querySelector('.gal__prev').addEventListener('click', () => show(idx - 1));
  dlg.querySelector('.gal__next').addEventListener('click', () => show(idx + 1));
  dlg.querySelector('.gal__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => onToggle?.(false));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // click en el fondo
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  // swipe en mobile
  let sx = null;
  imgWrap.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  imgWrap.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });
  return { open };
}

/* ================= SKILLS ================= */
const norm = (s) => s.toLowerCase().replace(/\.js\b/g, '').replace(/\s+\d+$/, '').replace(/[^a-z0-9áéíóúñ]+/g, ' ').trim();

export function renderSkills() {
  const wrap = document.getElementById('skills-grid');
  const usage = new Map();
  PROJECTS.forEach((p) => p.tech.forEach((t) => usage.set(norm(t), (usage.get(norm(t)) || 0) + 1)));
  SKILL_GROUPS.forEach((g) => {
    const ul = h('ul', { class: 'inv__items' });
    g.items.forEach((item) => {
      const n = usage.get(norm(item)) || 0;
      ul.append(
        h('li', { class: n ? 'has-uses' : '', title: n ? `Usado en ${n} proyecto${n > 1 ? 's' : ''} de esta web` : null },
          h('span', { text: item }),
          n ? h('b', { 'aria-label': `${n} proyectos`, text: `x${n}` }) : null,
        ),
      );
    });
    wrap.append(h('section', { class: 'inv reveal', 'aria-label': g.name }, h('h3', { text: g.name }), ul));
  });
}

/* ================= CONTACTO ================= */
export function renderContact() {
  const list = document.getElementById('contact-list');
  const row = (k, label, href, extra) =>
    h('li', {},
      h('span', { class: 'ct__k', text: k }),
      href ? h('a', { href, target: href.startsWith('http') ? '_blank' : null, rel: href.startsWith('http') ? 'noopener' : null, text: label }) : h('span', { text: label }),
      extra || null,
    );
  const copyBtn = h('button', { type: 'button', class: 'mini-btn', text: 'COPIAR' });
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      copyBtn.textContent = '¡COPIADO!';
    } catch {
      copyBtn.textContent = 'NO SE PUDO';
    }
    setTimeout(() => (copyBtn.textContent = 'COPIAR'), 1600);
  });
  list.append(
    row('EMAIL', CONTACT.email, `mailto:${CONTACT.email}`, copyBtn),
    row('WHATSAPP', CONTACT.phoneDisplay, CONTACT.whatsapp),
    row('LINKEDIN', CONTACT.linkedinLabel, CONTACT.linkedin),
    row('GITHUB', CONTACT.githubLabel, CONTACT.github),
    row('BASE', PROFILE.location),
  );
  const stats = document.getElementById('contact-stats');
  [['STATUS', 'READY FOR WORK'], ['RESPUESTA', CONTACT.responseTime], ['HORARIO', CONTACT.timezone], ['NEXT LEVEL', 'TU PROYECTO']].forEach(([k, v]) =>
    stats.append(h('dt', { text: k }), h('dd', { text: v })),
  );
  document.getElementById('wa-cta').href = CONTACT.whatsapp;
  document.getElementById('mail-cta').href = `mailto:${CONTACT.email}`;
}
