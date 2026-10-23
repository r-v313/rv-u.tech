#!/usr/bin/env python3
"""Polish the account video cover without changing the mentor's real appearance.

Removes the redundant left account box, reconstructs the original photographed
shirt, and relocates the Target information panel to beneath the shoulder.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
destination = root / "assets/rvu-video-account-methodology.webp"
original = root / "assets/rvu-video-solving-labs.webp"
html_file = root / "index.html"
verify_file = root / "_maintenance/verify.cjs"
old_url = "./assets/rvu-video-account-methodology.webp?v=20261023-account-edit"
new_url = "./assets/rvu-video-account-methodology.webp?v=20261023-account-clean"
index = html_file.read_text(encoding="utf-8")
if new_url in index:
    assert destination.exists() and "account-methodology" in verify_file.read_text()
    print("Account cover already finalized; preserving approved artwork.")
    raise SystemExit(0)
assert index.count(old_url) == 1, "Account Testing cover reference changed"
at = index.index(old_url)
assert "FDWt0pSoFTA" in index[max(0, at - 800):at], "Unexpected video card"

W, H = 1672, 941
cover = Image.open(destination).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
clean_original = Image.open(original).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)

# A photographic restoration, not generative face replacement: use the same
# source image beneath the extra ACCOUNT / TESTING card.
mask = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(mask)
d.rectangle((20, 493, 403, 711), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2))
cover.paste(clean_original, (0, 0), mask)

# Remove the oversized Target panel from beside the shoulder.
pixels = np.asarray(cover).copy()
erase = np.zeros((H, W), dtype=np.uint8)
cv2.rectangle(erase, (499, 420), (684, 714), 255, -1)
pixels = cv2.inpaint(pixels, erase, 9, cv2.INPAINT_TELEA)
canvas = Image.fromarray(pixels).convert("RGBA")

# Build intentional charcoal negative space with a feathered perimeter.
dark = Image.new("RGBA", (W, H), (8, 9, 12, 255))
fade = Image.new("L", (W, H), 0)
ImageDraw.Draw(fade).rectangle((508, 414, 693, 727), fill=255)
canvas.paste(dark, (0, 0), fade.filter(ImageFilter.GaussianBlur(12)))

# Compact target panel is entirely beneath the shoulder, directly above the
# signature, and does not cover any facial feature.
panel = (502, 576, 682, 700)
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((498, 573, 688, 708),
                                         radius=14, fill=(0, 0, 0, 145))
canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(11)))
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
d.rounded_rectangle(panel, radius=12, fill=(13, 16, 21, 240),
                    outline=(201, 117, 40, 195), width=2)
d.rounded_rectangle((508, 583, 675, 610), radius=6, fill=(25, 27, 31, 246))
for px, color in [(518, (255, 92, 73, 255)),
                  (532, (254, 190, 54, 255)),
                  (546, (38, 185, 117, 255))]:
    d.ellipse((px, 592, px + 7, 599), fill=color)

def font(size, bold=False):
    family = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(family, size)

d.text((565, 588), "TARGET", font=font(15, True), fill="#FFAA55")
d.text((519, 617), "example.com", font=font(15, True), fill="#F2ECE4")
d.line((519, 642, 663, 642), fill=(130, 84, 40, 160), width=1)
d.text((520, 651), "IN SCOPE", font=font(13, True), fill="#41C585")
d.text((520, 673), "Scan  /  Test", font=font(13), fill="#C8CCD3")
result = Image.alpha_composite(canvas, layer).convert("RGB")
result = result.resize((1440, 810), Image.Resampling.LANCZOS)
result.save(destination, "WEBP", quality=87, method=6)
assert destination.stat().st_size < 140000, "Image exceeds mobile data budget"
with Image.open(destination) as test:
    assert test.size == (1440, 810)
    test.verify()

html_file.write_text(index.replace(old_url, new_url, 1), encoding="utf-8")
tests = verify_file.read_text(encoding="utf-8")
assert "const posterPaths=['api','jwt','account-testing','account-methodology'];" in tests
print("PASS: Left box removed, Target relocated below shoulder, image optimized")
print("Final WebP size:", destination.stat().st_size, "bytes")
