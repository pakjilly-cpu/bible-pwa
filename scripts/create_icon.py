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
    font_size = int(render_size * 0.24)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf", font_size)
    except:
        font = ImageFont.truetype("/tmp/NotoSansKR.ttf", font_size)

    # Draw text on separate transparent layer, then stretch vertically 2x
    text = "gntc"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    txt_img = Image.new('RGBA', (tw + 20, th + 20), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((-bbox[0] + 10, -bbox[1] + 10), text, fill=(255, 255, 255), font=font)

    # Stretch: keep width, double the height
    stretched = txt_img.resize((txt_img.width, txt_img.height * 2), Image.LANCZOS)

    # Paste centered on background
    px = (render_size - stretched.width) // 2
    py = (render_size - stretched.height) // 2
    img.paste(stretched, (px, py), stretched)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")


create_icon(512, '/home/parksh/bible-pwa/public/icon-512.png')
create_icon(192, '/home/parksh/bible-pwa/public/icon-192.png')
