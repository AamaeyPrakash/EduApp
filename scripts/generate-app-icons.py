#!/usr/bin/env python3
"""Generates the iOS and Android app icons (and the Play Store icon).

Usage:
  pip install pillow
  python3 scripts/generate-app-icons.py                  # placeholder: white Σ on blue
  python3 scripts/generate-app-icons.py my-icon-1024.png # your own square artwork

Your own artwork should be a 1024x1024 PNG with the important part inside the middle
~60%, because Android crops launcher icons into circles and other shapes.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BLUE = (10, 132, 255)
# Bold fonts with a Σ glyph, used only for the placeholder icon (Linux, macOS, Windows).
FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
]

ANDROID_RES = ROOT / 'android/app/src/main/res'
LAUNCHER_SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
# Adaptive icon layers are 108dp, of which the middle 66dp is always visible.
ADAPTIVE_SIZES = {key: size * 108 // 48 for key, size in LAUNCHER_SIZES.items()}


def glyph_layer(size, scale):
    """A transparent square with a white Σ whose height is `scale` of the square."""
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font_path = next((path for path in FONT_CANDIDATES if Path(path).exists()), None)
    if font_path is None:
        sys.exit('No font with a Σ glyph found; pass your own 1024x1024 icon instead.')
    font = ImageFont.truetype(font_path, int(size * scale * 1.35))
    left, top, right, bottom = draw.textbbox((0, 0), 'Σ', font=font)
    x = (size - (right - left)) / 2 - left
    y = (size - (bottom - top)) / 2 - top
    draw.text((x, y), 'Σ', font=font, fill=(255, 255, 255, 255))
    return layer


def placeholder_artwork(size=1024):
    image = Image.new('RGBA', (size, size), BLUE + (255,))
    image.alpha_composite(glyph_layer(size, 0.46))
    return image


def masked(image, shape):
    size = image.size[0]
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    if shape == 'circle':
        draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    else:
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=size * 0.18, fill=255)
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(image, (0, 0), mask)
    return result


def write_ios(artwork):
    folder = ROOT / 'ios/eduApp/Images.xcassets/AppIcon.appiconset'
    # The App Store rejects icons with transparency.
    artwork.convert('RGB').save(folder / 'AppIcon-1024.png')
    contents = {
        'images': [
            {
                'filename': 'AppIcon-1024.png',
                'idiom': 'universal',
                'platform': 'ios',
                'size': '1024x1024',
            }
        ],
        'info': {'author': 'xcode', 'version': 1},
    }
    (folder / 'Contents.json').write_text(json.dumps(contents, indent=2) + '\n')


def write_android(artwork, foreground):
    for density, size in LAUNCHER_SIZES.items():
        folder = ANDROID_RES / f'mipmap-{density}'
        folder.mkdir(parents=True, exist_ok=True)
        resized = artwork.resize((size, size), Image.LANCZOS)
        masked(resized, 'rounded').save(folder / 'ic_launcher.png')
        masked(resized, 'circle').save(folder / 'ic_launcher_round.png')
        adaptive = ADAPTIVE_SIZES[density]
        foreground.resize((adaptive, adaptive), Image.LANCZOS).save(
            folder / 'ic_launcher_foreground.png'
        )

    adaptive_xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background" />\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n'
        '</adaptive-icon>\n'
    )
    anydpi = ANDROID_RES / 'mipmap-anydpi-v26'
    anydpi.mkdir(parents=True, exist_ok=True)
    (anydpi / 'ic_launcher.xml').write_text(adaptive_xml)
    (anydpi / 'ic_launcher_round.xml').write_text(adaptive_xml)
    (ANDROID_RES / 'values/ic_launcher_background.xml').write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <color name="ic_launcher_background">#%02X%02X%02X</color>\n'
        '</resources>\n' % BLUE
    )


def main():
    if len(sys.argv) > 1:
        artwork = Image.open(sys.argv[1]).convert('RGBA').resize((1024, 1024), Image.LANCZOS)
        # Shrink the artwork into the adaptive icon's always-visible middle area.
        foreground = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
        inner = artwork.resize((626, 626), Image.LANCZOS)
        foreground.alpha_composite(inner, (199, 199))
    else:
        artwork = placeholder_artwork()
        foreground = glyph_layer(1024, 0.30)

    write_ios(artwork)
    write_android(artwork, foreground)
    store = ROOT / 'assets/store'
    store.mkdir(parents=True, exist_ok=True)
    artwork.resize((512, 512), Image.LANCZOS).save(store / 'play-store-icon-512.png')
    print('Icons written for iOS, Android and the Play Store listing.')


if __name__ == '__main__':
    main()
