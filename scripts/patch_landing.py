from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')
    text = text.replace(old, new, 1)


def sub_once(pattern, replacement, label):
    global text
    text, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 match, found {count}')


# Load the small visual override layer.
if './overrides.css' not in text:
    replace_once(
        '<link href="./styles.css" rel="stylesheet"></head>',
        '<link href="./styles.css" rel="stylesheet"><link href="./overrides.css" rel="stylesheet"></head>',
        'overrides stylesheet link',
    )

# Remove the deleted Mentorship section from top navigation.
replace_once(
    '<li><a class="i18n" data-ar="Mentorship" data-en="Mentorship" href="#included-section">Mentorship</a></li>',
    '',
    'Mentorship nav item',
)

# Add a compact round LinkedIn icon beside the top Apply controls.
nav_old = '<div class="nav-actions"> <button aria-label="Switch to English Language" class="lang-toggle" id="langToggle" type="button">EN</button> <button class="nav-cta i18n" data-ar="قدّم" data-en="Apply" data-open-application="" type="button">قدّم</button>'
nav_new = '<div class="nav-actions"> <button aria-label="Switch to English Language" class="lang-toggle" id="langToggle" type="button">EN</button> <a aria-label="LinkedIn" class="nav-linkedin" href="https://www.linkedin.com/in/ramez-medhat-rvu/" rel="noopener noreferrer" target="_blank"><svg viewbox="0 0 24 24" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.6a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z"></path></svg></a> <button class="nav-cta i18n" data-ar="قدّم" data-en="Apply" data-open-application="" type="button">قدّم</button>'
replace_once(nav_old, nav_new, 'top LinkedIn button')

# Remove the entire Mentorship block from the page source.
sub_once(
    r'<section id="included-section" tabindex="-1">.*?</section>(?=<section class="outcomes-section" id="outcomes-section")',
    '',
    'Mentorship section',
)

# Replace Schedule with a tighter Camp System summary.
new_schedule = '''<section id="execution" tabindex="-1"> <div class="container"> <div class="schedule-box reveal tilt-card"> <div class="section-head schedule-head"><span class="section-num i18n" data-ar="SCHEDULE" data-en="SCHEDULE">SCHEDULE</span><h2 class="i18n" data-ar="نظام الكامب" data-en="CAMP SYSTEM">نظام الكامب</h2></div> <div class="schedule-grid"><div class="schedule-item"><div class="sch-label i18n" data-ar="البداية" data-en="Start">البداية</div><div class="sch-value i18n" data-ar="سبتمبر 2026" data-en="September 2026">سبتمبر 2026</div></div><div class="schedule-item"><div class="sch-label i18n" data-ar="نظام الأسبوع" data-en="Weekly flow">نظام الأسبوع</div><div class="sch-value i18n" data-ar="يومين سيشن Live كل أسبوع" data-en="Two live-session days each week">يومين سيشن Live كل أسبوع</div></div><div class="schedule-item"><div class="sch-label i18n" data-ar="مدة الكامب" data-en="Camp duration">مدة الكامب</div><div class="sch-value i18n" data-ar="أكتر من 36 ساعة" data-en="36+ hours">أكتر من 36 ساعة</div></div><div class="schedule-item"><div class="sch-label i18n" data-ar="متابعة فردية" data-en="Individual follow-up">متابعة فردية</div><div class="sch-value i18n" data-ar="1:1 Call كل أسبوع" data-en="One 1-on-1 call every week">1:1 Call كل أسبوع</div></div></div> </div> </div> </section> <section id="contact" tabindex="-1">'''
sub_once(
    r'<section id="execution" tabindex="-1">.*?</section> <section id="contact" tabindex="-1">',
    new_schedule,
    'Schedule section',
)

