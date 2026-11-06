# Agent brief - shared by every fan-out page of learn-stakeholder-management-with-phoebe

Filled from `~/.claude/skills/course-builder/references/agent-brief.template.md` on 2026-11-06.
Internal build document: never link it from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   how many options each question has (4):
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-stakeholder-management-with-phoebe/courses/01-who-actually-decides.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams. Use
   ONLY its numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-stakeholder-management-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block (first 25 lines) for the palette tokens:
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-stakeholder-management-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "learn-stakeholder-management-with-phoebe / Session N of 6", #toggle-all,
#zoom-toggle) · masthead (eyebrow "Learn Stakeholder Management with Phoebe · Session N of 6", h1
with one `<span class="accent">`, .sub, .chip-row with the level chip (🟡 Core for sessions 2 and 3,
🟠 Deeper for sessions 5 and 6) + two .chip.audience + .chip.time "45 min", .agenda a1-a4 with flex
weights) · main.wrap · section#intro (Part 0: kicker, .lede, .legend pills as in the template,
.callout.win "★ What you walk out with tonight.") · 3 Parts, each `section.section#part-N` with
section-kicker (klabel "Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE
figure, `details.card` accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`,
`.caret ▶`), at least one `.callout.example` with `span.ex-pill` "Real world" on the page ·
section#demo-1 Build-along (kicker `.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure,
`.steps > .step`, each with a `<p>` then a `.prompt-box.good` carrying a `span.label`; the worked
content is Sunniva's at Fernhollow, and the learner writes their own beside it) · section#exercise
Homework (ol, 4 items) · section#quiz (3 x `.quiz-q data-answer="0-based"`, `p.qtext`, four
`button.qopt` "A · ..." to "D · ...", `p.qwhy`; one `p.quiz-score` after the last) ·
section#official, h2 EXACTLY "What this session teaches, and where it came from",
`.covered > .covered-row` (pill solid ✓ / light ◐ + name + note), then the `.mono` line EXACTLY
"Every fact on this page, and its verification tier, is recorded in the course's source map." ·
section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin this</span>", .grid-2 of six
.cheat-item) · `.callout.next` with `.nx-pill` "Next session" · footer.pagefoot ·
`<script src="../assets/app.js?v=1"></script>`.

Head: the template's social meta block with this page's own title/description/url (og:image stays
`https://phoebefu6.github.io/learn-stakeholder-management-with-phoebe/assets/og-cover.png`);
`<title>Session N · <title> - learn stakeholder management with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. Fernhollow numbers are constructed
  and say so. Never quote a bench number the map does not list.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
- Citations in the exact form of the map's appendix; anything marked reported says "reported";
  practitioner models say "practitioner model".
- NEVER "lottery" or "lotteries"; say the mechanism.
- Default to the English word. Any non-English term carries its English in brackets.
- No named real employers, no salary or pay figures, no "hire me" advice tied to a real company.
- Running cases are FICTIONAL: label "Constructed Fernhollow Freight example" (in a figure note,
  a callout or the lede) on every page. Never Phoebe's own journey, employers or clients.
- Quiz answer letters must vary across the three questions; use the order given in your outline.
- Titles, widget ids and class names must not collide with siblings. Banned titles: "A system you
  keep", "The one-page marketing plan", "Is it worth the time?", "Where your week actually goes",
  "Trust is a cadence, not a charm offensive", "Five executives, one steering rhythm", "In their
  shoes", "Pushing back well", "Who decides what", and every h1 in learn-data-pmo,
  learn-marketing-analytics, learn-team-management, learn-facilitation, learn-negotiation,
  learn-communication, learn-performance-management.
- Seams: say each relevant one out loud with an absolute link and do not reteach it (map section
  "Seams"). Power/interest grid, comms plan, RACI, steering cadence: Data PMO. Marketing/brand/BD
  scorecards and push-back scripts: Marketing Analytics p1-p4. Running the meeting: Facilitation.
  Interests, BATNA, trades: Negotiation. The bad-news message: Communication 06.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink `#13292C` · muted `#4F6366` · primary `#0B6E79`
· deep `#064A52` · mid `#095C66` · soft `#B5DDE1` · tint `#E8F5F6` · faint `#C9D8DA` · hairline
`#E3ECED` · sienna (the ONE contrast colour) `#B4532A` · sienna ink `#7A3416` · sienna tint
`#FBEDE5` · paper `#FBFDFD` · `#FFFFFF` · universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a
wrong-way panel. Text colours that pass AA on white/tint: ink, muted, primary, deep, sienna ink.
White text only on primary, deep, mid or sienna fills. Never sienna `#B4532A` text on the sienna
tint (4.36, fails); use sienna ink.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `s<session><letter>` (s2a, s2b, s2c, s2d;
  s3a...; s5a...; s6a...). Never reuse s1x or s4x.
