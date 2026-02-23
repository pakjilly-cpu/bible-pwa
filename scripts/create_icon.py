#!/usr/bin/env python3
"""Generate Bible PWA app icons - open book design on green background"""

from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dimensions
    cx, cy = size / 2, size / 2
    pad = size * 0.06
    corner = size * 0.18

    # Background: rounded rectangle with gradient-like green
    # Draw solid dark green rounded rect
    bg_color = (35, 75, 30)  # Dark forest green
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=corner, fill=bg_color)

    # Subtle lighter gradient overlay on top half
    for y in range(int(pad), int(size * 0.5)):
        alpha = int(25 * (1 - (y - pad) / (size * 0.5 - pad)))
        draw.line([(pad + corner * 0.3, y), (size - pad - corner * 0.3, y)],
                  fill=(255, 255, 255, alpha))

    # ── Open Book ──
    book_w = size * 0.58
    book_h = size * 0.42
    book_top = cy - book_h * 0.38
    book_left = cx - book_w / 2
    book_right = cx + book_w / 2

    # Book pages (cream/off-white)
    page_color = (255, 248, 230)
    page_shadow = (235, 225, 200)

    # Left page
    left_pts = [
        (cx - size * 0.02, book_top + size * 0.02),
        (book_left + size * 0.01, book_top + size * 0.05),
        (book_left, book_top + book_h),
        (cx - size * 0.01, book_top + book_h - size * 0.02),
    ]
    draw.polygon(left_pts, fill=page_color)

    # Right page
    right_pts = [
        (cx + size * 0.02, book_top + size * 0.02),
        (book_right - size * 0.01, book_top + size * 0.05),
        (book_right, book_top + book_h),
        (cx + size * 0.01, book_top + book_h - size * 0.02),
    ]
    draw.polygon(right_pts, fill=page_color)

    # Book spine shadow (center line)
    spine_color = (200, 185, 155)
    spine_w = size * 0.012
    draw.line([(cx, book_top), (cx, book_top + book_h)], fill=spine_color, width=max(2, int(spine_w)))

    # Page edges shadow on left page right side
    for i in range(3):
        x = cx - size * 0.02 - i * 1
        alpha_val = 80 - i * 25
        draw.line([(x, book_top + size * 0.04), (x, book_top + book_h - size * 0.03)],
                  fill=(150, 140, 120, max(0, alpha_val)), width=1)

    # Text lines on left page
    line_color = (180, 170, 150)
    line_w = max(1, int(size * 0.005))
    left_margin = book_left + size * 0.06
    right_margin_left = cx - size * 0.05
    line_start_y = book_top + size * 0.10
    line_gap = size * 0.035

    for i in range(6):
        y = line_start_y + i * line_gap
        # Vary line lengths for natural look
        end_x = right_margin_left - (size * 0.02 if i in [2, 4] else 0)
        if y < book_top + book_h - size * 0.06:
            draw.line([(left_margin + size * 0.01, y), (end_x, y)], fill=line_color, width=line_w)

    # Text lines on right page
    left_margin_right = cx + size * 0.05
    right_margin = book_right - size * 0.06

    for i in range(6):
        y = line_start_y + i * line_gap
        end_x = right_margin - (size * 0.03 if i in [1, 3, 5] else 0)
        if y < book_top + book_h - size * 0.06:
            draw.line([(left_margin_right, y), (end_x, y)], fill=line_color, width=line_w)

    # Book cover edges (brown/leather colored border)
    cover_color = (120, 80, 40)
    cover_w = max(2, int(size * 0.012))

    # Left cover outline
    draw.line([left_pts[0], left_pts[1]], fill=cover_color, width=cover_w)
    draw.line([left_pts[1], left_pts[2]], fill=cover_color, width=cover_w)
    draw.line([left_pts[2], left_pts[3]], fill=cover_color, width=cover_w)

    # Right cover outline
    draw.line([right_pts[0], right_pts[1]], fill=cover_color, width=cover_w)
    draw.line([right_pts[1], right_pts[2]], fill=cover_color, width=cover_w)
    draw.line([right_pts[2], right_pts[3]], fill=cover_color, width=cover_w)

    # ── Small golden cross above the book ──
    cross_color = (218, 185, 110)  # Gold
    cross_cx = cx
    cross_cy = book_top - size * 0.06
    cross_h = size * 0.09
    cross_w = size * 0.06
    bar_thickness = max(2, int(size * 0.018))

    # Vertical bar
    draw.rounded_rectangle(
        [cross_cx - bar_thickness/2, cross_cy - cross_h/2,
         cross_cx + bar_thickness/2, cross_cy + cross_h/2],
        radius=max(1, int(bar_thickness * 0.3)),
        fill=cross_color
    )
    # Horizontal bar (slightly above center)
    horiz_cy = cross_cy - cross_h * 0.12
    draw.rounded_rectangle(
        [cross_cx - cross_w/2, horiz_cy - bar_thickness/2,
         cross_cx + cross_w/2, horiz_cy + bar_thickness/2],
        radius=max(1, int(bar_thickness * 0.3)),
        fill=cross_color
    )

    # ── App name text below the book ──
    text_color = (255, 248, 230)  # Cream white
    text_y = book_top + book_h + size * 0.04

    # Load Korean font
    font_size = int(size * 0.075)
    font = ImageFont.truetype("/tmp/NotoSansKR.ttf", font_size)

    text = "말씀과함께"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw / 2, text_y), text, fill=text_color, font=font)

    # Save
    img.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")


# Generate both sizes
create_icon(512, '/home/parksh/bible-pwa/public/icon-512.png')
create_icon(192, '/home/parksh/bible-pwa/public/icon-192.png')
