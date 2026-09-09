from pathlib import Path
import re

index_path = Path("index.html")
css_path = Path("overrides.css")

html = index_path.read_text(encoding="utf-8")

# Remove the five-step APPLY / WHATSAPP / INTERVIEW / DECISION / PAYMENT block.
marker = '<div class="admission-flow">'
start = html.find(marker)
if start != -1:
    token_re = re.compile(r'<div\b[^>]*>|</div>')
    depth = 0
    end = None
    for match in token_re.finditer(html, start):
        token = match.group(0)
        if token.startswith("<div"):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                end = match.end()
                break
    if end is None:
        raise SystemExit("Could not locate the closing admission-flow div")
    html = html[:start] + html[end:]
    index_path.write_text(html, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
marker_css = "/* schedule-clean-curriculum-orange-v2 */"
patch = r'''

/* schedule-clean-curriculum-orange-v2 */
.schedule-box{padding:24px 28px!important}
.schedule-box .schedule-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px 22px!important}
.schedule-box .schedule-item{--sch-accent:#f97316;position:relative!important;min-height:0!important;padding:8px 22px 8px 4px!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;display:block!important;text-align:right!important;transform:none!important}
[dir="ltr"] .schedule-box .schedule-item{text-align:left!important;padding:8px 4px 8px 22px!important}
.schedule-box .schedule-item:hover{transform:none!important;border:0!important;background:none!important;box-shadow:none!important}
.schedule-box .schedule-item::before{content:"";position:absolute;top:50%;right:2px;width:8px;height:8px;border-radius:50%;background:var(--sch-accent);transform:translateY(-50%)}
[dir="ltr"] .schedule-box .schedule-item::before{right:auto;left:2px}
.schedule-box .schedule-item:nth-child(1){--sch-accent:#f97316}
.schedule-box .schedule-item:nth-child(2){--sch-accent:#60a5fa}
.schedule-box .schedule-item:nth-child(3){--sch-accent:#34d399}
.schedule-box .schedule-item:nth-child(4){--sch-accent:#fbbf24}
.schedule-box .schedule-item:nth-child(1)::before{box-shadow:0 0 12px rgba(249,115,22,.34)}
.schedule-box .schedule-item:nth-child(2)::before{box-shadow:0 0 12px rgba(96,165,250,.34)}
.schedule-box .schedule-item:nth-child(3)::before{box-shadow:0 0 12px rgba(52,211,153,.34)}
.schedule-box .schedule-item:nth-child(4)::before{box-shadow:0 0 12px rgba(251,191,36,.34)}
.schedule-box .sch-label{font-size:.68rem!important;line-height:1.35!important;color:var(--sch-accent)!important;margin:0 0 3px!important;font-weight:800!important;letter-spacing:.025em!important}
.schedule-box .sch-value{font-size:.9rem!important;line-height:1.45!important;color:#f3eee9!important;margin:0!important;font-weight:750!important}

#curriculum .week-block:not(.is-open){background:linear-gradient(145deg,#090705,#050505)!important;border-color:rgba(249,115,22,.22)!important;box-shadow:inset 0 0 28px rgba(249,115,22,.025)!important}
#curriculum .week-block:not(.is-open) .week-index{color:#ff8a1f!important;text-shadow:0 0 12px rgba(249,115,22,.24)!important}
#curriculum .week-block:not(.is-open) .week-topic{color:#ffb06a!important;text-shadow:0 0 14px rgba(249,115,22,.2)!important;font-weight:800!important}
#curriculum .week-block:not(.is-open) .outcome-session{background:linear-gradient(145deg,#090705,#030303)!important;border:1px solid rgba(249,115,22,.28)!important;box-shadow:inset 0 0 18px rgba(249,115,22,.035),0 0 12px rgba(249,115,22,.035)!important}
#curriculum .week-block:not(.is-open) .outcome-session h3{color:#ff9b4a!important;text-shadow:0 0 10px rgba(249,115,22,.2)!important;font-weight:800!important}
#curriculum .week-block:not(.is-open) .outcome-session:hover{border-color:rgba(249,115,22,.55)!important;box-shadow:inset 0 0 22px rgba(249,115,22,.06),0 0 18px rgba(249,115,22,.08)!important}
#curriculum .week-accordion-toggle{background:#070707!important;border-color:rgba(249,115,22,.46)!important;box-shadow:0 0 16px rgba(249,115,22,.12),inset 0 0 12px rgba(249,115,22,.035)!important}
#curriculum .week-accordion-toggle:hover{background:#0a0705!important;border-color:#f97316!important;box-shadow:0 0 24px rgba(249,115,22,.2),inset 0 0 14px rgba(249,115,22,.06)!important}

@media(max-width:900px){
  .schedule-box .schedule-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:11px 18px!important}
}
@media(max-width:620px){
  .schedule-box{padding:20px 15px!important}
  .schedule-box .schedule-grid{grid-template-columns:1fr!important;gap:6px!important}
  .schedule-box .schedule-item{padding:7px 20px 7px 2px!important}
  [dir="ltr"] .schedule-box .schedule-item{padding:7px 2px 7px 20px!important}
  .schedule-box .sch-label{font-size:.65rem!important}
  .schedule-box .sch-value{font-size:.84rem!important}
}
'''

if marker_css not in css:
    css_path.write_text(css + patch, encoding="utf-8")
