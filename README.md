# RVU Mentorship Camp

Production website: https://rv-u.tech/

A single-page bilingual website served by GitHub Pages. The published files are the main page, its assets, PDF resources, indexing files and a static 404 page. Maintenance tools and PDF source content are excluded from publication.

## Maintenance

- Run `python _maintenance/check_structure.py` and the JavaScript regression/security checks before publishing.
- PDF dependencies are listed in `_maintenance/requirements.txt`. Run `python _maintenance/build_guides.py` to regenerate the three public Arabic field guides. Arabic source text lives in `_maintenance/content`, and the font license notices are retained.
- Three genuine student testimonials are published: Ahmed Alaa, Zain Ali, and Ghada Abdelrahman. The reviews retain the exact Arabic text and line breaks supplied by the students. The responsive grid shows three columns on wide desktop layouts, two on tablets, and one on phones. The new fifth overall cohort is the second online cohort after three offline and one completed online cohorts.
- The application form sends a best-effort background POST to Formspree before opening WhatsApp with a prefilled application message. YouTube loads only when a teaching video is opened. Analytics events exclude application field values and the application dialog is masked.
- Deployment and rollback use Git history. No duplicate or legacy website is published.


## Production quality and performance (Cohort 05)

- Keep `styles.css` readable as the **source**. After editing it, run `node _maintenance/minify-css.cjs` and commit both `styles.css` and `styles.min.css`. The page loads the minified version. Dead CSS rules are removed only after confirming they do not correspond to current HTML or JavaScript states.
- Report evidence is served as optimized thumbnail and full-resolution WebP. Large source PNGs are not published; Git history retains prior versions. If a new original PNG is supplied, `python _maintenance/optimize_assets.py` can regenerate its WebP (requires Pillow).
- `assets/ramez-medhat-480.webp` and `assets/ramez-medhat-640.webp` are responsive portrait candidates. Poster thumbnails and full-resolution proof images should not be loaded until needed.
- On `main` pushes, the **RVU site quality** workflow checks the HTML, URL/local-asset validity, form mocks, CSS source equivalence, security properties, page budget, and responsive Chromium layouts; separate Firefox/WebKit and automated WCAG 2.1 AA checks cover additional viewports and language modes.
- To run locally: `npm install --prefix _maintenance`, then `npm test --prefix _maintenance` and `npm run test:browser --prefix _maintenance` (requires Chrome/Chromium).
- GitHub Pages serves the site using its own HTTP compression and cache settings; these cannot be overridden using a repository `_headers` file. Asset query versions should change only when that asset changes.
- Formspree submissions use best-effort `fetch(..., {keepalive:true})` before navigating to WhatsApp, and **are not guaranteed to persist** if a device disconnects. WhatsApp's prefilled message must still be sent by the applicant.
- Do not add a global low-data/saver toggle. Progressive image loading and on-demand original files are built into the normal page.
