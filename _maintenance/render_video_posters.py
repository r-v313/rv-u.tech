#!/usr/bin/env python3
"""Generate four authentic, lightweight RVU video posters from the original instructor photo.

Unlike generated portraits, this uses the site's actual photographed source;
the illustrations are original vector-like Pillow drawings.  Output is WebP.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import math

ROOT = Path(__file__).resolve().parents[1]
PHOTO = ROOT / 'assets/ramez-medhat.webp'
OUT = ROOT / 'assets'
W,H=960,540
IVORY='#f6eee4'
MUTED='#aeb0b5'
ORANGE='#ff8a2e'
EDGE='#48301f'
FONT_REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
VIDEOS=[
    dict(slug='api',heading='How API Works?',subtitle='CLIENT  /  REQUEST  /  API  /  RESPONSE',
         eyebrow='01 / HTTP & API FUNDAMENTALS',kind='api'),
    dict(slug='jwt',heading='What is JWT?',subtitle='HEADER  /  PAYLOAD  /  SIGNATURE',
         eyebrow='02 / AUTHENTICATION & TOKENS',kind='jwt'),
    dict(slug='solving-labs',heading='Solving Labs',subtitle='PRICE  /  QUANTITY  /  COUPONS',
         eyebrow='03 / BUSINESS LOGIC PRACTICE',kind='labs'),
    dict(slug='account-testing',heading='Account Testing',subtitle='SESSIONS  /  ACCESS  /  RECOVERY',
         eyebrow='04 / ACCOUNT SECURITY TESTING',kind='account'),
]

def font(size,bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG,size)

def rect(d,xy,fill='#141516',outline=EDGE,radius=14,width=2):
    d.rounded_rectangle(xy,radius=radius,fill=fill,outline=outline,width=width)

def text(d,xy,t,size=20,color=IVORY,bold=False):
    d.text(xy,t,font=font(size,bold),fill=color,stroke_width=0)

def pill(d,xy,t,clr=ORANGE):
    x,y=xy
    tw=d.textbbox((0,0),t,font=font(14,True))[2]
    rect(d,(x,y,x+tw+25,y+31),fill='#21170f',outline='#7d4722',radius=15,width=1)
    text(d,(x+12,y+6),t,14,clr,True)
    return x+tw+34

def arrow(d,x1,y,x2,color=ORANGE):
    d.line((x1,y,x2,y),fill=color,width=4)
    d.polygon([(x2,y),(x2-11,y-8),(x2-11,y+8)],fill=color)

def panel(d,x,y,w,h,label,lines=()):
    rect(d,(x,y,x+w,y+h),fill='#111318',outline='#634021',radius=12,width=2)
    d.rounded_rectangle((x+9,y+9,x+w-9,y+41),radius=6,fill='#1d1f24')
    text(d,(x+19,y+14),label,17,ORANGE,True)
    for i,line in enumerate(lines):
        text(d,(x+18,y+57+i*29),line,15,MUTED)

def vignette():
    im=Image.new('RGB',(W,H))
    pix=im.load()
    for y in range(H):
        for x in range(W):
            glow=math.exp(-((x-170)**2/(210**2)+(y-205)**2/(245**2)))
            r=int(8+25*glow+5*(y/H))
            g=int(10+8*glow+3*(y/H))
            b=int(14+3*(y/H))
            pix[x,y]=(r,g,b)
    return im

def portrait(im):
    with Image.open(PHOTO) as src:
        original=ImageOps.exif_transpose(src).convert('RGB')
        # Preserve the user's REAL portrait instead of an imagined face.
        port=ImageOps.fit(original,(368,472),method=Image.Resampling.LANCZOS,centering=(.5,.38))
    # Gentle neutral grading so photo blends with the luxury black/bronze palette.
    overlay=Image.new('RGB',port.size,(18,12,10))
    port=Image.blend(port,overlay,0.12)
    mask=Image.new('L',port.size)
    mp=mask.load()
    for y in range(port.height):
        for x in range(port.width):
            lr=min(1,max(0,(port.width-x)/132))
            bt=min(1,max(0,(port.height-y)/118))
            top=min(1,max(0,y/38))
            mp[x,y]=int(255*lr*bt*top*.97)
    im.paste(port,(0,66),mask)
    # horizontal warm accent framing (behind lower lesson content)
    draw=ImageDraw.Draw(im)
    draw.line((20,495,340,495),fill='#b86728',width=3)

def draw_diagram(d,kind):
    if kind=='api':
        panel(d,377,269,139,171,'CLIENT',['Web browser','GET /api','Headers'])
        panel(d,551,269,144,171,'API SERVER',['Verify','Process','Respond'])
        panel(d,728,269,202,171,'DATABASE',['Find records','JSON response','200 OK'])
        arrow(d,518,356,545)
        arrow(d,700,356,721)
    elif kind=='jwt':
        panel(d,377,269,168,174,'HEADER',['alg: HS256','typ: JWT'])
        panel(d,558,269,169,174,'PAYLOAD',['sub: user123','role: user'])
        panel(d,740,269,189,174,'SIGNATURE',['HMAC SHA-256','Verify integrity'])
        d.line((546,358,556,358),fill=ORANGE,width=4)
        d.line((728,358,738,358),fill=ORANGE,width=4)
    elif kind=='labs':
        panel(d,377,265,266,185,'E-COMMERCE LAB',['Product: 2,200 EGP','Test: client-side price','Verify server result'])
        panel(d,658,265,270,185,'LOGIC INVARIANTS',['Negative quantity?','Coupon reused?','Persistent impact?'])
        d.line((635,359,658,359),fill=ORANGE,width=4)
        d.ellipse((638,352,651,365),fill=ORANGE)
    else:
        panel(d,377,265,267,185,'TWO TEST ACCOUNTS',['Account A  /  Account B','Session & token checks','Role and object access'])
        panel(d,659,265,269,185,'TRUST BOUNDARIES',['Password reset flows','IDOR / authorization','Cache & session leaks'])
        arrow(d,646,360,656)

def render(info):
    im=vignette()
    d=ImageDraw.Draw(im)
    # Quiet editorial grid: an expensive real photo plus accurate hand-drawn topic diagrams.
    for x in range(380,948,40):
        d.line((x,248,x,467),fill='#19191c',width=1)
    for y in range(248,467,40):
        d.line((374,y,941,y),fill='#19191c',width=1)
    portrait(im)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((366,24,948,510),radius=18,outline='#332b27',width=2)
    text(d,(379,43),'RVU  /  MENTORSHIP CAMP',21,ORANGE,True)
    d.line((379,78,933,78),fill='#77502c',width=2)
    text(d,(379,93),info['eyebrow'],15,MUTED,True)
    # Adaptive precise title size; avoid line breaks or text overflow.
    heading=info['heading']
    size=66
    while d.textbbox((0,0),heading,font=font(size,True))[2]>555:
        size-=2
    text(d,(375,129),heading,size,IVORY,True)
    d.rounded_rectangle((380,221,924,225),radius=2,fill=ORANGE)
    text(d,(380,243),info['subtitle'],16,ORANGE,True)
    draw_diagram(d,info['kind'])
    text(d,(30,461),'RAMEZ MEDHAT',17,IVORY,True)
    text(d,(30,506),'RV-U.TECH  /  WATCH THE LESSON',13,ORANGE,True)
    filename=OUT/f"rvu-video-{info['slug']}.webp"
    im.save(filename,'WEBP',quality=84,method=6)
    with Image.open(filename) as chk:
        chk.verify()
    assert filename.stat().st_size<140000, (filename,filename.stat().st_size)
    print(f'{filename.name}: {filename.stat().st_size:,} bytes')

if __name__=='__main__':
    if not PHOTO.exists():
        raise SystemExit('Missing real original mentor portrait: '+str(PHOTO))
    for video in VIDEOS:
        render(video)
