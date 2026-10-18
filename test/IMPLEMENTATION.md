# RVU Camp — cohort 02 preview

Scope: `/test/`. The homepage and labs are independent of this preview.

## Orange visual refinement

The current preview uses saturated orange for primary actions, playback and active states. Charcoal panels and neutral white / gray copy replace the broad brown, bronze and cream palette. Gold remains in the instructor signature and a small date accent. Video posters follow the orange palette. Layout, curriculum, pricing and application behavior are retained.

The HTML5 doctype is restored so the browser parses metadata inside `head` and uses standards mode. Resource regeneration preserves the doctype. Run `python test/tools/check_structure.py` from the repository root before publishing.

## Implemented

- Saturated black and gold visual system, natural-color instructor portraits, an English calligraphic vector signature and first-person Arabic / English copy.
- Early history: three offline camps, one completed online camp, upcoming online cohort 02.
- Two supplied teaching videos in an independent draggable shelf, followed by three explicitly illustrative, expandable review cards.
- Separate six-image report gallery, contextual learning notes and image dialog; no original-image links.
- Weekly mentorship walkthrough, six weekly topic summaries, one consolidated outcomes section, interactive work samples and feedback example.
- Optional educational investigation, link to RVU Commerce, and a suitability section.
- Three downloadable resources in Arabic and English; language selection controls download language.
- Camp journey disclosure, legal-session gift, visible EGP 4,000 pricing panel and installment FAQ and four-step application journey.
- Existing Formspree application handling with explicit pending, saved and unconfirmed states; manual WhatsApp continuation.
- One stylesheet; superseded gallery/theme files removed. A local event adapter is present. It sends no analytics requests in /test/; root-site integration remains part of the separately approved main-site release.

## Content that requires genuine source material

The three reviews remain labelled fictional design examples. Replace them only with approved real feedback and student display preferences. A personal introduction video, actual classroom captures, a student progress story and higher-resolution portrait require source material from Ramez. Do not fabricate those assets, video chapters, student outcomes or report details.

The date is displayed as 1 / 11 in both languages alongside the full date 1 November 2026. Public copy does not discuss a separate first-session date. Confirm current dates and syllabus before homepage promotion. Current curriculum and business details are retained from the existing preview, not inferred from the reference website.

## Validation

JavaScript syntax and DOM interaction checks cover language switching, bilingual download destinations, section anchors, local assets, six-week curriculum, review labels, video/image dialog cleanup, navigation, mocked application success and failure, and duplicate-submission prevention. No QA application was sent to Formspree or WhatsApp.

Browser rendering, touch-device behavior, contrast audit and measured Core Web Vitals require a visual browser pass. The managed environment did not expose the required control-browser capability during implementation. Responsive CSS is included; it is not a claim of device-level verification.

## Promotion to main site

Keep the preview `noindex,nofollow` until approved. Before promotion, replace review samples, confirm dates, inspect mobile / desktop in both languages, check accessibility and real performance, and review the application flow without sending unsolicited test messages. Change canonical / Open Graph URLs and indexing only as part of the approved main-site release. Retain the previous main-site commit for rollback; do not alter `/labs/` as part of this release.

## Component polish

Disclosure controls use centered CSS line geometry for plus/minus states; close buttons use centered crossed lines. Icons survive language switching, native disclosures support keyboard activation, and the signature uses shaped Latin glyph paths with no font dependency. Review cards form three columns on desktop and stack on narrow screens.

## Content simplification

Keep the instructor portrait once at the top. The weekly curriculum describes each week without session numbers or repeated outputs; overall outcomes follow week six. The former readiness checklist is removed. Audience-fit cards explain foundations, 5–7 weekly practice hours and realistic expectations. Video instructions and its item counter are removed; arrow and keyboard controls remain functional. Arabic copy uses plain colloquial wording without diacritics or commas. Restrained red and orange accents complement gold. Mobile rules cover narrow 320px layouts, wrapping headings, full-width controls and readable inputs.

## Comparison improvements

The opening now names the learner’s problem, while the original headline remains. Offline cohort counts and dates are retained from the existing main site without inferring a unique-student total. A single schedule summary includes 6 live hours plus 5–7 practice hours, a total of about 11–13 weekly hours. Duplicate facts and the weekly flow are removed. Outcomes name concrete work examples; week six explains team responsibility and valid negative results. The setup requirement and interview expectations are explicit.

The fee is visible before application: EGP 4,000 in two EGP 2,000 installments, second before week four. All application buttons describe a free interview. A country selector supports local Egyptian, Saudi and UAE numbers, explicit international numbers and an Other-country option.

A seven-page Arabic/English PDF kit has an interactive contents page and six bookmarks. Resource cards open the matching guide page and language. `tools/build_resources.py` regenerates the PDF destinations and sharing image; dependencies are in `tools/requirements.txt`. It expects DejaVu fonts on Linux. `RVU_SIGNATURE_FONT` can specify a preferred local signature font for the sharing graphic. PDF rendering and all guide destinations were checked.

The measurement adapter exposes only allowlisted event names and never includes form values. `/test/` sends no Clarity events. Real service integration, search indexing/canonical updates and replacing the homepage remain conditional on main-site approval. Real reviews, session captures and a genuine student-progress example still require source material. No student results or testimonial sources were invented.
