# E "Flight": notes (builder, 2026-10-17)

`flight.html` is one file of vanilla JS and canvas 2D, with no assets, and it opens from `file://`. Seed comes from
`?seed=N` (default 1). Test harness: `node tools/fun/flight.test.mjs [touch|dice|perf|shots|sims|all]`, using msedge,
hasTouch, DPR 2, 390x844 and 360x640.

## Rules as built

- **World**: 400 x 840, letterboxed (`S = min(VW/400, (VH - safe-area-bottom)/840)`). Board y 0–560, panel y 560–840.
  Ship base B = 32. The Craft (cool `#62c8ff`) starts at (200, 470) facing up. The Husk (warm `#f08a5d`) starts seeded
  at x 120–280, y 92–112, facing down ±25°. Both ships have 2 shields and 3 hull.
- **Round**: Plan → Fly → Act → Shoot. The top strip shows the phase word, 4 phase pips, `R<n>`, and for each ship its
  shields (blue), hull (white) and Strain (amber). Nothing else is on the strip.
- **Manoeuvres**: each move is one constant-curvature arc, centre to centre, of length `B + 40·speed` (72 / 112 / 152).
  Straight turns 0°, Bank 45°, Turn 90°. A Flip flies straight at its speed and ends facing backwards; the spin plays in
  the last third of the flight. There are 15 arcs plus the Flip (Flip 1–3 when drawn; a tap gives Flip 2).
- **Difficulty**: green is Straight 1–2 and Bank 1–2. White is Straight 3, Bank 3 and Turn 1–2. Red is Turn 3 and the
  Flip. Red adds +1 Strain, green takes off 1 (minimum 0), white leaves it. While Strain ≥ 1, FOCUS is disabled
  (marked "Strained") and red moves are clamped: Turn 3 becomes Turn 2 on the same side, and the Flip becomes Turn 2 on
  the side you drew. The pad line turns white and the pad says "Strained: no Hard moves".
- **The Fan**: a translucent wedge bounded by the two Turn 3 arcs and by the curve of all speed-3 end points, with
  faint speed 1 and 2 rings. It is drawn from the Craft on the board, and the same geometry is drawn on the pad at
  scale K = 0.9 with 15 faint landing dots. The Husk's Fan is shown faintly in Plan as a prediction aid.
- **Fly**: FLY reveals the Husk's path and commits yours in the same frame. After a 300 ms hold, the Husk flies
  (0.7 s, ease-in-out, nose tangent to the arc), then the Craft flies. If a path leaves the board (the ship's centre
  comes within B/2 of the edge), the ship stops at the edge and takes +1 Strain; a red move also adds its own +1, and a
  green move gives no relief. The ship then loses its action, and you see "Clipped the void · +1 Strain". **Its heading
  then reflects off the void** (see Deviations). The preview shows a clip before you commit: the path stops at the edge
  with a red X, the rest is dashed, and the pad says "Clips the void".
- **Act**: you get FOCUS (big) and PASS. Focus puts a glowing ring on the Craft for this round. If you are strained or
  clipped, FOCUS is shown disabled and PASS fires by itself after 600 ms.
