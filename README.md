# RVU Mentorship Camp

Production website: https://rv-u.tech/

A single-page bilingual website served by GitHub Pages. The published files are the main page, its assets, PDF resources, indexing files and a static 404 page. Maintenance tools and PDF source content are excluded from publication.

## Maintenance

- Run `python _maintenance/check_structure.py` and the JavaScript regression/security checks before publishing.
- PDF dependencies are listed in `_maintenance/requirements.txt`. Run `python _maintenance/build_guides.py` to regenerate the six standalone guides and bilingual collection. Source text is in `_maintenance/content` and font license notices are retained.
- The three review cards are clearly labelled design samples until genuine student reviews are provided.
- The application form submits directly to the configured Formspree endpoint. YouTube loads only when a teaching video is opened. Analytics events exclude application field values and the application dialog is masked.
- Deployment and rollback use Git history. No duplicate or legacy website is published.
