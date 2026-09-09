from pathlib import Path
import hashlib
import re

css_path = Path('styles.css')
js_path = Path('app.js')
html_path = Path('index.html')

css = css_path.read_text(encoding='utf-8')
js = js_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')

clarity_snippet = "window.RVU_CLARITY_PROJECT_ID='ydzz6gt587';window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};(function(){const s=document.createElement('script');s.async=true;s.src='https://www.clarity.ms/tag/'+window.RVU_CLARITY_PROJECT_ID;s.referrerPolicy='no-referrer';document.head.appendChild(s);})();"
if clarity_snippet not in js:
    raise SystemExit('Clarity production snippet changed or missing before cleanup')
if "https://www.clarity.ms" not in html or "https://scripts.clarity.ms" not in html:
    raise SystemExit('Clarity CSP allowlist is missing before cleanup')

js_sha_before = hashlib.sha256(js.encode('utf-8')).hexdigest()
html_sha_before = hashlib.sha256(html.encode('utf-8')).hexdigest()

if 'is-open' in html or 'is-open' in js:
    raise SystemExit('Unexpected live is-open dependency found in HTML/JS')

# Safely retire the obsolete curriculum accordion state from selectors.
# :not(.is-open) currently matches every week block, so removing that condition
# is behavior-preserving. .is-open selectors are unreachable and are dropped.
def split_selectors(prelude):
    parts=[]; start=0; paren=bracket=0; quote=None; escaped=False
    for i,ch in enumerate(prelude):
        if quote:
            if escaped: escaped=False
            elif ch=='\\': escaped=True
            elif ch==quote: quote=None
            continue
        if ch in ('"', "'"): quote=ch
        elif ch=='(': paren+=1
        elif ch==')': paren=max(0,paren-1)
        elif ch=='[': bracket+=1
        elif ch==']': bracket=max(0,bracket-1)
        elif ch==',' and paren==0 and bracket==0:
            parts.append(prelude[start:i].strip()); start=i+1
    parts.append(prelude[start:].strip())
    return [p for p in parts if p]

def find_open_brace(text,start):
    quote=None; escaped=False; paren=bracket=0
    for i in range(start,len(text)):
        ch=text[i]
        if quote:
            if escaped: escaped=False
            elif ch=='\\': escaped=True
            elif ch==quote: quote=None
            continue
        if ch in ('"', "'"): quote=ch
        elif ch=='(': paren+=1
        elif ch==')': paren=max(0,paren-1)
        elif ch=='[': bracket+=1
        elif ch==']': bracket=max(0,bracket-1)
        elif ch=='{' and paren==0 and bracket==0: return i
        elif ch==';' and paren==0 and bracket==0: return None
    return None

def matching_brace(text,open_pos):
    depth=1; quote=None; escaped=False; i=open_pos+1
    while i<len(text):
        ch=text[i]
        if quote:
            if escaped: escaped=False
            elif ch=='\\': escaped=True
            elif ch==quote: quote=None
        else:
            if ch in ('"', "'"): quote=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0: return i
        i+=1
    raise SystemExit('Unbalanced CSS')

def clean_selector(selector):
    if '.week-block.is-open' in selector:
        return None
    selector = selector.replace('.week-block:not(.is-open)', '.week-block')
    return selector

def process_css(text):
    out=[]; i=0; n=len(text)
    while i<n:
        while i<n and text[i].isspace(): i+=1
        if i>=n: break
        semi=text.find(';',i)
        brace=find_open_brace(text,i)
        if brace is None:
            if semi>=0:
                stmt=text[i:semi+1].strip()
                if stmt: out.append(stmt)
                i=semi+1; continue
            tail=text[i:].strip()
            if tail: out.append(tail)
            break
        if semi>=0 and semi<brace and text[i]=='@':
            out.append(text[i:semi+1].strip()); i=semi+1; continue
        close=matching_brace(text,brace)
        prelude=text[i:brace].strip(); body=text[brace+1:close]
        lower=prelude.lower()
        if lower.startswith('@media') or lower.startswith('@supports') or lower.startswith('@layer'):
            nested=process_css(body)
            if nested.strip(): out.append(prelude+'{'+nested+'}')
        elif prelude.startswith('@'):
            out.append(prelude+'{'+body.strip()+'}')
        else:
            cleaned=[]
            for selector in split_selectors(prelude):
                selector=clean_selector(selector)
                if selector and selector not in cleaned:
                    cleaned.append(selector)
            if cleaned:
                out.append(','.join(cleaned)+'{'+body.strip()+'}')
        i=close+1
    return ''.join(out)

css = process_css(css).strip()

# Remove a few selectors tied to markup that no longer exists in the current page.
# These were inherited from older iterations and have no current DOM target.
for stale_rule in [
    r'\.schedule-item \.sch-value\.placeholder\{[^{}]*\}',
    r'\.gold-card-legal h4\{[^{}]*\}',
    r'\.legal-copy h4\{[^{}]*\}',
]:
    css = re.sub(stale_rule, '', css)

# Laptop/desktop only: make each offline-camp date a boxed row.
desktop_rule = '@media (min-width:981px){.hunt-proof-grid .proof-card-wide .offline-camp-lines{grid-template-columns:1fr!important;gap:9px!important}.hunt-proof-grid .proof-card-wide .offline-camp-line{display:flex!important;width:100%!important;min-height:46px!important;align-items:center!important;justify-content:center!important;padding:9px 12px!important}}'
if desktop_rule not in css:
    css += desktop_rule

css += '\n'

if 'is-open' in css:
    raise SystemExit('Obsolete is-open selector remains after cleanup')
if '/*' in css or '*/' in css:
    raise SystemExit('CSS comments remain')
if css.count('{') != css.count('}'):
    raise SystemExit('CSS braces are unbalanced')

# Critical current selectors must remain.
for marker in [
    '.nav-profile-link','.offline-camp-lines','.offline-camp-line','.hero-apply-btn',
    '.week-sessions','.outcome-session','.legal-experience','.schedule-item',
    '.faq-item','.apply-modal','.mobile-apply-fab','.preloader'
]:
    if marker not in css:
        raise SystemExit(f'Critical selector missing after cleanup: {marker}')

# We intentionally do not write app.js or index.html.
if hashlib.sha256(js.encode('utf-8')).hexdigest() != js_sha_before:
    raise SystemExit('app.js changed unexpectedly')
if hashlib.sha256(html.encode('utf-8')).hexdigest() != html_sha_before:
    raise SystemExit('index.html changed unexpectedly')
if clarity_snippet not in js:
    raise SystemExit('Clarity snippet changed unexpectedly')

css_path.write_text(css, encoding='utf-8')
print('Final freshen completed.')
print('Clarity snippet preserved exactly.')
print('Desktop offline camp rows enabled at >=981px only.')
print(f'Final CSS bytes: {len(css.encode("utf-8"))}')
