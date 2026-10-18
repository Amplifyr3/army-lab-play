# F3 "Tactics: free fire": notes (Fable, 2026-10-18)

`tactics.html` is one file of vanilla JS and canvas 2D, no assets, opens from `file://`. Seed from `?seed=N`, `?calm=1` removes
the planning timer. Harness: `node tools/fun/tactics.test.mjs [touch|combat|perf|shots|bot|sims|all]` (msedge, hasTouch, DPR 2,
390x844 and 360x640). Test API on `window.__ft`. F2 stays live at `proto-f2`, F at `proto-f`.

F3 is F2 with the combat fixes from the owner's play. **The flight controls are unchanged**; the movement code sits behind one
boundary, `toPath(ship, worldPts)` → `CONTROLS[control]`, with `momentum` (F2's `strokeToPath`) as the only mode so far. A new
control mode plugs in there and nothing else moves (`__ft.control(name)` switches it).

## What changed from F2

1. **Only the active ship's arc.** The reveal keeps the silence, the heartbeat and the card flips, then the TAILING / HEAD-ON
   tags pop in one by one (each with a thin line between its two ships); no arc wall. During orders and fireworks the only
   sights on screen are the ship's whose turn it is (plus dashed lines to everything in them, and the line to its chosen
   target). **Tap-and-hold on any ship** (320 ms) shows that ship's arc while the finger stays; lifting hides it and gives no
   order.
2. **Shooting is always free.** On a ship's turn, tapping anything in its arc and range fires its base Attack dice; HOLD gives
   no order. Cards are optional boosts, at most one per ship per round: **Heavy Attack** (+2 dice, target inside 200) and
   **Shield** (+1 up to the maximum, *on top of the shot*; with nothing in arc, Shield then HOLD shields alone). The plain
   Attack card is gone. Flow per ship, still at most two taps: tap a target (default); or a boost card first, then the target;
   or HOLD. A Heavy card selected and a target beyond 200 tapped nudges the card and gives nothing.
3. **The loadout is 8 boost cards** (Heavy 4, Shield 4 by default; +/− within eight on the start card) and the hand is **2 a
   round**, so the decision is "which ship gets a boost", not "does everyone". With a 4-card hand of two card types every ship
   boosted every round and the cards stopped being a choice. Rivals bring 8 blended from their temperaments (Ram 6/2, Kite 2/6,
   Wisp 5/3 → about 4/4).
4. **Shield on top of the shot stays**: the sims say it is not too strong (next section). The alternative (Shield replaces the
   shot) is one constant, `SHIELD_WITH_SHOT`, if the owner wants to try it.
5. **No hull change.** Always-on fire roughly doubled shots per match (sweep: 11.4 from 5–6) and matches landed at a median
   of 10 rounds, inside the 8–12 the brief asked for, so the hulls stay as F2 set them.

Rival orders are still decided in secret at the reveal from the positions reached: the best free shot by expected damage
(kills first, the wounded preferred), plus Heavy if the target is inside 200 (or Shield when threatened or at ≤ 2 hull, if
in hand). Everything else (stats, momentum flight, flip, fireworks with E2's dice, the dead never act) is as in F2's notes.

## Test results (`node tools/fun/tactics.test.mjs all --seeds 24`)

**touch** (both viewports, real CDP touches): the loadout +/− (a + at eight does nothing, − disables BEGIN at seven), Calm and
BEGIN; the momentum checks from F2 unchanged (speed from the stroke, the turn limit and no backtracking, the Viper's loop at
speed 2 and "too fast to loop" at 4, flight in initiative order with final facing and the new speed, the timer, camera and
peek, the rival lean).

**combat** (both viewports): the reveal is silent with no arcs, three cards flipping in order at 0.75 s, still no arcs at
1.5 s; orders open on your Viper with exactly its arc on screen, zoomed in; the free shot targets are their Lancer (150) and
Brawler (263) and not their Viper, Heavy lit only on the Lancer, Shield only once the shield is down; **one real tap on the
Lancer fires for free** (order target r-lancer, boost null, both cards still in hand); a 500 ms press on their Brawler shows
its arc (plus the active ship's) and fires nothing on release; rival orders read as secret and are identical before and after
yours; Heavy then a target beyond 200 is refused, Heavy then the Lancer gives the boosted order and spends the card; Shield
then HOLD shields alone; the fireworks queue runs 6, 5, 4, 1, your Viper's Heavy rolls 5 dice and kills their 1-hull Viper
before it acts, your damaged Lancer's Shield lands in its own step (shield 1 after), and only one arc is on screen during the
fireworks; the reverse first strike (your 1-hull Lancer dies to their Viper and rolls nothing); the end card names the cause.

**perf** (DPR 2, fly + reveal + orders + fireworks): p50 0.5 / p95 0.9 / max 2.3 ms at 390x844; 0.5 / 0.9 / 2.0 at 360x640.
Bot decisions 1.4–1.6 ms p50 / 2.1–2.2 p95 at 4× CPU throttle.

**bot**: same seed → same rival paths and orders; rival paths frozen through your strokes; two scripted matches with one seed
identical; every candidate within the turn rate.

**sims** (24 seeds; greedy orders = the best free shot, Heavy if it fits, Shield when threatened or hurt):

| paths · orders | W–L–D | median rounds | dealt / taken | shots · Heavy · Shield per match | damage per bad read · per other | killed before acting theirs · yours |
|---|---|---|---|---|---|---|
| idle · greedy | 0–24–0 | 11 | 7 / 20 | 6.7 · 2.4 · 3.3 | 1.52 · 0.48 | 1 · 25 |
| random · greedy | 0–22–2 | 19 | 7 / 21 | 5.9 · 2.5 · 4.5 | 1.34 · 0.27 | 3 · 19 |
| sweep · hold | 0–24–0 | 10 | 0 / 17 | 0 · 0 · 0 | 1.33 · 0.69 | 0 · 0 |
| sweep · greedy | 11–13–0 | 10 | 16.4 / 16.3 | 11.4 · 6.1 · 2.5 | 1.38 · 0.55 | 28 · 23 |

- **Fights are shorter and denser**: the careful player fires 11 shots a match (F2: 5–6) and matches end in a median 10
  rounds (F2: 12); the hulls hold.
- **A careful predictor still beats a random flier**: 11 wins to 0 (random loses 22 and stalls twice).
- **A bad read is still punished**: 1.3–1.5 damage per ship-round in a rival's sights with nothing to shoot, against
  0.27–0.69 otherwise.
- **Initiative still shows**: 28 rivals killed before acting against 23 of yours for the careful player; the idle player is
  on the wrong end 25 to 1.
- The careful player's win rate fell from 15/24 to 11/24: free fire helps whoever has more ships in arc, and the rivals'
  planner is tuned for exactly that. A human who uses the reach fans should do better than the greedy script; if not, the
  first lever is Heavy for the rivals (Ram 6 of 8 is generous).

## What I would change next

- Show the free shot's dice next to each ringed target ("3d · Mid") so the choice between two targets is informed.
- A quicker fireworks beat for HOLD-only ships, and the toast "destroyed before it could act" as a pop on the ship.
- The control-mode slot is ready for the owner's new flight ideas.
