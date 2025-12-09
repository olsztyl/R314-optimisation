# Rapport d'Optimisation - R314 Site Vitrine

**Date:** 9 décembre 2025  
**Objectif:** Réduire le LCP, FCP, TBT et optimiser la charge globale du site  
**Branche:** main  

---

## 1. Résumé Exécutif

Le site a subi une optimisation complète de ses performances, ciblant les trois métriques Core Web Vitals principales (LCP, FCP, TBT) identifiées comme critiques par PageSpeed Insights.

### Gains Attendus
- **LCP** : ~-4 à 5 secondes (délai affichage image + ressources bloquantes supprimées)
- **FCP** : ~-160 ms (pas de requête CSS bloquante)
- **TBT** : ~-3.6 secondes (suppression boucles while bloquantes)
- **Taille images** : ~-159 KB (conversion WebP, -50% à -75% par image)

---

## 2. Problèmes Identifiés (PageSpeed Insights)

### ❌ Requêtes Bloquantes (Economie estimée: 310 ms)
**Problème :** `css/styles.css` chargée via `<link rel="stylesheet">` bloquait le rendu initial
- Durée : 160 ms
- Type : Render-blocking resource
- Impact : FCP/LCP retardés

### ❌ Exécution JavaScript Bloquante (3.6 s)
**Problème :** `js/script.js` contenait deux boucles while infinies :
```javascript
// Boucle 1: 2000 ms waste
const start = performance.now();
while (performance.now() - start < 2000) {}

// Boucle 2: 1000 ms waste + allocation mémoire inutile
const waste = [];
for (let i=0;i<200000;i++) { waste.push(Math.random()*i); }
window.__waste = waste;

// Boucle 3: 1000 ms supplémentaire
const t0 = performance.now();
while (performance.now() - t0 < 1000) {}
```
- **Impact TBT** : 3.6 secondes de main-thread blocking
- **Consequence** : Interactions utilisateur bloquées pendant 3.6s

### ❌ Images Non Optimisées (Économie estimée: 159 KB)
**Problème :** Tous les JPG étaient des fichiers non compressés, tailles énormes :
| Image | Taille JPG | Format Moderne | Économie |
|-------|-----------|----------------|----------|
| img1.jpg | 20.5 KB | WebP: 4.7 KB | -77% |
| img2.jpg | 30.9 KB | WebP: 10 KB | -68% |
| img3.jpg | 39 KB | WebP: 13 KB | -67% |
| img4.jpg | 45.9 KB | WebP: 21 KB | -54% |
| img5.jpg | 44.2 KB | WebP: 18 KB | -59% |
| img6.jpg | 38.5 KB | WebP: 15 KB | -61% |
| **Total** | **218 KB** | **~82 KB** | **-62%** |

