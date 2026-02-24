#!/usr/bin/env python3
"""Generate Bible PWA app icons - clean GNTC text on green background"""

from PIL import Image, ImageDraw, ImageFont


def create_icon(size, output_path):
    # Use higher resolution for rendering, then downscale for crisp result
    render_size = size * 4
    img = Image.new('RGBA', (render_size, render_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = render_size * 0.02
    corner = render_size * 0.18

    # Background: solid dark green rounded rect
    bg_color = (35, 100, 50)
    draw.rounded_rectangle([pad, pad, render_size - pad, render_size - pad], radius=corner, fill=bg_color)

    # "GNTC" text - big, bold, white, centered
    font_size = int(render_size * 0.28)
    try:
        font = ImageFont.truetype("/tmp/NotoSansKR.ttf", font_size)
    except:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)

    text = "GNTC"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx, cy = render_size / 2, render_size / 2
    draw.text((cx - tw / 2, cy - th / 2 - render_size * 0.04), text, fill=(255, 255, 255), font=font)

    # Small cross above text
    cross_color = (218, 195, 130)
    cross_cy = cy - th / 2 - render_size * 0.12
    cross_h = render_size * 0.08
    cross_w = render_size * 0.055
    bar = max(4, int(render_size * 0.016))
    draw.rounded_rectangle(
        [cx - bar / 2, cross_cy - cross_h / 2, cx + bar / 2, cross_cy + cross_h / 2],
        radius=max(1, int(bar * 0.3)), fill=cross_color)
    horiz_cy = cross_cy - cross_h * 0.1
    draw.rounded_rectangle(
        [cx - cross_w / 2, horiz_cy - bar / 2, cx + cross_w / 2, horiz_cy + bar / 2],
        radius=max(1, int(bar * 0.3)), fill=cross_color)

    # Subtitle below
    sub_size = int(render_size * 0.065)
    try:
        sub_font = ImageFont.truetype("/tmp/NotoSansKR.ttf", sub_size)
    except:
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sub_size)

    sub_text = "은혜와진리"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_tw = sub_bbox[2] - sub_bbox[0]
    sub_y = cy + th / 2 - render_size * 0.01
    draw.text((cx - sub_tw / 2, sub_y), sub_text, fill=(220, 230, 220, 200), font=sub_font)

    # Downscale with high-quality resampling
    img = img.resize((size, size), Image.LANCZOS)
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")


create_icon(512, '/home/parksh/bible-pwa/public/icon-512.png')
create_icon(192, '/home/parksh/bible-pwa/public/icon-192.png')
