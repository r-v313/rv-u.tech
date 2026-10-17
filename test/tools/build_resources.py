from pathlib import Path
from fpdf import FPDF
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont
import re,json
root=Path(__file__).resolve().parents[1]
fonts=Path('/usr/share/fonts/truetype/dejavu')
class Kit(FPDF):
    cover=True
    arabic=False
    def header(self):
        self.set_fill_color(249,247,240);self.rect(0,0,210,297,'F')
        if self.cover:return
        self.set_fill_color(17,19,22);self.rect(0,0,210,23,'F')
        self.set_draw_color(231,162,39);self.set_line_width(.7);self.line(18,23,192,23)
        self.set_font('RVU','B',9);self.set_text_shaping(False);self.set_text_color(247,209,132)
        self.set_xy(18,8);self.cell(174,7,'RVU CAMP / FIELD NOTES',align='L')
        self.set_y(32)
    def footer(self):
        self.set_y(-15);self.set_text_shaping(False);self.set_font('RVU','',8)
        self.set_text_color(149,135,110) if self.cover else self.set_text_color(104,100,92)
        self.cell(0,7,f'By Ramez Medhat  |  rv-u.tech  |  {self.page_no()}',align='C')

pdf=Kit(format='A4');pdf.set_margins(18,20,18);pdf.set_auto_page_break(True,22)
pdf.add_font('RVU','',str(fonts/'DejaVuSans.ttf'));pdf.add_font('RVU','B',str(fonts/'DejaVuSans-Bold.ttf'))
pdf.set_title('RVU Field Kit - Arabic and English');pdf.set_author('Ramez Medhat');pdf.set_subject('Report writing, target understanding and camp preparation')
pdf.add_page();pdf.set_fill_color(13,15,18);pdf.rect(0,0,210,297,'F');pdf.set_draw_color(234,174,58);pdf.set_line_width(.5);pdf.rect(13,13,184,268)
pdf.set_text_color(243,190,77);pdf.set_font('RVU','B',11);pdf.set_xy(23,29);pdf.cell(0,9,'RVU MENTORSHIP CAMP')
pdf.set_text_color(255,246,227);pdf.set_font('RVU','B',33);pdf.set_xy(23,53);pdf.multi_cell(165,17,'THE FIELD\nKIT',new_x='LMARGIN',new_y='NEXT')
pdf.set_text_shaping(True,direction='rtl');pdf.set_font('RVU','B',20);pdf.set_xy(23,101);pdf.multi_cell(164,12,'بداية أوضح وشغل مرتب',align='R',new_x='LMARGIN',new_y='NEXT')
pdf.set_font('RVU','',11);pdf.set_text_color(209,200,179);pdf.set_xy(23,123);pdf.multi_cell(164,7,'قالب تقرير وقائمة لفهم التطبيق وتجهيزك قبل الكامب\nموارد تعليمية بالعربي والإنجليزي',align='R',new_x='LMARGIN',new_y='NEXT')
pdf.set_draw_color(133,100,45);pdf.line(23,147,187,147)
guide_titles={'report-template':('قالب تقرير أمني','Security report guide'),'recon-checklist':('قائمة فهم الـTarget','Target understanding checklist'),'camp-preparation':('تجهيزك قبل الكامب','Before the camp')}
destinations={};cover_links={}
for lang,y in [('ar',159),('en',214)]:
    pdf.set_xy(23,y);pdf.set_font('RVU','B',10);pdf.set_text_shaping(False);pdf.set_text_color(243,190,77);pdf.cell(164,7,'ARABIC' if lang=='ar' else 'ENGLISH',align='R' if lang=='ar' else 'L')
    for n,(key,titles) in enumerate(guide_titles.items()):
        link=pdf.add_link();cover_links[(key,lang)]=link
        pdf.set_xy(23,y+10+n*10);pdf.set_font('RVU','',11);pdf.set_text_color(238,227,205);pdf.set_text_shaping(True,direction='rtl' if lang=='ar' else 'ltr')
        pdf.cell(164,8,titles[0 if lang=='ar' else 1],align='R' if lang=='ar' else 'L',link=link)

