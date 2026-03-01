#!/usr/bin/env python3
"""Generate Bible PWA app icons - bold '성경' on green background"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    render_size = size * 4
    img = Image.new('RGBA', (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = render_size * 0.02
    corner = render_size * 0.18

    bg_color = (35, 100, 50)
    draw.rounded_rectangle([pad, pad, render_size - pad, render_size - pad], radius=corner, fill=bg_color)

    # "성경" - bold, white, centered
    font_size = int(render_size * 0.30)
    font_path = os.path.expanduser("~/.local/share/fonts/malgunbd.ttf")
    font = ImageFont.truetype(font_path, font_size)

    text = "성경"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    txt_img = Image.new('RGBA', (tw + 20, th + 20), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((-bbox[0] + 10, -bbox[1] + 10), text, fill=(255, 255, 255), font=font, stroke_width=6, stroke_fill=(255, 255, 255))

    # Paste centered on background (no stretch for Korean text)
    px = (render_size - txt_img.width) // 2
    py = (render_size - txt_img.height) // 2
    img.paste(txt_img, (px, py), txt_img)

    img = img.resize((size, size), Image.LANCZOS)
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")


out_dir = os.path.join(os.path.dirname(__file__), '..', 'public')

create_icon(512, os.path.join(out_dir, 'icon-512.png'))
create_icon(192, os.path.join(out_dir, 'icon-192.png'))
create_icon(512, os.path.join(out_dir, 'icon.png'))
create_icon(512, os.path.join(out_dir, 'data', 'icon.png'))