- **Délai affichage LCP** : 4070 ms (image 2 n'était pas préchargée)
- **Format** : Tous JPG, pas de WebP/AVIF offerts

### ❌ Cache TTL Court (Économie estimée: 208 KB)
**Problème :** Tous les assets avaient TTL=10 minutes (pas de cache long terme)
- Images re-téléchargées tous les 10 min
- Scripts/CSS re-téléchargés tous les 10 min
- **Note** : Nécessite configuration serveur (GitHub Pages, .htaccess ou config CDN)

---

## 3. Optimisations Appliquées

### 3.1 ✅ Suppression des Requêtes Bloquantes

**Action :** Inlining du CSS critique dans le `<head>`

#### Avant
```html
<link rel="stylesheet" href="css/styles.css" /> <!-- 160 ms blocking -->
```

#### Après
```html
<style>
/* Inlined critical CSS (~650 bytes) */
:root{--bg:#0f1226;--fg:#E8ECF1;--muted:#93A1B1;--primary:#7C5CFF}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif}
.container{width:min(1200px,92%);margin:0 auto;padding:0 8px}
.topbar{position:sticky;top:0;background:rgba(10,12,28,.6);backdrop-filter:blur(6px);padding:12px 0}
/* ... etc ... */
@media (max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}.features-grid{grid-template-columns:repeat(2,1fr)}}
</style>
```

**Gain** : -160 ms (plus de requête réseau pour CSS)  
**Fichiers affectés** : `index.html`, `img1-6.html`

---

### 3.2 ✅ Suppression du JavaScript Bloquant

**Action :** Remplacement des boucles while par un script léger non-bloquant

#### Avant (3.6 secondes de blocage)
```javascript
(function(){
  const start = performance.now();
  while (performance.now() - start < 2000) {} // ❌ 2 sec waste
  const waste = [];
  for (let i=0;i<200000;i++) { waste.push(Math.random()*i); } // ❌ CPU waste
  window.__waste = waste;
  window.addEventListener('load', function(){
    const imgs = document.querySelectorAll('.card img');
    imgs.forEach(img => { /* ... */ });
    const t0 = performance.now();
    while (performance.now() - t0 < 1000) {} // ❌ 1 sec waste
  });
})();
```

#### Après (<1 milliseconde)
```javascript
/* Lightweight non-blocking image enhancement script */
(function(){
  function markImagesLoaded(){
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      if(img.complete) img.classList.add('loaded');
      else img.addEventListener('load', ()=> img.classList.add('loaded'), {once:true});
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', markImagesLoaded);
  } else {
    markImagesLoaded();
  }
})();
```

**Gain** : -3.6 secondes (main-thread blocking éliminé)  
**Taille** : 300 bytes vs 911 bytes avant (plus compact aussi)  
**Exécution** : <1 ms au lieu de 3600 ms  
**Fichier** : `js/script.js`

---

### 3.3 ✅ Conversion Images en WebP

**Action :** Conversion tous les JPG → WebP à qualité 80

#### Commandes exécutées
```bash
cd img/
# Conversion WebP pour les 6 images
for i in 1 2 3 4 5 6; do 
  cwebp -q 80 img$i.jpg -o img$i.webp
done
```

#### Résultats
```
img1.jpg (20.5 KB) → img1.webp (4.7 KB)     -77%
img2.jpg (30.9 KB) → img2.webp (10 KB)      -68%
img3.jpg (39 KB)   → img3.webp (13 KB)      -67%
img4.jpg (45.9 KB) → img4.webp (21 KB)      -54%
img5.jpg (44.2 KB) → img5.webp (18 KB)      -59%
img6.jpg (38.5 KB) → img6.webp (15 KB)      -61%
```

**Gain total** : ~-136 KB (62% reduction)  
**Fichiers créés** : `img/img1.webp`, `img/img2.webp`, ..., `img/img6.webp`

---

### 3.4 ✅ Preload et Optimisation LCP

**Action :** Ajouter preload pour les images LCP en WebP format

#### Avant
```html
<!-- Pas de preload spécifique LCP -->
<link rel="preload" as="image" href="img/img1.jpg">
```

#### Après
```html
<!-- Preload WebP moderne (format préféré) -->
<link rel="preload" as="image" href="img/img1.webp" type="image/webp">
<link rel="preload" as="image" href="img/img2.webp" type="image/webp">
```

**Gain** : Le navigateur commencera à télécharger les images WebP ASAP (plutôt que d'attendre le parsing HTML)

---

### 3.5 ✅ Remplacement `<img>` par `<picture>` + srcset

**Action :** Servir WebP avec fallback JPG sur tous les images

#### Avant
```html
<div class="card">
  <a href="img1.html">
    <img src="img/img1.jpg" alt="Image 1" width="663" height="374" fetchpriority="high" loading="eager" decoding="async" />
  </a>
</div>
```

#### Après
```html
<div class="card">
  <a href="img1.html">
    <picture>
      <source srcset="img/img1.webp" type="image/webp">
      <img src="img/img1.jpg" alt="Image 1" width="663" height="374" fetchpriority="high" loading="eager" decoding="async" />
    </picture>
  </a>
</div>
```

**Avantages** :
- Le navigateur charge img1.webp (4.7 KB) au lieu de img1.jpg (20.5 KB)
- Fallback JPG pour vieux navigateurs
- Attributs préservés : `fetchpriority`, `loading`, `decoding`, `width`, `height`

**Fichiers affectés** : `index.html`, `img1.html`, `img2.html`, `img3.html`, `img4.html`, `img5.html`, `img6.html`

---

### 3.6 ✅ Script Non-Bloquant

**Action :** Ajouter `defer` à `js/script.js` sur toutes les pages

#### Avant
```html
<script src="js/script.js"></script>
```

#### Après
```html
<script src="js/script.js" defer></script>
```

**Impact** : Téléchargement asynchrone du script; exécution après parse HTML  
**Gain** : FCP/LCP pas bloqués par le script

---

## 4. Fichiers Modifiés

### Créés
- `img/img1.webp` (4.7 KB)
- `img/img2.webp` (10 KB)
- `img/img3.webp` (13 KB)
- `img/img4.webp` (21 KB)
- `img/img5.webp` (18 KB)
- `img/img6.webp` (15 KB)

### Modifiés
- `index.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `js/script.js` — Suppression boucles while; script léger de 300 bytes
- `js/metrics.js` — Aucun changement (fonctionne avec lazy load)
- `css/styles.css` — Contenu déplacé vers inlining; fichier réduit à commentaire + helpers
- `css/extra.css` — Aucun changement
- `img1.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `img2.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `img3.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `img4.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `img5.html` — CSS inlinée + preload WebP + `<picture>` + script defer
- `img6.html` — CSS inlinée + preload WebP + `<picture>` + script defer

---

## 5. Impact Mesurable

### 5.1 Métriques Attendues (avant déploiement/cache)

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **LCP** | ~4500 ms | ~500-1000 ms | -4000 ms (80% ↓) |
| **FCP** | ~700 ms | ~300-400 ms | -300 ms (40% ↓) |
| **TBT** | ~3600 ms | <50 ms | -3550 ms (99% ↓) |
| **Total Bytes** | ~250 KB | ~90 KB | -160 KB (64% ↓) |
| **CSS Blocking** | 160 ms | 0 ms | -160 ms (100% ↓) |

### 5.2 Considérations Cache GitHub Pages

**Problème :** Les tests PageSpeed/Lighthouse utilisent le cache HTTP de GitHub Pages (TTL=10min) et le cache navigateur du test.

**Solution :**
1. Attendre ~10 minutes pour que le TTL expire
2. Ou vider le cache GitHub Pages avec un hard-refresh (`Cmd+Shift+R` ou `Ctrl+Shift+R`)
3. Ou ajouter un cache-buster (query string) aux URLs :
   ```html
   <link rel="preload" as="image" href="img/img1.webp?v=1" type="image/webp">
   <script src="js/script.js?v=1" defer></script>
   ```

---

## 6. Recommandations Supplémentaires

### 6.1 Cache Long-Terme (208 KB d'économies)
**Actuel** : TTL=10 minutes  
**Recommandé** : TTL=1 an (31536000 secondes) pour les assets statiques

**Implémentation (via `_headers` GitHub Pages ou `.htaccess`) :**
```
# Pour GitHub Pages: créer fichier `public/_headers`
/img/*.webp
  Cache-Control: public, max-age=31536000, immutable

/css/*.css
  Cache-Control: public, max-age=31536000, immutable

/js/*.js
  Cache-Control: public, max-age=31536000, immutable
```

### 6.2 Responsive Images (Futur)
Générer des variants resizés pour responsive design :
```bash
# 480px (mobile)
sips -Z 480 img/img1.jpg --out img/img1-480.jpg
cwebp -q 75 img/img1-480.jpg -o img/img1-480.webp

# 768px (tablet)
sips -Z 768 img/img1.jpg --out img/img1-768.jpg
cwebp -q 75 img/img1-768.jpg -o img/img1-768.webp

# 1200px (desktop)
sips -Z 1200 img/img1.jpg --out img/img1-1200.jpg
cwebp -q 75 img/img1-1200.jpg -o img/img1-1200.webp
```

Puis utiliser dans HTML :
```html
<picture>
  <source srcset="img/img1-480.webp 480w, img/img1-768.webp 768w, img/img1-1200.webp 1200w" type="image/webp">
  <source srcset="img/img1-480.jpg 480w, img/img1-768.jpg 768w, img/img1-1200.jpg 1200w" type="image/jpeg">
  <img src="img/img1.jpg" alt="Image 1" width="663" height="374" fetchpriority="high" loading="eager" decoding="async">
</picture>
```

### 6.3 AVIF Format (Compression Supplémentaire)
Pour économies additionnelles (~20% vs WebP) :
```bash
avifenc -c aom -s 8 img/img1.jpg img/img1.avif
```

Utiliser dans `<picture>` :
```html
<picture>
  <source srcset="img/img1.avif" type="image/avif">
  <source srcset="img/img1.webp" type="image/webp">
  <img src="img/img1.jpg" alt="Image 1" ...>
</picture>
```

---

## 7. Commandes de Validation

### Vérifier les fichiers WebP ont bien été créés
```bash
ls -lh img/*.webp
# Attendu: 6 fichiers .webp
```

### Vérifier le contenu de index.html a bien été modifié
```bash
grep -c "<picture>" index.html
# Attendu: 6 (une pour chaque image)

grep -c "fetchpriority" index.html
# Attendu: 2 (img1 et img2 LCP)
```

### Vérifier js/script.js est léger
```bash
wc -c js/script.js
# Avant: 911 bytes
# Après: ~300 bytes
```

### Vérifier CSS inlinée dans index.html
```bash
grep -c "<style>" index.html
# Attendu: 1
```

---

## 8. Résumé des Changements

| Aspect | Avant | Après | Gain |
|--------|-------|-------|------|
| **Images** | 6 JPG, 218 KB | 6 WebP, ~82 KB + 6 JPG fallback | -62% |
| **CSS Bloquant** | Oui (160 ms) | Non (inlinée) | -160 ms |
| **JS Bloquant** | 3600 ms waste | <1 ms | -3600 ms |
| **Preload** | JPG seulement | WebP optimal | Meilleur LCP |
| **HTML** | `<img>` simple | `<picture>` avec fallback | Format moderne |
| **Script Defer** | Non | Oui | FCP non bloqué |

---

## 9. Notes

- **Pas de changement Breaking** : Tous les fallbacks JPG restent disponibles pour compatibilité.
- **Taille Repo** : Augmentation ~82 KB (ajout 6 WebP), mais payload réseau diminue.
- **Compatibilité** : WebP supporté par 96%+ des navigateurs modernes; JPG fallback pour les anciens.
- **Performance Réelle** : La vraie amélioration sera visible après expiration du cache HTTP (10 min ou hard-refresh).

---

**Prochaines étapes :**
1. Vérifier un hard-refresh du site dans un navigateur (cache local vidé)
2. Re-lancer un audit Lighthouse/PageSpeed Insights après ~10 min
3. Optionnel : Implémenter responsive images + cache long-terme + AVIF

