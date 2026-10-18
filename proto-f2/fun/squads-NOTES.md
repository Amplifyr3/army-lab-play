# Squadrons: notes (grey-box prototype D)

**File:** `public/fun/squads.html`: one file, vanilla JS and canvas 2D, opens from `file://`.
**Fantasy:** "My spirits each lead a squadron. I slide them with my fingers; how I move them decides the fight."
**Test harness:** `node tools/fun/squads.test.mjs [sims|touch|perf|shots|all]`, run from the worktree (msedge, `hasTouch`,
390×844 and 360×640, DPR 2). Options: `--seeds=1,2`, `--pols=idle,ball,brace-flank`, `--runs=20` (battle variants per
seed), `--v` (one line per game), `--log=brace-flank`, `--T=key:value` (tuning override). Screenshots and
`squads-sims.json` go to `shots/` (untracked).

## Rules as built (one page)

- **Field.** World 400×640 portrait. Your Core (gold hexagon, crown ring) is bottom centre; the rival's (cyan on seeds
  1, 3, 5; violet on 2, 4) is top centre. Each side's deploy zone (30 % of the board) is tinted. Voids are impassable
  and pathed around on a 16-unit BFS grid with line-of-sight smoothing. Clock 2:30. Each Core gauge starts at 100. A
  gauge at 0 ends the round at once. At time-out the higher gauge wins; an equal gauge is a draw.
- **A card is a spirit leading a squad** of 6–15 sparks in a formation: Lancers a wedge of darts, Pikes a two-rank
  line of chevrons, Archers a loose double arc of rings, Breachers a 3-wide block of hexes. The spirit (a large glyph
  with a morale ring) sits behind the formation, and a small tick shows its facing. Hue marks the side only.
- **Hands.** Pointer events with one capture per finger, so two fingers steer two squads, or one steers while the
  other deploys. Drag a dock card up to deploy it: dropped in your zone it appears there; dropped elsewhere it
  appears at your Core and marches to the point. To steer, touch within 44 px of a squad (or 64 px below it). After
  6 px of movement or 180 ms of holding, the squad's goal is the finger **plus a 64 px upward offset**, updated on
  every pointermove. There is no easing on input. The squad moves at its type's speed and its facing follows its
  travel. A dashed ghost formation marks the goal. On release it carries on to the goal and keeps its facing. Tap a
  squad or its dock chip (under 180 ms and 6 px) to cast its ruse. Tap the clock to pause.
- **Types.**
  - **Lancers** (64/s): after 1.2 s at full speed, without turning more than 60° from the heading where the run
    started, the charge lights (a white trail and a front arc). Contact while charging deals impact damage (0.32 per
    spark, ×1.5 vs Archers, × the facing factor). It also costs the target 25, 35 or 45 morale, staggers it 0.5 s,
    knocks it back and scatters its sparks. Charging Lancers take a quarter of Archer fire. A stop, a turn over 60°,
    contact, or dust drops the charge.
  - **Pikes** (30/s): still and unengaged for 1 s (and not turning or sieging) → braced, with a bristle over the front
    120°. A charge into the bristle, which reaches 7 units further than contact, is **impaled**: the Lancers lose 55 %
    of their sparks and 70 morale, and they rout. Braced Pikes do not turn. They unbrace when they move, engage or
    siege.
  - **Archers** (36/s): when still for 0.4 s and unengaged they fire at the nearest visible enemy within 110 inside
    ±80° of their facing, and keep that lock (a dashed tracer) until it leaves range. 0.065 per spark per second,
    ×1.5 vs Pikes.
  - **Breachers** (19/s): 2.2 hp per spark, a third of a charge's damage ignored, a third of morale damage taken,
    weak in melee, siege at 3.0/s.
  - **Melee:** touching squads fight; each attacks the foe most in front of it. Damage is 0.035–0.10 per spark per
    second; the favoured side of **Pikes > Lancers > Archers > Pikes** gets +50 %.
  - **Facing:** a hit from more than 60° off the defender's front is a **flank** (+50 %, −10 morale and −3/s); more
    than 120° is a **rear** hit (+100 %, −20 and −6/s). A red FLANKED!/REAR! pop marks it. A contact between countered
    types shows a ▲/▼ pill with both glyphs for 0.6 s. Stopped, unengaged, unbraced squads that are not firing turn
    toward the nearest visible enemy within 220 at 60°/s.
