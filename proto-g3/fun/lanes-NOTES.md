# Lanes: notes (grey-box prototype D2)

**File:** `public/fun/lanes.html`: one file, vanilla JS and canvas 2D, opens from `file://`, 163 KB.
**Fantasy:** "Three of my spirits each lead a squadron. The sky is a board of routes. I send them down the right route at
the right moment with one gesture, and the sky holds its breath while I decide."
**Test harness:** `node tools/fun/lanes.test.mjs [sims|touch|perf|shots|all]`, run from the worktree (msedge, `hasTouch`,
`isMobile`, DPR 2, 390×844 and 360×640). Options: `--seeds=1,2`, `--pols=idle,ball,counter`, `--runs=20`, `--v` (one line
per game), `--log=counter` (full log of variant 0), `--T=key:value` (tuning override). Output goes to `shots/`
(untracked): `lanes-sims.json` and the `lanes-*.png` screenshots.

## Rules as built (one page)

- **Board.** World 400×640 portrait, drawn as a graph. Your gate (gold hexagon) is the bottom node, theirs the top one.
  Node kinds: **post** (soft disc), **choke** (rock waist; only a front and a rear edge), **pocket** (violet haze, one
  edge in), **gate**. Edges: **lane** (broad band), **cross-link** (thin), **flank route** (dashed curl), pocket spur
  (dashed). A small diamond marks the middle of every edge long enough to charge on (≥ 110, not dust). Four shapes
  (Trident, Ring, Spine, Twin chokes), mirrored left/right by seed. The Spine's two flank curls leave from the gates
  and arrive on the side of the second post (yours from your gate to their S2; theirs from their gate to your S3). Each side holds one squad per post; a second friendly
  squad waits on the edge just short of it.
- **Squads.** Three a side, picked from a hand (cost ≤ 6). Each is a 64 px disc with the spirit's type glyph filling it,
  a morale rim, and its sparks as a fan of dots on the side it faces. They start **mustered** in front of the gate
  (smaller, dashed discs). Mustered squads are handles, but they neither fight nor block a siege until their first order,
  which deploys them. A squad that breaks comes back the same way: READY at the gate after its countdown. D's types and
  numbers, except Breachers walk at 24/s (D: 19): Lancers 64/s, Pikes 30/s, Archers 36/s, Breachers 2.2 hp per spark.
- **Gestures** (one finger; a second finger is ignored). A gesture starts on a **handle**: the nearest own disc within
  56 px, or its **dock card** (three cards, 96–106 px tall, along the bottom). Touches anywhere else do nothing and never
  slow time.
  - **Flick** (≥ 28 px within 300 ms, then lift): go along the route out of the squad's node (or the node it is heading
    to) whose direction is closest to the flick, within 75°. No route within 75° = **Stand**. A Lancer's long open edge
    = **CHARGE**. Walks pass through plain posts (a lane in, a lane out) when nothing is within 150.
  - **Hold** (still ≤ 16 px for 250 ms): **Stand** at once (Pikes start their 1 s brace, Archers set and fire). The squad
    faces the edge its nearest seen threat is coming in by. While held, its routes light up with how it would arrive
    (FRONT / FLANK / REAR / HIDE / CHARGE / BACK / SIEGE), plus a Focus arc around the disc.
  - **Hold, then drag** ≥ 28 px: the snapped route highlights under the finger; lift commits; no route = Stand.
  - **Swipe home:** a flick whose route is closer to your gate *and* further from theirs pulls back: one parting hit
    from each foe in contact (no morale lost), one node back. A board flick that ends on the dock recalls the squad all
    the way home. From a dock card, a flick down always pulls back.
  - **Tap** (< 250 ms, < 16 px): the spirit's ruse if Resolve covers it; otherwise the card wobbles and the cost pops.
  - **Tap the clock:** pause (Resume / Home). Every order prints its word on the squad for 0.8 s (GO, CHARGE, FLANK →,
    REAR!, HIDE, SIEGE, STAND, BRACE, FIRE, FALL BACK, HOME, the ruse name) and vibrates 15 ms. Your routes stay drawn
    as a bright line until the squad arrives.
