from pathlib import Path
import base64
import re

ROOT = Path('.')
html_path = ROOT / 'index.html'
js_path = ROOT / 'app.js'
css_path = ROOT / 'styles.css'
base_path = ROOT / 'overrides-base.css'
override_path = ROOT / 'overrides.css'

html = html_path.read_text(encoding='utf-8')
js = js_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
base_css = base_path.read_text(encoding='utf-8')
override_css = override_path.read_text(encoding='utf-8')

required_html = [
    'التركيز على Web وAuthorization وAPIs وBusiness Logic وRecon workflows وpractical automation وبناء Methodology قابلة للتطوير بشكل عملي.',
    'بهانت بشكل فعلي من 2023 وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة.',
    'قانون الجرائم الإلكترونية المصري رقم 175 لسنة 2018 بالتفصيل وقررت أخلي السيشن دي',
    'data-ar="عني"',
    'data-ar="المنهج"',
    'data-ar="النظام"',
    'data-ar="الأسئلة"',
]
for marker in required_html:
    if marker not in html:
        raise SystemExit(f'Missing required HTML marker: {marker}')

if html.count('Poc%20(') < 12:
    raise SystemExit('PoC marquee structure is not the expected current version')

# Extract the embedded profile image without changing its bytes.
profile_re = re.compile(r'<img src="data:image/webp;base64,([A-Za-z0-9+/=]+)" alt="Ramez Medhat">')
profile_match = profile_re.search(html)
if not profile_match:
    raise SystemExit('Embedded profile WebP not found')
profile_bytes = base64.b64decode(profile_match.group(1), validate=True)
if not profile_bytes.startswith(b'RIFF') or b'WEBP' not in profile_bytes[:16]:
    raise SystemExit('Profile asset is not a valid WebP container')
(ROOT / 'profile.webp').write_bytes(profile_bytes)
html = profile_re.sub('<img src="./profile.webp" alt="Ramez Medhat">', html, count=1)

# Extract the embedded favicon without changing its SVG content.
favicon_re = re.compile(r'<link href="data:image/svg\+xml;base64,([A-Za-z0-9+/=]+)" rel="icon" type="image/svg\+xml">')
favicon_match = favicon_re.search(html)
if not favicon_match:
    raise SystemExit('Embedded favicon SVG not found')
favicon_bytes = base64.b64decode(favicon_match.group(1), validate=True)
if b'<svg' not in favicon_bytes[:200]:
    raise SystemExit('Favicon asset is not valid SVG')
(ROOT / 'favicon.svg').write_bytes(favicon_bytes)
html = favicon_re.sub('<link href="./favicon.svg" rel="icon" type="image/svg+xml">', html, count=1)

# Ship one stylesheet instead of styles.css -> overrides.css -> overrides-base.css.
import_line = '@import url("./overrides-base.css");'
if import_line not in override_css:
    raise SystemExit('Expected overrides import not found')
override_css = override_css.replace(import_line, '', 1)
html_link = '<link href="./styles.css" rel="stylesheet"><link href="./overrides.css" rel="stylesheet">'
if html_link not in html:
    raise SystemExit('Expected two-stylesheet HTML link sequence not found')
html = html.replace(html_link, '<link href="./styles.css" rel="stylesheet">', 1)

# Remove HTML comments if any exist.
html = re.sub(r'<!--.*?-->', '', html, flags=re.S)

# Remove JavaScript that belongs to features already removed from the page.
def remove_between(text, start, end):
    a = text.find(start)
    if a < 0:
        raise SystemExit(f'JS cleanup start marker not found: {start[:60]}')
    b = text.find(end, a)
    if b < 0:
        raise SystemExit(f'JS cleanup end marker not found: {end[:60]}')
    return text[:a] + text[b:]

js = remove_between(
    js,
    "(function(){const baseId=4471;",
    "(function(){const reduceTiltMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;"
)
js = remove_between(
    js,
    "(function(){const canvas=document.getElementById('radarCanvas');",
    "(function(){const questions=document.querySelectorAll('.faq-question');"
)
accordion_marker = '/* curriculum-accordion-v1 */'
accordion_pos = js.find(accordion_marker)
if accordion_pos < 0:
    raise SystemExit('Old curriculum accordion block not found')
