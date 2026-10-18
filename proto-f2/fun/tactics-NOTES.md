# F2 "Tactics with momentum": notes (Fable, 2026-10-18)

`tactics.html` is one file of vanilla JS and canvas 2D, no assets, opens from `file://`. Seed from `?seed=N` (default 1),
`?calm=1` removes the planning timer. Harness: `node tools/fun/tactics.test.mjs [touch|combat|perf|shots|bot|sims|all]`
(msedge, hasTouch, DPR 2, 390x844 and 360x640). Test API on `window.__ft`. F (the previous build) stays live at `proto-f`.

## Ships: basic stats only

| Type | Initiative (yours / theirs) | Hull | Shield | Attack | Defence | Speed (start) | Turn radius at min speed |
|---|---|---|---|---|---|---|---|
| Viper (nimble) | 6 / 5 | 3 | 1 | 3 | 3 | 2–4 (3) | 18 |
| Lancer (fast) | 3 / 4 | 4 | 1 | 3 | 2 | 3–5 (4) | 44 |
| Brawler (sturdy) | 2 / 1 | 6 | 2 | 3 | 1 | 1–3 (2) | 40 |

The rivals mirror the types (Ram flies the Brawler, Kite the Lancer, Wisp the Viper). The stats sit on each timeline card
(initiative top-left, speed top-right, hull and shield pips) and in the zoomed panel line ("Viper · I6 · Atk 3 Def 3 · Speed 3
(2–4) · Hull 3/3 · Shield 1/1"); the flipped combat face shows A/D.

## Movement with momentum

- **Speed sets the path length**: 60 units per point of speed. Next speed is within one step of the current one, inside the
  type's range. The speed comes from the stroke's length (rounded to a step and clamped), so a short dab slows down and a
  long pull speeds up; the meter under the strip shows the steps and "speed 2 → 3".
- **Turn rate**: the minimum turn radius is `r0 × (1 + 0.6 × (speed − min))`, so slow is tight and fast is wide. The drawn
  stroke is flown by pure pursuit (lookahead 22 units, or 0.9 × the radius for a tight ship) at that limit: the path starts
  along the nose, eases in, and never snaps. Where the ship cannot follow the finger the line **stiffens** (a taut white core)
  and the meter says "at its turn limit". A stroke shorter than the speed's length straightens the rest.
- **No backtracking**: the heading only changes at the turn rate, so a U-turn stroke becomes the tightest arc the ship can
  fly (a Lancer at speed 5 bends 178° at most over its 300). **Loops** are a deliberate gesture: a stroke that curls 300° or
  more drops the ship to the slowest speed it can reach this turn, and if its turn rate there closes a circle the flown path
  is that circle plus the remainder straight (the one place the stroke is not pursued point by point: a 14 px circle under a
  finger is not a fair ask). Only the Viper can, and only at speed 2 (120 of length on a radius of 18 is 382°; at speed 3 the
  radius is 28.8 and the meter says "too fast to loop"); from speed 4 it needs a turn of slowing first. The Lancer's maximum
  turn is 234° / 195° / 178° by speed, the Brawler's 86° to 117°.
- **Reach is a fan**: for each rival, one filled fan per speed it may fly next turn (the region between its tightest left
  and right arcs and the locus of arc ends), outlined at its widest. Your active ship shows its own fans with every outline.
- **Flight in initiative order**: low first, one ship at a time (0.85 s each, camera on the mover), the rest wait. A path
  leaving the board stops at the edge, faces back in, and drops the ship to its minimum speed.
- The 9 s timer commits the drawn path, or a straight hold at the current speed. Calm removes it. Two fingers peek.

## Combat

1. **The reveal** (kept from F): 0.45 s of silence, heartbeat, the six cards flip one by one (the back shows A/D, hull and
   shield; rivals show "?"), arcs snap on in initiative order with the relation lines and TAILING / HEAD-ON tags. Reads are
   scored here: a ship with a rival in its sights and none on it read well; one in a rival's sights with nothing to shoot
   read badly.
2. **Orders, ship by ship, high initiative first.** The camera zooms onto each ship. For yours, the shared hand (4 cards drawn
   from the 10-card loadout, reshuffled when the draw pile runs dry) slides up with the ship's stat line; a card is lit only
   if a target sits in that ship's arc and range (Heavy inside 200; Shield only while the shield is below its maximum). Two
   taps for an attack (card, then the gold-ringed target), one tap for Shield, HOLD to give no order. One card per ship.
   Rival ships get a 0.6 s pass ("orders in secret"): their orders were decided at the reveal from the positions reached
   and their own hand, and never change with yours.
3. **Fireworks**: orders resolve high initiative first, one every 1.25 s, the camera framing attacker and target. Dice tumble
   for 0.42 s, settle, then the damage lands with sparks, a nudge and a thump; a burst flashes. **A ship destroyed before its
   turn never acts** (toast, and the end card counts it both ways).

**Cards**: Attack = your Attack dice at a target in arc; Heavy Attack = Attack +2 dice, only inside 200 (the cost is
positional: you must have closed in, which is what a good read buys); Shield = +1 shield up to the maximum. **Dice** are E2's
d8 Strike (3 Hit, Burst, 2 Spirit, 2 Blank) against Dodge (3 Dodge, 2 Spirit, 3 Blank): Dodges cancel Hits then Bursts; Hits
take shield then hull; a Burst goes to hull. +1 Strike die at Close (≤ 100), +1 Dodge die at Far (> 200). I kept dice rather
than a flat rule because the fireworks are a show: a 3-vs-3 roll that reads "1 Hit · 1 Dodge → no damage" is a moment, a
fixed 0.9 damage is a spreadsheet; the expected values still drive the bots.

**Loadout** (on the start card, remembered on the device): Attack 5, Heavy 2, Shield 3 by default, +/− within ten; BEGIN
waits for ten. The rivals bring 10 cards blended from their temperaments (Ram 4/4/2, Kite 5/1/4, Wisp 5/3/2 → about 5/3/2).
No picks, no growing deck: one match.

## Bots

The honest planner from E2/F over 39 momentum candidates per ship (7 constant-curvature arcs, 2 S-curves, 2 turn-then-straight
and 2 straight-then-turn, at each allowed speed), scored at the end poses against 15 predicted ends per enemy (5 arcs per
allowed speed, weighted naive-straight 45 % — 80 % when that ship's last path was nearly straight — and reasoned by what would
light a shot on the bot). Utility in expected dice damage: A × my best card on them (discounted 15 % when they shoot first) −
D × their best on me + tail + range + kill, minus off-board and crowding; softmax inside a window of the best, seeded. Ram
noses in (Heavy at Close), Kite circles one hand and shields, Wisp hunts the rear. Rival orders: expected damage with the kill
bonus and a preference for the wounded; Shield when threatened or at ≤ 2 hull. Decision cost: p50 0.3 ms, p95 0.5 desktop;
1.5–2.2 ms at 4× CPU throttle.

## Test results (`node tools/fun/tactics.test.mjs all --seeds 24`)

**touch** (real CDP touches, both viewports): loadout +/− by taps (a + at ten does nothing, − enables nothing until ten
again), Calm, BEGIN; the Brawler at speed 2 drawn 400 px flies speed 3 for exactly 180, starting along its nose, and a 20 px
dab flies speed 1 for 60; a hook tighter than the Lancer can turn stiffens (76 % of the path at the limit, every heading
step within the rate) and a U-turn stroke bends 99–106° of a possible 178°, never back; a 30 px circle on the Viper at speed 3 is a
loop at speed 2 (curl 354°, the flown turn 351°); the same circle at speed 4 is "too fast to loop" (flies speed 3, bends 183–201°);
the candidate generator loops only at speed 2 and the Lancer never can;
flight runs one ship at a time in initiative order 1→6, each ending at its path's end facing its final direction with its
new speed; the 1 s timer commits a hold at the current speed and a stroke in progress as drawn; the camera zooms to 0.76–0.82
against an overview of 0.42, two fingers peek and draw nothing; a rival's pass shows a lean.

**combat** (both viewports): the reveal is silent for 0.45 s, three cards are flipping in order at 0.75 s, orders open on
your Viper (initiative 6) with the camera zoomed in (0.56–0.61 vs 0.30–0.32) and 4 cards up; on a staged board Attack lights
their Lancer (150) and Brawler (263) but not their Viper (out of arc), Heavy only the Lancer, Shield nothing at full shield
and your Viper once damaged; two real taps give "Heavy → their Lancer", the hand drops to 3, the next ship comes up after the
grace, rival orders read as secret and are identical before and after your orders; one tap on Shield orders a damaged Lancer;
the fireworks queue runs 6, 5, 4, 1, your Viper's Heavy rolls 5 dice at Mid and kills their 1-hull Viper, which never acts
(killed-before-acting 1); the other way round your 1-hull Lancer with an order dies to their Viper first and rolls nothing;
the end card names the cause.

**perf** (DPR 2, fly + reveal + orders + fireworks): p50 0.5 / p95 1.0 / max 1.9 ms (390x844); 0.5 / 0.9 / 1.9 (360x640).

**bot**: same seed → same three rival paths across re-plans and restarts, different seeds differ (10 of 10); rival paths
frozen through your strokes; two scripted matches with one seed identical over 19 planning rounds; every candidate within
the turn rate.

**sims** (24 seeds; greedy orders = the biggest expected damage, kills first, Shield when threatened or hurt):

| paths · orders | W–L–D | median rounds | dealt / taken | reads good · neutral · bad | damage per bad read · per other | killed before acting theirs · yours |
|---|---|---|---|---|---|---|
| idle (hold course) · greedy | 0–24–0 | 13 | 7 / 20 | 27 · 363 · 192 | 1.45 · 0.51 | 2 · 21 |
| random candidates · greedy | 1–21–2 | 17 | 6.5 / 21 | 47 · 506 · 257 | 1.40 · 0.25 | 1 · 18 |
| sweep (the planner for you) · hold | 0–24–0 | 9 | 0 / 17 | 99 · 278 · 78 | 1.37 · 0.80 | 0 · 0 |
| sweep · greedy | 15–9–0 | 12 | 17 / 16 | 133 · 438 · 111 | 1.32 · 0.40 | 30 · 20 |

- **A careful predictor beats a random flier clearly**: 15 wins against 1, and it reads well 133 times to the random
  flier's 47 while reading badly 111 times to 257.
- **A bad read is punished**: a ship that ends in a rival's sights with nothing to shoot takes 1.3–1.45 damage that
  round, against 0.25–0.5 for any other ship-round, for every policy.
- **Initiative shows**: with your Viper at 6 the greedy player kills a rival before it can act 30 times in 24 matches
  and loses a ship that way 20 times; the idle player, who rarely has a shot lined up, is on the wrong end 21 to 2.

## Deviations from the brief, and why

- **Heavy's cost is range (inside 200), not a once-per-match or a lost Shield**: it ties the card to the read, which is
  what the owner wants rewarded, and it needs no bookkeeping on a phone.
- **Shield restores +1 up to the maximum** (not "adds"): at +2 over the maximum, shield cards outpaced damage and a third of
  matches stalled at 30 rounds; now Shield is lit only while the shield is down.
- **Rival orders are decided at the reveal** (from the positions reached and their hand), not during their camera pass, so
  they cannot depend on your orders; the pass is only the beat that shows whose turn it is.
- **Range 300 and 60 units per speed point** (F had 240 and 70): with momentum, contact at 240 was fleeting and matches
  dragged; this keeps a 3-ship brawl to about 12 rounds.
- **The flight camera follows the mover** and the whole fly phase takes about 6 s for six ships; the brief asked for brisk.

## What I would change next

- A speed label on the ghost at the tip of the tether, and the rival fans tinted by speed so a reader can tell "it can only
  reach the near band if it slows".
- A held order shows on the strip ("—") and the fireworks skip a ship with nothing to do a little faster.
- The orders hand could show the expected dice for the selected card against each lit target.
- Rival decks as real hands are in; their temperaments could also bias the order (Ram prefers Heavy even at worse odds).
