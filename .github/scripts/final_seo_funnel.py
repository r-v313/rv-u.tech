from pathlib import Path
import base64
import hashlib
import json

html_path=Path('index.html')
js_path=Path('app.js')
html=html_path.read_text(encoding='utf-8')
js=js_path.read_text(encoding='utf-8')

clarity_loader="window.RVU_CLARITY_PROJECT_ID='ydzz6gt587';window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments);};(function(){const s=document.createElement('script');s.async=true;s.src='https://www.clarity.ms/tag/'+window.RVU_CLARITY_PROJECT_ID;s.referrerPolicy='no-referrer';document.head.appendChild(s);})();"
if js.count(clarity_loader)!=1:
    raise SystemExit('Expected Clarity loader not found exactly once')
if "https://www.clarity.ms" not in html or "https://scripts.clarity.ms" not in html:
    raise SystemExit('Clarity CSP allowlist missing')

# 1) Intro: 10s -> 6s, with the visual timeline scaled to the new duration.
replacements={
    'const introDuration=10000;':'const introDuration=6000;',
    "const stages=[{at:0,cls:'stage-boot',phase:'INITIALIZING',index:'01'},{at:1250,cls:'stage-map',phase:'MAPPING ATTACK SURFACE',index:'02'},{at:2550,cls:'stage-scan',phase:'SCANNING NODES',index:'03'},{at:4150,cls:'stage-lock',phase:'TARGET ACQUIRED',index:'04'},{at:5550,cls:'stage-analyze',phase:'ANALYZING SURFACE',index:'05'},{at:6900,cls:'stage-collapse',phase:'CONVERGING SIGNAL',index:'06'},{at:7750,cls:'stage-brand',phase:'RV_U',index:'07'},{at:9250,cls:'stage-outro',phase:'ENTER',index:'08'}];":
    "const stages=[{at:0,cls:'stage-boot',phase:'INITIALIZING',index:'01'},{at:750,cls:'stage-map',phase:'MAPPING ATTACK SURFACE',index:'02'},{at:1530,cls:'stage-scan',phase:'SCANNING NODES',index:'03'},{at:2490,cls:'stage-lock',phase:'TARGET ACQUIRED',index:'04'},{at:3330,cls:'stage-analyze',phase:'ANALYZING SURFACE',index:'05'},{at:4140,cls:'stage-collapse',phase:'CONVERGING SIGNAL',index:'06'},{at:4650,cls:'stage-brand',phase:'RV_U',index:'07'},{at:5550,cls:'stage-outro',phase:'ENTER',index:'08'}];",
    "(1-Math.max(0,(t-7.2)/2.0))":"(1-Math.max(0,(t-4.32)/1.2))",
    "const mapIn=smoothstep(1.15,2.45,seconds);const scanIn=smoothstep(2.35,3.35,seconds);const lockIn=smoothstep(3.95,4.7,seconds);const analyzeIn=smoothstep(5.25,5.9,seconds);const collapse=smoothstep(6.78,7.68,seconds);const networkAlpha=mapIn*(1-smoothstep(7.35,7.95,seconds));":
    "const mapIn=smoothstep(.69,1.47,seconds);const scanIn=smoothstep(1.41,2.01,seconds);const lockIn=smoothstep(2.37,2.82,seconds);const analyzeIn=smoothstep(3.15,3.54,seconds);const collapse=smoothstep(4.068,4.608,seconds);const networkAlpha=mapIn*(1-smoothstep(4.41,4.77,seconds));"
}
for old,new in replacements.items():
    if js.count(old)!=1:
        raise SystemExit(f'Intro anchor mismatch: {old[:80]}')
    js=js.replace(old,new,1)

# 2) Clarity funnel tracking. Keep the existing loader/settings byte-for-byte intact.
tracker="function rvuTrackClarity(eventName){if(typeof window.clarity==='function')window.clarity('event',eventName);}"
if tracker not in js:
    js=js.replace(clarity_loader,clarity_loader+tracker,1)

apply_anchor="document.querySelectorAll('[data-open-application]').forEach(btn=>{btn.addEventListener('click',function(e){e.preventDefault();openApplication('standard');});});"
apply_new="document.querySelectorAll('[data-open-application]').forEach(btn=>{btn.addEventListener('click',function(e){e.preventDefault();rvuTrackClarity('Apply_Click');openApplication('standard');});});"
if js.count(apply_anchor)!=1:
    raise SystemExit('Apply-click anchor mismatch')
js=js.replace(apply_anchor,apply_new,1)

