from pathlib import Path
from html import escape
import json
import re
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / '_maintenance/fonts'
OUT = ROOT / 'resources'
CONTENT = ROOT / '_maintenance/content'


def rich(text):
    text = text.replace('–', '-').replace('—', '-')
    text = re.sub(r'(?<=[\u0600-\u06ff])(?=[A-Za-z])', ' ', text)
    pieces, last = [], 0
    for m in re.finditer(r'[A-Za-z][A-Za-z0-9]*(?:[ /+._-]+[A-Za-z0-9][A-Za-z0-9]*)*', text):
        pieces += [escape(text[last:m.start()]), '<bdi dir="ltr">' + escape(m.group()) + '</bdi>']
        last = m.end()
    return ''.join(pieces) + escape(text[last:])


def para(text, cls=''):
    return f'<p class="{cls}" dir="auto">{rich(text)}</p>'


def field(title, hint='', lines=2):
    return '<section class="field"><h3>' + rich(title) + '</h3>' + (para(hint, 'hint') if hint else '') + '<div class="writing">' + '<div></div>' * lines + '</div></section>'


def table(headers):
    return '<table><thead><tr>' + ''.join('<th>' + rich(x) + '</th>' for x in headers) + '</tr></thead><tbody>' + '<tr><td></td><td></td><td></td></tr>' * 3 + '</tbody></table>'


def note(title, text):
    return '<aside class="note"><strong>' + rich(title) + '</strong>' + para(text) + '</aside>'


GUIDES = {
    'report-template': {
        'id': '01', 'words': ['SECURITY', 'REPORT', 'PLAYBOOK'],
        'ar': ['قالب تقرير أمني', 'اختبار واضح ودليل يقدر غيرك يعيده', 'اكتب تقرير يقدر غيرك يراجعه', 'من الاختبار لمسودة قابلة للإرسال', 'رتب السلوك والخطوات والأثر وراجع دليلك قبل الإرسال', [('افهم', 'حدد المتوقع والفرق اللي لاحظته'), ('اثبت', 'اربط كل خطوة بدليل من الاختبار'), ('اكتب', 'خلي غيرك يقدر يعيد النتيجة')]],
    },
    'recon-checklist': {
        'id': '02', 'words': ['TARGET', 'RESEARCH', 'FIELDNOTES'],
        'ar': ['قائمة لفهم الـTarget', 'افهم التطبيق قبل ما تزود الأدوات', 'خمس خطوات لصورة أوضح', 'ورقة شغل للـTarget', 'خريطة صغيرة وأسئلة مرتبة ودليل مطلوب لكل اختبار', [('حدد الحدود', 'الأصول والحسابات وقواعد الاختبار'), ('ارسم الخريطة', 'وظائف وطلبات وأدوار وموارد'), ('رتب الأسئلة', 'فرضية واضحة ونتيجة تقدر تتحقق منها')]],
    },
    'camp-preparation': {
        'id': '03', 'words': ['CAMP', 'READY', 'CHECKLIST'],
        'ar': ['تجهيزك قبل الكامب', 'جهز وقتك وأدواتك وتعالى بمحاولة', 'ابدأ وانت مجهز الأساسيات', 'خطتك لأول أسبوع', 'قائمة تساعدك تبدأ من نقطة واضحة وليست اختبار قبول', [('راجع الأساسيات', 'ويب وحسابات وطلبات وتجربة بالبرب'), ('جهز البيئة', 'جهاز واتصال وصوت وأدوات شغالة'), ('نظم التطبيق', 'وقت أسبوعي وملاحظات وأسئلة واضحة')]],
    },
}


def source_parts(key, lang):
    source = (CONTENT / f'{key}-{lang}.md').read_text()
    lines = [x for x in source.splitlines() if not x.startswith('# ') and not x.startswith('By')]
    intro, sections, current = [], [], None
    for line in lines:
        if line.startswith('## '):
            current = [line[3:], []]
            sections.append(current)
        elif line.strip():
            (intro if current is None else current[1]).append(line.strip())
    return ' '.join(intro), sections


