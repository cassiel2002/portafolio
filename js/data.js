/**
 * data.js — Contenido del portfolio (fuente única de verdad).
 * Tomado de https://cassdev.com.ar/port/ y https://rinconmate.com.ar/ (nov 2026).
 * Este módulo no toca el DOM: lo usa la web y también scripts/upload-cloudinary.mjs.
 *
 * images[].id   → nombre del archivo local (img/<id>.webp) y public_id en Cloudinary
 * images[].src  → URL original (ibb) para migrarla a Cloudinary; null si no hay
 * images[].w/h  → tamaño intrínseco de la versión local (evita saltos de layout)
 */

export const PROFILE = {
  name: 'Cassiel Maximiliano Lucero',
  short: 'CASS',
  role: 'Estudiante de Ingeniería en Sistemas · 4º año',
  university: 'Universidad Nacional de La Rioja (UNLaR)',
  tagline: 'Desarrollador apasionado por la IA, el desarrollo web y la creación de soluciones tecnológicas innovadoras.',
  location: 'La Rioja, Argentina',
  about: [
    'Curso el cuarto año de Ingeniería en Sistemas en la Universidad Nacional de La Rioja (UNLaR). Trabajo bien en equipos colaborativos, con responsabilidad y formalidad, y me enfoco en aprender todo el tiempo y mejorar en cada proyecto.',
    'Mi objetivo es crecer en el campo tecnológico aportando compromiso, iniciativa y una mentalidad orientada a resolver problemas. Me adapto rápido a entornos dinámicos, manejo con soltura distintos sistemas y software, y hablo español nativo e inglés intermedio-avanzado.',
    'Me formé en Deep Learning en la UNLP (redes neuronales, aprendizaje supervisado y no supervisado, con datasets reales) y en desarrollo Full Stack MERN (MongoDB, Express.js, React y Node.js) con el curso ITBA × Santander.',
  ],
  stats: [
    ['LEVEL', '4º año'],
    ['CLASS', 'Developer'],
    ['BASE', 'La Rioja, AR'],
    ['STATUS', 'Disponible'],
  ],
  achievements: [
    { label: 'Principios de Computación Cuántica', where: 'Concepción del Uruguay, Entre Ríos', year: '2026', isNew: true },
    { label: 'Full Stack MERN', where: 'ITBA × Banco Santander', year: '2025' },
    { label: 'Deep Learning', where: 'UNLP', year: '2024' },
    { label: 'Inglés nivel B1', where: 'UNCA', year: '2019' },
    { label: 'Reparación de PC', where: 'ISAF', year: '2018' },
    { label: 'Proyectos de IA y Python', where: 'Autodidacta', year: '' },
  ],
};

export const CONTACT = {
  email: 'cassieluc@gmail.com',
  phoneDisplay: '+54 9 3834 768445',
  phoneE164: '+5493834768445',
  whatsapp: 'https://wa.me/5493834768445',
  linkedin: 'https://www.linkedin.com/in/cassiel-lucero-493772275/',
  linkedinLabel: 'cassiel-lucero-493772275',
  github: 'https://github.com/cassiel2002',
  githubLabel: 'cassiel2002',
  responseTime: '< 24 h',
  timezone: 'GMT-3',
};

