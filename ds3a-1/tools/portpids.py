# usage: python3 -I portpids.py <port>  -> pids listening on the TCP port (from /proc)
import os, sys
port = int(sys.argv[1]); inodes = set()
for f in ("/proc/net/tcp", "/proc/net/tcp6"):
    try:
        for line in open(f).readlines()[1:]:
            p = line.split()
            if int(p[1].split(":")[1], 16) == port and p[3] == "0A": inodes.add(p[9])
    except FileNotFoundError: pass
pids = set()
for pid in filter(str.isdigit, os.listdir("/proc")):
    try:
        for fd in os.listdir(f"/proc/{pid}/fd"):
            l = os.readlink(f"/proc/{pid}/fd/{fd}")
            if l.startswith("socket:[") and l[8:-1] in inodes: pids.add(pid)
    except (PermissionError, FileNotFoundError, ProcessLookupError): pass
print(" ".join(sorted(pids)))
