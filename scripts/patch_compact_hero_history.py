from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# 1) Remove the long hero sales copy + fact chips while keeping the Apply CTA.
text, hero_count = re.subn(
    r'(<div class="hero-primary hero-copy">)\s*<h1 class="hero-outcome-title i18n".*?(?=<div class="hero-apply-wrap">)',
    r'\1 ',
    text,
    count=1,
    flags=re.S,
)
if hero_count not in (0, 1):
    raise RuntimeError(f'Unexpected hero match count: {hero_count}')

# 2) Remove the standalone previous-camps / story section entirely.
text, history_count = re.subn(
    r'<section class="previous-camps-section" id="previous-camps" tabindex="-1">.*?</section>(?=<section class="outcomes-section" id="outcomes-section")',
    '',
    text,
    count=1,
    flags=re.S,
)
if history_count not in (0, 1):
    raise RuntimeError(f'Unexpected history match count: {history_count}')

# 3) Move the three cohort rows into the existing 3 OFFLINE CAMPS proof card.
if 'offline-camp-lines' not in text:
    replacement = '''<div class="proof-card proof-card-green tilt-card"> <b class="proof-title-green">3 OFFLINE CAMPS</b> <p class="i18n" data-ar="قدّمت 3 معسكرات Bug Bounty أوفلاين قبل إطلاق النسخة الأونلاين." data-en="Delivered 3 offline Bug Bounty camps before launching the online cohort.">قدّمت 3 معسكرات Bug Bounty أوفلاين قبل إطلاق النسخة الأونلاين.</p> <div class="offline-camp-lines"> <span class="offline-camp-line camp-one i18n" data-ar="CAMP 01 · 8 طلاب · فبراير ← منتصف مارس 2026" data-en="CAMP 01 · 8 students · Feb → Mid-Mar 2026">CAMP 01 · 8 طلاب · فبراير ← منتصف مارس 2026</span> <span class="offline-camp-line camp-two i18n" data-ar="CAMP 02 · 11 طالب · أول أبريل ← منتصف مايو 2026" data-en="CAMP 02 · 11 students · Early Apr → Mid-May 2026">CAMP 02 · 11 طالب · أول أبريل ← منتصف مايو 2026</span> <span class="offline-camp-line camp-three i18n" data-ar="CAMP 03 · 16 طالب · يونيو ← منتصف يوليو 2026" data-en="CAMP 03 · 16 students · Jun → Mid-Jul 2026">CAMP 03 · 16 طالب · يونيو ← منتصف يوليو 2026</span> </div> </div>'''
    text, proof_count = re.subn(
        r'<div class="proof-card proof-card-green tilt-card">.*?</div>',
        replacement,
        text,
        count=1,
        flags=re.S,
    )
    if proof_count != 1:
        raise RuntimeError(f'Expected one 3 OFFLINE CAMPS proof card, found {proof_count}')

if text != original:
    path.write_text(text, encoding='utf-8')
    print('Compact hero/history patch applied.')
else:
    print('No changes needed; patch already applied.')
