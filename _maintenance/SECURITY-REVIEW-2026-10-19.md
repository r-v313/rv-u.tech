# Final website review — 19 October 2026

Site: https://rv-u.tech/
Reviewed and deployed code: 9a5c41f5aabb29b9cbc54d08a2c1dbcde229c364
Deployment: GitHub Pages run 39222421010 — completed successfully.

## Result

The main camp website is the only active site in this repository. Labs, the Test copy, the old submission page and legacy redirects were removed. The scoped checks did not demonstrate an exploitable vulnerability. This is a source and functional review of the static frontend, not a guarantee of complete security or a penetration test of external providers.

## Changes shipped

- Removed the Labs navigation item, tracking branch, sitemap entry and local Labs files.
- Deleted Test, submit.html, submit.js, submit.css, legacy-redirect.js and not-found.js. The 404 page is static and no longer redirects old resource routes.
- Removed obsolete maintenance release notes. PDF source text and page-map data now live under _maintenance/content, excluded from Pages. Only the seven intended PDFs remain in resources.
- Removed the obsolete release-query reload fallback from application code.
- Repaired application submission error boundaries: request preparation and missing browser APIs now enter the error/finally path, restoring editable controls instead of leaving the application pending.
- Added a cryptographically strong getRandomValues fallback when randomUUID is unavailable.
- Restricted the Formspree fetch to the fixed endpoint with omitted credentials, rejected redirects and no referrer.
- Isolated analytics failures from the save result. A tracking exception cannot turn a confirmed successful submission into an unconfirmed result.
- Improved Escape handling for the mobile menu and restored focus to its toggle.
- Removed six unused CSS selectors and eleven exact duplicate rules. Reformatted the stylesheet for maintenance and verified that formatting preserves the intended CSS syntax tree. Formatted source is larger in raw bytes; this is not presented as a raw-byte performance reduction.
- Preserved the main design, bilingual content, resources and legal font notices.

## Local verification

Passed:

- JavaScript syntax checks for app.js, experience.js and measurement.js.
- HTML structure, unique identifiers, local asset paths and anchor checks.
- Security regression suite: CSP restrictions, absence of inline event handlers and unsafe HTML sinks, hostile input rendering, bounded campaign parameters, encoded WhatsApp values with a fixed destination, and fixed video allowlist.
- Functional regression suite: Arabic/English rendering, curriculum, pricing, reviews, videos, galleries and application states.
- Mocked application outcomes: success, rejection, duplicate handling, missing randomUUID, missing AbortController, request abort and analytics exceptions.
- No personal application data stored by the main application in localStorage or sessionStorage.
- Current tracked text scan found no matching private-key/token/credential assignments. This is a pattern-based current-tree check, not proof that every secret or historical exposure is absent.
- Git whitespace checks.
- CSS round-trip syntax-tree comparison and sampled desktop computed-style comparison before/after deployment.

Commands:

```text
node --check app.js
node --check experience.js
node --check measurement.js
python _maintenance/check_structure.py
NODE_PATH=/workspace/scratch/e38a65f601ac/qa-rvu/node_modules node _maintenance/verify.cjs
NODE_PATH=/workspace/scratch/e38a65f601ac/qa-rvu/node_modules node _maintenance/security.cjs
git diff --check
```

The NODE_PATH above records this review environment. Another checkout must supply its own test dependencies.

## Production verification

- HTTP redirects to HTTPS. HTTPS requests succeeded with normal certificate validation.
- Removed Labs/Test/submit/redirect paths returned HTTP 404.
- /.env and /.git/config returned HTTP 404.
- Maintenance sources, old Markdown resource paths and resources/pdf-pages.json returned HTTP 404.
- All seven public PDFs returned application/pdf and matched local SHA-256 hashes. Individual guides have four pages and the combined kit has 25 pages.
- Live Arabic/English switching, application dialog, video playback opening/closing, FAQ and image gallery were exercised.
- Closing the video removed its iframe. Closing the image viewer removed its open state.
- The tested desktop viewport had no document horizontal overflow or broken loaded images.
- Sampled computed styles matched the previous design.
- Captured browser warning/error entries were from the browser extension; no website-origin error appeared in the captured entries.

## Remaining hosting work

The observed HTTPS responses do not include Strict-Transport-Security or X-Content-Type-Options. These require real HTTP response-header configuration at the hosting/CDN layer; HTML meta tags cannot implement them. No hosting security settings or nameserver changes were made.

Recommended host configuration:

- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000, once HTTPS coverage and renewal are confirmed. Add includeSubDomains only after confirming HTTPS on every subdomain.
- Consider a response-header CSP with frame-ancestors 'none' to prevent framing. The existing meta CSP cannot enforce frame-ancestors. Check any intended embedding before enabling it.

These are hardening items. Their absence alone did not demonstrate an exploitable issue in this review.

## Scope and limits

- Reviewed owned static frontend and public deployment. No disruptive scanning, load test, third-party exploitation, real payment, WhatsApp message or real Formspree application was performed.
- Formspree delivery, server-side validation, spam controls and account settings were not verified from its administration console.
- YouTube, Clarity and LinkedIn remain existing third-party dependencies and were not penetration-tested.
- Removing site Labs files does not shut down any separately hosted training backend. No external training infrastructure was changed.
- Desktop UI was tested live. Responsive CSS semantics were preserved and mobile-specific rules reviewed. Earlier 320/360/390-pixel checks are a prior baseline; this review did not obtain a fresh mobile browser viewport or physical-device/Safari test.
- The attempted PageSpeed mobile request returned HTTP 429, so there is no new PageSpeed score or fresh performance benchmark.
- Current-source scanning does not audit all Git history, hosting account access, DNS ownership or provider infrastructure.
- Temporary student review examples remain visibly labelled as examples rather than real testimonials.
- Git history is retained for recovery. This cleanup removes retired files from the current deployment, not from historical commits.

## Maintenance

Keep main HTML, JS, CSS and PDF links under regression checks when changing the site. Keep _maintenance excluded from publication and retain license notices. Recheck response headers after any hosting/CDN configuration change.

## Follow-up release gate

A subsequent review found that the main page still contained an inline Labs promotion and interactive Commerce scenario after the separate Labs routes had been removed. That remaining section has now been removed, including its GitHub link, exercise controls, JavaScript handlers, translations and unused CSS. Regression checks now reject the section and references as well as retired files and routes.

The updated bilingual curriculum remains in the requested 12-session order with Live Hunting as the final week. Each session has a meaningful description and full-width responsive content.

The complete local functional and security suites passed after this cleanup. Main HTML, JavaScript and CSS contain no comments or debug statements. Required font license notices remain. No current tracked text matched the credential patterns used in the follow-up scan.

The existing hosting-header, provider-administration, mobile-device and load-testing limitations above still apply. Student review examples remain intentionally labelled and unchanged.

Live follow-up checks confirmed that the main HTML, JS and CSS matched the deployed source, retired/private routes returned 404, the main sections retained their sampled computed styles, language switching worked and no loaded image with a source was broken. The image viewer was also given a reserved responsive image area to prevent loading-induced movement of the dialog and close button. No real application was submitted.