js = js[:accordion_pos].rstrip() + '\n'

dead_i18n = "const decBtn=document.getElementById('decBtn');const incBtn=document.getElementById('incBtn');if(decBtn)decBtn.setAttribute('aria-label',lang==='ar'?'إنقاص المعرف':'Decrease Target Identifier ID');if(incBtn)incBtn.setAttribute('aria-label',lang==='ar'?'زيادة المعرف':'Increase Target Identifier ID');if(typeof window.renderDemo==='function')window.renderDemo();if(typeof window.updateRadarNode==='function')window.updateRadarNode();"
if js.count(dead_i18n) != 1:
    raise SystemExit(f'Expected one obsolete i18n demo/radar hook, found {js.count(dead_i18n)}')
js = js.replace(dead_i18n, '', 1)

# Remove CSS comments, then filter selectors belonging only to removed features.
def strip_css_comments(text):
    return re.sub(r'/\*.*?\*/', '', text, flags=re.S)

DEAD_SELECTOR_PATTERNS = [
    r'\.nav-linkedin(?![\w-])',
    r'\.demo(?:[-\w]*)',
    r'\.term(?![\w-])', r'\.term[-\w]+',
    r'\.radar[-\w]+', r'#radar[\w-]*',
    r'\.included[-\w]+',
    r'\.mentorship-jewel(?![\w-])', r'\.jewel-label(?![\w-])',
    r'\.compact-mentorship[-\w]+', r'\.practice-track-card(?![\w-])',
    r'\.previous-camps-section(?![\w-])', r'\.camp-history[-\w]+',
    r'\.hunt-loop(?:[-\w]*)', r'\.capacity-note(?![\w-])',
    r'\.leave-with[-\w]+', r'\.admission-(?:flow|step)(?![\w-])',
    r'\.hero-outcome[-\w]+', r'\.hero-facts?(?![\w-])',
    r'\.hero-grid(?![\w-])', r'\.hero-demo-panel(?![\w-])',
    r'\.idor-intro(?![\w-])', r'\.session-support(?![\w-])',
    r'\.profile-highlight-box(?![\w-])',
    r'\.week-accordion-toggle(?![\w-])', r'\.week-triangle(?![\w-])',
]
DEAD_RE = re.compile('|'.join(f'(?:{p})' for p in DEAD_SELECTOR_PATTERNS))

def split_selectors(prelude):
    parts = []
    start = 0
    paren = bracket = 0
    quote = None
    escaped = False
    for i, ch in enumerate(prelude):
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = None
            continue
        if ch in ('"', "'"):
            quote = ch
        elif ch == '(':
            paren += 1
        elif ch == ')':
            paren = max(0, paren - 1)
        elif ch == '[':
            bracket += 1
        elif ch == ']':
            bracket = max(0, bracket - 1)
        elif ch == ',' and paren == 0 and bracket == 0:
            parts.append(prelude[start:i].strip())
            start = i + 1
    parts.append(prelude[start:].strip())
    return [p for p in parts if p]

