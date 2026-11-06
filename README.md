# Learn Stakeholder Management with Phoebe

Six 45-minute sessions on managing up and sideways for data and AI leads: the map of who decides,
what they fear, and how a data leader earns the room. Static site, no build step: open `index.html`.

1. Who actually decides
2. What they are measured on, and what they fear
3. Managing up
4. The influence-network bench
5. Coalitions and pre-wiring
6. Losing a stakeholder, and the long game

The running case, Fernhollow Freight, is constructed for teaching.

## The bench (session 4)

`assets/stk-live.js` computes in-degree, betweenness and reachability in the browser from the real
advice, friendship and reports-to ties of 21 managers in Krackhardt, D. (1987), Cognitive social
structures, Social Networks 9(2):109-134. The rows are the copy shipped in the CRAN package NetData
0.3 (GPL-2), `data/kracknets.rda`; `materials/build-stk-sample.py` rebuilds `assets/stk-sample.js`
from it. Who backs a proposal is modelled by one stated threshold rule and labelled as modelled.

`materials/stk_reference.py` (standard library only) reproduces every bench number;
`node materials/stk-node.js` prints the browser engine's numbers; `materials/compare-ladder.py`
checks they agree by value.

by Phoebe Fu