def content(key, lang):
    _, sections = source_parts(key, lang)
    rendered = []
    for n, (heading, lines) in enumerate(sections, 1):
        heading = re.sub(r'^[0-9٠-٩]+[. ]*', '', heading)
        block = f'<section class="guide-section"><div class="section-head"><span class="index">{n:02}</span><h3>{rich(heading)}</h3></div>'
        for line in lines:
            if line.startswith('- [ ]'):
                block += '<div class="check"><i></i>' + para(line[6:].strip()) + '</div>'
            elif line.startswith('- '):
                block += '<div class="bullet"><i></i>' + para(line[2:]) + '</div>'
            elif re.match(r'^\d+[. ]', line):
                m = re.match(r'^(\d+)[. ]+(.+)', line)
                block += '<div class="step"><b>' + m[1] + '</b>' + para(m[2]) + '</div>'
            else:
                block += para(line)
        rendered.append(block + '</section>')
    return rendered


def worksheet(key, lang):
    ar = lang == 'ar'
    def text(a, e): return a if ar else e
    if key == 'report-template':
        return '<div class="two">' + field(text('الأصل والمسار', 'Asset and endpoint'), '', 1) + field(text('الحسابات والموارد', 'Accounts and resources'), 'Account A / Account B / Owner', 1) + '</div>' + field(text('العنوان والملخص', 'Title and summary'), text('الخلل + الوظيفة + الأثر المثبت + الشروط', 'Flaw + affected feature + demonstrated impact + prerequisites'), 3) + field(text('خطوات إعادة الاختبار', 'Reproduction steps'), text('التجهيز ثم Baseline ثم التغيير ثم النتيجة', 'Setup, baseline, controlled change, verified result'), 4) + '<div class="two">' + field(text('المتوقع والفعلي', 'Expected / actual'), '', 3) + field(text('الأثر وحدود الدليل', 'Impact and evidence limits'), '', 3) + '</div>' + field(text('الأدلة وتوصية المعالجة', 'Evidence and remediation'), text('اربط المرفقات بالخطوات وحدد سبب الخلل', 'Connect evidence to steps and address the underlying cause'), 2) + note(text('مراجعة أخيرة', 'Final review'), text('شخص تاني يقدر يعيد الاختبار؟ الأسرار محذوفة؟ الأثر على قد اللي أثبته؟ HTTP 200 لوحده مش دليل على ثغرة', 'Can someone else reproduce it? Have you removed secrets? Does impact follow the evidence? HTTP 200 alone does not prove a flaw.'))
    if key == 'recon-checklist':
        return '<div class="two">' + field(text('الأصل وحدود الشغل', 'Asset and boundaries'), '', 2) + field(text('الحسابات والأدوار', 'Accounts and roles'), '', 2) + '</div><h3 class="table-title">' + text('خريطة صغيرة للتطبيق', 'A small application map') + '</h3>' + table(text(['الوظيفة والمسار', 'الدور والمورد', 'السؤال أو الملاحظة'], ['Feature / endpoint', 'Role / resource', 'Question / observation'])) + field(text('فرضية واحدة نبدأ بيها', 'One hypothesis to start with'), text('القاعدة المتوقعة + الافتراض اللي محتاج اختبار', 'Expected rule + the assumption to test'), 3) + '<div class="two">' + field(text('Baseline والتغيير الواحد', 'Baseline and controlled change'), '', 2) + field(text('النتيجة والدليل المطلوب', 'Expected outcome and evidence'), '', 2) + '</div>' + field(text('الملاحظات والخطوة التالية', 'Notes and next step'), text('إيه اللي اتأكد وإيه اللي لسه محتاج دليل', 'What is confirmed and what still needs evidence?'), 2) + note(text('قبل ما تزود أدوات', 'Before adding tools'), text('تقدر تشرح هتختبر إيه وليه وإيه النتيجة اللي تثبت الفرضية أو ترفضها؟ لو لأ ارجع للخريطة', 'Can you explain what you will test, why it matters and which result would support or reject the hypothesis? If not, return to the map.'))
    return '<div class="two">' + field(text('مستوايا دلوقتي', 'My starting point'), text('إيه اللي فاهمه وجربته بإيدي', 'What I understand and have tried myself'), 3) + field(text('الحاجة اللي هجهزها', 'What I need to prepare'), text('أداة أو أساس ناقص وخطوة لتجهيزه', 'A missing tool or foundation and one practical step'), 3) + '</div><h3 class="table-title">' + text('وقت التطبيق اللي هحافظ عليه', 'Practice time I can protect') + '</h3>' + table(text(['اليوم', 'الوقت', 'التطبيق أو المراجعة'], ['Day', 'Time', 'Practice / review'])) + field(text('محاولة أقدر أناقشها', 'An attempt I can discuss'), text('التوقع / التغيير / اللي حصل / الدليل', 'Expectation / controlled change / result / evidence'), 4) + '<div class="two">' + field(text('السؤال اللي محتاج مساعدة فيه', 'A question I need help with'), '', 3) + field(text('الخطوة الجاية', 'My next step'), '', 3) + '</div>' + note(text('وثق كل محاولة', 'Document each attempt'), text('كنت متوقع إيه؟ غيرت إيه؟ حصل إيه فعلا؟ إيه الدليل؟ إيه اللي مش واضح؟ وإيه الخطوة اللي بعدها؟', 'What did I expect? What did I change? What happened? What is the evidence? What remains unclear? What should I try next?'))