- **Morale** (0–100) falls with lost sparks (60 × fraction lost), flank and rear hits, charges, ambushes, and a
  neighbour routing or breaking (−10). It recovers +4/s when still and unengaged, +10/s within 120 of your Core, and
  +15 on a ruse. Below 25 the squad **routs**: it flees home at 1.3×, cannot be steered, takes +50 % damage, trails
  white streamers, and rallies at 50 at home or after 5 s. A squad that loses every spark **retreats**: its chip turns
  face-down with a countdown (12–25 s by cost), then it comes back at full strength at your Core. A squad at your Core
  and unengaged heals 2 sparks/s.
- **Siege.** An unengaged, non-routing squad inside the enemy Core's ring (48) drains its gauge: Breachers 3.0/s
  (4.5 under Bounty), Pikes and Archers 0.8, Lancers 0.6. The Core shoots the nearest enemy in the ring, one spark per
  1.5 s, so a clean Breacher siege is worth about 45 gauge.
- **Resolve:** both sides fill at the same rate (1 per 5 s, start 1, max 12), shown as 12 pips per side in the top
  bar. Ruses have a 0.8 s wind-up ring and their cost shown on the board for both sides. A ruse that is still active
  cannot be re-cast by accident. **Fury** 4: +60 % damage, +25 % speed, charge lights in 0.6 s, 8 s. **Rampart** 5:
  braced at once and even in melee, bristle ±90°, no flanks, 8 s. **Whirlpool** 6: enemies inside a 54-ring 62 ahead
  are pulled in and held 2.5 s. **Bloom** 4: friends within 80 get +4 sparks and +30 morale. **Bounty** 3: 10 s, each
  spark killed gives +1 Resolve, Breachers siege ×1.5.
- **Conditions.** **Nebula:** still 1 s inside → hidden from the other side. The AI cannot see or target it; you see an
  enemy in a nebula as a faint shimmer. Your own hidden squads get a dotted ring. Its first strike (contact or a
  volley) within 1.5 s of leaving hiding counts as a flank (AMBUSH!). **Starfall:** a dashed orange lane for 6 s with
  a countdown, then it burns 2 s; every spark inside dies, on either side. It never covers a Core. **Dust:** 0.6×
  speed, no charge inside.
- **Danger banner:** a siege on your Core (with the rate), a Lancer run lined up at your Archers, their Breachers past
  the middle, a rival push (told 4 s ahead), a Starfall tell.
- **Muster:** seed chips 1–5 and "?" each name the rival deck. The selected seed's line gives the deck, its make-up,
  the field and the "ask". The rival's spirits are shown as sigils. Your deck is shown as tiles (cost, glyph, name,
  ruse, affinity gem). Up to 5 cards, cost ≤ 8 on a ring with 8 ticks. The pre-pick is Vulpecula, Scutum, Lyra and
  Ara (8.0) or your last pick. PLAY is one tap. "reset deck" is on the card.
- **End card:** one sentence of cause with numbers, for example "Won on the clock, 96 to 70: your Breachers sieged
  their Core 10 s (−31 gauge) while their charges impaled on your Pikes ×3 (−20 sparks)", or "Lost: you never deployed
  a squad; their Breachers sieged your Core 0:41 unopposed (−79 gauge)". Below it: time, drags, taps, sparks lost and
  killed, Resolve spent by both sides, a 6-line log of the heaviest moments, and the rival deck. **On a win, pick 1 of
  3** spirits from an 8-card pool (Leo: wide charge, Crux, Virgo, Aquila: long range, Orion, Canis, Cassiopeia: swift,
  Delphinus). The pick is saved in `localStorage` under `squads-deck-v1` and appears on the muster tagged "new".
  Again, Next seed, Home.

