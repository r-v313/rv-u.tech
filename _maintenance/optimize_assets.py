#!/usr/bin/env python3
"""Create high-quality WebP evidence and a retina-sized portrait for RVU Camp.
PNG sources are optional: checked-in WebP is sufficient for routine deployments.
Run from the repository root after installing Pillow >= 10.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

def optimize_evidence():
    for number in range(1, 7):
        original = ROOT / f"poc-{number:02d}.png"
        output = ROOT / f"poc-{number:02d}-full.webp"
        if not original.exists():
            if not output.is_file():
                raise FileNotFoundError(f"Missing both optimized and source image: {number:02d}")
            print(f"{output.name}: existing optimized asset retained")
            continue
        with Image.open(original) as im:
            img = ImageOps.exif_transpose(im)
            img = img.convert("RGBA") if "A" in img.getbands() else img.convert("RGB")
            size = img.size
            for quality in (94, 90, 86):
                img.save(output, format="WEBP", quality=quality, method=6)
                if output.stat().st_size < original.stat().st_size:
                    break
            with Image.open(output) as check:
                check.load()
                assert check.size == size, (output, size, check.size)
        ratio = output.stat().st_size / original.stat().st_size
        print(f"{output.name}: {output.stat().st_size:,} bytes (original {original.stat().st_size:,}, ratio {ratio:.1%})")

def optimize_portrait():
    original = ROOT / "assets" / "ramez-medhat.webp"
    output = ROOT / "assets" / "ramez-medhat-640.webp"
    with Image.open(original) as im:
        img = ImageOps.exif_transpose(im).convert("RGB")
        img.thumbnail((640, 640), Image.Resampling.LANCZOS)
        img.save(output, format="WEBP", quality=88, method=6)
    with Image.open(output) as check:
        check.verify()
    print(f"{output.name}: {output.stat().st_size:,} bytes")

if __name__ == "__main__":
    optimize_evidence()
    optimize_portrait()
