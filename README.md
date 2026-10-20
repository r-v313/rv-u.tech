# RVU Mentorship Camp

Production website: https://rv-u.tech/

A single-page bilingual website served by GitHub Pages. The published files are the main page, its assets, PDF resources, indexing files and a static 404 page. Maintenance tools and PDF source content are excluded from publication.

## Maintenance

- Run `python _maintenance/check_structure.py` and the JavaScript regression/security checks before publishing.
- PDF dependencies are listed in `_maintenance/requirements.txt`. Run `python _maintenance/build_guides.py` to regenerate the six standalone guides and bilingual collection. Source text is in `_maintenance/content` and font license notices are retained.
- Student testimonials are temporarily removed from the rendered page. Their three illustrative HTML cards remain inside a marked HTML comment in `index.html` for replacement with genuine student reviews later; no review section, sample cards or placeholder heading is displayed.
- The application form submits directly to the configured Formspree endpoint. YouTube loads only when a teaching video is opened. Analytics events exclude application field values and the application dialog is masked.
- Deployment and rollback use Git history. No duplicate or legacy website is published.
