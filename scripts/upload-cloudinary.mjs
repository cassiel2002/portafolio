#!/usr/bin/env node
/**
 * Sube todas las imágenes de los proyectos a Cloudinary con un public_id estable:
 *   <FOLDER>/<id>   (ej: cassdev/projects/kiosko-pos)
 *
 * Origen de cada imagen, en este orden de prioridad:
 *   1. originals/<id>.(png|jpg|jpeg|webp)  ← poné acá las capturas en alta resolución (recomendado)
 *   2. images[].src                         ← la URL actual en i.ibb.co (muchas son de 180 px)
 *   3. img/<id>.webp                        ← la copia local de baja resolución
 *
 * Uso:
 *   1. npm install
 *   2. Exportá tus credenciales (NUNCA las subas al repo ni al hosting):
 *        Linux/macOS:  export CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 *        Windows PS:   $env:CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
 *   3. npm run upload:images -- --dry-run   (muestra qué subiría)
 *      npm run upload:images                 (sube)
 *   4. Poné tu CLOUD_NAME en js/media.js.
 */
import { v2 as cloudinary } from 'cloudinary';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS } from '../js/data.js';
import { CLOUDINARY } from '../js/media.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');

if (!process.env.CLOUDINARY_URL && !DRY) {
  console.error('Falta la variable de entorno CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME).');
  process.exit(1);
}

function sourceFor(img) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const p = path.join(ROOT, 'originals', `${img.id}.${ext}`);
    if (existsSync(p)) return { from: 'original', value: p };
  }
  if (img.src) return { from: 'ibb', value: img.src };
  return { from: 'local-lowres', value: path.join(ROOT, 'img', `${img.id}.webp`) };
}

const jobs = PROJECTS.flatMap((p) => p.images.map((img) => ({ project: p.id, img, source: sourceFor(img) })));
console.log(`${jobs.length} imágenes → carpeta "${CLOUDINARY.FOLDER}"${DRY ? ' (dry-run)' : ''}\n`);

let ok = 0;
let fail = 0;
const CONCURRENCY = 3;
const queue = [...jobs];

async function worker() {
  while (queue.length) {
    const { img, source } = queue.shift();
    const publicId = `${CLOUDINARY.FOLDER}/${img.id}`;
    if (DRY) {
      console.log(`· ${publicId.padEnd(42)} ← [${source.from}] ${source.value}`);
      ok++;
      continue;
    }
    try {
      const res = await cloudinary.uploader.upload(source.value, {
        public_id: publicId,
        asset_folder: CLOUDINARY.FOLDER, // cuentas con "dynamic folders"
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        context: { alt: img.alt },
      });
      console.log(`✓ ${publicId.padEnd(42)} ${res.width}×${res.height} [${source.from}]`);
      ok++;
    } catch (err) {
      console.error(`✗ ${publicId}: ${err.message || err.error?.message || err}`);
      fail++;
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nListo: ${ok} ok, ${fail} con error.`);
const lowres = jobs.filter((j) => j.source.from !== 'original').length;
if (lowres) console.log(`Aviso: ${lowres} imágenes no tienen original en /originals (se usó ibb o la copia local, de baja resolución).`);
if (fail) process.exit(1);
