#!/usr/bin/env python3
"""Crop avatar + product thumb from Figma review screenshot."""
from pathlib import Path

from PIL import Image

src = Path(
    '/Users/mirajana/.cursor/projects/Users-mirajana-dev-showcase/assets/'
    'image-07fe2142-2fba-466f-94ad-1fd691089a80.png'
)
out = Path('/Users/mirajana/dev/showcase/apps/frontend/public/assets/footer')
out.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert('RGB')
w, h = img.size
print(f'size={w}x{h}')

# Screenshot is the reviews+footer block on dark canvas.
# Cards start below header; first card left edge ~ proportional to design.
# Empirically map: design canvas ~1300 wide for content area in SVG,
# but screenshot may be cropped. Probe by finding white card rects.

pixels = img.load()

def is_white(x, y, tol=12):
    r, g, b = pixels[x, y]
    return r > 250 - tol and g > 250 - tol and b > 250 - tol

# Find top of first white card
card_top = None
for y in range(h):
    if is_white(w // 6, y):
        card_top = y
        break
print('card_top', card_top)

# Find left of first card
card_left = None
for x in range(w):
    if is_white(x, card_top + 20):
        card_left = x
        break
print('card_left', card_left)

# Avatar is ~48px in 389 card; scale from card width
# Find card right (first gap)
card_right = card_left
for x in range(card_left + 50, w):
    if not is_white(x, card_top + 20):
        # check if still in padding of dark bg
        r, g, b = pixels[x, card_top + 20]
        if r < 40 and g < 40 and b < 40:
            card_right = x
            break
print('card_right', card_right)

card_w = card_right - card_left
scale = card_w / 389.333
pad = int(20 * scale)
avatar_size = int(48 * scale)
ax = card_left + pad
ay = card_top + pad
avatar = img.crop((ax, ay, ax + avatar_size, ay + avatar_size))
avatar_path = out / 'review-avatar.jpg'
avatar.save(avatar_path, quality=92)
print('avatar', avatar.size, '->', avatar_path)

# Product thumb: 64x52 at bottom of card (y=288 in design, card y=92, so offset 196 from card top)
# card height 269, thumb near bottom with 20 pad: offset = 20+48+16+95+16 = 195
thumb_y = card_top + int(196 * scale)
thumb_x = card_left + pad
thumb_w = int(64 * scale)
thumb_h = int(52 * scale)
thumb = img.crop((thumb_x, thumb_y, thumb_x + thumb_w, thumb_y + thumb_h))
thumb_path = out / 'review-product.jpg'
thumb.save(thumb_path, quality=92)
print('thumb', thumb.size, '->', thumb_path)
