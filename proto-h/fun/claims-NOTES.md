# Claims: grow or strike (grey-box prototype C)

`public/fun/claims.html`: one file, vanilla JS + canvas 2D, opens from `file://`. Fantasy: *your swarm is stardust. Spend it
to claim the sky and shape the board, or throw it at their Core.*

## Rules as built

- **One ship kind (sparks).** Each Core makes 1 spark/s into a pool that waits at the Core. The cap is 45, +6 per Beacon and
  +20 per captured Core.
- **Verb 1, SEND.** Tap the board and the whole swarm flies there. Tap a rival Core or post to strike it: Core turrets fall
  first, and only sparks ordered at a structure damage it. Tap your Core (or HOME) to recall. Sparks shoot the nearest enemy
  spark in reach. Your home pool rushes anything inside its ring.
- **Verb 2, PLANT.** Hold (350 ms) on gold ground, or tap PLANT and then tap gold ground. A radial of three big buttons opens:
  Bastion, Forge or Beacon. A plant takes 2 taps (3 through the dock).
  - The whole swarm flies to the spot. The first 15 sparks to arrive are spent ("7/15" shows over a dotted hex). Then the post
    builds for 3 s, and the build animation is the tell.
  - If you give another order before 15 have arrived, the delivered sparks pop back out.
  - Max 4 posts each. **Posts must stand beyond your own Core's ring**, so they claim the map rather than pad your home.
- **Gold ground** is the union of your Core rings (radius 60) and Beacon rings (66), plus a thin trail where your sparks fly.
  The trail fades after 8 s. Ground never spreads by itself. To plant somewhere new, send the swarm there, then hold where it
  stands. Plant mode makes the plantable ground glow.
- **The three posts** all have hp and can be struck:
  - **Bastion** (castle hex, 400 hp): every 0.45 s it fires a volley at 3 sparks in range 62. It is solid and walls a lane,
    and dies to a sustained assault.
  - **Forge** (anvil hex, 60 hp): every friendly spark that flies within 34 is forged for good: +50% hp, drawn bigger with a
    white edge.
  - **Beacon** (lantern hex, 60 hp): its ring is your ground while it stands. +1 spark per 4 s, doubled on the **Starwell**.
    Break a rival Core that its ring touches and you **capture** it (it becomes yours at half hp). A dashed ring on the Core
    is the tell.
- **Cores** have 100 hp (rivals) and 120 hp (you), each guarded by 3 turrets (20 hp). Win by breaking or capturing both
  rival Cores; lose when you hold no Core.
- **Surge at 5:00.** Cores take triple damage from sparks, bots go all-in at 20 sparks, and every Core cracks on its own at
  0.5 + 2 × (1 − share of claimed ground) hp/s. Turtle endgames end, and the board's claims decide who cracks first. During
  the Surge the HUD shows ground %.
- **Variety engine (on the start card per seed).** Each seed has a map template (voids, chokes, Starwell, flanks) and two
  rival styles:
  - Seeds 1-5 are authored, and they differ in both map and styles.
  - Random seeds mirror and jitter a template and roll the styles.
- **End card.** One cause sentence that names the board, for example "Lost: the Syndicate's Beacons out-grew you (4 Beacons
  to 0)", "Won: your Forge lane cracked the Corsairs at 2:22", or "Lost in the Surge: … you held 36% of the ground". Below it:
  time, taps, orders, posts, and the decision log (every send, strike, plant and recall with its time, plus Core kills).

## How the bots think (same rules, slow, readable)

- **Pace.** A bot thinks every 4-6 s. Every move, plant and strike gets a 3 s windup first: a growing ring at its Core, a
  dotted line to the target, a label ("Beacon", "moving", a countdown), and a toast ("Syndicate will strike YOUR Core in 3").
  Then its post builds for 3 s. Recall is the only order with no windup, but it is checked only on the normal think, so a
  counter-strike gets a window.
- **Style plan.** Each crew walks a post list, sending its swarm out to make trail ground first, then planting. After its
  style list it keeps adding Beacons (at 2:30 and 3:30), so an idle player gets out-grown.
  - **Bastion crew:** Bastion on the nearest choke (or its front), then a Beacon (Starwell if free), then a second choke or
    front Bastion. It strikes at 42 sparks, from 1:35.
  - **Forge crew:** a Forge 82 out on the lane toward you; its waves route through it. A side Bastion at 2:00. It strikes at
    28 sparks from 1:00, then 38 after 2:00.
  - **Beacon crew:** the Starwell, then two expansion Beacons that grab the most neutral ground, then a capture Beacon 74 from
    its target Core. It strikes late (50 sparks, from 2:30).
- **Target.** Mostly you, with seeded jitter: score = Core health share + distance, −20 for the player, ±25 random. So some
  waves go at the other rival. If an enemy Bastion sits on its lane, it strikes that first (readable, and exploitable). It
  pulls a wave back when fewer than a quarter of its sparks are still out.

## What I tuned (measured, Playwright + `__claims.fast`, 5 runs per cell with shifted policy timing)