- **Time rule.** While a handle is held, the sim runs at 25 %, paid from a 5 s **Focus** pool. It refills at 1 s per
  1.5 s when no finger is down. Empty Focus: 100 % while touching, and the arc blinks red. The arc shows around the held
  squad and beside the clock, which reads "25%" while slow. Start-card switch: **Focus 5 s / unlimited** (saved).
  Slow-time seconds are counted for the end card.
- **Facing and hits.** A squad at a node watches one edge: up the lane by default, or the threat's edge after a Stand.
  An enemy arriving by the watched edge hits the **front**. Any other edge is a **flank** (+50 %, −10 morale), or the
  **rear** (+100 %, −20) when the edge is more than 120° from the watched one. A walking squad faces where it walks. A
  pill shows ▲/▼ with both glyphs at a counter contact, and FLANKED! / REAR! / AMBUSH! / IMPALED! pop on the hit.
- **Counter web** (D's): Pikes > Lancers > Archers > Pikes, +50 %. A Lancer's **charge lights at the edge's midpoint**
  (a quarter with Fury) and hits on contact: 0.32 per spark × counter × facing. A charge that reaches an empty post
  stops and drops. A charge into a **braced Pike's front is impaled**: −55 % sparks, −70 morale, a rout. Archers standing
  standing still (at a node, queued on an edge, or at the enemy gate) fire at the nearest seen enemy on an adjacent edge
  or post, within 185, and keep the lock. Contact is at
  56; a squad in contact closes to 40 and no further, so a strike down a cross-link reaches a squad fighting on the lane.
- **Morale, rout, respawn, siege, gates, Resolve:** D's rules and numbers. Rout below 25: the squad walks home at
  1.3× and cannot be ordered ("routing · 4 s"); it rallies at the gate or after 5 s. A squad that loses every spark
  goes face-down in the dock for 12–20 s (by cost), then returns mustered at the gate. Gates heal friends 2 sparks/s
  and shoot one enemy spark per 1.5 s. Siege rates: Breachers 3.0/s (4.5 under Bounty), Pikes and Archers 0.8,
  Lancers 0.6. **A squad fighting at the enemy gate keeps sieging**: Breachers at full rate (they are the siege), the
  rest at half; Bounty's ×1.5 only counts while the Breacher is unopposed. Defending a gate means killing the sieger,
  not just touching it. **The castle's defenders turn:** a squad at (or within 110 of) its own gate meets every arrival
  front-on, for both sides, so home defence is never a flank or rear hit. Resolve:
  12 pips a side, 1 per 5 s. Ruses with the 0.8 s wind-up both sides see: Fury 4, Rampart 5, Whirlpool 6 (holds enemies
  within 140 for 2.5 s), Bloom 4 (friends within 140: +4 sparks, +30 morale), Bounty 3.
- **Conditions.** **Pocket:** a squad still 1 s in a pocket is hidden (enemy hidden squads are not drawn at all). Its
  first strike within 1.5 s of leaving is a flank (AMBUSH). **Starfall** on a named edge: told 5 s ahead (dashed orange
  with a countdown and a banner), then burns 2 s; a squad on the edge loses all its sparks in about 0.9 s, either side.
  Squads at its end nodes are safe. **Dust:** 0.6× speed, no charge.
- **Round.** 2:00. Gates 100. A gate at 0 ends the round; at time-out the higher gauge wins, equal is a draw.
- **Danger banner** (top), in this priority: a siege on your gate (with the rate); a told or running charge at your
  Archers (with the seconds); a Starfall on the route your squad is on; their Breacher past the middle; a push told
  ("PUSH in 4 s: right lane").
- **Start card:** seed chips 1–5 and "?" with deck and board ("Riders / Trident"); the seed line (deck, make-up,
  conditions, ask); the rival's three sigils; your hand as tiles with 3 pre-picked (cost ring with 6 ticks); PLAY;
  the Focus switch; reset deck. **End card:** a cause sentence with numbers ("Won 100–37: your Breachers sieged their
  gate 1:00–1:26 (−64)", "Lost 10–100: your squads never left the gate; their Lancers sieged your gate 0:31–2:00 (−91)
  while your squads were away"), then seed, time, orders by kind, slow-time seconds, sparks lost and killed, Resolve
  spent by both sides, a 6-line log, and the rival deck. On a win you **pick 1 of 3** from an 8-card pool, saved under
  `lanes-deck-v1`. Again / Next seed / Home.

## The seeds

| Seed | Rival | Board | Conditions | The ask (start card) |
|---|---|---|---|---|
| 1 | Riders: Pegasus, Equuleus (L), Sagitta (A) | Trident | dust below the centre choke; Starfall on the left cross-link at 0:52 | brace a Pike before you bite their bait, then hit the bait from the far side |
| 2 | Spearwall: Draco, Hydra (P), Sagittarius (A) | Twin chokes | dust in front of the left choke | never charge a walled lane; go round to their Archers |
| 3 | Siege train: Cetus (B), Draco (P), Columba (A) | Spine (mirrored) | Starfall on the spine at 0:44 and 1:26 | hit the train from the side, or race it with your own siege |
| 4 | Ghosts: Lupus (L), Hydra (P), Musca (A) | Ring | two pockets; Starfall on the left arc at 1:14 | never stand next to a pocket you have not scouted |
| 5 | Switcher: Vela (L), Draco (P), Crater (B) | Trident (mirrored) | dust above their choke; Starfall on a cross-link at 1:00 | keep a squad on the cross-link so their swap hits your front |

"?" draws a deck, a shape, a mirror, and one or two conditions on named edges. The Ghosts always get two pockets: Trident
and Spine have optional pocket spots that are added for them.

## How each deck thinks

Every deck thinks every 1.2–2 s and gives **one order per think** through the same verbs a finger has (go, stand, pull
back, recall, ruse). Each order is drawn as an arrow along its route **1.5 s (game time) before it moves**: a charge is
orange with a lance glyph, a brace is a bristle fan with BRACE at the post, a pull back is green, and a squad you cannot
see is a dashed arrow from a "?". A countdown ring shrinks at the start of the arrow. They never see hidden squads.
Rival orders stop at each decision node, so they walk the same edges you do. Shared priorities each think: (1) step
off a told Starfall edge; (2) defend a sieged gate with the nearest free squad (a Lancer strikes); (3) finish a routing
squad with a free Lancer; (4) a Lancer stuck in melee for 2.2 s, or against Pikes, pulls back to charge again; (5) after
0:20, if no squad of yours is home, raid your gate (Breacher first, then Archers); (6) committed raiders keep walking;
(7) **pushes** at 0:30, 1:05 and 1:40, told 4 s ahead, last 16 s, down the lane with fewest of your squads; then the
deck's plan; then heal; then back to posts. A Lancer's strike picks the approach edge that lands on a flank or rear,
never a braced front, runs up to it, then goes.

- **Riders:** the Archers sit as **bait** on the mid-board post with the most routes (Trident: the centre crossroads).
  The two Lancers wait on the posts beside it with long edges into it (the cross-link ends). Whatever bites the bait is
  charged by the wing that waited longest. Wings idle 4 s also hunt anything scoring high: alone, Archers or Breachers,
  engaged, standing, low morale; Pikes score down. The bait steps back from a Lancer charging at it.
- **Spearwall:** both Pikes brace **in the chokes** (on Twin one choke is in your half; on boards without chokes, the
  forward posts on two lanes), with the Archers one node behind. A wall Pike re-faces to a threat off its front, with a
  telegraphed BRACE and a 1 s brace gap. After 0:24 the Archers walk down any lane that is empty of you.
- **Siege train:** a lane is picked at deploy (fewest of your squads). The Pike leads one node at a time, the Breacher
  closes up a node behind, the Archers behind it. The Pike re-braces at anything coming. Once the lead is in your half,
  or it has held one node for 12 s after 0:30, or from 0:50 at the latest, the Breacher breaks for your gate, routing
  round nodes your squads hold. If it gets caught in a melee for 4 s it walks on by another route.
- **Ghosts:** the Lancers and Pikes sit hidden in two pockets, and the Archers walk the lure lane a node every 7 s. Any
  squad of yours standing still at (or next to) a pocket's post, or fighting near it, is struck from the pocket: AMBUSH,
  telegraphed from "?". At 1:00 the ghosts come out, hunt and push.
- **Switcher:** commits the Pike and Breacher to one lane (the centre on Trident). When you answer it (your squad ahead
  of the Breacher on that lane, or engaging the Pike), the Breacher **swaps** to the lane with fewest of your squads,
  and the Pike walks back to hold the swap node. The Lancer charges the flank of whatever fights the Pike, else hunts.
- **Ruses** are the think's one order and have the same 0.8 s wind-up as yours, with no extra telegraph. Fury on a Lancer
  about to strike; Rampart when one of your Lancers is charging at a Pike's node; Whirlpool on two squads in range (or one
  plus a free Lancer); Bloom below 50 % sparks or 35 morale; Bounty while sieging.

## Policy results (`sims --runs=20`, seeds 1–5)

Bots never use slow time, so slow = 0 s throughout. The counter drafts for the rival as a player would from the start
card: Lyra + Scutum + Ara (Archers, Pikes, Breacher) against Spearwall, and Vulpecula + Scutum + Ara elsewhere. Idle and
ball use the default hand (Vulpecula, Scutum, Lyra).

| Policy | Seed 1 Riders | Seed 2 Spearwall | Seed 3 Siege train | Seed 4 Ghosts | Seed 5 Switcher |
|---|---|---|---|---|---|
| idle (never touches) | 0W 20L | 0W 20L | 0W 20L | 0W 20L | 0W 20L |
| ball (all three up one lane every 4 s) | 13W 4L 3D | 0W 19L 1D | 4W 15L 1D | 18W 1L 1D | 0W 20L |
| counter (reads telegraphs; see below) | **18W 2L (90 %)** | 9W 10L 1D (45 %) | 1W 19L | **19W 1L (95 %)** | **15W 4L 1D (75 %)** |

Averages per game ("gap" = median winner-loser gauge gap):

| Policy, seed | Gap | Gauge you/them | Impales (theirs / yours) | Your flanks | Ambushes (you / them) | Siege gauge (you / them) |
|---|---|---|---|---|---|---|
| idle 1 / 2 / 3 / 4 / 5 | 88 / 79 / 100 / 56 / 100 | 13 / 22 / 0 / 48 / 0 vs 100 | 0 | 0 | 0 | 0 vs 87 / 78 / 100 / 52 / 100 |
| ball 1 | 4 | 90 / 88 | 0 / 0 | 2.3 | 0 / 0 | 12.4 / 10.6 |
| ball 2 | 18 | 78 / 95 | 0 / 0 | 0.3 | 0 / 0 | 4.7 / 21.8 |
| ball 3 | 34 | 70 / 98 | 0 / 0 | 0.8 | 0 / 0 | 2.5 / 30.4 |
| ball 4 | 9 | 91 / 83 | 0 / 0.1 | 0.4 | 0 / 0.1 | 17.6 / 8.8 |
| ball 5 | 56 | 26 / 80 | 0 / 0 | 0.2 | 0 / 0 | 19.9 / 74.4 |
| counter 1 | 27 | 88 / 59 | 0.2 / 0 | 2.6 | 0 / 0 | 41.5 / 12.4 |
| counter 2 | 17 | 90 / 80 | 0 / 0 | 1.9 | 0 / 0 | 20.1 / 9.7 |
| counter 3 | 44 | 53 / 96 | 0 / 0.1 | 2.5 | 0 / 0 | 4.0 / 47.5 |
| counter 4 | 35 | 91 / 56 | 0.1 / 0.1 | 1.3 | 0 / 1.3 | 43.6 / 9.3 |
| counter 5 | 30 | 49 / 30 | 0 / 0 | 2.4 | 0 / 0 | 70.5 / 51.5 |

Idle loses every seed (seeds 3 and 5 empty the gate before 2:00). The ball loses to Spearwall (19 of 20), the Switcher (20
of 20) and the Siege train (15 of 20), and beats the Riders 13 of 20 on a coin-flip margin (median gap 4; see
deviations). The counter beats idle's record on every seed, wins ≥ 60 % on three (1, 4, 5) and 45 % on seed 2, has at
most one draw per seed, and its median gap is 17–44. Seed 3 is still the counter's bad seed (1 of 20, gap 44; target was
≥ 40 % wins and gap ≤ 40). Both Spine curls land on spine posts (S2, S3), so the train's lead holding S3 and its Breacher
coming down the other curl block every route to their gate; the counter's race has no free road (see next steps).

