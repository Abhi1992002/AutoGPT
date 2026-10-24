# usage: python3 -I crops.py <out.html> <x> <y> <w> <h> <scale> <png>...  -> html page showing that region of each png side by side
import sys
out, x, y, w, h, sc = sys.argv[1], *map(int, sys.argv[2:6]), float(sys.argv[6])
h_ = '<html><body style="margin:0;display:flex;gap:8px;background:#fff;font:11px sans-serif">'
for f in sys.argv[7:]:
    lab = "/".join(f.split("/")[-2:])
    h_ += f'<div><div style="height:14px">{lab}</div><div style="width:{w*sc}px;height:{h*sc}px;overflow:hidden;outline:1px solid red"><img src="file://{f}" style="transform:scale({sc}) translate(-{x}px,-{y}px);transform-origin:0 0"></div></div>'
open(out, "w").write(h_ + "</body></html>")