CSS = '''
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;color:#f6f0e7;font-family:Latin,Arab,sans-serif}
.page{position:relative;width:210mm;height:297mm;padding:31mm 17mm 20mm;background:linear-gradient(140deg,#090e16,#111b29);overflow:hidden;page-break-after:always}.page:last-child{page-break-after:auto}
.page:before{content:"";position:absolute;left:10mm;top:28mm;bottom:20mm;border-left:1px solid #ba985833}
.ar{direction:rtl;font-family:Arab,Latin,sans-serif}bdi{font-family:Latin,Arab,sans-serif;unicode-bidi:isolate}.ar bdi{display:inline-block;direction:ltr;unicode-bidi:embed;white-space:nowrap;margin-inline:.08em}
.header{position:absolute;top:10mm;left:17mm;right:17mm;height:16mm;display:flex;justify-content:space-between;align-items:center;direction:ltr;border-bottom:1px solid #a78b525f;padding-bottom:5mm}
.wordmark{font:700 10px Latin;letter-spacing:1.2px;color:#e9c786}.header-right{display:flex;align-items:center;gap:12px}.header-right>span{font:8px Latin;letter-spacing:1.4px;line-height:1.6;color:#aebdd0;text-align:right}.header img{width:41px;height:41px;border-radius:9px}
.footer{position:absolute;left:17mm;right:17mm;bottom:9mm;display:flex;justify-content:space-between;direction:ltr;border-top:1px solid #b9985750;padding-top:4mm;font:9px Latin;letter-spacing:.5px}.footer .by{color:#efcb86}.footer a{color:#b8c7d8;text-decoration:none}.footer .num{position:absolute;left:48%;color:#efcb86;letter-spacing:2px}
p,h1,h2,h3{margin:0}.eyebrow{font:700 9px Latin;letter-spacing:2px;direction:ltr;color:#e8bb72;margin-bottom:4mm}h2{font-size:26px;line-height:1.4;color:#fff3de}h3{font-size:16px;line-height:1.5;color:#edc989}.ar h2{font-size:29px}.sub{font-size:13px;line-height:1.7;color:#acbdd0;margin:1mm 0 5mm}.ar .sub{font-size:14px}
.cover{padding-top:41mm}.cover .eyebrow{border-left:3px solid #ff8127;padding-left:12px;margin-bottom:18mm}.cover h1{font:700 59px/.97 Latin;letter-spacing:-2px;direction:ltr;position:relative}.cover h1 span{display:block}.cover h1 .gold{color:#edc57e}.cover h2{font-size:26px;margin-top:15mm;position:relative}.ar.cover h2{font-size:33px}.tagline{color:#ffa150;font-size:15px;line-height:1.8;margin-top:1mm}.intro{font-size:14px;line-height:1.9;color:#c2cedc;margin-top:4mm}.ar .intro{font-size:16px}
.route{display:flex;gap:4mm;margin-top:10mm;border-top:1px solid #c39d5b60;padding-top:7mm}.route article{flex:1;border-inline-start:2px solid #a78042;padding-inline-start:4mm;min-width:0}.route b{display:block;font:700 11px Latin;color:#ff954a;margin-bottom:3mm}.route strong{font-size:15px;color:#f0ca86;line-height:1.5}.route p{font-size:11.5px;line-height:1.8;color:#b5c4d5;margin-top:1mm}.ar .route p{font-size:13px}.cover-bottom{position:absolute;bottom:28mm;left:17mm;right:17mm;display:flex;justify-content:space-between;direction:ltr;font:9px Latin;letter-spacing:1px;color:#98abc1}
.orbit{position:absolute;right:-39mm;top:48mm;width:150mm;height:150mm;border:1px solid #bd98532c;border-radius:50%}.orbit:before{content:"";position:absolute;inset:18mm;border:1px solid #bd985333;border-radius:50%}.orbit:after{content:"";position:absolute;inset:36mm;border:1px solid #ff8b273a;border-radius:50%}.cover-index{position:absolute;right:20mm;top:65mm;font:700 120px Latin;color:#d1a65a15}
.guide-section{padding-top:1mm;border-bottom:1px solid #90a3bc30;padding-bottom:2.4mm;margin-bottom:2.6mm;break-inside:avoid}.section-head{display:flex;align-items:baseline;gap:3mm;margin-bottom:1.4mm}.index{font:700 11px Latin;color:#ff9d52}.guide-section p{font-size:15px;line-height:1.75;color:#ced9e5;margin-top:.8mm}.ar .guide-section p{font-size:16px;line-height:1.8}.check,.bullet,.step{display:flex;align-items:flex-start;gap:3mm}.check i{min-width:9px;width:9px;height:9px;border:1px solid #ba9b62;border-radius:2px;margin-top:6px}.bullet i{min-width:3px;width:3px;height:3px;background:#d2aa66;margin-top:10px}.step b{font:700 10px Latin;color:#ff9b4c;margin-top:7px}
.field{border:1px solid #99875a44;background:#b8cbe707;border-radius:7px;padding:3mm 4mm;margin-bottom:3mm;break-inside:avoid}.field h3{font-size:14px}.hint{font-size:10.5px;line-height:1.7;color:#9eb0c7}.ar .hint{font-size:12px}.writing>div{height:7mm;border-bottom:1px solid #8398b033}.two{display:flex;gap:3mm}.two>.field{width:50%;min-width:0}.table-title{margin:2mm 0}table{width:100%;table-layout:fixed;border-collapse:collapse;margin:0 0 4mm}th{font-size:11px;color:#edcc90;background:#1b293b;padding:2.5mm;text-align:inherit;border:1px solid #a18b5355}td{height:11mm;border:1px solid #879bb345;padding:2mm}.note{border-inline-start:2px solid #ff8b29;background:#e9bd7010;padding:3mm 4mm;margin-top:3mm;break-inside:avoid}.note strong{font-size:12px;color:#ffc27e}.note p{font-size:11.5px;line-height:1.7;color:#c1cede;margin-top:1mm}.ar .note p{font-size:13px}
.kit-title{font:700 61px/1 Latin;direction:ltr;letter-spacing:-2px;margin-top:21mm}.kit-title em{font-style:normal;color:#edc57e}.kit-intro{font-size:19px;line-height:1.8;color:#c4d1e1;margin-top:9mm}.kit-list{margin-top:8mm}.kit-list a{display:flex;justify-content:space-between;align-items:baseline;text-decoration:none;border-top:1px solid #ab92555a;color:#edcc8c;padding:4mm 0;font-size:18px}.kit-list small{font:10px Latin;color:#9cadc2;direction:ltr}
'''