for lang in ['ar','en']:
    for key,titles in guide_titles.items():
        pdf.cover=False;pdf.arabic=lang=='ar';pdf.add_page()
        page=pdf.page_no();destinations.setdefault(key,{})[lang]=page;pdf.set_link(cover_links[(key,lang)],page=page)
        title=titles[0 if lang=='ar' else 1];pdf.start_section(title,level=0)
        pdf.set_text_shaping(True,direction='rtl' if lang=='ar' else 'ltr');pdf.set_font('RVU','B',19);pdf.set_text_color(35,39,43)
        pdf.multi_cell(pdf.epw,10,title,align='R' if lang=='ar' else 'L',new_x='LMARGIN',new_y='NEXT');pdf.ln(4)
        source=(root/'resources'/f'{key}-{lang}.md').read_text().splitlines()
        for line in source:
            line=line.strip()
            if line.startswith('# ') or line.startswith('By'):continue
            if not line:pdf.ln(1.5);continue
            heading=line.startswith('## ')
            text=line.removeprefix('## ').replace('- [ ]','☐').removeprefix('- ')
            pdf.set_text_shaping(True,direction='rtl' if lang=='ar' else 'ltr')
            pdf.set_font('RVU','B' if heading else '',12 if heading else 10.5)
            pdf.set_text_color(141,88,22) if heading else pdf.set_text_color(44,47,51)
            if heading:pdf.ln(2)
            pdf.multi_cell(pdf.epw,5.5 if lang=='ar' else 5.0,text,align='R' if lang=='ar' else 'L',new_x='LMARGIN',new_y='NEXT')
            if heading:pdf.ln(1)
output=root/'resources/RVU_Field_Kit_AR_EN.pdf';pdf.output(output)
(root/'resources/pdf-pages.json').write_text(json.dumps(destinations))
s=BeautifulSoup((root/'index.html').read_text(),'html.parser')
for link in s.select('[data-pdf-guide]'):
    key=link['data-pdf-guide'];link['data-page-ar']=str(destinations[key]['ar']);link['data-page-en']=str(destinations[key]['en']);link['href']='./resources/RVU_Field_Kit_AR_EN.pdf#page='+str(destinations[key]['ar'])
(root/'index.html').write_text(str(s))
print(json.dumps({'pdf':str(output),'pages':pdf.page_no(),'bytes':output.stat().st_size,'destinations':destinations}))

# A precise social sharing graphic using the website's real typography and facts.
image=Image.new('RGB',(1200,630),'#0b0d10');draw=ImageDraw.Draw(image)
regular=str(fonts/'DejaVuSans.ttf');bold=str(fonts/'DejaVuSans-Bold.ttf')
for x in range(0,1200,60):draw.line((x,0,x,630),fill='#15181b',width=1)
draw.rounded_rectangle((44,40,1156,590),radius=14,fill='#111416',outline='#9d7229',width=2)
draw.line((82,105,230,105),fill='#ff7a1a',width=5)
draw.text((82,66),'RVU MENTORSHIP CAMP',font=ImageFont.truetype(bold,24),fill='#f3bd50')
draw.text((1115,166),'الدفعة الثانية أونلاين',font=ImageFont.truetype(regular,29),fill='#ffbe50',anchor='ra',direction='rtl')
draw.text((1115,220),'افهم الـTarget',font=ImageFont.truetype(bold,66),fill='#fff1d7',anchor='ra',direction='rtl')
draw.text((1115,310),'وابن طريقتك',font=ImageFont.truetype(bold,65),fill='#ffc044',anchor='ra',direction='rtl')
draw.text((1115,418),'6 أسابيع   |   12 سيشن مباشر   |   متابعة 1:1',font=ImageFont.truetype(regular,25),fill='#d8cfbd',anchor='ra',direction='rtl')
draw.line((82,484,1115,484),fill='#6c5129',width=1)
import os
signature=Path(os.environ.get('RVU_SIGNATURE_FONT', str(fonts/'DejaVuSans-Oblique.ttf')))
draw.text((82,510),'Ramez Medhat',font=ImageFont.truetype(str(signature) if signature.exists() else regular,48),fill='#f7c66a')
draw.text((1115,527),'rv-u.tech',font=ImageFont.truetype(regular,24),fill='#e4d9c5',anchor='ra')
image.save(root/'assets/og-cohort-02.png',optimize=True)
print('Social sharing image created')