The counter in one line: its Pike holds your half's post on the rival's lane (one node back from a braced wall) and
turns to a told charge (Rampart if it can). Its Archers keep a node behind the Pike, or shoot a standing target from
beside it, and pull back from a told charge or a near Lancer. Its Lancer strikes the sieger, the defenders of its
walking Breacher, anything fighting its squads, routers, Archers and Breachers, never a braced front, and waits at home
otherwise. A squad at home walks out along a sieger's edge to meet it; against a Breacher sieger the Lancer runs home and
out along that edge. Its Breacher walks the quietest route round braced Pikes after 0:30 (0:10 if the rival is
engaged). Against the Siege train (a Breacher plus Archers) it races instead: its Breacher waits home, then walks the
least-held route to their gate (never an edge an enemy is on) while the train is out, and the Pike braces at the gate.
It pulls a squad home under 35 % sparks or 40 morale.

## Touch tests (real CDP `Input.dispatchTouchEvent`, `hasTouch`, DPR 2)

All ten pass at **390×844** and **360×640** (`allOk: true` at both):

| # | Test | 390×844 | 360×640 |
|---|---|---|---|
| 1 | flick on a disc within 300 ms → route order, moving one rAF later | ok (GO, gesture 290 ms wall clock) | ok (200 ms) |
| 2 | flick 40° off a route snaps to it | ok (L2 → L1) | ok |
| 3 | no route within 75° → Stand | ok (STAND) | ok |
| 4 | hold ≥ 250 ms: Stand; speed 0.25 held, 1.0 after; Focus drains and refills; empty Focus = 1.0 | ok (BRACE; Focus 5 → 3.78 → 4.77) | ok (5 → 3.78 → 4.79) |
| 5 | hold, then drag picks a route | ok (cross-link L2 → C2, GO) | ok |
| 6 | swipe toward home pulls back; a flick ending on the dock recalls home | ok (FALL BACK; HOME) | ok |
| 7 | tap casts the ruse when affordable, wobbles when not | ok (wobble, then FURY) | ok |
| 8 | the same on the dock card (flick up, flick down = back, hold = 0.25, hold-drag, tap) | ok | ok |
| 9 | a second finger is ignored | ok (the held squad stays the first; the second gets no order) | ok |
| 10 | a touch between two discs picks the nearer | ok (32 / 49 px) | ok (25 / 38 px) |
| + | a touch on empty board neither holds nor slows | ok (speed 1) | ok |