**Not built:** Turncoat (optional in the brief). Sound (deferred, as the direction says).
**Deviation:** the brief's default pick (Vulpecula, Taurus, Lyra, Ara) costs 9, not 8, so the default swaps Taurus
for Scutum.

## The seeds

| Seed | Rival | Field | The ask |
|---|---|---|---|
| 1 | Riders: Pegasus, Equuleus, Monoceros (L), Sagitta (A) | open; nebula left; small void right | brace, keep Archers behind, punish the bait |
| 2 | Spearwall: Draco, Hydra (P), Sagittarius (A), Cetus (B) | two voids leave one centre choke and two thin side passages; dust in front of the choke | go around; Lancers for their Archers; never charge the front |
| 3 | Siege train: Cetus, Crater (B), Draco (P), Columba (A) | a void wall down the middle (twin lanes); Starfall ×3 across the middle (0:34, 1:10, 1:48) | stop the train from the flank, or race it on the other lane |
| 4 | Ghosts: Lupus, Vela (L), Hydra (P), Musca (A) | two nebulae; small centre void | scout, don't park Archers, ambush them back |
| 5 | Riders + Cetus (+1 cost) | void left; Starfall ×2 (0:46, 1:38) | defend and counter-siege |

Random seeds draw a deck and one or two conditions.

## How each AI deck thinks

All decks think every 1.5–2.5 s, act 0.6–1.0 s after deciding, and steer one squad per think. Standing "follow"
orders (the train, escorts) count as that squad's order. They never see a hidden squad, use the same Resolve and
ruses (with the same wind-up), and deploy their hand in the first 4 s. In priority order each think:
1. Pull a squad out of a told Starfall lane. A train moves as a column by moving its lead so every follower clears the lane.
2. Defend the Core: the nearest free squad goes straight at anything within 95 of it. A Lancer strikes if it is
   already lined up.
3. Finish a routing squad of yours with a free Lancer.
4. Finish a run-up into its strike.
5. A Lancer pulls out of melee after 1.6 s, or at once against Pikes or below 50 morale, so it can charge again.
6. Flank: when one of your squads fights one of theirs head-on, a free Lancer charges its flank or rear.
6b. Raid your Core when no squad of yours is staying home (Breacher first, then Archer, then Lancer).
7. **Pushes:** three per round (about 0:34, 1:16, 1:56, 24 s each, told 4 s ahead): Breachers walk in down the lane
   with fewer of your squads in it, Lancers hunt with a lower bar, Archers move up to 96 from your nearest squad,
   Pikes escort the Breacher.
8. The personality, then heal at home under 35 %, then return to posts.

- **Charges** (all decks): the AI picks an approach point 118 out on the target's rear, flank or front, never inside a
  braced bristle's arc and never through another braced Pike. It runs up there, then strikes through the target, aiming
  50 past it and leading it by 70 % of the travel time.
- **Riders:** the Archer is the **bait**, shown forward on the open side (y 300). Two wings wait 92 to each side of it.
  When anything of yours comes within 120 of the bait, the wing that waited longest charges its flank, then the
  other. The **hunter** Lancer charges whatever scores highest: isolated, facing away, an Archer or Breacher, low
  morale, already engaged. Pikes are scored down. Wings idle for 6 s also hunt, at a higher bar. Fury is cast on a
  Lancer that is striking.
- **Spearwall:** two Pikes brace in the choke (or at y 232). When something of yours sits off their front within 115,
  a braced Pike re-faces with a 6-unit step (its brace drops for a second). The Archer stands 62 behind and steps back
  from anything within 70. The Breacher walks in at 0:40, or from 0:14 once any squad of yours is engaged, or during
  a push. Rampart goes up when a Lancer of yours is running at a Pike.