| policy | seed 1 | seed 2 | seed 3 | seed 4 | seed 5 |
|---|---|---|---|---|---|
| matched plan (reactive player, per-seed opening) | 5/5, 4:52, 12 orders | 5/5, 1:34, 6 | 5/5, 3:03, 11 | 5/5, 2:55, 12 | 5/5, 2:13, 7 |
| never plants (mass, throw at the weakest Core) | 0/5 | 2/5 | 0/5 | 1/5 | 1/5 |
| idle | 0/5 (lost ~3:50) | 0/5 | 0/5 | 0/5 | 0/5 |

Each round's opening came from a one-opening-everywhere test. Once posts had to sit beyond the Core ring, no single opening
won every seed:

- **Starwell Beacon + Forge toward the Syndicate** won seeds 2-5 but only 1 of 3 on seed 1.
- **Bastion toward the Corsairs + Starwell Beacon** won seed 1 (and 2) but lost every run on seeds 4 and 5.

Changes, in order:

1. Bots kept an "attack" order with a dead target forever. Fixed: a spent wave now re-launches from home.
2. Home pools rush intruders. Before this, only the near side of the pool fought.
3. Sparks went from 3 to 6 hp and shoot every 0.6 s, so fights last seconds instead of an instant (Lanchester was erasing
   turrets and Bastions).
4. Bastion became a 400 hp, 3-target volley wall.
5. Bots recall slowly, so counter-strikes have a window.
6. Bots got target jitter: they no longer gang up 2-on-1 every wave.
7. Surge bleed by ground, so 1v1 turtles end.
8. **Posts beyond your Core's ring.** Before this, a Bastion + Forge hugging your own Core won all 5 seeds: one plan again,
   which is the original diagnosis.
9. Beacon cap bonus went from 10 to 6. Beacon crews were reaching 105 sparks and could not be struck.

Frame time is 0.4-0.95 ms average and 2.8 ms max on desktop Edge, at around 120-150 sparks. No console errors.

## Three seeds that feel most different

- **Seed 1: centre choke, open right flank, Starwell on your side. Corsairs Bastion crew, Syndicate Beacon crew.**
  - The Corsairs wall the choke in the first 30 s, so the direct lane is a kill zone.
  - The Syndicate's Beacons are the clock.
  - It wins by Bastion + Starwell, then grinding the Corsairs' waves on your Bastion ("Bastion held (18 kills)").
  - Rounds are long: 2 of 5 reach the Surge.
- **Seed 2: no choke, open middle, Starwell in the centre. Corsairs Forge crew, Syndicate Bastion crew.**
  - A fast brawl. Bastion toward the Syndicate, Forge toward the Corsairs, and the Forge lane cracks the Syndicate at
    about 1:34.
  - The only board where never-planting sometimes wins (2/5).
- **Seed 5: huge central void, two long flanks, Starwell up top between the rivals. Corsairs Forge crew, Syndicate Beacon
  crew.**
  - The Syndicate gets the Starwell for free. With your Bastion on the Corsairs' flank, their Forge waves usually break the
    Syndicate for you, and your own Forge lane then cracks the Corsairs at about 2:13.
  - A no-plant player instead loses with "Beacons out-grew you (4 to 0)" (4 of 5 runs).

## Clarity concerns at phone size

- Sparks are about 9 device px. The silhouettes (triangle for you, chevron for the Corsairs, dart for the Syndicate) are hard
  to read inside a mixed fight, so colour carries it there.
- The territory is a 24×44 grid smoothed up. It reads as soft ground, but edges are blocky, and the 8 s trail (which is what
  makes a spot plantable) is faint.
- **Capture** is the least obvious rule (a Beacon ring touching a Core). "Beacon swallowed your Core" will surprise a first
  round, even with the dashed ring tell.
- Toasts override each other when two bots act at once. The windup label sits on top of the bot's Core ring.
- At 360×640 the board is only about 270 px wide. It is playable but small.

## What I would change next

- **Starwell Beacon + Forge is the strongest general opening (4 of 5 seeds; it fails on seed 1).** Make the Starwell a trap on some seeds: next
  to a Bastion crew, or inside a Beacon crew's reach.
- Bots strike any enemy Bastion on their lane, so a Bastion is a guaranteed spark sink. Give them a "go around" option on maps
  with a flank.
- Show a bot's next post spot as a ghost hex a few seconds before it walks out, for more read-and-answer time.
- Let PLANT target the swarm's current spot in one tap, to cut taps (a forward plant is now send + hold + pick).
- Seed 1 is long (4:52 mean). Bring its Bastion crew's strike earlier.
- The player rarely uses capture (1 win in 25). It may need a stronger reward or a clearer prompt ("your Beacon touches their
  Core: break it to take it").
- No sound or juice yet. A build "chime" and a capture fanfare would sell the claims.

## Test hooks

`window.__claims`:

- `start(seed)`, `state()`, `fast(seconds, policySource)` (runs the sim without rendering and calls the policy every 0.5 s)
- `order(kind, x, y, post)`, `plantCheck(x, y)`, `w2s(x, y)`, `perf()`, `pause(bool)`

Screenshots are in `shots/claims-*.png` (untracked).
