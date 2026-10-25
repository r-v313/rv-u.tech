# RVU Mentorship Camp

Production website: https://rv-u.tech/

A single-page bilingual website served by GitHub Pages. The published files are the main page, its assets, PDF resources, indexing files and a static 404 page. Maintenance tools and PDF source content are excluded from publication.

## Maintenance

- Run `python _maintenance/check_structure.py` and the JavaScript regression/security checks before publishing.
- PDF dependencies are listed in `_maintenance/requirements.txt`. Run `python _maintenance/build_guides.py` to regenerate the six standalone guides and bilingual collection. Source text is in `_maintenance/content` and font license notices are retained.
- The published testimonials are genuine student reviews from Ahmed Alaa and Zain Ali. The three former illustrative placeholder testimonials were removed entirely, not published as real student feedback. A third review must only be added after the student's actual name and text are provided.
- The application form sends a best-effort background POST to Formspree before opening WhatsApp with a prefilled application message. YouTube loads only when a teaching video is opened. Analytics events exclude application field values and the application dialog is masked.
- Deployment and rollback use Git history. No duplicate or legacy website is published.


## Production performance workflow (Cohort 02)

- Keep `styles.css` readable as the **source**. After editing it, run `node _maintenance/minify-css.cjs` and commit both `styles.css` and `styles.min.css`. The page loads the minified version.
- Security-report screenshots are kept as `poc-01.png` through `poc-06.png` for full-fidelity reference. `poc-0N-full.webp` are the default high-quality, reduced-transfer display versions. Rebuild via `python _maintenance/optimize_assets.py` (requires Pillow); a GitHub Action also regenerates WebP when source screenshots change.
- `assets/ramez-medhat-480.webp` and `assets/ramez-medhat-640.webp` are responsive portrait candidates. Poster thumbnails and full-resolution proof images should not be loaded until needed.
- On `main` pushes, the **RVU site quality** workflow checks the HTML, URL/local-asset validity, form mocks, CSS source equivalence, security properties, page budget, and responsive Chromium layouts; separate Firefox/WebKit and automated WCAG 2.1 AA checks cover additional viewports and language modes.
- To run locally: `npm install --prefix _maintenance`, then `npm test --prefix _maintenance` and `npm run test:browser --prefix _maintenance` (requires Chrome/Chromium).
- GitHub Pages serves the site using its own HTTP compression and cache settings; these cannot be overridden using a repository `_headers` file. Asset query versions should change only when that asset changes.
- Formspree submissions use best-effort `fetch(..., {keepalive:true})` before navigating to WhatsApp, and **are not guaranteed to persist** if a device disconnects. WhatsApp's prefilled message must still be sent by the applicant.
- Do not add a global low-data/saver toggle. Progressive image loading and on-demand original files are built into the normal page.
