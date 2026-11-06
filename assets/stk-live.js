/* stk-live.js - the influence-network bench for learn-stakeholder-management-with-phoebe
 *
 * Real rows: Krackhardt (1987) high-tech managers, 21 people (stk-sample.js). Who goes to whom
 * for advice, who names whom as a friend, who reports to whom. In-degree, betweenness and
 * reachability are COMPUTED here, in the browser, from those ties.
 * What is MODELLED, and labelled so on the widget: who ends up backing a proposal. A
 * deterministic linear-threshold rule: a manager backs it once at least TH percent of the people
 * they go to (advice) or name (friendship) back it. One shared threshold for everyone is the
 * model's simplification. Random pre-wiring is averaged over 200 seeded draws.
 *   org      ANTI-LEVER: pre-wire from the top of the org chart (CEO, then the vice presidents
 *            with the biggest teams).
 *   broker   BREAK BUTTON: the top-betweenness person leaves the firm. The plan as it stood loses
 *            them; the page also prints the plan re-mapped on the smaller network.
 * The Python reference (materials/stk_reference.py) runs the same steps in the same order and
 * prints the same numbers; materials/compare-ladder.py checks them by value.
 */
(function (root) {
  "use strict";

  var CEO = 7, MAJORITY = 11, DRAWS = 200, SEED = 20261106;
  var THRESHOLDS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  var KS = [1, 2, 3, 4, 5];
  var NETS = ["advice", "friendship"];
  var STRATS = ["org", "indeg", "btw", "random"];

  /* ---------- engine (mirrors the Python reference, step for step) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function Net(data, net, removed) {
    this.n = data.n;
    this.removed = {};
    var self = this;
    (removed || []).forEach(function (r) { self.removed[r] = true; });
    this.alive = [];
    for (var i = 1; i <= this.n; i++) if (!this.removed[i]) this.alive.push(i);
    this.out = {};
    this.alive.forEach(function (i) {
      self.out[i] = data[net][i - 1].filter(function (j) { return !self.removed[j]; });
    });
    this.level = data.level;
    this.reportsTo = data.reportsTo;
  }
  Net.prototype.indeg = function () {
    var d = {}, self = this;
    this.alive.forEach(function (i) { d[i] = 0; });
    this.alive.forEach(function (i) { self.out[i].forEach(function (j) { d[j] += 1; }); });
    return d;
  };
  Net.prototype.betweenness = function () {
    var self = this, cb = {};
    this.alive.forEach(function (i) { cb[i] = 0; });
    this.alive.forEach(function (s) {
      var stack = [], pred = {}, sigma = {}, dist = {}, delta = {};
      self.alive.forEach(function (w) { pred[w] = []; sigma[w] = 0; dist[w] = -1; delta[w] = 0; });
      sigma[s] = 1; dist[s] = 0;
      var q = [s], qi = 0;
      while (qi < q.length) {
        var v = q[qi++];
        stack.push(v);
        self.out[v].forEach(function (w) {
          if (dist[w] < 0) { q.push(w); dist[w] = dist[v] + 1; }
          if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
        });
      }
      while (stack.length) {
        var w = stack.pop();
        pred[w].forEach(function (v) { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
        if (w !== s) cb[w] += delta[w];
      }
    });
    return cb;
  };
  Net.prototype.orgOrder = function () {
    var reports = {}, i;
    for (i = 1; i <= this.n; i++) reports[i] = 0;
    for (i = 0; i < this.reportsTo.length; i++) if (this.reportsTo[i]) reports[this.reportsTo[i]] += 1;
    var lv = this.level;
    return this.alive.slice().sort(function (a, b) {
      return (lv[a - 1] - lv[b - 1]) || (reports[b] - reports[a]) || (a - b);
    });
  };
  Net.prototype.indegOrder = function () {
    var d = this.indeg();
    return this.alive.slice().sort(function (a, b) { return (d[b] - d[a]) || (a - b); });
  };
  Net.prototype.btwOrder = function () {
    var b = this.betweenness(), order = this.alive.slice();
    for (var a = 1; a < order.length; a++) {
      var x = order[a], j = a - 1;
      while (j >= 0 && (b[x] > b[order[j]] + 1e-9 || (Math.abs(b[x] - b[order[j]]) <= 1e-9 && x < order[j]))) {
        order[j + 1] = order[j]; j--;
      }
      order[j + 1] = x;
    }
    return order;
  };
  Net.prototype.spread = function (seeds, th) {
    var self = this, sup = {}, rounds = 0;
    seeds.forEach(function (s) { if (!self.removed[s]) sup[s] = true; });
    while (true) {
      var add = [];
      this.alive.forEach(function (v) {
        if (sup[v]) return;
        var o = self.out[v];
        if (!o.length) return;
        var c = 0;
        o.forEach(function (j) { if (sup[j]) c++; });
        if (c * 100 >= th * o.length) add.push(v);
      });
      if (!add.length) break;
      add.forEach(function (v) { sup[v] = true; });
      rounds++;
    }
    var list = Object.keys(sup).map(Number).sort(function (a, b) { return a - b; });
    return { sup: list, rounds: rounds };
  };
  Net.prototype.dists = function (s) {
    var d = {}, q = [s], qi = 0, self = this;
    d[s] = 0;
    while (qi < q.length) {
      var v = q[qi++];
      self.out[v].forEach(function (w) { if (d[w] === undefined) { d[w] = d[v] + 1; q.push(w); } });
    }
    return d;
  };

  function passes(sup) { return sup.length >= MAJORITY && sup.indexOf(CEO) >= 0; }

  function seedsFor(g, strat, k) {
    if (strat === "org") return g.orgOrder().slice(0, k);
    if (strat === "indeg") return g.indegOrder().slice(0, k);
    if (strat === "btw") return g.btwOrder().slice(0, k);
    throw new Error(strat);
  }

  function randomAvg(g, k, th) {
    var r = mulberry32(SEED), tot = 0, ok = 0, pool0 = g.alive.slice();
    for (var d = 0; d < DRAWS; d++) {
      var pool = pool0.slice();
      for (var i = 0; i < k; i++) {
        var j = i + Math.floor(r() * (pool.length - i));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      var res = g.spread(pool.slice(0, k), th);
      tot += res.sup.length;
      if (passes(res.sup)) ok++;
    }
    return { mean: tot / DRAWS, passRate: ok / DRAWS };
  }

  function evaluate(data, net, strat, k, th, brokerLeaves, mine) {
    var full = new Net(data, net), seeds = null;
    if (strat === "mine") seeds = (mine || []).slice().sort(function (a, b) { return a - b; });
    else if (strat !== "random") seeds = seedsFor(full, strat, k);
    if (!brokerLeaves) {
      if (strat === "random") return randomAvg(full, k, th);
      var res = full.spread(seeds, th);
      return { seeds: seeds, support: res.sup.length, supporters: res.sup, rounds: res.rounds, passes: passes(res.sup) };
    }
    var broker = full.btwOrder()[0];
    var red = new Net(data, net, [broker]);
    if (strat === "random") return { broker: broker, after: randomAvg(red, k, th) };
    var stood = seeds.filter(function (s) { return s !== broker; });
    var a = red.spread(stood, th);
    var remapped = strat === "mine" ? stood : seedsFor(red, strat, k);
    var rr = red.spread(remapped, th);
    return { broker: broker, stood: stood, after: a.sup.length, afterPasses: passes(a.sup),
             remapped: remapped, remappedSupport: rr.sup.length, remappedPasses: passes(rr.sup),
             afterSupporters: a.sup, afterRounds: a.rounds };
  }

  function connectivity(data, net) {
    var full = new Net(data, net), broker = full.btwOrder()[0];
    var red = new Net(data, net, [broker]), cut = [], longer = 0;
    red.alive.forEach(function (i) {
      var b = full.dists(i), a = red.dists(i);
      red.alive.forEach(function (j) {
        if (j === i || b[j] === undefined) return;
        if (a[j] === undefined) cut.push([i, j]);
        else if (a[j] > b[j]) longer++;
      });
    });
    return { broker: broker, cut: cut, longer: longer };
  }

  var MINE_EXAMPLES = [
    ["ceo-plus-two-managers", "advice", [7, 1, 10], 65],
    ["three-level3", "advice", [1, 4, 10], 65],
    ["friendship-hubs", "friendship", [2, 7, 17], 65]
  ];

  function strip(r) { /* drop UI-only keys so the canon matches the reference exactly */
    var o = {};
    Object.keys(r).forEach(function (k) { if (k !== "afterSupporters" && k !== "afterRounds") o[k] = r[k]; });
    return o;
  }

  function canon(data) {
    var out = { n: data.n, ties: {}, nets: {}, mine: {} };
    NETS.forEach(function (k) { out.ties[k] = data[k].reduce(function (a, x) { return a + x.length; }, 0); });
    NETS.forEach(function (net) {
      var g = new Net(data, net), ind = g.indeg(), bt = g.betweenness(), node = {};
      node.indeg = g.alive.map(function (i) { return ind[i]; });
      node.btw = g.alive.map(function (i) { return bt[i]; });
      node.orgOrder = g.orgOrder();
      node.indegOrder = g.indegOrder();
      node.btwOrder = g.btwOrder();
      node.connectivity = connectivity(data, net);
      node.grid = {};
      THRESHOLDS.forEach(function (th) {
        KS.forEach(function (k) {
          var cell = {}, brk = {};
          STRATS.forEach(function (s) { cell[s] = evaluate(data, net, s, k, th, false); });
          STRATS.forEach(function (s) { brk[s] = strip(evaluate(data, net, s, k, th, true)); });
          cell["break"] = brk;
          node.grid[th + "-" + k] = cell;
        });
      });
      out.nets[net] = node;
    });
    MINE_EXAMPLES.forEach(function (m) {
      out.mine[m[0]] = { plain: evaluate(data, m[1], "mine", m[2].length, m[3], false, m[2]),
                         "break": strip(evaluate(data, m[1], "mine", m[2].length, m[3], true, m[2])) };
    });
    return out;
  }

  /* ---------- widget ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function f1(x) { return x.toFixed(1); }

  var STRAT_UI = [
    { id: "org", label: "Top of the org chart", note: "Pre-wire the CEO first, then the vice presidents with the biggest teams.", anti: true },
    { id: "indeg", label: "The most-asked people", note: "Highest in-degree: the managers the most colleagues go to (or name)." },
    { id: "btw", label: "The brokers", note: "Highest betweenness: who sits on the most shortest paths between two colleagues." },
    { id: "random", label: "Random, 200 seeded draws", note: "Pre-wire k people drawn at random; the bench prints the average." },
    { id: "mine", label: "Your own pick", note: "Choose up to 5 managers with the buttons under the map." }
  ];
  var NET_UI = { advice: "Advice ties: who goes to whom", friendship: "Friendship ties: who names whom" };

  var data, rootEl, els = {}, layout = null;
  var state = { net: "advice", strat: "org", k: 3, th: 65, brk: false, mine: [7, 1, 10] };

  function roleOf(id) {
    var lv = data.level[id - 1];
    if (lv === 1) return "CEO";
    if (lv === 2) return "Vice president";
    return "Manager, reports to " + data.reportsTo[id - 1];
  }
  function shortRole(id) {
    var lv = data.level[id - 1];
    return lv === 1 ? "CEO" : lv === 2 ? "VP" : "mgr";
  }

  function computeLayout() {
    var vps = [], teams = {}, i;
    for (i = 1; i <= data.n; i++) if (data.level[i - 1] === 2) vps.push(i);
    vps.sort(function (a, b) { return a - b; });
    vps.forEach(function (v) { teams[v] = []; });
    for (i = 1; i <= data.n; i++) if (data.level[i - 1] === 3) teams[data.reportsTo[i - 1]].push(i);
    var row = [];
    vps.forEach(function (v) { teams[v].sort(function (a, b) { return a - b; }); row = row.concat(teams[v]); });
    var pos = {}, x0 = 120, pitch = (846 - x0) / (row.length - 1);
    row.forEach(function (id, k) { pos[id] = { x: x0 + k * pitch, y: 268, r: 15 }; });
    var cx = 0;
    vps.forEach(function (v) {
      var xs = teams[v].map(function (id) { return pos[id].x; });
      var x = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
      pos[v] = { x: x, y: 150, r: 17 }; cx += x;
    });
    pos[CEO] = { x: cx / vps.length, y: 48, r: 19 };
    return { pos: pos, vps: vps, teams: teams };
  }

  function mapSvg(sup, seeds, removed) {
    var L = layout, pos = L.pos, ties = data[state.net], seen = {}, h = "";
    var supSet = {}, seedSet = {};
    sup.forEach(function (s) { supSet[s] = true; });
    seeds.forEach(function (s) { seedSet[s] = true; });
    h += '<svg viewBox="0 0 880 360" role="img" aria-label="The 21 managers laid out as the formal org chart, with ' +
      esc(state.net) + ' ties drawn between them; ' + sup.length + ' back the proposal">';
    for (var i = 1; i <= data.n; i++) {
      ties[i - 1].forEach(function (j) {
        var a = Math.min(i, j), b = Math.max(i, j), key = a + "-" + b;
        if (seen[key]) return; seen[key] = true;
        if (removed === a || removed === b) return;
        var p = pos[a], q = pos[b], on = supSet[a] && supSet[b];
        var d;
        if (p.y === q.y) {
          var bow = Math.min(90, Math.abs(q.x - p.x) * 0.28);
          d = "M" + f1(p.x) + " " + f1(p.y - p.r) + " Q" + f1((p.x + q.x) / 2) + " " + f1(p.y - p.r - bow) + " " + f1(q.x) + " " + f1(q.y - q.r);
        } else {
          d = "M" + f1(p.x) + " " + f1(p.y) + " L" + f1(q.x) + " " + f1(q.y);
        }
        h += '<path class="stk-e' + (on ? " is-on" : "") + '" d="' + d + '"/>';
      });
    }
    for (var id = 1; id <= data.n; id++) {
      var p = pos[id], cls = "stk-n";
      if (removed === id) cls += " is-gone";
      else if (supSet[id]) cls += " is-sup";
      if (seedSet[id]) cls += " is-seed";
      h += '<g class="' + cls + '" data-id="' + id + '">';
      h += '<circle cx="' + f1(p.x) + '" cy="' + p.y + '" r="' + p.r + '" fill="#FFFFFF"/>';
      h += '<text x="' + f1(p.x) + '" y="' + (p.y + 4) + '" text-anchor="middle">' + id + "</text></g>";
    }
    h += '<text class="stk-cap" x="12" y="52">CEO</text>';
    h += '<text class="stk-cap" x="12" y="154">VPs</text>';
    h += '<text class="stk-cap" x="12" y="272">managers</text>';
    L.vps.forEach(function (v) {
      var xs = L.teams[v].map(function (t) { return pos[t].x; });
      h += '<text class="stk-cap" x="' + f1((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2) + '" y="306" text-anchor="middle">reports to ' + v + "</text>";
    });
    h += '<text class="stk-cap" x="12" y="336">Filled: backs the proposal. Thick ring: pre-wired. Line: a tie in either direction.</text>';
    h += "</svg>";
    return h;
  }

  function seedsNow() {
    var full = new Net(data, state.net);
    if (state.strat === "mine") return state.mine.slice().sort(function (a, b) { return a - b; });
    if (state.strat === "random") return [];
    return seedsFor(full, state.strat, state.k);
  }

  function render() {
    var net = state.net, th = state.th, k = state.strat === "mine" ? state.mine.length : state.k;
    Object.keys(els.btns).forEach(function (id) {
      els.btns[id].classList.toggle("is-on", id === state.strat);
      els.btns[id].querySelector("input").checked = id === state.strat;
    });
    Object.keys(els.netBtns).forEach(function (id) { els.netBtns[id].classList.toggle("is-on", id === net); els.netBtns[id].setAttribute("aria-pressed", id === net ? "true" : "false"); });
    els.brk.classList.toggle("is-on", state.brk);
    els.brk.querySelector("input").checked = state.brk;
    els.kOut.textContent = String(state.k);
    els.thOut.textContent = th + "%";
    els.kRow.style.display = state.strat === "mine" ? "none" : "";
    els.pickRow.style.display = state.strat === "mine" ? "" : "none";

    var full = new Net(data, net), broker = full.btwOrder()[0];
    var plain = evaluate(data, net, state.strat, k, th, false, state.mine);
    var brk = state.brk ? evaluate(data, net, state.strat, k, th, true, state.mine) : null;
    var nAlive = state.brk ? data.n - 1 : data.n;
    var verdict, vcls, sup, seeds = seedsNow(), rounds = null;

    if (state.strat === "random") {
      var rv = state.brk ? brk.after : plain;
      verdict = "Modelled, averaged over " + DRAWS + " seeded draws of " + k + ": " + f1(rv.mean) + " of " + nAlive +
        " back it on average; the decision rule passes in " + Math.round(rv.passRate * DRAWS) + " of " + DRAWS + " draws.";
      vcls = rv.passRate >= 0.5 ? "is-good" : "is-bad";
      sup = [];
    } else if (!state.brk) {
      sup = plain.supporters; rounds = plain.rounds;
      verdict = "Modelled. Pre-wiring " + (seeds.length ? seeds.join(", ") : "nobody") + " on " + net + " ties at a " + th +
        "% threshold: " + plain.support + " of 21 back it after " + rounds + " round" + (rounds === 1 ? "" : "s") +
        ". Decision rule (11 or more, CEO included): " + (plain.passes ? "passes." : "fails.");
      vcls = plain.passes ? "is-good" : "is-bad";
    } else {
      sup = brk.afterSupporters; rounds = brk.afterRounds; seeds = brk.stood;
      verdict = "Broken on purpose. Manager " + broker + " (top betweenness) leaves. The plan as it stood: " + plain.support +
        " of 21 → " + brk.after + " of 20" + (brk.afterPasses ? ", rule still passes." : ", rule fails.") +
        (state.strat === "mine" ? "" : " Re-mapped on the smaller network (" + brk.remapped.join(", ") + "): " + brk.remappedSupport + " of 20.");
      vcls = brk.after < plain.support ? "is-bad" : "is-ok";
    }
    els.verdict.className = "mb-verdict " + vcls;
    els.verdict.textContent = verdict;

    function metric(label, val, unit, kind) {
      return '<div class="mb-metric"><span class="mb-mkind ' + (kind === "measured" ? "is-measured" : "is-heuristic") + '">' + esc(kind) + "</span>" +
        '<span class="mb-mlabel">' + esc(label) + '</span><span class="mb-mvalue">' + esc(val) + '</span><span class="mb-munit">' + esc(unit) + "</span></div>";
    }
    var conn = connectivity(data, net), ind = full.indeg(), bt = full.betweenness();
    var m = "";
    if (state.strat === "random") {
      var rr = state.brk ? brk.after : plain;
      m += metric("Average backers", f1(rr.mean), "of " + nAlive + ", over " + DRAWS + " draws", "modelled");
      m += metric("Rule passes", Math.round(rr.passRate * DRAWS) + " of " + DRAWS, "draws", "modelled");
    } else {
      m += metric("Backers", (state.brk ? brk.after : plain.support) + " of " + nAlive, state.brk ? "before the exit: " + plain.support + " of 21" : "after " + rounds + " round" + (rounds === 1 ? "" : "s"), "modelled");
      m += metric("Decision rule", (state.brk ? brk.afterPasses : plain.passes) ? "passes" : "fails", "11 or more, CEO included", "modelled");
    }
    m += metric("Top broker", "Manager " + broker, "betweenness " + f1(bt[broker]) + "; " + roleOf(broker), "measured");
    m += metric("If the broker leaves", conn.cut.length + " pairs cut off", conn.longer + " ordered pairs need a longer route", "measured");
    els.metrics.innerHTML = m;

    els.map.innerHTML = mapSvg(sup, seeds, state.brk ? broker : null);

    var t = '<table class="dt-table stk-cmp"><thead><tr><th>Who you pre-wire</th><th>People</th><th>Backers</th><th>Rule</th>' +
      (state.brk ? "<th>After the broker leaves</th>" : "") + "</tr></thead><tbody>";
    STRAT_UI.forEach(function (s) {
      var kk = s.id === "mine" ? state.mine.length : state.k;
      var r = evaluate(data, net, s.id, kk, th, false, state.mine);
      var b = state.brk ? evaluate(data, net, s.id, kk, th, true, state.mine) : null;
      var who = s.id === "random" ? "any " + kk : (r.seeds.length ? r.seeds.join(", ") : "nobody");
      var bk = s.id === "random" ? f1(r.mean) + " avg" : r.support + " of 21";
      var rule = s.id === "random" ? Math.round(r.passRate * DRAWS) + "/" + DRAWS : (r.passes ? "passes" : "fails");
      t += "<tr" + (s.id === state.strat ? ' class="is-cur"' : "") + "><th>" + esc(s.label) + "</th><td>" + who + "</td><td>" + bk + "</td><td>" + rule + "</td>";
      if (state.brk) {
        var cell = s.id === "random" ? f1(b.after.mean) + " avg of 20" :
          b.after + " of 20" + (s.id === "mine" ? "" : "; re-mapped " + b.remappedSupport);
        t += "<td>" + cell + "</td>";
      }
      t += "</tr>";
    });
    els.cmp.innerHTML = t + "</tbody></table>";

    var order = full.btwOrder();
    var rk = '<table class="dt-table stk-rank"><thead><tr><th>Manager</th><th>Formal role</th><th>' +
      (net === "advice" ? "Asked by" : "Named by") + "</th><th>Betweenness</th></tr></thead><tbody>";
    order.forEach(function (id) {
      rk += "<tr><th>" + id + "</th><td>" + esc(roleOf(id)) + "</td><td>" + ind[id] + "</td><td>" + f1(bt[id]) + "</td></tr>";
    });
    els.rank.innerHTML = rk + "</tbody></table>";

    els.pickBtns.forEach(function (b) {
      var id = +b.getAttribute("data-id");
      b.classList.toggle("is-on", state.mine.indexOf(id) >= 0);
      b.setAttribute("aria-pressed", state.mine.indexOf(id) >= 0 ? "true" : "false");
    });
    els.pickNote.textContent = state.mine.length + " of 5 picked: " + (state.mine.length ? state.mine.slice().sort(function (a, b) { return a - b; }).join(", ") : "nobody yet");
  }

  function toggleMine(id) {
    var i = state.mine.indexOf(id);
    if (i >= 0) state.mine.splice(i, 1);
    else if (state.mine.length < 5) state.mine.push(id);
    render();
  }

  function buildUI() {
    rootEl.innerHTML = "";
    var top = document.createElement("div"); top.className = "stk-nets";
    els.netBtns = {};
    NETS.forEach(function (n) {
      var b = document.createElement("button"); b.type = "button"; b.className = "stk-net"; b.textContent = NET_UI[n];
      b.addEventListener("click", function () { state.net = n; render(); });
      top.appendChild(b); els.netBtns[n] = b;
    });
    rootEl.appendChild(top);

    var panel = document.createElement("div"); panel.className = "mb-presets";
    els.btns = {};
    STRAT_UI.forEach(function (p) {
      var l = document.createElement("label");
      l.className = "mb-preset" + (p.anti ? " is-anti" : "");
      l.innerHTML = '<input type="radio" name="stk-strat" value="' + p.id + '">' +
        '<span class="mb-pname">' + esc(p.label) + (p.anti ? ' <em class="mb-anti">anti-lever</em>' : "") + "</span>" +
        '<span class="mb-pnote">' + esc(p.note) + "</span>";
      l.querySelector("input").addEventListener("change", function () { state.strat = p.id; render(); });
      panel.appendChild(l); els.btns[p.id] = l;
    });
    var bl = document.createElement("label"); bl.className = "mb-preset is-anti";
    bl.innerHTML = '<input type="checkbox" name="stk-brk"><span class="mb-pname">The broker leaves <em class="mb-anti">break</em></span>' +
      '<span class="mb-pnote">Remove the top-betweenness manager and re-run the same plan on the 20 who remain.</span>';
    bl.querySelector("input").addEventListener("change", function (e) { state.brk = e.target.checked; render(); });
    panel.appendChild(bl); els.brk = bl;
    rootEl.appendChild(panel);

    var kRow = document.createElement("div"); kRow.className = "ab-caprow";
    kRow.innerHTML = '<label for="stk-k">People you can pre-wire</label><input type="range" id="stk-k" min="1" max="5" step="1" value="3"><output id="stk-kout">3</output>';
    kRow.querySelector("input").addEventListener("input", function (e) { state.k = +e.target.value; render(); });
    rootEl.appendChild(kRow); els.kRow = kRow; els.kOut = kRow.querySelector("output");

    var thRow = document.createElement("div"); thRow.className = "ab-caprow";
    thRow.innerHTML = '<label for="stk-th">Backing a manager needs from their ties <span class="mb-mkind is-heuristic">modelled</span></label>' +
      '<input type="range" id="stk-th" min="30" max="80" step="5" value="65"><output id="stk-thout">65%</output>';
    thRow.querySelector("input").addEventListener("input", function (e) { state.th = +e.target.value; render(); });
    rootEl.appendChild(thRow); els.thOut = thRow.querySelector("output");

    els.verdict = document.createElement("p"); rootEl.appendChild(els.verdict);
    els.metrics = document.createElement("div"); els.metrics.className = "mb-metrics"; rootEl.appendChild(els.metrics);

    var c1 = document.createElement("div"); c1.className = "ab-card";
    c1.innerHTML = '<h4>The formal chart, with the real ties drawn on it <span class="mb-mkind is-measured">ties measured</span></h4>';
    els.map = document.createElement("div"); els.map.className = "stk-stage"; c1.appendChild(els.map);
    var pickRow = document.createElement("div"); pickRow.className = "stk-pick";
    els.pickBtns = [];
    for (var i = 1; i <= data.n; i++) {
      var b = document.createElement("button"); b.type = "button"; b.className = "stk-pb"; b.setAttribute("data-id", i);
      b.textContent = i + " " + shortRole(i);
      (function (id) { b.addEventListener("click", function () { toggleMine(id); }); })(i);
      pickRow.appendChild(b); els.pickBtns.push(b);
    }
    els.pickNote = document.createElement("p"); els.pickNote.className = "mb-hint"; pickRow.appendChild(els.pickNote);
    c1.appendChild(pickRow); els.pickRow = pickRow;
    rootEl.appendChild(c1);

    var grid = document.createElement("div"); grid.className = "ab-grid";
    var c2 = document.createElement("div"); c2.className = "ab-card";
    c2.innerHTML = "<h4>Every strategy at these settings</h4>";
    els.cmp = document.createElement("div"); els.cmp.className = "dt-tablewrap"; c2.appendChild(els.cmp);
    var c3 = document.createElement("div"); c3.className = "ab-card";
    c3.innerHTML = '<h4>Formal role against the network <span class="mb-mkind is-measured">measured</span></h4>';
    els.rank = document.createElement("div"); els.rank.className = "dt-tablewrap stk-rankwrap"; c3.appendChild(els.rank);
    grid.appendChild(c2); grid.appendChild(c3);
    rootEl.appendChild(grid);

    var hint = document.createElement("p"); hint.className = "mb-hint";
    hint.textContent = "Real rows: Krackhardt (1987), 21 managers of a small high-tech manufacturing firm; " +
      data.advice.reduce(function (a, x) { return a + x.length; }, 0) + " advice ties, " +
      data.friendship.reduce(function (a, x) { return a + x.length; }, 0) + " friendship ties and " +
      data.reportsTo.filter(Boolean).length + " reporting lines, as shipped in the CRAN package NetData 0.3 (GPL-2). " +
      "Measured: in-degree, betweenness and who can still reach whom. Modelled: who backs the proposal, by one shared threshold rule; " +
      "real people differ in how easily they move, so read the ORDER of the strategies, not the exact counts.";
    rootEl.appendChild(hint);
    render();
  }

  function init() {
    rootEl = document.getElementById("stk-bench");
    if (!rootEl || !root.STK_SAMPLE) return;
    data = root.STK_SAMPLE;
    layout = computeLayout();
    buildUI();
    root.STK_BENCH = {
      set: function (o) {
        o = o || {};
        ["net", "strat", "k", "th", "brk", "mine"].forEach(function (key) { if (o[key] !== undefined && o[key] !== null) state[key] = o[key]; });
        var kIn = document.getElementById("stk-k"), tIn = document.getElementById("stk-th");
        if (kIn) kIn.value = state.k;
        if (tIn) tIn.value = state.th;
        render();
        return els.verdict.textContent;
      },
      state: state,
      evaluate: function (net, strat, k, th, brk, mine) { return evaluate(data, net, strat, k, th, brk, mine); }
    };
  }

  var api = { mulberry32: mulberry32, Net: Net, evaluate: evaluate, connectivity: connectivity, canon: canon };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : this);
