import re, sys, collections
def by_rule(f):
    c = collections.Counter(re.findall(r"\[Error/shadcn\(([a-z-]+)\)\]", open(f).read()))
    return c
