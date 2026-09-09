from pathlib import Path
import re

index_path = Path('index.html')
css_path = Path('overrides.css')
text = index_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')

# Replace the three proof cards with one combined hunting/practical card + a two-column offline camps card.
pattern = re.compile(
    r'<div class="hunt-proof-grid reveal">\s*'
    r'<div class="proof-card proof-card-orange tilt-card">.*?</div>\s*'
    r'<div class="proof-card proof-card-green tilt-card">.*?</div>\s*'
    r'<div class="proof-card proof-card-blue tilt-card">.*?</div>\s*'
    r'</div>',
    re.S,
)

replacement = '''<div class="hunt-proof-grid reveal"> <div class="proof-card proof-card-orange tilt-card proof-card-combined"> <div class="proof-combined-part"><b class="proof-title-orange">HUNTING SINCE 2023</b> <p class="i18n" data-ar="بهانت بشكل فعلي من 2023 وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة." data-en="I have been actively hunting since 2023 and have submitted security reports across public and private bug bounty programs at different severity levels.">بهانت بشكل فعلي من 2023 وقدمت تقارير أمنية بمستويات خطورة مختلفة على برامج Bug Bounty عامة وخاصة.</p></div> <div class="proof-combined-part"><b class="proof-title-blue">PRACTICAL FOCUS</b> <p class="i18n" data-ar="التركيز على Web وAuthorization وAPIs وBusiness Logic وRecon workflows وpractical automation وبناء Methodology قابلة للتطوير." data-en="Practical focus on web, authorization, APIs, business logic, recon workflows, practical automation and building an evolving methodology.">التركيز على Web وAuthorization وAPIs وBusiness Logic وRecon workflows وpractical automation وبناء Methodology قابلة للتطوير.</p></div> </div> <div class="proof-card proof-card-green tilt-card proof-card-wide"> <b class="proof-title-green">3 OFFLINE CAMPS</b> <p class="i18n" data-ar="قدّمت 3 معسكرات Bug Bounty أوفلاين قبل إطلاق النسخة الأونلاين." data-en="Delivered 3 offline Bug Bounty camps before launching the online cohort.">قدّمت 3 معسكرات Bug Bounty أوفلاين قبل إطلاق النسخة الأونلاين.</p> <div class="offline-camp-lines"> <span class="offline-camp-line camp-one i18n" data-ar="8 طلاب · فبراير ← منتصف مارس 2026" data-en="8 students · Feb → Mid-Mar 2026">8 طلاب · فبراير ← منتصف مارس 2026</span> <span class="offline-camp-line camp-two i18n" data-ar="11 طالب · أول أبريل ← منتصف مايو 2026" data-en="11 students · Early Apr → Mid-May 2026">11 طالب · أول أبريل ← منتصف مايو 2026</span> <span class="offline-camp-line camp-three i18n" data-ar="16 طالب · يونيو ← منتصف يوليو 2026" data-en="16 students · Jun → Mid-Jul 2026">16 طالب · يونيو ← منتصف يوليو 2026</span> </div> </div> </div>'''

text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise RuntimeError(f'Expected one proof grid match, found {count}')

marker = '/* proof-card-balance-v2 */'
if marker not in css:
    css += '''\n/* proof-card-balance-v2 */\n.hunt-proof-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.hunt-proof-grid .proof-card-combined{grid-column:span 1}.hunt-proof-grid .proof-card-wide{grid-column:span 2}.proof-combined-part+.proof-combined-part{margin-top:18px;padding-top:17px;border-top:1px solid rgba(255,255,255,.1)}.proof-combined-part b{display:block;margin-bottom:8px}.proof-combined-part p{margin:0}.proof-card-wide .offline-camp-lines{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:15px}.proof-card-wide .offline-camp-line{display:flex;align-items:center;justify-content:center;min-height:52px;padding:10px 12px;text-align:center;border-radius:8px;font-weight:700;line-height:1.45}.proof-card-wide .camp-one{color:#ffae68;background:rgba(255,138,31,.08);border:1px solid rgba(255,138,31,.22)}.proof-card-wide .camp-two{color:#70e3a1;background:rgba(62,207,142,.07);border:1px solid rgba(62,207,142,.2)}.proof-card-wide .camp-three{color:#8ebeff;background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.2)}@media(max-width:900px){.hunt-proof-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.hunt-proof-grid .proof-card-wide{grid-column:span 2}.proof-card-wide .offline-camp-lines{grid-template-columns:1fr}}@media(max-width:620px){.hunt-proof-grid{grid-template-columns:1fr!important}.hunt-proof-grid .proof-card-combined,.hunt-proof-grid .proof-card-wide{grid-column:span 1}}\n'''

index_path.write_text(text, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
print('Proof card layout updated.')
