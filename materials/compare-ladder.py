"""Compare two canon JSON files BY VALUE (python reference vs node engine).

    python3 materials/compare-ladder.py py.json node.json        -> exit 0 when every value agrees
    python3 materials/compare-ladder.py --self-test py.json      -> plants a 0.1% fault, must FAIL it

Numbers agree when |a - b| <= 1e-9 * max(1, |a|); keys, list lengths, booleans and strings exactly.
"""
import copy
import json
import sys


def diff(a, b, where="$", out=None):
    out = [] if out is None else out
    if isinstance(a, bool) or isinstance(b, bool):
        if a is not b:
            out.append(where)
    elif isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if abs(a - b) > 1e-9 * max(1.0, abs(a)):
            out.append("%s: %r vs %r" % (where, a, b))
    elif isinstance(a, dict) and isinstance(b, dict):
        if set(a) != set(b):
            out.append("%s keys: %s" % (where, sorted(set(a) ^ set(b))))
        for k in set(a) & set(b):
            diff(a[k], b[k], where + "." + k, out)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            out.append("%s length %d vs %d" % (where, len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)):
            diff(x, y, "%s[%d]" % (where, i), out)
    elif a != b:
        out.append("%s: %r vs %r" % (where, a, b))
    return out


def count(o):
    if isinstance(o, dict):
        return sum(count(v) for v in o.values())
    if isinstance(o, list):
        return sum(count(v) for v in o)
    return 1


if __name__ == "__main__":
    if sys.argv[1] == "--self-test":
        a = json.load(open(sys.argv[2]))
        b = copy.deepcopy(a)
        b["nets"]["advice"]["btw"][17] *= 1.001
        bad = diff(a, b)
        print("planted fault detected:", bad[:1])
        sys.exit(0 if len(bad) == 1 else 1)
    a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
    bad = diff(a, b)
    print("values compared: %d; mismatches: %d" % (count(a), len(bad)))
    for x in bad[:20]:
        print("  " + x)
    sys.exit(1 if bad else 0)
