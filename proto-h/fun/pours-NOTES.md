# Pours: notes (grey-box, proto-a)

File: `public/fun/pours.html` (one file, vanilla JS + canvas, opens from `file://`).
Fantasy: *my Core holds three star spirits; each pour is a different kind of spark, and the right spark at the right moment wins.*

## Rules as built

- **Board.** 360×620 world units, scaled to the phone. Your Core bottom-centre (hp 120), two rival Cores up top (hp 100),
  each with 3 turrets (hp 20, range 44) that must fall before the Core can be hit. Broken turrets rebuild after 30 s unless
  enemy Breakers are close. Rifts (black discs) are impassable. Territory is a 24×44 grid, coloured by nearby sparks.
- **Production.** Each Core adds one spark to its pool every ~0.8 s, scaled by land held (0.7 + 1.2 × land share). Cap 60
  per crew, counting the pool plus every spark on the board (dug-in Wardens included).
- **Three kinds, one loop: Breakers > Wardens > Swarmers > Breakers.**
  - **Ember / Breakers** (red-orange, fat arrowhead): hp 3, slow (26), the only kind that damages turrets and Cores.
    They deal ×3 to Wardens. In open fights Swarmers out-shoot them (Swarmers deal 2, Breakers deal 0.25 to a Swarmer).
  - **Moss / Swarmers** (green, thin dart): hp 1, fast (50), win ship-vs-ship, stamp a wider patch of land, can't hurt
    turrets or Cores (they deal 0.25 to Wardens).
  - **Tide / Wardens** (blue, diamond, then hexagon): fly to the point and dig in as a line of blue hexes (14 per row,
    then a staggered second row) across the direction they came from. Dug in: range 36, fire every 0.35 s, 2 damage to a
    Swarmer. Enemy sparks can't pass a dug Warden. Breakers crack them.
  - Same kind against same kind trades evenly. Fights resolve in 1–3 s, so a losing matchup melts where you can see it.
- **Control (at most 2 taps).** Tap a spirit button (it lights), then tap the board: the whole pool pours out as that kind
  (a stream, 30 sparks a second). Tapping a rival Core gives a kind-specific order: Breakers assault it, Swarmers raid its
  door (they hold 72 units out and fight whatever comes out), Wardens wall it off (80 units out, facing you). Tapping your
  own Core calls everything home, and the sparks rejoin the pool (that is how you re-type). The lit spirit stays lit, so the
  next pour is one tap. Tapping the lit button while it is pouring does nothing.
- **Holding.** Swarmers and Breakers that reach a point hold it, chase anything within 70, and drift home to the pool after
  12 s with nothing to fight. The land they claimed stays claimed. Wardens stay dug in until recalled.
- **Long-press powers** (25 s cooldown, a glowing pip on the button means ready): Ember drops a bomb on your last tap
  (1 s warning ring, 3 damage to sparks, 8 to turrets); Moss gives your Swarmers +50% speed for 5 s; Tide restores every
  Warden to full hp. Bots have no powers (a grey-box simplification).
- **Attuned spirit** (gold star on its button): +30% hp and damage for that kind this round. It stands in for the draft.
- **Rivals.** Each crew is a constellation with a favourite kind. It pours in a readable rhythm (Breaker crew: B B S B W;
  Swarmer crew: S B S S B; Warden crew: W B W S B; rusher: B B B S B B), with a 12% surprise. Every 7–10 s it checks its
  pool. With at least 18–22 sparks (12 for a rusher) it picks a target: you 38% of the time, otherwise the weakest Core.
  **Telegraph:** for 3 s a ring in the kind's colour grows around its Core, with the kind's silhouette and a label
  ("BREAKERS → YOU"), plus a dotted line to the target. When the target is you, a banner says
  `Corsairs: BREAKERS → you · answer Moss` and the answering button pulses.
- **Bot defence (same rules).** When enemy sparks ordered at its Core come within 160, a bot telegraphs a home pour
  (3 s): 65% its favourite kind, 35% the true counter. Swarmers and Breakers sortie out to meet the threat; Wardens dig in at
  the door. If its cap is parked on the board for 12 s it calls those sparks home.
- **End.** Win: break both rival Cores. Lose: your Core breaks. At 5:00 the Surge triples damage to turrets and Cores.
  At 7:00 the round ends as "Stalled". The end card gives one cause sentence that names the matchup (from what happened in
  the last 40 s), then time, taps, pours, powers, sparks broken and lost, and a 6-line decision log (your last 4 decisions
  plus the 2 moments that decided it).
- **Seeds** (the variety engine, shown on the start card). Each seed sets the rivals' kinds, the rifts and your attuned spirit:
  1. Corsairs + Draco, both Breaker crews, open board, Moss attuned.
  2. Lyre + Draco, both Warden crews, two rifts make three narrow lanes, Tide attuned (a deliberate mismatch).
  3. Corsairs rushers (first Breakers launch at ~0:13, then a pour every ~8 s) + Orion Swarmers close on the right, Ember attuned (race them).
  4. Hydra Swarmers + Lyre Wardens, rifts squeeze your Core into a pocket, Ember attuned.
  5. Hydra Swarmers + Corsairs Breakers, one mid rift, Tide attuned: every answer is needed.
  Random seeds draw names, kinds, a 25% rusher, 0–2 rifts and the attuned spirit.

## How it was tuned (headless sims in the page: `__pours.simulate(seed, policy, arg)`)

