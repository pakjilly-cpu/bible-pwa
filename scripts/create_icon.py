#!/usr/bin/env python3
"""Generate Bible PWA app icons - bold GNTC on green background"""

from PIL import Image, ImageDraw, ImageFont


def create_icon(size, output_path):
    render_size = size * 4
    img = Image.new('RGBA', (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = render_size * 0.02
    corner = render_size * 0.18

    bg_color = (35, 100, 50)
    draw.rounded_rectangle([pad, pad, render_size - pad, render_size - pad], radius=corner, fill=bg_color)

    # "GNTC" - bold, white, dead center (smaller to leave padding)
    font_size = int(render_size * 0.20)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.truetype("/tmp/NotoSansKR.ttf", font_size)

    text = "GNTC"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (render_size - tw) / 2 - bbox[0]
    ty = (render_size - th) / 2 - bbox[1]
    draw.text((tx, ty), text, fill=(255, 255, 255), font=font)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")


create_icon(512, '/home/parksh/bible-pwa/public/icon-512.png')
create_icon(192, '/home/parksh/bible-pwa/public/icon-192.png')
