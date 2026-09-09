from pathlib import Path

text = Path('index.html').read_text(encoding='utf-8')

expected = (
    'class="nav-linkedin"' in text
    and 'id="included-section"' not in text
    and 'data-ar="نظام الكامب"' in text
    and 'data-ar="إزاي أدفع"' in text
    and 'data-ar="هل الـLive Hunting مصرح به"' not in text
)

if not expected:
    raise RuntimeError('Expected patched landing-page state was not found.')

print('Landing page is already patched; nothing to do.')