/** category: web | sistema | fullstack */
export const PROJECTS = [
  {
    id: 'rincon-web',
    title: 'Rincón del Mate',
    subtitle: 'Web con recorrido 3D',
    badge: 'NEW',
    category: 'web',
    color: '#ff8a3d',
    description:
      'Sitio de la cafetería de Villa Sanagasta con un recorrido 3D interactivo del local: vista general, modo para caminar por el lugar, modo noche y carteles que llevan a cada sección. Incluye la carta con precios por categoría y buscador, los espacios, horarios y cómo llegar.',
    tech: ['React', 'Three.js', 'Vite', '3D interactivo', 'Responsive'],
    links: { live: 'https://rinconmate.com.ar' },
    images: [
      { id: 'rinconweb-recorrido', src: null, w: 800, h: 600, alt: 'Recorrido 3D del local de El Rincón del Mate con carteles interactivos' },
      { id: 'rinconweb-carta', src: null, w: 600, h: 450, alt: 'Carta de El Rincón del Mate con categorías, precios y buscador' },
    ],
  },
  {
    id: 'doctor-inmobiliario',
    title: 'El Doctor Inmobiliario',
    subtitle: 'Real estate en Tulum · leads',
    category: 'web',
    color: '#c9a24a',
    description:
      'Web para un asesor inmobiliario de Tulum orientada a inversores internacionales: zonas, portfolio de propiedades, due diligence, guía descargable y agenda de llamadas. La sección Rentas invierte la paleta (de negro y dorado a crema). Mide con Google Analytics 4 con consentimiento de cookies e incluye un embudo de leads desde Instagram con formulario conectado a un CRM.',
    tech: ['Next.js', 'Google Analytics 4', 'Embudo de leads', 'CRM', 'Calendly', 'Responsive'],
    links: { live: 'https://eldoctorinmobiliario.com' },
    images: [
      { id: 'doctor-enclaves', src: null, w: 633, h: 480, alt: 'Sección de zonas de inversión en Tulum de El Doctor Inmobiliario' },
      { id: 'doctor-rentas', src: null, w: 633, h: 480, alt: 'Sección Rentas con paleta clara y villas para estadías' },
    ],
  },
  {
    id: 'erre',
    title: 'ERRE+',
    subtitle: 'Agencia creativa',
    category: 'web',
    color: '#9b5cff',
    description:
      'Frontend para una agencia de estrategia, branding y producción de La Rioja: intro animada, carrusel en abanico de proyectos destacados, galerías por marca, métricas de la agencia y contacto directo por WhatsApp e Instagram. Animaciones con Framer Motion, scroll suave con Lenis y tipografía propia.',
    tech: ['React', 'Vite', 'Framer Motion', 'Lenis', 'Tipografía custom', 'Responsive'],
    links: { live: 'https://www.agenciaerre.com.ar' },
    images: [
      { id: 'erre-inicio', src: null, w: 791, h: 600, alt: 'Portada de ERRE+ Agencia Creativa' },
      { id: 'erre-proyectos', src: null, w: 475, h: 360, alt: 'Carrusel en abanico de proyectos destacados' },
      { id: 'erre-desafios', src: null, w: 475, h: 360, alt: 'Sección de marcas acompañadas por la agencia' },
    ],
  },
  {
    id: 'kioskov2',
    title: 'KioskoV2',
    subtitle: 'Gestión para PyMEs',
    category: 'sistema',
    color: '#2de2e6',
    description:
      'Sistema de gestión para PyMEs con POS integrado, pagos digitales con MercadoPago (QR, OAuth2 y webhooks), analytics y arquitectura multi-tenant escalable. Paginación inteligente, dashboard en tiempo real, reportes por categoría y marca, y vista dual tabla/tarjetas.',
    tech: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Firebase', 'Google Cloud Functions', 'MercadoPago SDK', 'Recharts', 'ExcelJS', 'Multi-tenant'],
    links: {},
    images: [
      { id: 'kiosko-pos', src: 'https://i.ibb.co/HTXzxx1T/POS-PUNTO-VENTA.jpg', w: 638, h: 294, alt: 'Punto de venta de KioskoV2 con productos, carrito y métodos de pago' },
      { id: 'kiosko-dashboard', src: 'https://i.ibb.co/8ns9JQH4/dashboard-ventas.jpg', w: 318, h: 198, alt: 'Dashboard de ventas de KioskoV2' },
      { id: 'kiosko-estadisticas', src: 'https://i.ibb.co/TxtB4W2z/estadisticas-y-demanda.jpg', w: 318, h: 210, alt: 'Estadísticas y demanda en KioskoV2' },
      { id: 'kiosko-pedidos', src: 'https://i.ibb.co/23TXzyTv/gestion-pedidos.jpg', w: 318, h: 156, alt: 'Gestión de pedidos en KioskoV2' },
      { id: 'kiosko-stock', src: 'https://i.ibb.co/C3LbLMy4/kioskov2-2.jpg', w: 318, h: 198, alt: 'Gestión de stock en KioskoV2' },
      { id: 'kiosko-inicio', src: 'https://i.ibb.co/VY6XHpWF/kioskv1-1.jpg', w: 318, h: 194, alt: 'Pantalla de inicio de Kiosko' },
    ],
  },
  {
    id: 'drive-plus',
    title: 'Drive+',
    subtitle: 'Turnos de pádel',
    category: 'sistema',
    color: '#3d8bff',
    description:
      'Aplicación web para gestionar turnos y canchas de pádel. Centraliza las reservas, evita superposiciones automáticamente, muestra la disponibilidad por semana o por día e incluye un panel administrativo completo. Reemplaza la gestión manual de los complejos deportivos.',
    tech: ['React', 'Node.js', 'Python', 'Firebase Auth', 'Neon (PostgreSQL)', 'Railway', 'Tailwind CSS', 'Framer Motion'],
    links: { live: 'https://drive-plus.com.ar' },
    images: [
      { id: 'driveplus-presentacion', src: 'https://i.ibb.co/7xK1CFr3/Drive-pres-1.png', w: 638, h: 348, alt: 'Presentación de Drive+, app de pádel' },
      { id: 'driveplus-inicio', src: 'https://i.ibb.co/DP3C3dgG/drive-padel-cap.png', w: 318, h: 194, alt: 'Pantalla de bienvenida de Drive+' },
      { id: 'driveplus-torneos', src: 'https://i.ibb.co/cXNG8VR1/drive-cap-2.png', w: 248, h: 238, alt: 'Sección de torneos de Drive+' },
      { id: 'driveplus-logo', src: 'https://i.ibb.co/gxG5dK2/logo-dri-ve-padel.jpg', w: 254, h: 298, alt: 'Logo de Drive+' },
    ],
  },
  {
    id: 'seven',
    title: 'Se7en Barbershop',
    subtitle: 'Gestión para barbería',
    category: 'sistema',
    color: '#ff4d5e',
    description:
      'Sistema de gestión para barbería con PWA integrada. Maneja ventas, tipos de corte, sueldos diferenciados entre encargado y barberos, reportes exportables a Excel y PDF y períodos de venta por tiempo, con animaciones y diseño responsive.',
    tech: ['React', 'Firebase', 'Tailwind CSS', 'Vite', 'PWA', 'Excel/PDF Export'],
    links: {},
    images: [
      { id: 'seven-dashboard', src: 'https://i.ibb.co/2YjzJLNm/Seven-dashboard.png', w: 638, h: 204, alt: 'Dashboard de Se7en Barbershop con ventas y acciones rápidas' },
      { id: 'seven-servicios', src: 'https://i.ibb.co/vCfN6hjF/Servicios-seven.png', w: 638, h: 198, alt: 'Gestión de servicios de la barbería' },
      { id: 'seven-login', src: 'https://i.ibb.co/7xhPmZ0f/Seven-login.png', w: 328, h: 478, alt: 'Inicio de sesión de Se7en Barbershop' },
    ],
  },
  {
    id: 'rincon-gestion',
    title: 'Rincón del Mate',
    subtitle: 'Sistema de gestión',
    category: 'sistema',
    color: '#3ddc84',
    description:
      'Webapp para el negocio con gestor de mesas y pedidos para llevar. Productos por categoría, filtros por método de pago y fecha, exportación a Excel y autenticación con Auth0.',
    tech: ['React', 'Node.js', 'Firebase', 'Auth0', 'Excel Export', 'Tailwind CSS'],
    links: {},
    images: [
      { id: 'mate-mesas', src: 'https://i.ibb.co/7d15G45n/stock-mate-1.png', w: 306, h: 238, alt: 'Estado de mesas en el sistema de Rincón del Mate' },
      { id: 'mate-productos', src: 'https://i.ibb.co/VYV7xyDv/stock-3.png', w: 564, h: 478, alt: 'Gestión de productos por categoría' },
      { id: 'mate-ventas', src: 'https://i.ibb.co/Gfxqb4S1/stock-4.png', w: 586, h: 478, alt: 'Panel de ventas con filtros por período y método de pago' },
      { id: 'mate-para-llevar', src: 'https://i.ibb.co/KjygDfCS/stock-mate-2.png', w: 318, h: 228, alt: 'Pedidos para llevar' },
    ],
  },
  {
    id: 'marmoleria',
    title: 'Marmolería Santa Rita',
    subtitle: 'Web corporativa',
    category: 'web',
    color: '#c9d1ff',
    description:
      'Web corporativa para una marmolería de La Rioja, con sección de contacto, envío de presupuestos y galería de diseños en mármol y granito.',
    tech: ['React', 'Framer Motion', 'Responsive Design'],
    links: {},
    images: [
      { id: 'marmoleria-disenos', src: 'https://i.ibb.co/3yWd1dD6/Dise-os-marmoleria.png', w: 638, h: 378, alt: 'Galería de diseños de interiores en granito' },
      { id: 'marmoleria-inicio', src: 'https://i.ibb.co/bMVrNSZT/Marmoleria-Frente.png', w: 318, h: 165, alt: 'Portada de Marmolería Santa Rita' },
      { id: 'marmoleria-contacto', src: 'https://i.ibb.co/cKTQNX36/Panel-contacto-marmoleria-ejemplos.png', w: 194, h: 238, alt: 'Panel de contacto y presupuestos' },
    ],
  },
  {
    id: 'pie-de-la-vina',
    title: 'Pie de la Viña',
    subtitle: 'Casa de campo · SPA',
    category: 'web',
    color: '#9be15d',
    description:
      'Single Page Application para una casa de campo en Sanagasta, organizada en módulos: galería de fotos por ambientes, servicios, información del complejo y contacto. Diseño elegante y minimalista con navegación clara entre secciones.',
    tech: ['React', 'SPA', 'Framer Motion', 'Responsive Design', 'Arquitectura modular'],
    links: {},
    images: [
      { id: 'piedelavina-inicio', src: 'https://i.ibb.co/zTkx8JjD/spa-mama-1.png', w: 638, h: 417, alt: 'Portada de Casa de Campo Pie de la Viña' },
      { id: 'piedelavina-galeria', src: 'https://i.ibb.co/S756ghgk/spa-mama-2.png', w: 638, h: 454, alt: 'Galería de fotos por secciones' },
      { id: 'piedelavina-ubicacion', src: 'https://i.ibb.co/pCZ5CKD/spa-mama-3.png', w: 318, h: 230, alt: 'Ubicación y atracciones cercanas' },
      { id: 'piedelavina-contacto', src: 'https://i.ibb.co/3mCFCBPF/spa-mama-4.png', w: 290, h: 238, alt: 'Contacto y reservas por WhatsApp' },
    ],
  },
  {
    id: 'itba-ecommerce',
    title: 'E-commerce ITBA × Santander',
    subtitle: 'Mueblería Hermanos Jota',
    category: 'fullstack',
    color: '#ffd23f',
    description:
      'E-commerce full-stack hecho para el Sprint 4 del curso ITBA con Banco Santander: frontend en HTML, CSS y JavaScript, backend con Express.js y base de datos integrada.',
    tech: ['HTML', 'CSS', 'JavaScript', 'Express.js', 'Node.js', 'Base de datos', 'Full-Stack'],
    links: { video: 'https://dai.ly/x9s3wl4' },
    images: [
      { id: 'itba-ecommerce', src: 'https://i.ibb.co/4RtzLV2T/image.png', w: 638, h: 375, alt: 'Catálogo de la Mueblería Hermanos Jota' },
    ],
  },
];

export const FILTERS = [
  ['all', 'TODOS'],
  ['web', 'WEBS'],
  ['sistema', 'SISTEMAS'],
  ['fullstack', 'FULL-STACK'],
];

export const SKILL_GROUPS = [
  { name: 'FRONTEND', items: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Framer Motion', 'Lenis', 'Three.js', 'PWA', 'Recharts', 'HTML', 'CSS'] },
  { name: 'BACKEND', items: ['Node.js', 'Express.js', 'Python', 'Google Cloud Functions', 'Multi-tenant'] },
  { name: 'DATOS', items: ['Firebase', 'Neon (PostgreSQL)', 'MongoDB', 'MySQL'] },
  { name: 'PAGOS & AUTH', items: ['MercadoPago SDK', 'Auth0', 'Firebase Auth'] },
  { name: 'GROWTH', items: ['Google Analytics 4', 'Embudo de leads', 'CRM', 'Calendly'] },
  { name: 'TOOLS', items: ['Vite', 'Railway', 'ExcelJS', 'Excel/PDF Export', 'Office', 'Reparación de PC'] },
  { name: 'IA & MÉTODO', items: ['Deep Learning', 'MERN Stack', 'Scrum'] },
];
