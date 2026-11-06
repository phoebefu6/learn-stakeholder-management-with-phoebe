"""Reference engine for the influence-network bench (session 4). Standard library only.

Reads the same data file the browser reads (assets/stk-sample.js), runs the same steps in the same
order as assets/stk-live.js, and prints the canon as JSON. Compare with the node run:

    python3 materials/stk_reference.py > /tmp/py.json
    node materials/stk-node.js > /tmp/node.json
    python3 materials/compare-ladder.py /tmp/py.json /tmp/node.json

What is REAL: who goes to whom for advice, who names whom as a friend, who reports to whom
(Krackhardt 1987). In-degree, betweenness and reachability are computed from those ties.
What is MODELLED: who ends up backing the proposal. A deterministic linear-threshold rule: a manager
backs it once at least TH percent of the people they go to (advice) or name (friendship) back it.
Everyone shares one threshold, which is the model's simplification, stated on the widget.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

CEO = 7
MAJORITY = 11
DRAWS = 200
SEED = 20261106
THRESHOLDS = list(range(30, 85, 5))
KS = [1, 2, 3, 4, 5]
NETS = ["advice", "friendship"]
STRATS = ["org", "indeg", "btw", "random"]


def load():
    s = open(os.path.join(REPO, "assets", "stk-sample.js"), encoding="utf-8").read()
    m = re.search(r"window\.STK_SAMPLE = (\{.*\});", s, re.S)
    return json.loads(m.group(1))


def mulberry32(a):
    st = [a & 0xFFFFFFFF]

    def imul(x, y):
        return (x * y) & 0xFFFFFFFF

    def r():
        st[0] = (st[0] + 0x6D2B79F5) & 0xFFFFFFFF
        a_ = st[0]
        t = imul(a_ ^ (a_ >> 15), 1 | a_)
        t = ((t + imul(t ^ (t >> 7), 61 | t)) & 0xFFFFFFFF) ^ t
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return r


class Net:
    def __init__(self, data, net, removed=()):
        self.n = data["n"]
        self.removed = set(removed)
        self.alive = [i for i in range(1, self.n + 1) if i not in self.removed]
        self.out = {i: [j for j in data[net][i - 1] if j not in self.removed] for i in self.alive}
        self.level = data["level"]
        self.reports_to = data["reportsTo"]

    def indeg(self):
        d = {i: 0 for i in self.alive}
        for i in self.alive:
            for j in self.out[i]:
                d[j] += 1
        return d

    def betweenness(self):
        cb = {i: 0.0 for i in self.alive}
        for s in self.alive:
            stack, pred = [], {w: [] for w in self.alive}
            sigma = {w: 0 for w in self.alive}
            dist = {w: -1 for w in self.alive}
            sigma[s], dist[s] = 1, 0
            q, qi = [s], 0
            while qi < len(q):
                v = q[qi]
                qi += 1
                stack.append(v)
                for w in self.out[v]:
                    if dist[w] < 0:
                        q.append(w)
                        dist[w] = dist[v] + 1
                    if dist[w] == dist[v] + 1:
                        sigma[w] += sigma[v]
                        pred[w].append(v)
            delta = {w: 0.0 for w in self.alive}
            while stack:
                w = stack.pop()
                for v in pred[w]:
                    delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
                if w != s:
                    cb[w] += delta[w]
        return cb

    def org_order(self):
        reports = {i: 0 for i in range(1, self.n + 1)}
        for i, b in enumerate(self.reports_to, 1):
            if b:
                reports[b] += 1
        return sorted(self.alive, key=lambda i: (self.level[i - 1], -reports[i], i))

    def indeg_order(self):
        d = self.indeg()
        return sorted(self.alive, key=lambda i: (-d[i], i))

    def btw_order(self):
        b = self.betweenness()
        order = list(self.alive)
        # sort by betweenness desc with a 1e-9 tolerance, then id asc (insertion sort, mirrors JS)
        for a in range(1, len(order)):
            x = order[a]
            j = a - 1
            while j >= 0 and (b[x] > b[order[j]] + 1e-9 or (abs(b[x] - b[order[j]]) <= 1e-9 and x < order[j])):
                order[j + 1] = order[j]
                j -= 1
            order[j + 1] = x
        return order

    def spread(self, seeds, th):
        sup = set(s for s in seeds if s not in self.removed)
        rounds = 0
        while True:
            new = []
            for v in self.alive:
                if v in sup:
                    continue
                o = self.out[v]
                if not o:
                    continue
                c = sum(1 for j in o if j in sup)
                if c * 100 >= th * len(o):
                    new.append(v)
            if not new:
                return sorted(sup), rounds
            sup.update(new)
            rounds += 1

    def dists(self, s):
        d = {s: 0}
        q, qi = [s], 0
        while qi < len(q):
            v = q[qi]
            qi += 1
            for w in self.out[v]:
                if w not in d:
                    d[w] = d[v] + 1
                    q.append(w)
        return d


def passes(sup):
    return len(sup) >= MAJORITY and CEO in sup


def seeds_for(g, strat, k):
    if strat == "org":
        return g.org_order()[:k]
    if strat == "indeg":
        return g.indeg_order()[:k]
    if strat == "btw":
        return g.btw_order()[:k]
    raise ValueError(strat)


def random_avg(g, k, th):
    r = mulberry32(SEED)
    tot, ok = 0, 0
    pool0 = list(g.alive)
    for _ in range(DRAWS):
        pool = list(pool0)
        for i in range(k):
            j = i + int(r() * (len(pool) - i))
            pool[i], pool[j] = pool[j], pool[i]
        sup, _ = g.spread(pool[:k], th)
        tot += len(sup)
        ok += 1 if passes(sup) else 0
    return {"mean": tot / DRAWS, "passRate": ok / DRAWS}


def evaluate(data, net, strat, k, th, broker_leaves=False, mine=None):
    full = Net(data, net)
    if strat == "mine":
        seeds = sorted(mine or [])
    elif strat == "random":
        seeds = None
    else:
        seeds = seeds_for(full, strat, k)
    if not broker_leaves:
        if strat == "random":
            return random_avg(full, k, th)
        sup, rounds = full.spread(seeds, th)
        return {"seeds": seeds, "support": len(sup), "supporters": sup, "rounds": rounds, "passes": passes(sup)}
    broker = full.btw_order()[0]
    red = Net(data, net, removed=[broker])
    if strat == "random":
        return {"broker": broker, "after": random_avg(red, k, th)}
    stood = [s for s in seeds if s != broker]
    sup_a, _ = red.spread(stood, th)
    if strat == "mine":
        remapped = stood
    else:
        remapped = seeds_for(red, strat, k)
    sup_r, _ = red.spread(remapped, th)
    return {"broker": broker, "stood": stood, "after": len(sup_a), "afterPasses": passes(sup_a),
            "remapped": remapped, "remappedSupport": len(sup_r), "remappedPasses": passes(sup_r)}


def connectivity(data, net):
    full = Net(data, net)
    broker = full.btw_order()[0]
    red = Net(data, net, removed=[broker])
    cut, longer = [], 0
    for i in red.alive:
        b = full.dists(i)
        a = red.dists(i)
        for j in red.alive:
            if j == i or j not in b:
                continue
            if j not in a:
                cut.append([i, j])
            elif a[j] > b[j]:
                longer += 1
    return {"broker": broker, "cut": cut, "longer": longer}


def canon(data):
    out = {"n": data["n"], "ties": {k: sum(len(x) for x in data[k]) for k in NETS}}
    out["nets"] = {}
    for net in NETS:
        g = Net(data, net)
        node = {}
        node["indeg"] = [g.indeg()[i] for i in g.alive]
        node["btw"] = [g.betweenness()[i] for i in g.alive]
        node["orgOrder"] = g.org_order()
        node["indegOrder"] = g.indeg_order()
        node["btwOrder"] = g.btw_order()
        node["connectivity"] = connectivity(data, net)
        grid = {}
        for th in THRESHOLDS:
            for k in KS:
                key = "%d-%d" % (th, k)
                grid[key] = {s: evaluate(data, net, s, k, th) for s in STRATS}
                grid[key]["break"] = {s: evaluate(data, net, s, k, th, broker_leaves=True) for s in STRATS}
        node["grid"] = grid
        out["nets"][net] = node
    # learner picks quoted on the pages (session 4 build-along); add here before any page quotes one
    out["mine"] = {}
    for label, net, pick, th in MINE_EXAMPLES:
        out["mine"][label] = {"plain": evaluate(data, net, "mine", len(pick), th, mine=pick),
                              "break": evaluate(data, net, "mine", len(pick), th, broker_leaves=True, mine=pick)}
    return out


MINE_EXAMPLES = [
    ("ceo-plus-two-managers", "advice", [7, 1, 10], 65),
    ("three-level3", "advice", [1, 4, 10], 65),
    ("friendship-hubs", "friendship", [2, 7, 17], 65),
]


if __name__ == "__main__":
    print(json.dumps(canon(load()), sort_keys=True))
