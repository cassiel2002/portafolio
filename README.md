# CASS.DEV — portfolio arcade

Portfolio de Cassiel Lucero: un llavero 3D animado (Three.js) que cae colgando y se revela pixelado
al entrar, scroll suave con Lenis y los proyectos presentados como maquinitas arcade.

Es un sitio **estático, sin build**: HTML + CSS + módulos ES. Las dependencias (Three.js r170, Lenis 1.1.18
y las fuentes pixel) están dentro de `vendor/` y `fonts/`, así que no depende de ningún CDN.

## Estructura

```
index.html            estructura y SEO (Open Graph, JSON-LD)
css/styles.css        estilos (tokens al principio del archivo)
js/data.js            ← TODO el contenido: perfil, proyectos, skills, contacto
js/media.js           ← URLs de imágenes (local o Cloudinary)
js/main.js            arranque, Lenis, intro INSERT COIN, navegación
js/sections.js        render de máquinas, galería, skills y contacto
js/stage.js           escena 3D (se carga diferida)
js/cass-charm.js      el llavero (modelo procedural + física de péndulo)
img/                  copias locales (baja resolución) + favicon + og.jpg
scripts/upload-cloudinary.mjs   migra las imágenes a Cloudinary
.htaccess             HTTPS, caché, compresión y cabeceras de seguridad (Apache/Hostinger)
```

## Editar contenido

Todo se edita en `js/data.js`: agregar un proyecto es sumar un objeto a `PROJECTS`
(`id`, `title`, `subtitle`, `category`, `color`, `description`, `tech`, `links`, `images`).
Los contadores **xN** de la sección de skills se calculan solos a partir de `tech`.

## Probar en tu compu

Los módulos ES no funcionan abriendo el archivo con doble clic (`file://`). Levantá un servidor:

```bash
npm run serve        # http://localhost:5173
# o:  python -m http.server 5173
```

## Imágenes con Cloudinary

1. Creá una cuenta gratuita en cloudinary.com y copiá el `CLOUDINARY_URL` del Dashboard
   (formato `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`). **El API secret nunca va al repo ni al hosting.**
2. (Recomendado) Guardá capturas nuevas en alta resolución en `originals/<id>.png`, con el mismo `id` que figura
   en `js/data.js`. Las imágenes actuales de ibb son chicas: varias miden 180×180 px.
3. Subí todo:
   ```bash
   npm install
   export CLOUDINARY_URL=cloudinary://...          # Windows PowerShell: $env:CLOUDINARY_URL="cloudinary://..."
   npm run upload:images -- --dry-run              # revisá qué va a subir
   npm run upload:images
   ```
4. En `js/media.js` poné `CLOUD_NAME: 'tu-cloud-name'`. Desde ese momento las imágenes salen de Cloudinary
   con `f_auto,q_auto` (AVIF/WebP según el navegador) y `srcset` responsive. El cloud name es público.

## Publicar en Hostinger

1. hPanel → Archivos → Administrador de archivos → `public_html/` del dominio cassdev.com.ar.
2. Borrá el `default.php` / `index.php` de bienvenida de Hostinger (si lo hay).
3. Subí: `index.html`, `.htaccess`, `css/`, `js/`, `img/`, `vendor/`, `fonts/`.
   No hace falta subir `scripts/`, `originals/`, `package.json` ni `README.md` (el `.htaccess` igual los bloquea).
4. La versión anterior en `/port` queda intacta. Si querés mandar ese tráfico a la nueva, agregá en el `.htaccess`:
   `RedirectMatch 301 ^/port/?$ https://cassdev.com.ar/`

## Accesibilidad y rendimiento

- `prefers-reduced-motion`: sin intro, sin pixelado, sin scroll suave ni parpadeos.
- La intro se saltea con clic/tecla y solo se muestra una vez por sesión.
- El llavero gira con las flechas del teclado (enfocalo con Tab); la galería usa `<dialog>` (Esc cierra, ← → navegan).
- Three.js se carga después del contenido; sin WebGL la página funciona igual sin el llavero.
- En mobile el 3D deja de renderizar cuando sale de pantalla.
