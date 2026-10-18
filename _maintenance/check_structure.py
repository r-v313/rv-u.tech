"""Check document invariants before publishing the camp website."""
from html.parser import HTMLParser
from pathlib import Path
import re

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False
        self.head_metadata = set()
        self.title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'head':
            self.in_head = True
        if self.in_head and tag == 'title':
            self.title = True
        if self.in_head and tag == 'meta':
            self.head_metadata.add(attrs.get('name', attrs.get('http-equiv', '')).lower())

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False

page = Path(__file__).resolve().parents[1] / 'index.html'
source = page.read_text(encoding='utf-8')
assert re.match(r'\s*<!doctype html>', source, re.I), 'HTML5 doctype must precede page content'
document = Document()
document.feed(source)
assert document.title, 'Page title must be inside head'
assert {'viewport', 'robots', 'content-security-policy'} <= document.head_metadata, 'Required metadata must be inside head'
print('PASS: HTML5 doctype, title, viewport, indexing metadata and CSP placement')