- `<defs>` holds three things with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  `#0B6E79` line, opacity .5) when used, an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill
  none, ink stroke 1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none"
  stroke="#13292C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`; rects carry
  a tiny rotation (-4 to 4 degrees for hand-placed items, under 1 for panels). Fills: white, tint,
  the hachure for "the pile" or "the data", and sienna ONLY for the one thing the figure is about.
  One doodle anchor per figure, simple strokes, never a mascot. Text classes: `.PH` 800 12px ink
  heading · `.PL` 600 12px ink label · `.PS` 400 11px muted · `.PB` 800 11px sienna ink · `.PV`
  800 16-20px deep value · `.PW` 800 12px white on a fill · `.PA` 700 11px primary axis caption ·
  `.PN` 400 12px muted note. Hand-stacked items must not overlap as painted rects.
- ALL `<text>` outside any filtered group, sans stack, never below 10.5px.
- Fit: max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under 110
  chars; 40px between neighbouring point labels; bottom note 22px below the last row, H clears it
  by 8px. No line, arrow or curve may pass through a label (the gate fails it); a numbered badge
  is a filled circle with its number inside. When in doubt, shorten.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM, never a metaphor
  literally, never decoration.

## Voice and honesty

Every Part gets a story: the Fernhollow case (constructed) or a source from the map. Health: stress
here is workload and planning, never medical or clinical advice (said on the landing page and
session 1 already; do not give clinical advice anywhere).

## Cast (constructed Fernhollow Freight; use exactly these)

Sunniva Holm, head of data, reports to Kenji. Marguerite Vance, CEO. Halvard Lind, CFO. Odile
Mercer, COO. Rafe Okoro, Commercial director. Kenji Arai, CIO. Bram Tully, depot planning manager,
19 years, asked first by Odile and Marguerite. The proposal: one customer-data platform, one shared
customer record across sales, depots and billing, two years, budget in next year's IT plan, first
depot live by Q3. Measured-on and fears: the map's cast table. Session 1 decision path: Bram asked
first; Odile and Rafe can say no; Halvard, Kenji, Marguerite must say yes; conversation order 0
Kenji, 1 Bram, 2 Odile, 3 Rafe, 4 Halvard, 5 the room. Session 4 bench (real Krackhardt data, never
Fernhollow): chart-first pre-wiring 7 of 21, brokers 21 of 21, broker leaves 9 of 20, re-mapped 20.

## Cross-links (absolute URLs)

- Data PMO: https://phoebefu6.github.io/learn-data-pmo-with-phoebe/courses/a5-stakeholders-and-steering.html ,
  .../b6-stakeholder-management.html , .../b4-raci-and-rr.html , .../b8-conflict-management.html
- Marketing Analytics Partnership: https://phoebefu6.github.io/learn-marketing-analytics-with-phoebe/courses/p1-in-their-shoes.html ,
  .../p4-pushing-back-well.html
- Team Management: https://phoebefu6.github.io/learn-team-management-with-phoebe/courses/02-who-decides-what.html
- Facilitation: https://phoebefu6.github.io/learn-facilitation-with-phoebe/
- Negotiation: https://phoebefu6.github.io/learn-negotiation-with-phoebe/courses/01-positions-and-interests.html ,
  .../05-trade-across-issues.html
- Communication: https://phoebefu6.github.io/learn-communication-with-phoebe/courses/06-bad-news-and-disagreement.html
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

Footer left: "Session N of 6 · learn-stakeholder-management-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: "<a href="PREV">← Prev: <title></a> &nbsp;·&nbsp; <a href="NEXT">Next: <title> →</a>" (last page: "← Prev" and "<a href="../index.html">Course home</a>").

Session titles (exact, sentence case, one accent span in h1):
1. Who actually decides · `01-who-actually-decides.html`
2. What they are measured on, and what they fear · `02-measured-on-and-afraid-of.html`
3. Managing up · `03-managing-up.html`
4. The influence-network bench · `04-the-influence-network-bench.html`
5. Coalitions and pre-wiring · `05-coalitions-and-pre-wiring.html`
6. Losing a stakeholder, and the long game · `06-losing-a-stakeholder.html`
