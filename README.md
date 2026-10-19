# RVU Mentorship Camp

Production website: https://rv-u.tech/

Static HTML, CSS and JavaScript published with GitHub Pages. No build step or application server is required. The application form uses Formspree and the video player loads YouTube only when opened.

## Maintenance

- Run `python _maintenance/check_structure.py` before publishing.
- Resource build dependencies are listed in `_maintenance/requirements.txt`.
- Run `python _maintenance/build_guides.py` to regenerate the six standalone guides and the bilingual PDF field kit. Sources remain in `resources/*-ar.md` and `resources/*-en.md`; worksheet layouts and typography live in the builder. The bundled fonts retain their OFL license notices.
- The three review cards are labelled demonstration samples. Replace them with genuine testimonials only with the students’ permission.
- `/test/` is a compatibility redirect to the root website. No preview website remains.
- The original website is recoverable from Git history before this release.

Existing Clarity and LinkedIn project identifiers are retained. The application dialog is masked for session recordings. Conversion events carry event names or the existing conversion ID, never application fields.
