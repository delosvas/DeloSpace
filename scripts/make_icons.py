import os
import subprocess
from PIL import Image, ImageDraw

def create_mac_icon():
    raw_path = 'assets/icon_raw.jpg'
    png_path = 'assets/icon.png'
    iconset_dir = 'assets/icon.iconset'
    icns_path = 'assets/icon.icns'

    os.makedirs('assets', exist_ok=True)
    os.makedirs(iconset_dir, exist_ok=True)

    img = Image.open(raw_path).convert('RGBA')
    size = 1024
    img = img.resize((size, size), Image.Resampling.LANCZOS)

    # Super-sampled antialiased squircle mask (scale x4 for pristine edges)
    scale = 4
    mask_size = size * scale
    mask = Image.new('L', (mask_size, mask_size), 0)
    draw = ImageDraw.Draw(mask)

    # Standard macOS Big Sur icon proportion: 824px squircle inside 1024px canvas, or full frame with 224px radius
    radius = int(224 * scale)
    margin = int(40 * scale) # macOS Dock icons have ~40px margin around squircle
    draw.rounded_rectangle(
        [margin, margin, mask_size - margin, mask_size - margin],
        radius=radius,
        fill=255
    )

    mask = mask.resize((size, size), Image.Resampling.LANCZOS)

    # Composite onto transparent background
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask=mask)
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
