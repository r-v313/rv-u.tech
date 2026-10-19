# Resource release - 19 October 2026

Six standalone Arabic/English PDFs and one bilingual collection rebuilt in the site identity. Each standalone guide contains a branded cover, two reference pages and one worksheet. All pages include the supplied RV logo, embedded fonts, author credit, page number and website link. The collection includes a linked contents page and has 25 pages.

Website download and preview controls now point directly to the appropriate language-specific PDF. The report download in work samples uses the same guide. Original Markdown URLs remain available for existing external links and as build inputs. The existing collection URL remains available with the redesigned collection.

The builder validates page counts and checks that content boxes do not enter the footer area. PDF checks cover author metadata, page headers/footers, embedded fonts and link actions. All 25 collection pages were rendered and visually reviewed, including Arabic/Latin direction and worksheet spacing. Site regression and security checks passed after updating the resource destination assertions.

Rebuild using `python _maintenance/build_guides.py` with `_maintenance/requirements.txt`. Fonts and license notices are included. Maintenance sources and fonts are excluded from the deployed website.
