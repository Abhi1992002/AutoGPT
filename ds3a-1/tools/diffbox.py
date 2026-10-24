# usage: python3 -I diffbox.py <diff.png>...  -> bounding box of the pure-red diff pixels (x0,y0,x1,y1) and their count
import sys, zlib, struct
def read_png(path):
    data = open(path, "rb").read(); assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos, idat, w = 8, b"", 0
    while pos < len(data):
        n, typ = struct.unpack(">I4s", data[pos:pos+8]); body = data[pos+8:pos+8+n]; pos += 12 + n
        if typ == b"IHDR": w, h, depth, ctype, _, _, inter = struct.unpack(">IIBBBBB", body); assert depth == 8 and inter == 0
        elif typ == b"IDAT": idat += body
    bpp = {6: 4, 2: 3}[ctype]; raw = zlib.decompress(idat); stride = w * bpp; rows = []; prev = bytearray(stride); i = 0
    for _ in range(h):
        f = raw[i]; line = bytearray(raw[i+1:i+1+stride]); i += 1 + stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0; b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line); prev = line
    return w, h, bpp, rows
for path in sys.argv[1:]:
    w, h, bpp, rows = read_png(path); x0 = y0 = 10**9; x1 = y1 = -1; n = 0
    for y, line in enumerate(rows):
        for x in range(w):
            r, g, b = line[x*bpp], line[x*bpp+1], line[x*bpp+2]
            if r == 255 and g == 0 and b == 0:
                n += 1; x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
    print(f"{path.rsplit('/',1)[-1]} n={n} box=({x0},{y0},{x1},{y1})" if n else f"{path.rsplit('/',1)[-1]} n=0")