- **Siege train:** one lane (seeded left or right). The lead Pike steps 70 down the lane when the way ahead is clear,
  the first Breacher is closed up, and no Starfall is told on the step. The Breachers and the Archer follow at 30, 58
  and 88 behind. A Breacher that is hit sends the Pike at its attacker. Once the lead is in your half, or stalled for
  8 s, the Breachers break for your Core while the Pike blocks whatever is near them. Bounty goes up while sieging.
- **Ghosts:** both Lancers sit hidden in the nebulae. Anything of yours that comes within 165 is charged from hiding,
  which counts as a flank. The Pike hides in a nebula and jumps anything within 60. The Pike walks in at 0:40 and the
  Archer at 0:52 if the way is quiet.

## Policy results (headless, 20 battle variants per seed, `sims --runs=20`)

| Policy | Seed 1 Riders | Seed 2 Spearwall | Seed 3 Siege train | Seed 4 Ghosts | Seed 5 Riders + B |
|---|---|---|---|---|---|
| idle (never touches) | 0W 20L | 0W 20L | 0W 20L | 0W 20L | 0W 20L |
| ball (deploy all, drag the clump at their Core, the Breacher sets the pace) | 6W 14L | 0W 20L | 2W 18L | 14W 6L | 0W 20L |
| brace-flank (Pikes braced in front of the Archers, Lancers on flanks, Breacher walks in down the quiet side) | 10W 7L 3D | 17W 3L | 14W 6L | 20W 0L | 5W 15L |

Idle loses everything; the median idle loss comes at 1:04–2:01, with the gauge drained by Breachers or by Lancer and
Archer raids. The ball loses to Spearwall (20/20) and to the Riders (14/20). The brace-flank bot wins seed 4 every
time and seed 1 half the time (10 W, 3 draws). Its seed-1 wins and losses are mostly 2–8 gauge apart: it impales 2.5
Rider charges a round, but its Breacher rarely gets a clean siege past three Lancers. It loses 6 of 20 on seed 3.
Seed 5 is the hard one. Averages per brace-flank game:

