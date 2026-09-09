from pathlib import Path
import re

html = Path('index.html').read_text(encoding='utf-8')
js = Path('app.js').read_text(encoding='utf-8')
css_path = Path('styles.css')
css = css_path.read_text(encoding='utf-8')

live_classes = set()
for raw in re.findall(r'class="([^"]*)"', html):
    live_classes.update(x for x in raw.split() if x)

live_ids = set(re.findall(r'id="([A-Za-z_][\w-]*)"', html))

# Classes and ids referenced/created by JavaScript.
live_classes.update(re.findall(r'\.([A-Za-z_][\w-]*)', js))
live_ids.update(re.findall(r'#([A-Za-z_][\w-]*)', js))

# Simple quoted tokens cover classList.add/remove/toggle and className assignments.
for q in re.findall(r"(['\"])(.*?)\1", js):
    value = q[1]
    for token in value.split():
        if re.fullmatch(r'[A-Za-z_][\w-]*', token):
            live_classes.add(token)

# Known runtime states are explicit to make the pruning fail-safe.
live_classes.update({
    'loading','intro-complete','seen-before','ready','hide','skip-fast',
    'stage-boot','stage-map','stage-scan','stage-lock','stage-analyze',
    'stage-collapse','stage-brand','stage-outro','show','open','active','in',
    'fonts-loaded','poc-fallback','curtain-mode','application-open','nav-open',
    'success','error'
})


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


def positive_tokens(selector):
    # Classes/ids inside :not() do not need to exist for a selector to match.
    cleaned = re.sub(r':not\([^()]*\)', '', selector)
    classes = set(re.findall(r'\.([A-Za-z_][\w-]*)', cleaned))
    ids = set(re.findall(r'#([A-Za-z_][\w-]*)', cleaned))
    return classes, ids


def selector_can_match(selector):
    classes, ids = positive_tokens(selector)
    return classes.issubset(live_classes) and ids.issubset(live_ids)

removed=[]
kept=[]

def process(text):
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
            nested=process(body)
            if nested.strip(): out.append(prelude+'{'+nested+'}')
        elif prelude.startswith('@'):
            out.append(prelude+'{'+body.strip()+'}')
        else:
            selectors=split_selectors(prelude)
            live=[]
            for s in selectors:
                if selector_can_match(s):
                    live.append(s); kept.append(s)
                else:
                    removed.append(s)
            if live:
                out.append(','.join(live)+'{'+body.strip()+'}')
        i=close+1
    return ''.join(out)

new_css=process(css).strip()+'\n'
if '/*' in new_css or '*/' in new_css:
    raise SystemExit('Comments unexpectedly present')
if new_css.count('{') != new_css.count('}'):
    raise SystemExit('CSS brace mismatch after pruning')
if not removed:
    raise SystemExit('Expected stale selectors, removed none')

# Critical current selectors must survive.
for marker in [
    '.nav-profile-link', '.hero-apply-btn', '.hunt-proof-grid', '.outcome-pill',
    '.week-sessions', '.outcome-session', '.legal-experience', '.schedule-item',
    '.interview-payment-note', '.faq-item', '.apply-modal', '.mobile-apply-fab',
    '.poc-card-item', '.preloader'
]:
    if marker not in new_css:
        raise SystemExit(f'Critical selector was lost: {marker}')

css_path.write_text(new_css,encoding='utf-8')
print(f'Live HTML classes: {len(live_classes)}')
print(f'Live IDs: {len(live_ids)}')
print(f'Removed stale selectors: {len(removed)}')
print(f'CSS bytes: {len(css.encode("utf-8"))} -> {len(new_css.encode("utf-8"))}')
print('Examples removed:', removed[:30])