mobile_anchor="if(mobileApplyButton){mobileApplyButton.addEventListener('click',function(e){e.preventDefault();openApplication('curtain');});}"
mobile_new="if(mobileApplyButton){mobileApplyButton.addEventListener('click',function(e){e.preventDefault();rvuTrackClarity('Apply_Click');openApplication('curtain');});}"
if js.count(mobile_anchor)!=1:
    raise SystemExit('Mobile apply anchor mismatch')
js=js.replace(mobile_anchor,mobile_new,1)

form_anchor="const isAr=window.RVU_LANG==='ar';const messageAr="
if js.count(form_anchor)!=1:
    raise SystemExit('Form-complete anchor mismatch')
js=js.replace(form_anchor,"const isAr=window.RVU_LANG==='ar';rvuTrackClarity('Application_Form_Complete');const messageAr=",1)

wa_anchor="if(editBtn){editBtn.addEventListener('click',function(){"
if js.count(wa_anchor)!=1:
    raise SystemExit('WhatsApp tracking anchor mismatch')
js=js.replace(wa_anchor,"if(waLink){waLink.addEventListener('click',()=>rvuTrackClarity('WhatsApp_Click'));}"+wa_anchor,1)

# 3) Course + Person JSON-LD.
structured={
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"Person",
      "@id":"https://rv-u.tech/#ramez-medhat",
      "name":"Ramez Medhat",
      "url":"https://rv-u.tech/",
      "sameAs":["https://www.linkedin.com/in/ramez-medhat-rvu/"],
      "jobTitle":"Bug Bounty Security Researcher"
    },
    {
      "@type":"Course",
      "@id":"https://rv-u.tech/#rvu-camp",
      "name":"rv_u camp — Bug Bounty Mentorship Camp",
      "description":"A 6-week live bug bounty mentorship focused on methodology, recon, authorization, APIs, business logic, automation, reporting and authorized live hunting.",
      "url":"https://rv-u.tech/",
      "provider":{"@id":"https://rv-u.tech/#ramez-medhat"},
      "inLanguage":["ar","en"],
      "timeRequired":"P6W",
      "offers":{
        "@type":"Offer",
        "price":"4000",
        "priceCurrency":"EGP",
        "url":"https://rv-u.tech/"
      },
      "hasCourseInstance":{
        "@type":"CourseInstance",
        "courseMode":"Online"
      }
    }
  ]
}
jsonld=json.dumps(structured,ensure_ascii=False,separators=(',',':'))
script_tag='<script type="application/ld+json">'+jsonld+'</script>'
if '"@id":"https://rv-u.tech/#rvu-camp"' not in html:
    if html.count('</head>')!=1:
        raise SystemExit('head close anchor mismatch')
    html=html.replace('</head>',script_tag+'</head>',1)

# Add only the exact CSP hash needed for this JSON-LD block.
hash_value=base64.b64encode(hashlib.sha256(jsonld.encode('utf-8')).digest()).decode('ascii')
hash_token="'sha256-"+hash_value+"'"
script_src="script-src 'self' https://www.clarity.ms https://scripts.clarity.ms;"
script_elem="script-src-elem 'self' https://www.clarity.ms https://scripts.clarity.ms;"
if hash_token not in html:
    if html.count(script_src)!=1 or html.count(script_elem)!=1:
        raise SystemExit('CSP script directives changed unexpectedly')
    html=html.replace(script_src,"script-src 'self' "+hash_token+" https://www.clarity.ms https://scripts.clarity.ms;",1)
    html=html.replace(script_elem,"script-src-elem 'self' "+hash_token+" https://www.clarity.ms https://scripts.clarity.ms;",1)

# Production invariants.
if js.count(clarity_loader)!=1:
    raise SystemExit('Clarity loader changed')
if "window.RVU_CLARITY_PROJECT_ID='ydzz6gt587'" not in js:
    raise SystemExit('Clarity project ID changed')
for event in ('Apply_Click','Application_Form_Complete','WhatsApp_Click'):
    if event not in js:
        raise SystemExit(f'Missing Clarity event {event}')
if 'const introDuration=6000;' not in js:
    raise SystemExit('Intro is not 6 seconds')
if script_tag not in html:
    raise SystemExit('JSON-LD missing')
if hash_token not in html:
    raise SystemExit('JSON-LD CSP hash missing')

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
Path('robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://rv-u.tech/sitemap.xml\n',encoding='utf-8')
print('SEO, 6-second intro, robots and Clarity funnel instrumentation completed.')
print('Clarity project ID preserved: ydzz6gt587')
print('JSON-LD CSP hash:',hash_token)