Screenshots in `shots/`: `lanes-muster`, `lanes-telegraph-held` (a told charge arrow at your Archers while you hold
your Pike, routes lit), `lanes-impale`, `lanes-flank`, `lanes-pocket-hidden`, `lanes-ambush`, `lanes-end`, `lanes-pick`,
each `-390x844` and `-360x640`. The console showed zero errors in every run.

## Frame time

Staged brawl: seed 1, rival frozen, each slot pair thrown at L2, C2 or R2 every second with sparks topped up, so all six
squads fight at once (64 sparks, 6 engaged). Edge, DPR 2, 8 s window after 7 s of warm-up:

| Viewport | p50 | p95 | max |
|---|---|---|---|
| 390×844 | 0.3–0.4 ms | 0.5–0.6 ms | 0.8–1.2 ms |
| 360×640 | 0.3–0.4 ms | 0.5 ms | 0.9–4 ms (single host spikes) |

One rAF, 60 fps cap, the static board pre-rendered once, nothing drawn behind the start and end cards, ≤ 100 sparks
(max 6 × 15), and a 320-particle pool.

## Tuning table (what moved, and why)

| Knob | Start | Now | Why |
|---|---|---|---|
| "toward home" | far node closer to your gate | closer to yours **and** further from theirs | a cross-link into the centre counted as a pull back, so Lancer cross-link charges never lit (touch test 5 caught it) |
| contact closing | stop at 56 | contact at 56, close to 40 | a wing's strike down a cross-link could never reach a squad engaged on the lane next to the bait |
| friend on a node | always queue 74 back | may close to 26 on an engaged friend's node | supports could not join a fight at a held post |
| undeployed squads | fight at the gate | mustered: neither fight nor block a siege | three squads sitting at the gate made idle a strong turtle; the design says an undeployed hand loses the gauge |
| Spearwall walls | AI-half chokes, else forward posts | the chokes, wherever they are | on Twin both lanes were walled with no way round; now the cross-link sits behind your-half choke (a rear hit) |
| rival Bloom | below 60 % sparks / 45 morale | below 50 % / 35 | four Blooms a round kept the wall immortal |
| siege train lead | had to be on the field to advance | can deploy itself | the train never left the gate (a bug); Breacher went in alone at 0:50 |
| gate fire | 1 spark / 1.5 s | unchanged (tried 2 s) | 2 s barely moved results |
| light siege (L/P/A) | ×1 | unchanged (tried ×1.5, ×2) | no change to who wins; kept D's numbers |
| Riders wing hunt bar | 1.4 | unchanged (tried 0.9, 0.5) | lower bars did not stop the ball and cost the Riders their bait shape |
| pushes | none | 0:30 / 1:05 / 1:40, told 4 s, 16 s long | idle has to lose; rounds need a rhythm |
| siege while engaged | stops | continues: Breachers full rate, others half (`siegeEngaged` 0.5); engaged range +34 | a defender touching a sieger cancelled a 70 s siege; rounds ended 99–100 with nothing scored |
| respawn | at the gate, fighting at once | READY (mustered) at the gate, plus a 1 s grace before contact | a respawn blocked a siege just by existing; also matches the start rule |
| Breacher speed | 19 (D) | 24 (`breachSpeed`) | a Breacher walk plus the grind did not land a siege inside 2:00; counter seeds 2 and 5 rose 15–30 points |
| Spine curls | from the first posts (S4 → S2, S1 → S3) | from the gates (Y → S2, T → S3) | the gate had one way in, so the Spine was a single-file trench; 13–20 ball draws out of 20 |
| Archers fire | at a node only | also queued on an edge or stopped at the enemy gate | queued Archers behind a Pike were useless on the Spine |
| siege train | assault in your half | also after a 12 s stall, at 0:50 at the latest, and walks round a melee | it ground at their doorstep all round |
| own-gate facing | by edge or angle | always front within 110 of your own gate | home defenders were flanked by every curl arrival on the Spine |
| Bounty | ×1.5 siege always | ×1.5 only while the Breacher is unopposed | a Bounty Breacher in melee drained 100 in 22 s; seed 3 gap 61 → 44 with the counter's race |