def font_css():
    specs = [('Arab', 400, FONTS/'Tajawal-Regular.ttf'), ('Arab', 700, ROOT/'assets/fonts/tajawal-bold.woff'), ('Latin', 400, FONTS/'Lato-Regular.ttf'), ('Latin', 700, FONTS/'Lato-Bold.ttf')]
    return ''.join(f'@font-face{{font-family:{name};font-weight:{weight};src:url("{path.as_uri()}")}}' for name, weight, path in specs)


def page(body, lang, n, cls='', ident=''):
    header = '<div class="header"><span class="wordmark">RVU MENTORSHIP CAMP</span><div class="header-right"><span>FIELD GUIDES<br>LEARN / APPLY / REVIEW</span><img src="' + (ROOT/'assets/logo.webp').as_uri() + '" alt="RVU logo"></div></div>'
    footer = f'<div class="footer"><span class="by">By: Ramez Medhat</span><span class="num">{n:02}</span><a href="https://rv-u.tech/">rv-u.tech</a></div>'
    return f'<section class="page {lang} {cls}" lang="{lang}" dir="{"rtl" if lang == "ar" else "ltr"}" id="{ident}">{header}{body}{footer}</section>'


def guide_pages(key, lang, start=1):
    guide, copy = GUIDES[key], GUIDES[key][lang]
    intro, _ = source_parts(key, lang)
    title = ''.join(f'<span class="{"gold" if i == 1 else ""}">{word}</span>' for i, word in enumerate(guide['words']))
    route = ''.join(f'<article><b>0{i+1}</b><strong>{rich(t)}</strong>{para(c)}</article>' for i, (t, c) in enumerate(copy[5]))
    cover = f'<div class="orbit"></div><div class="cover-index">{guide["id"]}</div><p class="eyebrow">{guide["id"]} / RVU PRACTICAL RESOURCES</p><h1>{title}</h1><h2>{rich(copy[0])}</h2>' + para(copy[1], 'tagline') + para(intro, 'intro') + f'<div class="route">{route}</div><div class="cover-bottom"><span>{"ARABIC EDITION" if lang == "ar" else "ENGLISH EDITION"}</span><span>GUIDE + WORKSHEET / 04 PAGES</span></div>'
    pages = [page(cover, lang, start, 'cover', key+'-'+lang)]
    sections = content(key, lang)
    split = {'report-template': 4, 'recon-checklist': 3, 'camp-preparation': 2}[key]
    second_titles = {'report-template': ['الدليل والأثر والمراجعة', 'Evidence, impact and final review'], 'recon-checklist': ['من الخريطة لفرضية اختبار', 'From a map to a testable hypothesis'], 'camp-preparation': ['نظم وقتك ومحاولاتك', 'Plan your time and document attempts']}
    second_title = second_titles[key][0 if lang == 'ar' else 1]
    bodies = [(1, 'METHOD / REFERENCE', copy[2], ''.join(sections[:split])), (2, 'REVIEW / NEXT STEPS', second_title, ''.join(sections[split:])), (3, 'PRACTICE / WORKSHEET', copy[3], worksheet(key, lang))]
    for offset, label, heading, body in bodies:
        pages.append(page(f'<p class="eyebrow">{guide["id"]} / {label}</p><h2>{rich(heading)}</h2>' + para(copy[4], 'sub') + body, lang, start+offset, 'worksheet' if offset == 3 else 'method'))
    return pages