# Merge INTERVIEW and BEFORE YOU PAY into one smaller, multi-accent card.
merged_note = '''<div class="personal-note reveal interview-payment-note"> <div class="interview-payment-grid"> <div class="interview-mini-block interview-side"> <span class="interview-mini-kicker i18n" data-ar="INTERVIEW" data-en="INTERVIEW">INTERVIEW</span> <h3 class="i18n" data-ar="الانترفيو مش امتحان" data-en="The interview is not an exam">الانترفيو مش امتحان</h3> <p class="i18n" data-ar="لكن بيه هنبص على أساسياتك ووقتك واستعدادك للتطبيق وطريقة تفكيرك وبعدها هقولك بصراحة &lt;span class='accent-accepted'&gt;Accepted&lt;/span&gt; أو &lt;span class='accent-notyet'&gt;Not Yet&lt;/span&gt; ولو محتاج تراجع حاجة هقولك إيه هي قبل ما تاخد قرار الدفع." data-en="We use it to look at your foundations available time readiness to practice and how you think. Then I tell you directly &lt;span class='accent-accepted'&gt;Accepted&lt;/span&gt; or &lt;span class='accent-notyet'&gt;Not Yet&lt;/span&gt; and if you need to review anything I tell you what it is before you make a payment decision.">لكن بيه هنبص على أساسياتك ووقتك واستعدادك للتطبيق وطريقة تفكيرك وبعدها هقولك بصراحة <span class="accent-accepted">Accepted</span> أو <span class="accent-notyet">Not Yet</span> ولو محتاج تراجع حاجة هقولك إيه هي قبل ما تاخد قرار الدفع.</p> </div> <div class="interview-mini-block before-pay-side"> <span class="interview-mini-kicker i18n" data-ar="بيني وبينك قبل ما تدفع" data-en="BETWEEN YOU AND ME BEFORE YOU PAY">بيني وبينك قبل ما تدفع</span> <h3 class="i18n" data-ar="قبل ما تدفع" data-en="Before you pay">قبل ما تدفع</h3> <p class="i18n" data-ar="أنا مش هبيع لك وعد بباونتي لأن ممكن &lt;span class='accent-report'&gt;Report قوي&lt;/span&gt; يطلع &lt;span class='accent-dup'&gt;Duplicate&lt;/span&gt; أو &lt;span class='accent-info'&gt;Informative&lt;/span&gt; ونفس نوع الثغرة ممكن يتقيّم بشكل مختلف حسب الـImpact والـProgram ومفيش حد يقدر يضمن لك رقم أو توقيت." data-en="I will not sell you a guaranteed bounty because a &lt;span class='accent-report'&gt;strong report&lt;/span&gt; can still be &lt;span class='accent-dup'&gt;Duplicate&lt;/span&gt; or &lt;span class='accent-info'&gt;Informative&lt;/span&gt; and the same vulnerability class can be valued differently depending on impact and the program so nobody can guarantee a payout or timeline.">أنا مش هبيع لك وعد بباونتي لأن ممكن <span class="accent-report">Report قوي</span> يطلع <span class="accent-dup">Duplicate</span> أو <span class="accent-info">Informative</span> ونفس نوع الثغرة ممكن يتقيّم بشكل مختلف حسب الـImpact والـProgram ومفيش حد يقدر يضمن لك رقم أو توقيت.</p> <p class="i18n" data-ar="لو داخل عشان &lt;span class='accent-fast'&gt;نتيجة سريعة&lt;/span&gt; وهتوقف بعد رفض Report أو Duplicate فالكامب مش مناسب ليك لأن اللي هنقدر نبنيه فعلًا هو &lt;span class='accent-skill'&gt;Skill&lt;/span&gt; و&lt;span class='accent-methodology'&gt;Methodology&lt;/span&gt; وطريقة تفكير تقدر تكمل وتطور بيهم بعد الكامب." data-en="If you are joining only for a &lt;span class='accent-fast'&gt;quick result&lt;/span&gt; and will stop after a rejected report or duplicate then this camp is not for you because what we can actually build is &lt;span class='accent-skill'&gt;Skill&lt;/span&gt; &lt;span class='accent-methodology'&gt;Methodology&lt;/span&gt; and a way of thinking you can keep developing after the camp.">لو داخل عشان <span class="accent-fast">نتيجة سريعة</span> وهتوقف بعد رفض Report أو Duplicate فالكامب مش مناسب ليك لأن اللي هنقدر نبنيه فعلًا هو <span class="accent-skill">Skill</span> و<span class="accent-methodology">Methodology</span> وطريقة تفكير تقدر تكمل وتطور بيهم بعد الكامب.</p> </div> </div> </div> <div class="invest-box reveal tilt-card">'''
sub_once(
    r'<div class="personal-note reveal">.*?<div class="invest-box reveal tilt-card">',
    merged_note,
    'Interview + before-pay cards',
)

# FAQ: remove level question, keep payment as only "How do I pay?", and remove Live Hunting authorization question.
sub_once(
    r'<div class="faq-item"><button aria-expanded="false" class="faq-question" type="button"><span class="i18n" data-ar="الكامب مناسب لمين وإيه المستوى المطلوب".*?</div></div>',
    '',
    'FAQ level question',
)
replace_once(
    '<span class="i18n" data-ar="السعر كام وإمتى وإزاي بدفع" data-en="How much is it and when and how do I pay?">السعر كام وإمتى وإزاي بدفع</span>',
    '<span class="i18n" data-ar="إزاي أدفع" data-en="How do I pay?">إزاي أدفع</span>',
    'FAQ payment title',
)
sub_once(
    r'<div class="faq-answer i18n" data-ar="سعر أول دفعة أونلاين 4000 جنيه[^\"]*" data-en="Online Cohort 01 is 4000 EGP[^\"]*">.*?</div>',
    '<div class="faq-answer i18n" data-ar="بعد الانترفيو والقبول لو قررت تدخل تقدر تدفع عن طريق Vodafone Cash أو Orange Cash أو Instapay والقبول لوحده مش بيلزمك تدفع." data-en="After the interview and acceptance, if you decide to join, you can pay through Vodafone Cash, Orange Cash, or Instapay. Acceptance alone does not obligate you to pay.">بعد الانترفيو والقبول لو قررت تدخل تقدر تدفع عن طريق Vodafone Cash أو Orange Cash أو Instapay والقبول لوحده مش بيلزمك تدفع.</div>',
    'FAQ payment answer',
)
sub_once(
    r'<div class="faq-item"><button aria-expanded="false" class="faq-question" type="button"><span class="i18n" data-ar="هل الـLive Hunting مصرح به".*?</div></div>',
    '',
    'FAQ live hunting authorization',
)

path.write_text(text, encoding='utf-8')
print('Landing page patch applied successfully.')
