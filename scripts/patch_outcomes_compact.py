from pathlib import Path
import re

index_path = Path('index.html')
css_path = Path('overrides.css')
html = index_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

html, nav_count = re.subn(
    r'\s*<a[^>]*class="nav-linkedin"[^>]*>.*?</a>',
    '',
    html,
    count=1,
    flags=re.S,
)

outcomes = '''<section class="outcomes-section outcomes-compact" id="outcomes-section" tabindex="-1"><div class="container"><div class="section-head reveal outcomes-compact-head"><span class="section-num i18n" data-ar="OUTCOMES" data-en="OUTCOMES">OUTCOMES</span><h2 class="i18n" data-ar="هتطلع بإيه" data-en="WHAT YOU LEAVE WITH">هتطلع بإيه</h2><p class="i18n" data-ar="5 حاجات عملية هتفضل معاك وتستخدمها بعد الكامب." data-en="Five practical things you keep using after the camp.">5 حاجات عملية هتفضل معاك وتستخدمها بعد الكامب.</p></div><div class="outcomes-pill-grid reveal"><article class="outcome-pill"><span class="outcome-pill-num">01</span><div><strong class="i18n" data-ar="Methodology خاصة بيك" data-en="Your Methodology">Methodology خاصة بيك</strong><small class="i18n" data-ar="تعرف تبدأ منين وتختبر إيه وليه." data-en="Know where to start, what to test and why.">تعرف تبدأ منين وتختبر إيه وليه.</small></div></article><article class="outcome-pill"><span class="outcome-pill-num">02</span><div><strong class="i18n" data-ar="Authorization + APIs" data-en="Authorization + APIs">Authorization + APIs</strong><small class="i18n" data-ar="Checklists مرتبة للصلاحيات والـAPIs." data-en="Structured checklists for authorization and APIs.">Checklists مرتبة للصلاحيات والـAPIs.</small></div></article><article class="outcome-pill"><span class="outcome-pill-num">03</span><div><strong class="i18n" data-ar="AI + Automation" data-en="AI + Automation">AI + Automation</strong><small class="i18n" data-ar="Workflow يسرّع الشغل المتكرر." data-en="A workflow that speeds up repetitive work.">Workflow يسرّع الشغل المتكرر.</small></div></article><article class="outcome-pill"><span class="outcome-pill-num">04</span><div><strong class="i18n" data-ar="Reporting" data-en="Reporting">Reporting</strong><small class="i18n" data-ar="تعرف تكتب Report واضح وسهل للـTriage." data-en="Write clear reports that are easy to triage.">تعرف تكتب Report واضح وسهل للـTriage.</small></div></article><article class="outcome-pill"><span class="outcome-pill-num">05</span><div><strong class="i18n" data-ar="Hunt Record" data-en="Hunt Record">Hunt Record</strong><small class="i18n" data-ar="توثيق منظم للـTests والـEvidence والنتيجة." data-en="Organized tests, evidence and final result.">توثيق منظم للـTests والـEvidence والنتيجة.</small></div></article></div></div></section>'''

html, outcome_count = re.subn(
    r'<section class="outcomes-section" id="outcomes-section" tabindex="-1">.*?</section>',
    outcomes,
    html,
    count=1,
    flags=re.S,
)

if outcome_count != 1:
    raise RuntimeError(f'Expected one outcomes section, found {outcome_count}')

start = '/* outcomes-compact-v1 */'
if start in css:
    css = css.split(start, 1)[0].rstrip() + '\n'

css += '''\n/* outcomes-compact-v1 */\n.outcomes-compact{padding-top:58px!important;padding-bottom:58px!important}.outcomes-compact-head{max-width:720px;margin-bottom:24px!important}.outcomes-compact-head p{max-width:620px!important;margin-top:8px!important}.outcomes-pill-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;align-items:stretch}.outcome-pill{grid-column:span 2;display:flex;align-items:center;gap:12px;min-height:76px;padding:12px 17px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.018));box-shadow:inset 0 1px 0 rgba(255,255,255,.04);transition:transform .2s ease,border-color .2s ease,background .2s ease}.outcome-pill:nth-child(4){grid-column:2/span 2}.outcome-pill:nth-child(5){grid-column:4/span 2}.outcome-pill:hover{transform:translateY(-2px);border-color:rgba(249,115,22,.38);background:linear-gradient(135deg,rgba(249,115,22,.07),rgba(255,255,255,.02))}.outcome-pill-num{display:grid;place-items:center;min-width:42px;height:42px;padding:0 8px;border-radius:999px;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.3);color:#ff9b4a;font-family:"IBM Plex Mono",monospace;font-size:.73rem;font-weight:800;letter-spacing:.04em}.outcome-pill>div{min-width:0}.outcome-pill strong{display:block;margin-bottom:3px;color:#f5f2ee;font-family:"IBM Plex Sans Arabic","IBM Plex Sans",sans-serif;font-size:.92rem;line-height:1.35}.outcome-pill small{display:block;color:#aaa39c;font-family:"IBM Plex Sans Arabic","IBM Plex Sans",sans-serif;font-size:.76rem;line-height:1.5}.nav-linkedin{display:none!important}@media(max-width:900px){.outcomes-pill-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.outcome-pill,.outcome-pill:nth-child(4),.outcome-pill:nth-child(5){grid-column:auto}.outcome-pill:last-child{grid-column:1/-1;max-width:calc(50% - 6px);width:100%;justify-self:center}}@media(max-width:620px){.outcomes-compact{padding-top:42px!important;padding-bottom:42px!important}.outcomes-compact-head{margin-bottom:18px!important}.outcomes-pill-grid{grid-template-columns:1fr;gap:9px}.outcome-pill,.outcome-pill:nth-child(4),.outcome-pill:nth-child(5),.outcome-pill:last-child{grid-column:auto;max-width:none;width:100%;min-height:64px;padding:9px 13px;gap:10px}.outcome-pill-num{min-width:38px;height:38px;font-size:.68rem}.outcome-pill strong{font-size:.86rem}.outcome-pill small{font-size:.72rem;line-height:1.4}}\n'''

index_path.write_text(html, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print(f'Updated outcomes; navbar LinkedIn removed: {nav_count == 1}')
