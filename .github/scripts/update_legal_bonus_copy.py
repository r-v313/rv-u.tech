from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
old = ' ونربطه بالـScope والـProgram Rules والتصريح والـResponsible Disclosure والـSafe Harbor'
count = text.count(old)
if count != 2:
    raise SystemExit(f'Expected exactly 2 legal-copy occurrences, found {count}')
text = text.replace(old, '', 2)
path.write_text(text, encoding='utf-8')
print('Updated Arabic legal bonus paragraph only.')
