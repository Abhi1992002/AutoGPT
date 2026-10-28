"""Cut an AutoGPT character out of its flat studio tile, for the desktop app's avatars.

The background, its floor and the floor shadow become transparent; the character's own colours,
cream stripes included, are never changed. The result is cropped square around the character and
written as 256.webp and 128.webp.

usage: python3 scripts/cutout-character.py <upstream 512.png> <out dir>   (needs Pillow and NumPy)
"""
import sys
from collections import deque
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
img = np.asarray(Image.open(src).convert("RGB")).astype(np.float64)
h, w, _ = img.shape
border = np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]])
bg = np.median(border, axis=0)

diff = bg - img                                  # how much darker than the background, per channel
dev = np.abs(diff - diff.mean(axis=2, keepdims=True)).max(axis=2)
neutral = (dev < 14) & (img.mean(axis=2) > 150)  # background, its floor and grey shadow
STEP = 5  # the flood only crosses smooth gradients, never a silhouette edge

filled = np.zeros((h, w), bool)
q = deque()
for y in range(h):
    for x in (0, w - 1):
        if neutral[y, x] and not filled[y, x]:
            filled[y, x] = True; q.append((y, x))
for x in range(w):
    for y in (0, h - 1):
        if neutral[y, x] and not filled[y, x]:
            filled[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and neutral[ny, nx] and not filled[ny, nx] and np.abs(img[ny, nx] - img[y, x]).max() < STEP:
            filled[ny, nx] = True; q.append((ny, nx))

# The character is the largest region left; specks of noisy floor around it are background too
label = np.full((h, w), -1)
sizes = []
for sy in range(h):
    for sx in range(w):
        if filled[sy, sx] or label[sy, sx] >= 0:
            continue
        n = len(sizes); label[sy, sx] = n; q.append((sy, sx)); count = 0
        while q:
            y, x = q.popleft(); count += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not filled[ny, nx] and label[ny, nx] < 0:
                    label[ny, nx] = n; q.append((ny, nx))
        sizes.append(count)
filled = label != int(np.argmax(sizes))

# Second pass: the floor touching the feet is noisy, so take anything this close to the background colour
near = np.abs(img - bg).max(axis=2) <= 12
q.extend(zip(*np.nonzero(filled)))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not filled[ny, nx]:
            filled[ny, nx] = True; q.append((ny, nx))

# The floor shading shares the cream stripes' exact colour, so separate it by shape: the floor is a
# thin horizontal band, while stripes sit inside the tall body. Pale pixels in short vertical runs go.
body = ~filled
run = np.zeros((h, w), int)
for x in range(w):
    y = 0
    while y < h:
        if not body[y, x]:
            y += 1
            continue
        end = y
        while end < h and body[end, x]:
            end += 1
        run[y:end, x] = end - y
        y = end
pale = ((img.max(axis=2) - img.min(axis=2)) <= 30) & (img.mean(axis=2) > 150)
shadowy = ((img.max(axis=2) - img.min(axis=2)) <= 30) & (img.mean(axis=2) > 110)
filled |= body & shadowy & (run < 48)

# A sliver of floor can sit right under the base: drop short pale tails at the bottom of each column
body = ~filled
for x in range(w):
    ys = np.nonzero(body[:, x])[0]
    if not len(ys):
        continue
    end = ys.max()
    y = end
    while y >= 0 and body[y, x] and pale[y, x]:
        y -= 1
    if 0 < end - y < 12:
        filled[y + 1: end + 1, x] = True

# Colour-to-alpha against the background: the shadow keeps as a soft black, the rest clears
shade = np.clip((diff.mean(axis=2)) / bg.mean(), 0, 1) * 0.7
alpha = np.where(filled, shade, 1.0)
rgb = np.where(filled[..., None], 0.0, img)

# Soften the 1px seam between character and background
edge = (~filled) & (np.roll(filled, 1, 0) | np.roll(filled, -1, 0) | np.roll(filled, 1, 1) | np.roll(filled, -1, 1))
alpha = np.where(edge, 0.6, alpha)

rgba = np.dstack([rgb, alpha * 255]).round().clip(0, 255).astype(np.uint8)
im = Image.fromarray(rgba)
# Crop to the character, square and centred, so small avatars spend their pixels on it
ys, xs = np.nonzero(alpha > 0.5)
cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
half = max(ys.max() - ys.min(), xs.max() - xs.min()) / 2 * 1.04
im = im.crop((round(cx - half), round(cy - half), round(cx + half), round(cy + half)))
for size in (256, 128):
    im.resize((size, size), Image.Resampling.LANCZOS).save(f"{out}/{size}.webp", "WEBP", quality=90, method=6)
print(src, "bg", bg.round(), "cleared", round(filled.mean() * 100, 1), "%")