## Deviations from the brief (and why)

1. **Mustered start.** Squads start beside the gate as handles, and their first order deploys them. Until then they
   neither fight nor block a siege, so an idle hand loses the gauge to the push, as the design says. Otherwise three
   squads sitting at the gate (gate fire plus heal) out-defend any push.
2. **Hold applies Stand at 250 ms**, not on lift. A Pike starts its 1 s brace while you are still reading the lit
   routes; lifting confirms it, and a drag after the hold replaces it.
3. **Stand facing:** a Stand faces the edge your nearest seen threat is coming in by (else up the lane), instead of "the
   edge it arrived by, reversed". That reading turns a squad round to face home after every advance. This way one hold
   answers a telegraphed charge.
4. **"Toward home"** means closer to your gate and further from theirs, so sideways cross-links are a go (see tuning).
5. **Recall home** is a board flick that ends on the dock. On the dock card itself, a flick down is pull back one node,
   as specified; there is no separate "home" gesture on the card.
6. **Rival ruses** use their 0.8 s wind-up as the tell (the same rule as yours) and skip the 1.5 s arrow. A ruse is
   that think's one order.
7. **Hidden squads' telegraphs** are drawn dashed from a "?". The arrow shows that something is coming, not what, so a
   ghost ambush is never unexplained.