def find_open_brace(text, start):
    quote = None
    escaped = False
    paren = bracket = 0
    for i in range(start, len(text)):
        ch = text[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = None
            continue
        if ch in ('"', "'"):
            quote = ch
        elif ch == '(':
            paren += 1
        elif ch == ')':
            paren = max(0, paren - 1)
        elif ch == '[':
            bracket += 1
        elif ch == ']':
            bracket = max(0, bracket - 1)
        elif ch == '{' and paren == 0 and bracket == 0:
            return i
        elif ch == ';' and paren == 0 and bracket == 0:
            # Top-level at-rule without a block.
            return None
    return None

def matching_brace(text, open_pos):
    depth = 1
    quote = None
    escaped = False
    i = open_pos + 1
    while i < len(text):
        ch = text[i]
        if quote:
            if escaped:
                escaped = False
            elif ch == '\\':
                escaped = True
            elif ch == quote:
                quote = None
        else:
            if ch in ('"', "'"):
                quote = ch
            elif ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    raise SystemExit('Unbalanced CSS braces')

def process_css(text):
    out = []
    i = 0
    n = len(text)
    while i < n:
        while i < n and text[i].isspace():
            i += 1
        if i >= n:
            break
        # Preserve top-level semicolon at-rules if present.
        semi = text.find(';', i)
        brace = find_open_brace(text, i)
        if brace is None:
            if semi >= 0:
                stmt = text[i:semi + 1].strip()
                if stmt:
                    out.append(stmt)
                i = semi + 1
                continue
            tail = text[i:].strip()
            if tail:
                out.append(tail)
            break
        if semi >= 0 and semi < brace and text[i] == '@':
            stmt = text[i:semi + 1].strip()
            out.append(stmt)
            i = semi + 1
            continue
        close = matching_brace(text, brace)
        prelude = text[i:brace].strip()
        body = text[brace + 1:close]
        lower = prelude.lower()
        if lower.startswith('@media') or lower.startswith('@supports') or lower.startswith('@layer'):
            nested = process_css(body).strip()
            if nested:
                out.append(prelude + '{' + nested + '}')
        elif lower.startswith('@keyframes') or lower.startswith('@-webkit-keyframes') or lower.startswith('@font-face'):
            out.append(prelude + '{' + body.strip() + '}')
        elif prelude.startswith('@'):
            out.append(prelude + '{' + body.strip() + '}')
        else:
            selectors = split_selectors(prelude)
            live = [s for s in selectors if not DEAD_RE.search(s)]
            if live:
                out.append(','.join(live) + '{' + body.strip() + '}')
        i = close + 1
    return ''.join(out)

# The old base file contains one complete superseded accordion block. Drop it before merging.
old_accordion_comment = '/* schedule-pills-curriculum-accordion-v1 */'
new_schedule_comment = '/* schedule-clean-curriculum-orange-v2 */'
if old_accordion_comment in base_css and new_schedule_comment in base_css:
    a = base_css.index(old_accordion_comment)
    b = base_css.index(new_schedule_comment)
    base_css = base_css[:a] + base_css[b:]

merged_css = css + '\n' + base_css + '\n' + override_css
merged_css = strip_css_comments(merged_css)
merged_css = process_css(merged_css)

# Collapse only inter-rule whitespace; declaration values are left intact.
merged_css = re.sub(r'}\s+', '}', merged_css).strip() + '\n'

# Production validation before writing.
for forbidden in ('radarCanvas', 'baseId=4471', 'week-accordion-toggle', 'week-triangle'):
    if forbidden in js:
        raise SystemExit(f'Dead JavaScript marker remains: {forbidden}')
if '/*' in js or '*/' in js:
    raise SystemExit('JavaScript block comment remains')
if '/*' in merged_css or '*/' in merged_css:
    raise SystemExit('CSS comment remains')
if '<!--' in html or '-->' in html:
    raise SystemExit('HTML comment remains')
if './overrides.css' in html or '@import' in merged_css:
    raise SystemExit('Old stylesheet chain remains')
if html.count('./profile.webp') != 1 or html.count('./favicon.svg') != 1:
    raise SystemExit('Extracted static assets are not referenced exactly once')
if html.count('Poc%20(') < 12:
    raise SystemExit('PoC markup changed unexpectedly')

html_path.write_text(html, encoding='utf-8')
js_path.write_text(js, encoding='utf-8')
css_path.write_text(merged_css, encoding='utf-8')

print('Production cleanup completed.')
print(f'index.html: {len(html.encode("utf-8"))} bytes')
print(f'app.js: {len(js.encode("utf-8"))} bytes')
print(f'styles.css: {len(merged_css.encode("utf-8"))} bytes')
print(f'profile.webp: {len(profile_bytes)} bytes')
print(f'favicon.svg: {len(favicon_bytes)} bytes')