| Seed | Gauge you/them | Impales (theirs) | Charges you/them | Ambushes | Starfall sparks you/them | Their gauge from |
|---|---|---|---|---|---|---|
| 1 | 96 / 92 | 2.5 | 12 / 13 | 0.9 | 0 / 0 | Lancers |
| 2 | 92 / 81 | 0 (yours 0.3) | 5 / 0 | 0 | 0 / 0 | Breacher |
| 3 | 67 / 55 | 0 (yours 2.5 on the train's Pike) | 11 / 0 | 0 | 2 / 15 | Breachers, 32 a round |
| 4 | 98 / 80 | 0.9 | 15 / 6 | 6.5 | 0 / 0 | almost none |
| 5 | 93 / 96 | 2.8 | 14 / 13 | 0 | 7 / 5 | Lancers + Breacher |

The bots are crude: they cast ruses from simple tells. Without ruses the brace-flank bot won seed 1 only 1–2 times
in 12. A human who reads the danger banner and times Rampart and Fury should do better on 1 and 5.

## Touch tests (real CDP `Input.dispatchTouchEvent`)

Both 390×844 and 360×640, DPR 2:
- Deploy drag from the dock: the squad lands exactly at the drop point (120, 470).
- Steer drag: one rAF after the second move, the goal is 64 px above the finger, the squad is held and moving.
  Held still, the squad sits 64 px above the finger (not under it).
- A long straight Lancer drag lights the charge 1.35 s after the touch starts.
- Two fingers hold two squads at once.
- On release the squad keeps walking to its goal.

## Frame time

A staged brawl (seed 5, every squad of both sides thrown into the middle every second; 8 squads, 6–8 engaged at peak),
Edge desktop, DPR 2, 8 s window:

| Viewport | p50 | p95 | max |
|---|---|---|---|
| 390×844 | 0.4 ms | 0.6–0.7 ms | 9–10 ms (single spikes, GC/host) |
| 360×640 | 0.4–0.5 ms | 0.6–0.7 ms | 7–9 ms |

At most about 120 sparks and a 320-particle pool. Console: no errors in any run.

## Tuning table (what moved, and why)

| Knob | Start | Now | Why |
|---|---|---|---|
| Core fire | 1 hp/s | 1 spark / 1.5 s (design value) | at 1 hp/s every siege bled out in ~10 s and rounds ended 98/100 |
| Lancer siege | 0.4/s | 0.6/s | Riders and Ghosts had no way to score against a defender |
| Breacher hp per spark | 1.7 | 2.2, and charges into Breachers ×0.7 | "very tough": three Lancers killed a walking Breacher in seconds |
| Breacher morale damage | ×1 | ×0.35 | Breachers routed 1–4 s after reaching a Core; no siege ever landed |
| Pike contact radius | 13 | 16 | a two-Pike wall let squads slip between them |
| Spearwall wall | above the choke | inside the choke | flanks covered by the voids, so "go around" means the side passages |
| AI raids | only if your Core is empty | whenever no squad of yours stays home | a ball always left home empty and never paid for it |
| AI pushes | none | 3 × 24 s, told 4 s ahead | without them the AI turtled; rounds had no rhythm and no threat |
| Siege train | lead advanced only with a clear road | assaults once in your half or stalled 8 s; dodges Starfall as a column | it parked forever in front of a braced Pike and burned in every Starfall |
| Friendly separation | always | only between parked squads | Spearwall's Breacher was stuck behind its own wall |
| Ruse re-cast | allowed | blocked while active | Bounty was being spent four times in ten seconds |
| Tried and left off | home-ground +30 % damage (`homeGround`), Core fire on every sieger (`fireAll`) | 1.0 / 0 | both just made the ball stronger or weaker on all seeds at once |

## The three seeds that felt most different

- **Seed 2 (Spearwall)** is the "don't" seed. The rival never charges. Everything that walks into the choke meets a
  braced bristle and Archers behind it; your own Lancers get impaled if you charge the front. The round is decided by
  their Breacher walking down a side passage while you are busy, and by whether you take the side passages yourself.
- **Seed 3 (Siege train)** is a race. Both sides land real sieges (30–45 gauge each). Three Starfalls cut the middle:
  the train stops for them, and the player who times a strike into the train as it waits wins. The gauges move
  more than on any other seed.
- **Seed 4 (Ghosts)** is about not parking. About six ambushes a round. Squads that stop next to a nebula get charged
  in the flank by something they could not see. A cheap scout into a cloud, or a Pike braced facing it, flips it.

Seed 1 is the reference fight: charges and counter-charges, impales on a good brace, and wins by small margins.

## What I would change next

1. **Seed 1 margins are small.** Against the Riders most rounds end 92–98 to each other; 3–8 gauge from one raid
   decides it. Options: a fourth push, or a Riders Breacher on a timer so there is a real siege to stop.
2. **Breacher escort as a gesture.** Escorting with one finger per squad is hard. A "drag two squads at once with two
   fingers held together" gesture, or a Pike that follows the Breacher it touches, would make the siege play humane.
3. **Clarity at 360×640:** a brawl of four squads reads as a knot. Sparks of the losing side could pale as morale
   falls, and the hero glyph could pulse when routing.
4. **Sound** for the charge light, the impact thump, the impale crack and the bristle ring.
5. **Turncoat** (magenta, 7) as a late pick.
6. The AI's one-order-per-think rule makes defence slow by design. Against a human that is the point, but the
   "defend" step could be allowed to interrupt a pending order.