Policies: `idle`; `only k` (pours one kind at the weakest Core every 12 s); `answer pace` (reads the tells after a 1.5 s
reaction, answers with the counter, opens a rival's door with the counter to its favourite kind, then sends Breakers;
at most one decision every 6–10 s × pace). Final sweep, 5 seeds:

| | result |
|---|---|
| idle | loses 5/5 (0:38 on the rusher seed, 1:05–3:20 elsewhere) |
| one kind only (Breakers, Swarmers, Wardens) | 0/15 wins: Breakers-only loses its Core while the pool is out; Swarmers-only stalls (they can't hurt Cores); Wardens-only loses in about a minute |
| answer, 6 paces (0.6×–1.4×) | 25/30 wins, median 2:49. Seeds 1–2 6/6 (2:05–3:13), seed 3 5/6, seed 4 4/6, seed 5 4/6 (4:20–7:00) |

What moved the numbers:
- Bots poured too often and too small, so nobody died, and the idle player survived. Bigger pours (18–22), slower thinking
  (7–10 s), a fixed rhythm with Breakers woven into every crew, and a 38% lean at you made idle lose and pours readable.
- A bot recall bug sent 54 Breakers home mid-assault. Bots now only recall sparks parked on the board.
- Defenders won every assault, so rounds stalled. Turrets now hit Breakers for 0.6, Breakers move at 26, matchups are
  sharper (Swarmers deal 2 to Breakers, Breakers 0.25 to Swarmers, Wardens 0.3 to Breakers), and bot defence sorties out
  to meet the threat instead of hugging the Core. That last change is what makes "wall their door, then send Breakers" work.
- Holders that never went home ate the cap and froze production. The 12 s drift home fixed it; walls still cost cap (the
  Warden trade-off).
- Seeds were reordered so seed 1 (Breaker crews: Moss first, then strike) is the friendliest, seed 2 is its opposite
  (Ember first), and the mixed Hydra + Corsairs board is seed 5.

## How the bots think (a small table, not a planner)

`idle → (pool ≥ minPour and think timer) → pick kind from rhythm → pick target (you 38%, else weakest Core by hp + distance)
→ telegraph 3 s → pour all`. Separately, every 0.6 s: "are sparks ordered at my Core within 160?" → telegraph a home pour
(8 s cooldown). Order shapes are the same as yours: Breakers on a Core, Swarmers raid its door, Wardens wall its door or a
lane point 42–52% of the way there.

## The three most different seeds

- **Seed 1 (two Breaker crews, open board).** The game is defence-first: Breakers arrive every 20–30 s, and Swarmers shred
  them. Then you counter-punch while their pool is empty. Wins come from good timing.
- **Seed 2 (two Warden crews, three narrow lanes).** The opposite: Wardens dig into the lanes and at your door, and the
  answer is Breakers almost every time. Your attuned Tide is a trap. Going straight from seed 1 to seed 2 flips your
  instincts.
- **Seed 3 (Breaker rusher plus a close Swarmer crew).** The first rush launches at ~0:13 and lands at ~0:30, so you must read the
  first red ring and pour Moss within about 15 s, or you lose at 0:38. After that it is a race with attuned Ember while Orion's Swarmers raid
  your door, which calls for a Tide wall.

## Clarity at phone size (390×844)

- Kind is read by silhouette and fill (arrowhead / dart / diamond-hex). Crew is read by outline and trail colour. A rival's
  Swarmers and your own differ only in a 1.1 px outline and the trail, which works at 390 wide but is weak at 360×640:
  the board shrinks to about 245 px wide because the world is tall. Wider worlds on short phones, or bigger sparks, would help.
- The tell (ring, icon, label, dotted line, banner, pulsing answer button) is very readable. If anything it is too
  helpful: the banner names the answer. The owner may want it gone after the first few rounds.
- Core labels and tell labels can overlap rival sparks near the top edge. Dug Warden clumps in narrow lanes (seeds 2 and 4)
  read as a blob more than a line.
- The rusher seed kills an idle or slow player at 0:38. That is intended, but it is the harshest first minute.

## What I would change next

1. **A "half pour" toggle** (a small ½ chip in the dock). Whole-pool pours make every defence all-in, and that is why the
   sims lose seed 5: the player over-answers a 20-spark raid with 60 Wardens. A half pour would add the trade decision every
   10–15 s that the diagnosis asks for.
2. **Make the draft real.** Before PLAY, offer 3 spirits and pick 2 to sit beside the champion, so "attuned" is a choice
   and not a gift.
3. **Give bots one power each** (the same long-presses) with the same 1 s warning ring, so the rules are truly symmetric.
4. **Wardens recall per wall** (tap a wall to call home just it), so re-typing doesn't mean calling everything home.
5. **Kind-keyed omens** ("Wardens dig in twice as fast", "no Breakers before 1:00") as the next layer of the variety engine.
6. Scale the world to the phone's aspect ratio so 360×640 phones get bigger sparks.

## Test hooks

`window.__pours`: `start(seed)`, `select(k)`, `tapWorld(x, y)`, `power(k)`, `step(dt)`, `state()`, `ships()`,
`simulate(seed, 'idle' | 'only' | 'answer', arg)`, `perf` (frame time samples), `board()` (screen mapping for taps).
Measured frame time on desktop Edge (390×844, dpr 2) at the busiest moment found in a sweep (~100–120 sparks):
average 0.6–0.9 ms, p95 1.0–1.4 ms, worst frame 1.5–3.4 ms across three runs (budget 8 ms). Peak spark count seen: 119.