8. **Walk-through:** a flick passes plain posts (a lane in, a lane out, nothing within 150), so a squad goes to the next
   decision point, not the next dot. Rival orders stop at each node.
9. **Starfall** kills every spark on its edge over about 0.9 s of the 2 s burn; squads at its end nodes are safe.
10. **Respawn mustered:** a broken squad returns READY at the gate (it needs a flick, or a rival order, to rejoin) and
    has 1 s of grace. The brief's "returns at the gate", read literally, let a respawn cancel any siege by existing.
11. **Breachers walk at 24/s** (D: 19), and **the Spine's curls start at the gates** (the direction's diagram shows the
    flank routes leaving the gate; my first build left from the first post). Both serve the 2:00 clock.
12. **Ball vs Riders:** the brief expected the ball to lose to the Riders; it wins 13/20 (median gap 4, 3 draws). A column of
    three never leaves one squad alone for the Riders' hunt, and their siege is light (Lancers 0.6/s, Archers 0.8). It
    loses to Spearwall 17/20 as expected. Tightening the Riders (lower hunt bar, stronger light sieges) did not change
    it, and I kept D's numbers.
13. **The counter drafts for the rival** (Archers against Spearwall). The brief's policy walks a Breacher, so its default
    hand is Lancers + Pikes + Breacher. It stays below 60 % on seed 2 (45 %) and seed 3 (5 %).