- **Shoot**: your Sights snap out: a 90° wedge to range 300 with Close / Mid / Far rings at 100 / 200 / 300, popping
  from 0.6 to 1.0 in 120 ms. The Husk's Sights are drawn too, faint, or strong when you are inside them. If the Husk is
  in your Sights, the target card appears showing the band, its pips, the bonus ("+1 Strike die (Close)" or "+1 Dodge
  die (Far)"), and whether it fires back. Tap the card or the Husk, then ROLL. Otherwise you see "No target in Sights".
- **Dice**: you roll 3 Strike dice (+1 at Close) against the Husk's 2 Dodge dice (+1 at Far). Dodges cancel Hits first,
  then Bursts. Hits take shields, then hull; Bursts take hull directly. Focus turns your Spirit faces into Hits, and your
  Spirit faces into Dodges when you defend. The Husk then fires back if you are in its Sights: 2 Strike dice, no Focus,
  no Close bonus, against your 2 Dodge dice (+1 at Far). A result reads like "2 Hits, 1 Burst · 1 Dodge → 1 shield,
  1 hull".
- **Arc-dodge**: a Shoot where the Husk is in your Sights and you are out of its Sights shows the toast "Out of its
  Sights" and counts on the end card.
- **End card**: shows a cause line with numbers ("Husk destroyed, round 5: a Burst through the hull, after 5 shots
  landed." / "Craft destroyed, round N: you sat in its Sights for K rounds and it landed M."), plus rounds, Strain
  taken, best shot, arc-dodges, shots landed / missed, rounds in its Sights and the seed. Buttons: **Again** (seed+1),
  **Same seed**, and a link to all prototypes.

## Stroke → manoeuvre

Pad space is pad units (world units of the panel) with the origin at the pad Craft's centre, x right and y down. One
board pixel is K = 0.9 pad units, so speed 3 is 137 pad units, which is 133 px on screen at 390 and 104 px at 360.

1. Resample the raw stroke every 3 units, take a moving average of 5 (centred, ends pinned), then resample every 6
   units to get headings.
2. **Bend** = the initial heading's offset from the nose, plus the sum of the wrapped heading deltas along the
   polyline. The initial heading is taken over the first `min(14, L/4)` units. The bend is counted from the nose because
   a stroke that starts sideways has already turned, exactly as the ship would on the board.
3. **Shape**: |bend| < 22.5° is Straight, < 67.5° is Bank, ≤ 112.5° is Turn. Beyond that, or if the end is more than
   6 units below the start, it is a Flip. The side is the sign of the bend.
4. **Speed**: for arcs, the speed comes from the arc length the chord implies at the quantised curvature,
   `disp · θ / (2 sin(θ/2))`. For a Flip it comes from the stroke's farthest reach. Thresholds are 83 and 119 pad units,
   the midpoints between the nominal 65 / 101 / 137 (see Deviations).
5. The plan updates live on every move once the finger has gone 12 px. The raw stroke is drawn thin and the quantised
   move bold in its colour, with the label under the pad Craft ("Bank 2 · Easy"), the ghost on the board, and the arc.
6. **Tap** (< 12 px and < 250 ms): picks the arc whose landing dot is nearest. A tap behind the pad Craft (y > 10)
   picks Flip 2, on the side of the tap. Redrawing or re-tapping replaces the plan.
7. One finger only: a second pointer is ignored from pointerdown to pointerup.

## Die faces

| Die | Faces (d8) | Glyph |
|---|---|---|
| Strike | Hit ×3, Burst ×1, Spirit ×2, Blank ×2 | Hit = filled diamond, Burst = four-point star, Spirit = small five-point star, Blank = empty |
| Dodge | Dodge ×3, Spirit ×2, Blank ×3 | Dodge = crescent arc |

Dice are rounded squares in the owner's colour. They tumble for 0.8 s, cycling faces with jitter (the visuals use
`Math.random`, so the game RNG is not touched by frame count), then settle one by one 80 ms apart with a pop and a
rising pentatonic tick. Focus flips flash white. A hit gives sparks, a 4 px nudge and `vibrate(20)`; a Burst adds a
brighter board flash and a deeper thump. Audio is created on the first touch.

## The Husk's bag and seeds

- The game RNG is `mulberry32(seed·31 + 7)` and is used for the Husk's choice and all dice. Start positions use
  `mulberry32(seed·7919 + 3)`.
- The bag is {Straight 2 ×3, Bank 1 ×2, Bank 2 ×3, Bank 3 ×1, Turn 1 ×2, Turn 2 ×2, Flip 2 ×1}. Each bank or turn is
  tried on both sides. Each candidate scores +3 if its whole path stays on the board (−9 if not), +2 if its end pose
  holds the Craft's *current* position in its Sights, and `0.25·count + rng()·2.2` as weight and noise. Red moves are
  removed while it is strained. It takes the best score. The plan is made at round start and hidden until FLY.

## Test results (final run, `node tools/fun/flight.test.mjs all`, commit after c56666b)

**touch** passes at both viewports. Every stroke is a real CDP `Input.dispatchTouchEvent`.

| check | 390x844 | 360x640 |
|---|---|---|
| forward 90 px | Straight 2 · Easy (lest 92) | Straight 2 · Easy (lest 118) |
| live during stroke | Straight 1 while the finger is down | same |
| gentle right bend (100 px, 45°) | Bank 2 · Easy (bend 42°) | Bank 3 · Steady (bend 43°) |
| U-turn | Flip 2 · Hard, Strain 0→1 after FLY | Flip 3 · Hard, Strain 0→1 |
| strained U-turn | Turn 2 · Steady R, clamped from Flip | same |
| preview = flight, 6 moves by real taps | Straight 1, Bank 2L, Turn 1R, Bank 3R, Turn 2L, Straight 3: d = 0, dh = 0 | same |
| tap near Bank 2R / behind | Bank 2R / Flip 2 | same |
| FLY + FOCUS (button) + card + ROLL | seed 1: Burst,Burst,Blank vs Dodge,Blank → 1 hull (2/3→2/2); seed 2: Hit,**Spirit**,Hit → Hit,Hit,Hit vs Dodge,Dodge → 1 shield. Return fire matched both times. | same |
| second finger | Straight 1 (finger 1 only) | same |
| button heights | FLY / ROLL 74 px, FOCUS 189, card 137 | FLY / ROLL 58 px, FOCUS 148, card 107 |

```json
{"viewport":"390x844","t1_forward":{"ok":true,"plan":"Straight 2 · Easy"},"t2_bank":{"ok":true,"plan":"Bank 2 · Easy"},"t3_flip":{"ok":true,"plan":"Flip 2 · Hard","strain":"0->1"},"t4_strained":{"ok":true,"plan":"Turn 2 · Steady","raw":"Flip 2 · Hard"},"t5_previewEqualsFlight":{"ok":true,"maxD":0},"t6_tap":{"ok":true,"near":"Bank 2 · EasyR","behind":"Flip 2 · Hard"},"t7_roll":{"ok":true},"t8_secondFinger":{"ok":true,"plan":"Straight 1 · Easy"},"buttons":{"flyPx":74.1,"allAtLeast56":true},"pass":true}
{"viewport":"360x640","t1_forward":{"ok":true,"plan":"Straight 2 · Easy"},"t2_bank":{"ok":true,"plan":"Bank 3 · Steady"},"t3_flip":{"ok":true,"plan":"Flip 3 · Hard","strain":"0->1"},"t4_strained":{"ok":true,"plan":"Turn 2 · Steady","raw":"Flip 3 · Hard"},"t5_previewEqualsFlight":{"ok":true,"maxD":0},"t6_tap":{"ok":true},"t7_roll":{"ok":true},"t8_secondFinger":{"ok":true,"plan":"Straight 1 · Easy"},"buttons":{"flyPx":57.9,"allAtLeast56":true},"pass":true}
```

The full JSON is in `shots/flight-results.json` after a run.

**dice**: 8000 rolls each, every face within ±1.5 points of nominal:

```json
{"strike":{"Hit":[37.5,37.86],"Burst":[12.5,11.91],"Spirit":[25,24.29],"Blank":[25,25.94],"ok":true},
 "dodge":{"Dodge":[37.5,36.36],"Spirit":[25,25.99],"Blank":[37.5,37.65],"ok":true}}
```

**perf**: 4 staged rounds of real flight, Focus and dice at DPR 2, last 300 frames, update and render time:

```json
{"viewport":"390x844","dpr":2,"p50":0.3,"p95":0.5,"max":0.6,"pass":true}
{"viewport":"360x640","dpr":2,"p50":0.3,"p95":0.4,"max":0.6,"pass":true}
```

**shots** (in `shots/`, both viewports): plan-flip, plan-clip, plan-bank, reveal (frozen mid-hold), husk-flies, act,
shoot-sights, dice-tumble, dice-tray, end. Console errors: none.

**sims** (extra): 40 seeds per bot, anim off. The bots only stroke the pad at landing spots. Their tie-breaks use
`Math.random`, so the numbers move by a game or two between runs.

| bot | W–L (none) | median rounds | Craft health left (of 5) | arc-dodges / game | clips / game |
|---|---|---|---|---|---|
| naive (random legal, avoids clips) | 11–23 (6) | 20 | 2.8 | 0.5 | 2.0 |
| brawler (keep the Husk in Sights) | 39–1 | 9 | 3.8 | 0.9 | 0 |
| careful (in my Sights, out of its Sights) | 40–0 | 6 | 4.1 | 0.8 | 0 |

## Deviations from the brief, and why

1. **Speed thresholds are 83 and 119 pad units, not 60 and 100.** Those are the midpoints between the nominal lengths
   on a pad where speed 3 is about 140 px (the brief allowed tuning). With 60/100, a stroke drawn exactly to the speed-1
   ring would read as speed 2. With midpoints, "draw to the ring" lands on that ring. The brief's 90 px forward stroke
   still gives Straight 2 at both viewports.
2. **Speed comes from the implied arc length, not raw displacement.** Raw chord length under-reads turns by 11%. For a
   Flip the stroke's displacement is near zero, so its speed comes from how far forward the stroke reached.
3. **The Flip keeps the drawn speed (1–3)**, as in DIRECTION-E §3, so there are 18 moves, not the 16 quoted. The label
   names the speed ("Flip 2 · Hard"). A tap behind the Craft picks Flip 2. The Husk's bag Flip is Flip 2.
4. **The bend counts from the nose**: the initial heading's offset from up plus the sum of deltas. A pure sum of deltas
   reads a straight diagonal stroke as Straight even though it ends off to the side, which would make the pad lie
   about where the ship goes.
5. **A clipped ship's heading reflects off the edge.** The brief only says "stops at the edge". Built that way, a ship
   facing the void was stuck forever: every forward move clips, every clip adds Strain, and Strain blocks the Flip. The
   first naive-bot run averaged 16.7 clips per game. Reflecting the heading is the build-around: you still pay +1
   Strain and lose your action, but you are facing back in. The turn plays in the last 20% of the flight so you see it.
   After the fix the naive bot averages 2.0 clips per game.
6. **A clipped move gives no green relief, and red still adds its +1.** If green relief applied, a clipped green move
   would net 0 Strain, and the "+1 Strain" toast would be untrue.
7. **The Husk has no Close bonus when it fires.** The brief and DIRECTION both say exactly "2 Strike dice (no Focus)".
8. **Small additions**, all aimed at clarity and explainable losses: the Husk's Fan is shown faintly in Plan, the
   Husk's Sights are shown in Shoot, the card says whether it fires back, "Out of its Sights" is a toast, the preview
   warns about the void, the round number shows as `R<n>`, and there is a link to all prototypes on the end card.

## What I would change next

- **Make the Husk bite.** The brawler wins 39 of 40 by sitting in the Husk's Sights. Arc-dodging only shortens the
  fight (9 → 6 rounds) and saves about one health point. The Husk's 2 dice against 2 Dodge cannot punish a careless
  player. Give it 3 Strike dice at Close, or give it Focus on rounds it is not strained, so that sitting in its arc
  costs a hull every two rounds.
- **Drop the card-then-ROLL double tap when there is one target.** With a single target the card tap is ceremony. Keep
  the card as information and make ROLL live at once (one tap). The pick matters only once there are squads.
- **Give Act a real choice.** With Focus as the only action and no downside, PASS is never right. Add Dodge or a
  sidestep from DIRECTION §4 so that Act is a decision.
- **Telegraph the Husk** with a tell (it favours banks toward you), so Plan is a prediction rather than a guess. The
  reveal is the best moment in the loop, and it deserves a mind to read.
- On the 360x640 pad, a speed-3 Flip's end ghost touches the top of the pad. A slightly smaller K (0.85) would give
  more room.
