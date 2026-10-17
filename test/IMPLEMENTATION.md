# RVU Camp — cohort 02 preview

Scope: `/test/`. The homepage and labs are independent of this preview.

## Implemented

- Saturated black and gold visual system, natural-color instructor portraits, an Arabic calligraphic vector signature and first-person Arabic / English copy.
- Early history: three offline camps, one completed online camp, upcoming online cohort 02.
- Two supplied teaching videos in an independent draggable shelf, followed by three explicitly illustrative, expandable review cards.
- Separate six-image report gallery, contextual learning notes and image dialog; no original-image links.
- Weekly mentorship walkthrough, six-week curriculum with explicit practice and output, interactive work samples and feedback example.
- Optional educational investigation, link to RVU Commerce, and a personal readiness checklist.
- Three downloadable resources in Arabic and English; language selection controls download language.
- Camp journey disclosure, legal-session gift, closed pricing FAQ and four-step application journey.
- Existing Formspree application handling with explicit pending, saved and unconfirmed states; manual WhatsApp continuation.
- One stylesheet; superseded gallery/theme files removed. No tracking service introduced.

## Content that requires genuine source material

The three reviews remain labelled fictional design examples. Replace them only with approved real feedback and student display preferences. A personal introduction video, actual classroom captures, a student progress story and higher-resolution portrait require source material from Ramez. Do not fabricate those assets, video chapters, student outcomes or report details.

The announcement date is displayed as ١ / ١١ in Arabic and 1 / 11 in English, alongside the full date 1 November 2026. It is not the first-session date. Verify the first-session date and current syllabus before promoting the preview to the homepage. Current curriculum and business details are retained from the existing preview, not inferred from the reference website.

## Validation

JavaScript syntax and DOM interaction checks cover language switching, readiness feedback, bilingual download destinations, section anchors, local assets, six-week curriculum, review labels, video/image dialog cleanup, navigation, mocked application success and failure, and duplicate-submission prevention. No QA application was sent to Formspree or WhatsApp.

Browser rendering, touch-device behavior, contrast audit and measured Core Web Vitals require a visual browser pass. The managed environment did not expose the required control-browser capability during implementation. Responsive CSS is included; it is not a claim of device-level verification.

## Promotion to main site

Keep the preview `noindex,nofollow` until approved. Before promotion, replace review samples, confirm dates, inspect mobile / desktop in both languages, check accessibility and real performance, and review the application flow without sending unsolicited test messages. Change canonical / Open Graph URLs and indexing only as part of the approved main-site release. Retain the previous main-site commit for rollback; do not alter `/labs/` as part of this release.

## Component polish

Disclosure controls use centered CSS line geometry for plus/minus states; close buttons use centered crossed lines. Icons survive language switching, native disclosures support keyboard activation, and the signature uses shaped Arabic glyph paths with no font dependency. Review cards form three columns on desktop and stack on narrow screens.
