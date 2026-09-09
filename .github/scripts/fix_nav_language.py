from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

# Arabic navbar labels only.
replacements = {
    'data-ar="About" data-en="About"': 'data-ar="عني" data-en="About"',
    'data-ar="Curriculum" data-en="Curriculum"': 'data-ar="المنهج" data-en="Curriculum"',
    'data-ar="Schedule" data-en="Schedule"': 'data-ar="النظام" data-en="Schedule"',
    'data-ar="FAQ" data-en="FAQ"': 'data-ar="الأسئلة" data-en="FAQ"',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing navbar label anchor: {old}')
    text = text.replace(old, new, 1)

# Put the profile photo inside nav-actions as the last item.
# In RTL this naturally places it at the far left; in LTR at the far right.
pattern = re.compile(r'(<a class="nav-profile-link".*?</a>)(<div class="nav-actions">)(.*?)(</div> </div> </nav>)', re.S)
match = pattern.search(text)
if not match:
    raise SystemExit('Could not locate nav profile/actions block')
profile, actions_open, actions_inner, nav_close = match.groups()
replacement = actions_open + actions_inner.rstrip() + ' ' + profile + nav_close
text = text[:match.start()] + replacement + text[match.end():]

if text == original:
    raise SystemExit('No changes were made')

path.write_text(text, encoding='utf-8')
print('Navbar Arabic labels updated and profile moved into nav-actions.')