14. **Page size** is 163 KB, a little over the ~160 KB guide.
15. **Ruse ring** is drawn as a pill ringing the ruse name and cost (lit in the ruse colour when affordable, filled while
    active), because a ring plus a name does not fit a 113 px card at 360 px wide.
16. **64 px discs at 360×640:** the board is height-limited there (S ≈ 0.74), so discs on the short centre edges of
    Trident (85 units) nearly touch. Render keeps friends 1.9 radii apart and foes 1.8.

## The three seeds that felt most different

- **Seed 5, Switcher on mirrored Trident:** the biggest swings, both gates drained (counter 40–21 on average; the ball
  loses all 20 at 14–84). It is a gauge race decided by the swap. Answer the train's lane and their Breacher crosses to
  the lane you left; keep a squad on the cross-link node and the swap walks into your front.
- **Seed 2, Spearwall on Twin chokes:** the positional seed. The rival never charges, a Lancer up a walled lane gains
  nothing, and the tool that moves a wall is Archers shooting a braced Pike from beside your own. The Breacher's way in
  is the cross-link behind the choke in your half. The ball loses all 20; the counter wins about half, by 25.
- **Seed 3, Siege train on the Spine:** the race seed. One spine and two curls from the gates; the train takes the curl
  to your gate while you are busy on the spine, and its Breacher keeps sieging while you fight it. The counter bot loses
  all 20 (32–99): the answer is to meet the train on its curl, or race down yours, which the bot does not do well.

(Seed 4, Ghosts on Ring, is the only seed with ambushes: pockets inside both arcs, struck from "?". The counter wins 95 %
there by never parking next to a pocket.)

## What I would change next

1. **Seed 3 favours the train.** Both curls land on spine posts, so a lead Pike on S3 and a Breacher on the other curl
   block every road to their gate. Land each curl on a post of its own beside the spine (a node the train does not hold),
   or give the Spine a third, short route, so the race the ask describes has a road. Rampart or Whirlpool stopping a
   Breacher's siege while it lasts would also give the defender an answer.
2. **Seed 2:** light the "REAR" route through the Twin cross-link more strongly, so a player finds the way round.
3. **The Riders against a column:** let a wing charge the rear of a squad walking past the bait's cross-link, so a ball
   pays for marching as one.
4. **Human playtest of the Focus switch.** Bots use no slow time; the end card's "slow time" line is there to measure
   it. Try limited vs unlimited on seeds 1 and 4.
5. **Banner placement:** the danger banner covers the rival's gate for its 3–4 s. A bottom-of-board strip would keep
   both gates visible.
6. **Sound:** the charge light at the midpoint, the impact thump, the impale crack, the bristle ring.