def render(pages, title, lang, destination):
    source = '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><title>'+escape(title)+'</title><meta name="author" content="Ramez Medhat"><style>'+font_css()+CSS+'</style></head><body>'+''.join(pages)+'</body></html>'
    rendered = HTML(string=source, base_url=str(ROOT)).render()
    if len(rendered.pages) != len(pages): raise ValueError(f'{destination.name}: {len(rendered.pages)} pages instead of {len(pages)}')
    for page_number, rendered_page in enumerate(rendered.pages, 1):
        for box in rendered_page._page_box.descendants():
            if box.element is None or type(box).__name__ not in ['BlockBox', 'FlexBox']:
                continue
            if box.element.get('class') in ['guide-section', 'field', 'note'] and box.position_y + box.border_height() > 1047:
                raise ValueError(f'{destination.name} page {page_number}: content intrudes into footer at {box.position_y + box.border_height():.1f}px')
    rendered.write_pdf(destination, pdf_tags=True, optimize_images=True)
    print(json.dumps({'file': destination.name, 'pages': len(pages), 'bytes': destination.stat().st_size}))


def main():
    """Build the three Arabic public guides only; no bilingual kit or unpublished editions."""
    OUT.mkdir(parents=True, exist_ok=True)
    for key, guide in GUIDES.items():
        render(guide_pages(key, 'ar'), guide['ar'][0], 'ar', OUT / f'{key}-ar.pdf')


if __name__ == '__main__':
    main()
