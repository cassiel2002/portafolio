/**
 * media.js — URLs de imágenes.
 *
 * Mientras CLOUD_NAME esté vacío, la web usa las copias locales de img/<id>.webp.
 * Cuando subas las imágenes con scripts/upload-cloudinary.mjs, poné tu cloud name acá
 * y todas pasan a servirse desde Cloudinary con formato y calidad automáticos (f_auto,q_auto)
 * y tamaños responsive (srcset). El cloud name es público: no es un secreto.
 */
export const CLOUDINARY = {
  CLOUD_NAME: '', // ej: 'cassdev'
  FOLDER: 'cassdev/projects',
};

const WIDTHS = [400, 720, 1200];

export function imageUrl(img, width = 720) {
  if (!CLOUDINARY.CLOUD_NAME) return `img/${img.id}.webp`;
  // c_limit: nunca agranda una imagen más allá de su tamaño original
  return `https://res.cloudinary.com/${CLOUDINARY.CLOUD_NAME}/image/upload/f_auto,q_auto,c_limit,w_${width}/${CLOUDINARY.FOLDER}/${img.id}`;
}

export function imageSrcset(img) {
  if (!CLOUDINARY.CLOUD_NAME) return '';
  return WIDTHS.map((w) => `${imageUrl(img, w)} ${w}w`).join(', ');
}

/** Crea un <img> con lazy loading, decoding async y dimensiones para evitar saltos de layout. */
export function createImg(img, { sizes = '(max-width: 760px) 92vw, 380px', eager = false, className = '' } = {}) {
  const el = document.createElement('img');
  el.src = imageUrl(img);
  const set = imageSrcset(img);
  if (set) {
    el.srcset = set;
    el.sizes = sizes;
  }
  el.alt = img.alt;
  el.width = img.w;
  el.height = img.h;
  el.decoding = 'async';
  el.loading = eager ? 'eager' : 'lazy';
  if (className) el.className = className;
  return el;
}
