Rapport d'optimisation — Site vitrine (R314-optimisation)

1) Analyse initiale (extraits)
- Pages principales: `index.html`.
- Ressources bloquantes détectées: CSS `css/styles.css` importait `extra.css` et chargeait Google Fonts via @import (render-blocking). `js/script.js` exécutait des boucles longues et allocations massives (2s blocking + heavy loop), bloquant le thread principal.
- Poids total actuel (mesure locale): ~10 018 700 bytes (images dominent). Détails clés:
  - `css/styles.css`: 89 430 bytes
  - `css/extra.css`: 400 bytes (was much larger before)
  - `js/script.js`: 911 bytes (rewritten)
  - `js/metrics.js`: 6 124 bytes
  - images: img1..img6 total ~9.6 MB (largest assets)

2) Optimisations proposées (choix techniques)
- Éviter CSS render-blocking: remove @import, load non-critical CSS with `preload`+`onload` and inline minimal critical CSS.
- Fonts: avoid @import; use `preconnect` + `preload` pattern so font CSS is non-blocking.
- JS: defer non-essential scripts; remove long-running synchronous work; use requestIdleCallback for low-priority tasks.
- Images: add `loading="lazy"`, add width/height attributes to avoid CLS, convert/compress images to WebP and create `srcset` for responsive sizes.
- Prefetch: prefetch likely navigations (gallery pages) during idle time.
- Trim CSS: remove large repetitive utility classes (massive `extra-*` and `.redundant-*` lists) to reduce payload size.

3) Changements appliqués (fichiers modifiés)
- `index.html`
  - Fonts loaded with `preconnect`+`preload` and fallback `noscript`.
  - Inlined small critical CSS for above-the-fold.
  - `css/extra.css` loaded with `preload` as style and `noscript` fallback.
  - `js/script.js` now loaded with `defer`.
  - Gallery images given `width`/`height` and `loading="lazy"`.
- `css/styles.css`
  - Removed `@import` and trimmed repetitive rules (reduced size).
- `css/extra.css`
  - Replaced large repetitive file with a compact version keeping shadows and a few utilities.
- `js/script.js`
  - Rewritten to remove blocking loops, add lazy loading, and prefetch gallery links during idle time.

4) Résultats avant/après (local asset sizes)
- Combined CSS payload reduced (removed large imports). `css/extra.css` reduced from ~>100KB to ~400 bytes in local test (original was large in repo — trimmed).
- JS now non-blocking (defer) and no CPU-heavy startup tasks.
- Images still dominate: total ~9.6 MB — next step is to convert/compress images.

5) Commandes et étapes recommandées pour optimiser images (à exécuter localement)
- Install `cwebp` (libwebp) on macOS via brew:

```bash
brew install webp
```

- Convert images to WebP with quality 80 and generate responsive sizes (example):

```bash
cwebp -q 80 img/img1.jpg -o img/img1.webp
sips -Z 1200 img/img1.jpg --out img/img1-1200.jpg
cwebp -q 80 img/img1-1200.jpg -o img/img1-1200.webp
```

- Or batch convert with a simple loop (bash):

```bash
for f in img/*.jpg; do cwebp -q 80 "$f" -o "${f%.jpg}.webp"; done
```

- After conversion, update `index.html` image tags to use `<picture>` with WebP and fallback JPG, and add `srcset` for different widths.

6) Tests et comparaison
- Re-run Lighthouse (Chrome DevTools) or GTmetrix before/after. Expected improvements:
  - Faster FCP/LCP due to reduced render-blocking CSS and deferred JS.
  - Lower TBT because of removed long tasks.
  - Reduced total bytes and requests after image conversion (WebP often 30-60% smaller).

7) Difficultés et notes
- Image conversion cannot be fully automated here; needs to be run locally (or in CI). I provided commands and an example.
- If you want, I can generate smaller sample WebP images and update `index.html` with `picture` tags.

8) Next steps I can take for you (ask to proceed):
- Convert images locally and update HTML with `<picture>` + `srcset` (I can create a sample set of WebP images if you want me to generate placeholders).
- Run Lighthouse programmatically and produce before/after screenshots and metrics.
- Create the final PDF report from this `report.md` including screenshots.


