import os
import subprocess
from PIL import Image, ImageDraw

def create_mac_icon():
    raw_path = 'assets/icon_raw.png'
    png_path = 'assets/icon.png'
    iconset_dir = 'assets/icon.iconset'
    icns_path = 'assets/icon.icns'

    os.makedirs('assets', exist_ok=True)
    os.makedirs(iconset_dir, exist_ok=True)

    src = Image.open(raw_path).convert('RGBA')
    size = 1024

    # 4x super-sampled squircle mask
    scale = 4
    msize = size * scale
    mask = Image.new('L', (msize, msize), 0)
    draw = ImageDraw.Draw(mask)

    # Standard macOS Big Sur icon proportion: ~824px squircle inside 1024px canvas
    margin = int(50 * scale)
    radius = int(210 * scale)
    rect = [margin, margin, msize - margin, msize - margin]
    draw.rounded_rectangle(rect, radius=radius, fill=255)

    # Subtle inner border for crisp edge
    border_mask = Image.new('L', (msize, msize), 0)
    bdraw = ImageDraw.Draw(border_mask)
    bdraw.rounded_rectangle(rect, radius=radius, outline=255, width=int(2 * scale))

    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    border_mask = border_mask.resize((size, size), Image.Resampling.LANCZOS)

    # Output canvas with transparency
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(src, (0, 0), mask=mask)

    # Add subtle border
    border_layer = Image.new('RGBA', (size, size), (255, 128, 56, 40))
    output.paste(border_layer, (0, 0), mask=border_mask)

    output.save(png_path, 'PNG')
    print(f"Saved {png_path}")

    # Generate all iconset sizes
    icon_specs = [
        ('icon_16x16.png', 16),
        ('icon_16x16@2x.png', 32),
        ('icon_32x32.png', 32),
        ('icon_32x32@2x.png', 64),
        ('icon_128x128.png', 128),
        ('icon_128x128@2x.png', 256),
        ('icon_256x256.png', 256),
        ('icon_256x256@2x.png', 512),
        ('icon_512x512.png', 512),
        ('icon_512x512@2x.png', 1024),
    ]

    for fname, dim in icon_specs:
        resized = output.resize((dim, dim), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_dir, fname), 'PNG')

    print(f"Generated {len(icon_specs)} sizes in {iconset_dir}")

    # Build ICNS via macOS iconutil
    res = subprocess.run(['/usr/bin/iconutil', '-c', 'icns', iconset_dir, '-o', icns_path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Successfully generated macOS Apple icon: {icns_path}")
    else:
        print(f"iconutil error: {res.stderr}")

if __name__ == '__main__':
    create_mac_icon()
