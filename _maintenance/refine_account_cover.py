#!/usr/bin/env python3
"""Rework the account lesson's cover from the original, preserving the real portrait."""
from pathlib import Path
import subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

root=Path(__file__).resolve().parents[1]
source=root/'assets/rvu-video-solving-labs.webp'
destination=root/'assets/rvu-video-account-methodology.webp'
im=Image.open(source).convert('RGB').resize((1672,941),Image.Resampling.LANCZOS)
w,h=im.size
arr=np.array(im)

# Target only the old orange first-line lettering; not the white second line.
hsv=cv2.cvtColor(arr,cv2.COLOR_RGB2HSV)
mask=np.zeros((h,w),dtype=np.uint8)
roi=hsv[135:266,550:1230]
mask[135:266,550:1230]=(((roi[:,:,0]<26)&(roi[:,:,1]>79)&(roi[:,:,2]>70)).astype(np.uint8)*255)
mask=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
arr=cv2.inpaint(arr,mask,5,cv2.INPAINT_TELEA)
base=Image.fromarray(arr).convert('RGBA')

# Move the upper-left ghosted scope panel: matte only the scenery behind the
# real model, feathering around the left edge of hair. No portrait retouching.
back=Image.new('RGBA',(w,h))
backpx=back.load()
backalpha=Image.new('L',(w,h),0)
alpha=backalpha.load()
checkpoints=[(0,482),(64,482),(84,285),(115,243),(170,240),(260,235)]
for y in range(0,260):
    for x in range(0,510):
        right=235
        for j in range(len(checkpoints)-1):
            (ya,xa),(yb,xb)=checkpoints[j],checkpoints[j+1]
            if ya<=y<=yb:
                right=xa+(xb-xa)*(y-ya)/max(1,yb-ya)
                break
        xf=min(1,max(0,(right-x)/16))
        yf=min(1,max(0,(256-y)/34))
        a=int(255*(xf*xf*(3-2*xf))*(yf*yf*(3-2*yf)))
        if not a: continue
        glow=np.exp(-((x+60)/340)**2-((y-267)/245)**2)
        top=np.exp(-((x+120)/480)**2-((y-35)/200)**2)
        backpx[x,y]=(int(8+30*glow+8*top),int(8+13*glow),int(10+5*glow),255)
        alpha[x,y]=a
base.paste(back,(0,0),backalpha)

# Smooth dark section replaces residual upper title glow, preserving browser UI.
mat=Image.new('RGBA',(w,h))
matpx=mat.load()
matalpha=Image.new('L',(w,h),0)
ma=matalpha.load()
for y in range(111,267):
    for x in range(526,1155):
        xl=min(1,max(0,(x-526)/32))
        xr=min(1,max(0,(1155-x)/35))
        yt=min(1,max(0,(y-111)/25))
        yb=min(1,max(0,(267-y)/11))
        a=int(255*xl*xr*yt*yb)
        if not a: continue
        glow=np.exp(-((x-900)/500)**2-((y-160)/240)**2)
        matpx[x,y]=(int(7+4*glow),int(8+3*glow),int(10+2*glow),255)
        ma[x,y]=a
base.paste(mat,(0,0),matalpha)

# Render Account over the exact first-line title location in warm bronze/orange.
canvas=base.convert('RGBA')
def font_match(family):
    """Portable font discovery for Ubuntu CI and local workstations."""
    return subprocess.check_output(
        ['fc-match','-f','%{file}',family], text=True).strip()
font=font_match('Inter Display:style=Black')
fb=font_match('Inter:style=SemiBold')
fm=font_match('Inter:style=Medium')
big=ImageFont.truetype(font,115)
letters=Image.new('L',(w,h),0)
ImageDraw.Draw(letters).text((565,148),'Account',font=big,fill=255,anchor='lt')
grad=np.zeros((h,w,4),dtype=np.uint8)
for y in range(141,258):
    t=np.clip((y-145)/112,0,1)
    grad[y,:,0]=255
    grad[y,:,1]=int(192-93*t)
    grad[y,:,2]=int(72-65*t)
    grad[y,:,3]=255
g=Image.fromarray(grad,'RGBA')
halo=letters.filter(ImageFilter.GaussianBlur(7))
glow=Image.new('RGBA',(w,h),(240,103,19,0))
glow.putalpha(halo.point(lambda x:int(x*.31)))
canvas.alpha_composite(glow)
canvas.paste(g,(0,0),letters)

# The relocated compact account window sits below the shoulder, above signature.
panel=(43,535,368,693)
shadow=Image.new('RGBA',(w,h))
ImageDraw.Draw(shadow).rounded_rectangle(
    (panel[0]+4,panel[1]+7,panel[2]+4,panel[3]+7),
    radius=16,fill=(0,0,0,180))
canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
card=Image.new('RGBA',(w,h))
d=ImageDraw.Draw(card)
d.rounded_rectangle(panel,radius=15,fill=(10,13,17,225),
                    outline=(194,101,34,172),width=2)
d.rounded_rectangle((56,547,355,589),radius=9,fill=(28,26,24,210))
for color,cx in [((255,102,78,255),69),((248,168,54,255),86),((43,199,125,255),103)]:
    d.ellipse((cx,562,cx+9,571),fill=color)
d.text((124,558),'ACCOUNT  /  TESTING',
       font=ImageFont.truetype(fb,19),fill='#f8a146')
d.line((63,605,348,605),fill=(136,96,49,180),width=1)
small=ImageFont.truetype(fm,15)
d.text((65,617),'Sessions     •     Recovery',font=small,fill='#e0e3e7')
d.text((65,649),'Access control  •  Identity',font=small,fill='#b4bbc4')
canvas.alpha_composite(card)

# 1440px is enough to retain sharp type and the photographed facial detail.
cover=canvas.convert('RGB').resize((1440,810),Image.Resampling.LANCZOS)
cover.save(destination,'WEBP',quality=87,method=6)
assert destination.stat().st_size<140000, 'Optimized image exceeds budget'
with Image.open(destination) as check:
    assert check.size==(1440,810)
    check.verify()

# Switch only the Account Testing video, without changing IDs or other posters.
index=root/'index.html'
html=index.read_text(encoding='utf-8')
old='./assets/rvu-video-solving-labs.webp?v=20261023-swapped'
new='./assets/rvu-video-account-methodology.webp?v=20261023-account-edit'
if old in html:
    assert html.count(old)==1, 'Expected one original Account Testing poster'
    pos=html.index(old)
    assert 'FDWt0pSoFTA' in html[max(0,pos-600):pos]
    html=html.replace(old,new,1)
    index.write_text(html,encoding='utf-8')
else:
    assert html.count(new)==1, 'Edited Account Testing poster reference missing'

# Keep the existing full site QA assertion aligned with the new asset.
verify=root/'_maintenance/verify.cjs'
tests=verify.read_text(encoding='utf-8')
before="const posterPaths=['api','jwt','account-testing','solving-labs'];"
after="const posterPaths=['api','jwt','account-testing','account-methodology'];"
if before in tests:
    assert tests.count(before)==1, 'Poster test list changed'
    verify.write_text(tests.replace(before,after,1),encoding='utf-8')
else:
    assert tests.count(after)==1, 'Edited poster regression check missing'
print('PASS: Account Methodology poster edited, linked and regression-tested')
print('Image bytes:',destination.stat().st_size)
