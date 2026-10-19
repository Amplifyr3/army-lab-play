# G3 "Musou, sideways": notes (builder for Fable, 2026-10-19)

The owner on G2: "Nice!", but "controls are a little too finicky, like it's too easy to overdo it on moves, and I feel like the
real enemy is the camera, like it's a game from 20 years ago." G3 answers with landscape, a camera that never turns, and calm
controls. It is the same `musou.html`; the G2 modes are still in the code but unreachable (`CONTROL = 'arena'` is the G3 scheme).
Harness: `node tools/fun/musou.test.mjs [touch|fight|perf|sims|shots|all]`, at 844x390 and 640x360, real CDP touches, DPR 2.

## What changed

- **Landscape.**
  - The lane is rotated on screen: your base on the left, theirs on the right, the three points along the middle. The world is
    unchanged; the camera's fixed yaw of 180° puts world +y on screen right.
  - In portrait, a full-screen "Turn your phone sideways" card with a rotating phone icon covers everything, and the
    simulation pauses until you turn.
  - LAUNCH requests fullscreen and then `screen.orientation.lock('landscape')`, both failing silently.
  - Start and end cards are two-column so they fit 360 px tall.
- **The camera never rotates.**
  - A raised 3/4 view: 52° pitch, eye 676 from the focus, focal 1.33 × screen height.
  - It follows a focus point that leads the hero by 0.35 s of velocity (at most 150 units), damped at 0.32 s.
  - It zooms out to 1.22× while BOOST is held. Locked on a rival, it zooms to fit both (up to 1.45×) and leans 35 % toward them.
  - No yaw swings, no chase camera. I dropped G's chase view rather than add a cinematic special cast; it would need its own camera
    path and wasn't cheap.
- **Calm controls.**
  - **Left 40 %:** a floating stick (60 px, 12 % dead zone) with an **expo 1.6** response curve. A 25 % push walks at 4.7 % of top
    speed; 60 % at 38 %.
  - Top walk speed is 180, down from G2's 230.
  - Acceleration is smoothed (τ 0.16 s); braking is smoothed (τ 0.07 s) with a 700 u/s² floor, so release lands on a hover in
    0.17 s and holds exactly.
  - **Right thumb, an arc:** SPECIAL (the biggest, with a cooldown ring), DASH (with a green cooldown pip), and **BOOST**: hold it
    to fly at 400 in the stick's direction (or straight on); lift it to brake.
  - The flick dash and the rim-hold boost are gone.
  - Portraits run along the top right; the minimap is a horizontal strip at top centre (tap a ring on it to lock that point).
- **Lock-on** is unchanged: auto (rival, open Core, densest clump ahead) and tap to switch.
  - No orbit mode: with a fixed camera the stick circles naturally.
  - The lock just keeps you facing the target and frames the camera.
  - DASH keeps its 0.3 s invulnerability, the backstep when the stick is idle, and the 1.1 s cooldown.
- **Rebalance for longer matches.**
  - G2's tunings stay: rival chip shots every 0.9 s with lead 0.3, Moss with 8 drones, rivals going for your last point, and the
    march on your base.
  - **Rivals respawn** 20 s after they fall, at their base, with a wave of 12 sparks.
  - **A rival retaking a point brings a wave** of 10.
  - **Their Core has 600 hp** (was 400).
  - Sparks are drawn a little bigger for the higher camera.

## Test results (`node tools/fun/musou.test.mjs all`: every check passes at both sizes, console clean, exit 0)

- **p0 portrait:** the card shows, sim time stays at 0 for 0.7 s, and turning to landscape hides it and play resumes.
- **l1 camera:** a real match with the push player, a rival locked, boosts and zooms: 30 samples, **one yaw value (π)**,
  zoom 1.00–1.22.
- **l2 stick curve** (real touch):

  | Push | Speed |
  |---|---|
  | 25 % | 8.4 u/s (4.7 % of top) |
  | 60 % | 68 |
  | 100 % | 180 |

- **l3 release:** from 180, a hover in **0.17 s**, drift **0** over 2 s. Stick up moves world −x, which is screen up.
- **l4 DASH:** a dash while still inside Scorpius' ring at the resolve takes 0 (22 without it). A real tap backsteps out (312 from
  the centre) and takes 0. A second tap during the 1.1 s cooldown does nothing.
- **l5 BOOST:** stick alone at full, no boost (180). Stick plus a second finger holding BOOST: boost at 400. 80 ms after lifting the
  BOOST finger, boost is off, and the speed is back to 180 after 0.68 s.
- **l6 tap-lock:** auto-lock takes the nearer rival. A real tap on Draco switches the lock to Draco; a tap on the middle point locks
  it. Both taps are outside the stick zone.
- **l7 capture on a hover:** bar 0.42 after 3 s, captured, banner, no movement.
- **l8 hit areas:**

  | Element | Size at 844x390 | Size at 640x360 |
  |---|---|---|
  | SPECIAL | 94 | 86 |
  | DASH | 74 | 68 |
  | BOOST | 74 | 68 |
  | Portraits | 56 | 56 |

  All are on screen. None overlaps the stick zone or another button, counting the 6 px hit padding (the round buttons are
  compared as circles).
- **l9:** a real tap on LAUNCH starts the match with no console error, whatever fullscreen says.
- **fight** (seed 1): push wins at 3:08 (1039 KOs); idle loses at 1:34 ("All three heroes went down to Scorpius").
- **perf** (200 forced sparks, a rival, a real stick touch, BOOST held for 1.5 s, 6 s at DPR 2):

  | Size | p50 | p95 | Max | fps | 4× throttle |
  |---|---|---|---|---|---|
  | 844x390 | 0.4 ms | 0.6 ms | 0.9 ms | 59.5 | 59.8 fps, p95 2.5 ms |
  | 640x360 | 0.4 ms | 0.7 ms | 0.9 ms | 59.8 | 59.8 fps, p95 2.2 ms |

- **sims** (seeds 1–8, 10 min cap):
  - **Push:** 7 wins and 1 timeout (seed 8), **median 4:46** (times 2:44–7:39). 1477 median KOs, 69 rivals defeated, 81 rival
    respawns, 90 waves, 168 boosts, 270 dashes.
  - **Idle:** 0–8, median 1:33. The rivals sweep the points, march on your base and take all three spirits; one seed ends by the Core.
- **shots:**
  - at 844x390: `musou-g3-start`, `-horde`, `-special`, `-boost`, `-duel` (Scorpius' ring, the camera zoomed to fit both),
    `-capture`, `-end`;
  - at 640x360: `-640-horde`;
  - `-portrait` (the turn card).

## My read

- **The camera is no longer the enemy:** it never turns, so left is always left and their Core is always to the right. The
  look-ahead keeps more of where you are going on screen, and the zoom on a lock keeps the duel framed without any swing.
- **Nothing is easy to overdo:**
  - the curve makes small corrections tiny;
  - braking is a hover;
  - the two accidental triggers in G2 (the flick and the rim hold) are gone;
  - speed is now a deliberate held button.
- **Landscape fits the lane:** you see about 1100 units of the lane's length and most of its width, both tides, and the next
  point.
- **The open question** is whether G's thrill survives: there's no chase camera, and BOOST is a held fast walk, not a flight.
  If the owner misses it, the cheap version is a 1 s chase cut when a special is cast.
- The push bot's spread (2:44 to a 10-minute stalemate) says the core siege can stall when rivals keep respawning onto it. A human
  match should sit in 4–6 minutes, but one stalemate in 8 means the siege needs a closer: rivals not respawning once their Core is
  open, or a respawn timer that grows each time.

---

# G2 "Musou: now I can stop": notes (builder for Fable, 2026-10-19)

The owner played G and liked it ("it's pretty sick"), with one problem: there was no way to stop, so it was hard to help capture
anything or to fight a rival mech when you zoom past them. G2 is the same `musou.html` with a **Controls** toggle on the start card:
**Anchor / Arena / Flight (G)**. The choice is remembered on the device (`musou.controls`), `?controls=anchor|arena|flight` wins on
load, and Anchor is the default. Flight is G, unchanged except for the shared tunings below. The suites are now
`node tools/fun/musou.test.mjs [touch|stick|fight|perf|sims|shots|all]`; G's suite is `touch`, pinned to Flight.

## What both new modes share

- **A floating stick.** It appears wherever the left thumb lands in the lower-left zone (x < about half the width, below 38 % of the
  height, never over a button). Its radius is 64 px with a 28 % dead zone, and the base follows a thumb that runs past the rim.
  **Release = stop:** the mech brakes at 1700 u/s² to a hover (200 → 0 in 0.12 s, a full boost in 0.25 s) and holds position
  exactly. When the stick is idle, a faint "MOVE" ghost shows where it lives.
- **Omnidirectional and camera-relative:** up = away from the camera, right = strafe right. Walk speed is 200 at full stick
  (analogue below that), with a 1300 u/s² accel.
- **Auto-facing** (540°/s): it faces the lock target, else the move direction, so you strafe while the forward cone (±35°, 420)
  keeps firing. Inside a point you have locked, it turret-spins to the nearest foe within range.
- **Lock-on.** It auto-locks the nearest rival within 650 (dropped beyond 1100). Otherwise it locks their Core if it is open and
  within 650, otherwise the densest clump of theirs ahead (sparks within 120, re-picked every 0.25 s), otherwise nothing.
  - Tap a rival, a point, the open Core or a ring on the minimap to lock it.
  - Tapping the same target again, or empty ground, drops a manual lock.
  - A tap on a rival's own sprite wins over the stick zone.
  - The lock ring is gold: solid when manual, dashed when auto. A chevron sits over the target.
- **DASH:** the button beside the Special, or a flick on the stick (released within 220 ms after passing 70 % of the radius).
  It's a 0.18 s burst at 900 (about 160 units) in the stick's direction, or a backstep if the stick is idle. It gives 0.3 s of
  invulnerability (a white ring) on a 1.1 s cooldown.
- **The right thumb** holds the Special (88 px), DASH (70 px) and the three portraits (56 px) in a column above the Special. The whole
  screen is the field. The hull bar sits under the mech; the rival's bar sits in the top band.

## Anchor (Gundam / Zone of the Enders hybrid)

- **Walk:** a mid chase camera, eye 150 behind and 125 above at 36°. The camera's yaw drifts toward your move direction only when
  you move forward-ish (within 70°). Strafing and backing never turn it.
- **BOOST:** push to the rim (92 %) and hold for 0.3 s. A gold ring fills around the stick base while you hold, then it's G's
  flight: up to 420, G's turn rates, G's camera (90 / 70 / 30°). The stick's angle off the nose is the rudder. Easing off (under
  78 %) or letting go brakes back to walk or hover.
- **Duel:** locked on a rival, the camera turns to frame you and the target (190 / 150 / 34°).
  - Stick sideways **orbits** at the held range. Up and down close or open it (140–600, 220 u/s).
  - A radial correction (gain 6) holds the range.
  - Only the up and down sectors of the rim can boost here, so a full-speed orbit never turns into a boost.
- **Point lock:** before you reach the point, the camera turns toward it, so up takes you there. Inside, you hold and turret-spin.
  The lock drops once you leave the ring again.

## Arena (Brawl Stars / Archero)

- The camera is raised to 55° pitch (eye 330 behind and 430 above, focal 1.15×). It never turns: up is always their Core.
- Screen-direction moves at 230. Release stops, auto-face, auto-fire, tap to lock, DASH. No boost, no orbit.

## Tunings (all modes)

- Rival chip shots every **0.9 s** (was 0.7) with **0.3** lead (was 0.6).
- Moss's Drone Swarm: **8 drones** (was 12), and each drone waits **0.12 s** between trash kills.
- Rivals now hold **the point you took last** before the nearest one.
- When they hold all three points, rivals **bring the fight to your base**: they orbit 200 in front of your Core and chip it
  (2 hp every 0.4 s) while it is open.
  - Without this, a hovering idle player at home was a turret that never lost.
  - Now stick-mode idle loses at about 1:34, with "All three heroes went down to Scorpius" and similar.
- The base and point streams are unchanged (yours 4.0/s, theirs 6.5/s). A sweep down to 5.0/s barely moved stick-mode idle,
  because the rivals decide it.

## Test results (`node tools/fun/musou.test.mjs all`, 390x844 and 360x640, real CDP touches, console clean, exit 0)

**stick** (identical at both sizes)
- **s0:** a real tap on Arena is stored. It survives a reload, `?controls=flight` wins, and the default is Anchor.
- **s1 hover** (Anchor and Arena): walking at 117–134 (stick at 70 %), release brakes to 0 in **0.08 s** of sim time, and drift
  over the next 2 s is **0**.
- **s2 camera-relative:** in Anchor at yaw 90° and 0°, up moves along the camera's forward and right along its right, **0°
  error**. Arena stays at 90° whatever the heading.
- **s3 orbit:** auto-locked on Scorpius at 265–267 and holding the stick sideways for 3 s, the range stays within **3 %**. It
  sweeps 2.0 rad around the rival and never boosts.
- **s4 boost:**
  - half stick for 0.9 s: no boost;
  - rim for 120 ms: no boost (edgeT 0.12);
  - rim for 570 ms: boost, reaching 420;
  - release: hover at 0 within 0.45 s;
  - Arena at the rim: never.
- **s5 dash:**
  - i-frames: a dash 0.2 s before Scorpius' ring resolves, while still inside it, takes **0**; the same spot without the dash
    takes **22**;
  - a real DASH tap inside the ring backsteps to 313 from it and takes 0;
  - a real flick dashes at 900 in the flick's direction.
- **s6 tap lock:** auto-lock takes the nearest rival. A real tap on Draco switches the lock to him (manual); a tap on the middle
  point locks the point.
- **s7 capture on a hover** (Anchor and Arena): no input inside the middle ring, bar at 0.42 after 3 s, captured, banner, 0 movement.
- **s8 targets:** Special 90×90, DASH 70×70, portraits 56×56 at 390x844 (82, 64, 56 at 360x640). All on screen, none touching
  the stick zone, and the zone is at least 45 % of the width.

**touch** (G's suite in Flight): t1–t7 all pass, as in G.

**fight** (seed 1):

| Mode | Push wins at | Idle loses at |
|---|---|---|
| Anchor | 2:16 | 1:34 |
| Arena | 1:54 | 1:32 |
| Flight | 2:16 | 2:58 |

**perf** (DPR 2, 200 forced sparks, a rival, a held real touch, 6 s; then 4× CPU throttle). Ranges are over two full runs and
both sizes:

| Mode | p95 | Max | 4× throttle |
|---|---|---|---|
| Anchor | 0.6–0.9 ms | 1.8–3.3 ms | 59.5 fps, p95 2.7–3.7 ms |
| Arena | 0.6–0.8 ms | 1.2–2.8 ms | 59.5–59.8 fps, p95 2.3–3.1 ms |
| Flight | 0.7–0.8 ms | 0.9–1.3 ms | 59.3–59.8 fps, p95 2.5–3.3 ms |

**sims** (seeds 1–8):

| Mode | Idle | Push | Median time | Median KOs | Rivals defeated | Notes |
|---|---|---|---|---|---|---|
| Anchor | 0–8 (median 1:34) | 8–0 | 2:05 | 459 | 16 | 39 boosts, 38 dashes |
| Arena | 0–8 (median 1:34) | 8–0 | 1:47 | 487 | 16 | 35 dashes |
| Flight | 0–8 (median 3:51) | 8–0 | 2:19 | 585 | 9 | |

**shots** at 390x844: `musou-g2-start` (the toggle), `-anchor-walk` (strafing at a clump with the cone on it), `-anchor-boost`,
`-anchor-duel` (Scorpius locked, its ring on the ground, orbiting at its edge), `-arena`, `-capture` (a hover inside the ring),
`-end`.

## My read: which mode is best for what (from the bots, the shots and the numbers; I have not held a phone)

- **Capture: Arena, narrowly.** Both stick modes make capture what the owner asked for: stand in the ring, let go, it fills. Arena
  shows the whole ring and everything walking into it, and nothing behind you is hidden, so you see the "fewer than four" rule
  happen. Anchor's point lock (camera turns to it, turret-spin inside) works, but its low camera still hides what comes from behind.
  Flight can't really capture; it circles.
- **Duels: Anchor, clearly.** The lock-and-orbit is the mech duel: the rival stays framed ahead, the telegraph lies on the ground
  between you, sideways circles out of a beam, down opens the range out of a ring, and DASH has i-frames for the last moment.
  The bot defeats 16 rivals in Anchor against 9 in Flight. Arena duels work, but you circle by hand and the rival is small.
- **Horde-mowing: Flight still feels the most like the fantasy;** Anchor's boost gets most of it back. Speed through a stream with
  the chase camera is the thrill. Walking at 200 lets the horde come to you, which is more Dynasty Warriors but less G. Anchor
  keeps both: walk and strafe a clump with the cone on it, boost to the next one. Arena shows the most horde at once but loses
  the cockpit; it reads as a different, smaller game.
- **Overall: Anchor as the default.** It is the only mode that is good at all three, and it keeps G's flight one push away. The
  risks are the ones only hands can answer:
  - Is the walk camera's yaw drift calm enough?
  - Does a 0.3 s rim hold trigger boost by accident when someone just wants to walk fast?
  - Is the stick zone big enough for a thumb that lands near the middle?

  If the camera swing disorients, Arena is the fallback, and it is the easiest to learn.

## G2 gaps and next steps

- No manual camera turn. In Anchor's walk you turn the view by walking forward-ish; a two-finger drag or a "snap behind" tap
  may be wanted.
- The bot matches are short (1:47–2:19 median). A human will be slower, but if real matches run under 4 minutes the next knobs are
  the rivals' respawn (none yet) and making them retake points with a wave.
- Lock-on cycles through rivals, points and the Core by tap. There is no lock on a single brute.
- Moss is untested by hand after the nerf; Tide's Shield Dash still flies along the facing, which in the stick modes is the lock
  target.

---

# G (the first build, still the Flight mode): notes

`musou.html` is one file of vanilla JS and canvas 2D, no assets, opens from `file://`. Phone portrait. Seed from `?seed=N`,
`?burst=0` hides the Burst button (the `BURST_ON` constant). Harness: `node tools/fun/musou.test.mjs [touch|fight|perf|sims|shots|all]`
(msedge, hasTouch, isMobile, DPR 2, 390x844 and 360x640; writes `shots/musou-*.png` and `shots/musou-results.json`). Test API on
`window.__fm`. Design: `playtests/fun/PROTO-G-BRIEF.md` and `DIRECTION-G.md`.

## What was built

- **The board.** A lane 900 wide and 3600 long, your Core at the bottom (y 120), theirs at the top (y 3480), three point rings
  (radius 140) at 28 / 50 / 72 % of the lane, the outer two 180 off the centre line so the lane bends. Point 1 starts yours,
  2 neutral, 3 theirs. Soft red walls: near an edge and heading into it, the craft is turned along the wall and a little
  inward, so it never sticks in a corner.
- **The tide.** Pooled typed arrays (cap 260), a 120-unit spatial grid rebuilt each step, no per-frame allocation. Each base
  pours a steady stream, each owned point pours 1.5/s for its owner, 1 in 12 is a brute (hp 6, slower, ringed). Sparks follow
  seven stream lines with a slow wobble (it reads as a tide, not a grid), lean toward the next contested point ahead, slow to
  a third of their speed inside a ring they do not own (so points are where the clashes pile up), engage enemies within 110 and
  trade hp within 40 (a 1v1 clash takes 2 s). They never chase you; any of theirs within 30 of you ticks 4 hp/s. Sparks that
  reach a Core hit it if it is open and pop on the shield if not. The match starts after a 10 s pre-warm so the tides are
  already flowing. The front is the mean y of all living sparks, recomputed each second with a 25-unit hysteresis; it is the
  gold line on the minimap and a faint dashed line on the ground.
- **The camera.** F4's Chase maths, allocation free: eye 90 behind and 70 above, pitched 30°, near plane 14, focal
  0.92 × min(width, 440), nose always up. Sky and plane gradients (cached at resize), a star band that slides with the heading,
  the 150-unit grid, the lit lane, red walls, rings with a capture arc that grows from the near side, Cores with a shield ring,
  beacon pillars with diamonds (faded near the camera) so points and Cores read at distance, the cone of fire on the plane like a
  flashlight. The field uses the top 62 % of the screen; the hero sits fixed at 58 % of the field, banking with the rudder.
- **Sparks on screen.** Projected and bucket-sorted into six depth bands (far to near, one path per team per band): your
  sparks are circles, theirs are wedges pointing at you, brutes are rings, near bands get a soft halo, the farthest band is
  dim dots. Mobs behind the near plane or off screen are skipped.
- **The pad.** Lower 30 %, full width. Horizontal = rudder (0.10 s lag, 6 % centre detent), vertical = throttle (bottom 260,
  top 420 units/s; turn rate 200°/s at the bottom, 120°/s at the top). Lifting keeps the throttle and centres the rudder.
  Thumb in a bottom corner = a tight orbit of radius ~75, which fits inside a ring: that is how you hold a point.
- **Auto-fire.** Nearest foe in a ±35° cone, range 420, sides alternate so a crowd in the cone is mowed; rivals in the cone are
  preferred, an open Core too. Ember: twin bolts 5/s (10 hits/s). Tide: piercing bolts 4/s, 1.5 damage, up to 4 sparks on the
  line. Moss: homing pellets 6/s that curve onto the target. Hits on rivals ×1.5.
- **Burst** (above the Special): a 3-shot piercing spread, 0.6 s cooldown, behind `BURST_ON` / `?burst=0`.
- **Special** (bottom right, the corner opposite the portraits; a big round button with a cooldown ring, 14 s per spirit):
  hit-stop (0.12 s at 10 %), white flash, a 4 px nudge, the KO counter bumps, "x37 KO!" in gold counting the special's KOs.
  Ember **Fury Nova**: ring 320, all trash out, brutes −4, rivals −18 and knocked back. Tide **Shield Dash**: 0.8 s, 600 units,
  a 180-wide corridor cleared, no damage taken, rivals −14 and knocked aside. Moss **Drone Swarm**: 12 drones for 6 s seeking
  within 380, trash dies on touch, brutes −1, rivals −2 per touch. A Special near an open Core hits it for 30.
- **Swap.** Three 56 px portraits on the left with hull bars and ACTIVE / READY / BENCHED / DOWN (READY in gold when you are
  somewhere you may swap). Inside a friendly ring or within 220 of home: a 0.6 s dip to dark and the tapped spirit launches from
  the same spot. Elsewhere the portrait shakes and says "Swap at a friendly point". Benched spirits heal 8 %/s. A spirit at 0 is
  down for the match: "HERO DOWN", then the healthiest one launches from home after 1.5 s; the last one down ends the match.
- **Points.** Capture as in the brief (you +0.14/s, +0.01 per spark of yours inside, blocked by 4 of theirs; mirrored for
  them, their rival spirits count as you do). A capture: "Point captured!" banner, a gold ring flash, a wave of 12 sparks, the
  point's stream starts. Callouts: "Ally point under attack!" (once per 20 s per point), "Point lost.", "They took point 3.".
- **Rival spirits.** Two per match from Scorpius / Draco / Lupus (seeded order), at 0:40 and 2:30, or 3 s after you take a
  point if sooner. They hold the nearest point that is not theirs (orbiting it, mowing your sparks: 2 damage every 0.4 s within
  280), hunt you inside 700 (leave at 950), keep 230 off you and face you. Basic shot every 0.7 s when facing you within 500
  (a projectile at 560 with a little lead, 6 hp). Every 7 s while hunting within 650: a 1.2 s wind-up drawn on the plane, the
  rival frozen while it winds: Scorpius a ring of 260 around itself, Draco a 90-wide beam 700 long at where you were, Lupus a
  lunge circle of 140 where you were (it jumps there). Inside at the resolve: 22 hp, shake, red vignette, vibration, and "DODGE
  the ring / beam / lunge" the first two times. The blast also wipes your sparks inside it. Their bar shows on the projected
  rival, in an officer bar at the bottom of the field ("SCORPIUS!" pulsing while it winds) and as red diamonds on the minimap;
  off-screen rivals get a red arrow on the field's edge (pulsing while winding). Defeated: banner, +50 KOs, hit-stop and 1.5 s
  of slow-mo.
- **Cores and the end.** Their Core (400) is shielded unless all three points are yours ("Their Core is open!"; "shielded
  again" if one slips); your shots 2, your sparks 1, a Special 30. Yours mirrors it; any damage raises "YOUR BASE IS UNDER
  ATTACK" with its hull bar in the top band (pulsing) plus a callout. The end card names the cause ("Your Core fell while
  Scorpius and Lupus held all three points", "All three heroes went down to Draco", "You broke their Core at 2:27 with all
  three points held"), with KOs, best combo, points taken, rivals defeated, time, seed; AGAIN / SAME SEED / LINEUP.
- **Musou feel.** KO counter top centre (bumps per KO), a gold "x24" combo that drops after 1.5 s without a KO, "+1" pops (a
  cached sprite, no text per mob), 8–12 particle bursts per KO (pooled), a nudge on brute kills, centre banners that slide in
  for 1.4 s, callouts in the top band. Sound from tactics.html's tiny WebAudio set: a KO tick rising on a pentatonic step per
  combo (throttled to one per 55 ms), thump and whoosh on the Special, a fanfare on captures and kills, an alarm on "appeared",
  "point lost" and the base; vibration on the Special and on hits. Audio starts on the first touch.
- **Budget.** One rAF, a 60 fps cap (frames under 15 ms are skipped), a fixed 1/60 step with an accumulator and at most 4
  steps a frame, DPR capped at 2, gradients and fonts cached at resize, colour strings precomputed, no shadows or blur, text only
  in the HUD. Hit-stop and slow-mo scale the accumulator, so `step()` stays deterministic.
- **Start card**: what to do in five lines, the lead spirit (Ember / Tide / Moss), LAUNCH. It fits 360x640 without scrolling.

## Tuning (all in `T` at the top of the file; where it departs from the brief, why)

| Knob | Value | Brief | Why |
|---|---|---|---|
| Your base stream / theirs | 4.0 / **6.5** per s | ~4 / "a bit more" | Auto-fire mows ~2.5 sparks/s even with no input. At 4.4 the idle player's tide took all three points by 0:40 and chipped their Core to 176; at 6.5 idle loses at 4:16 median and no seed comes close. |
| Spark share of a capture | 0.01/s each, **capped at 6** | uncapped | A 20-spark blob captured at 0.2/s, faster than you (0.14). Now the tide alone flips a neutral point in ~17 s, you plus a few sparks in ~5–7 s. |
| Rival hp | **240** | 180 | At 180 a focused Ember kills a rival in ~8 s, before its second telegraph. 240 gives 2–3 wind-ups per duel; the push bot's match grows ~30 s. |
| Speed / turn | 260–420, 200→120°/s | 260–420; "bottom = 40 %" | The two numbers conflict; I kept the range: throttle 0 = 260 (62 % of top). A full-rudder orbit at 260 has radius ~75, inside a ring. |
| Spark speed | 88 (brutes 58) | not set | Keeps 150–230 alive with the streams above; crossing the lane takes ~40 s. |
| Engage / fight range | 110 / 40 | 40 | Without a 110 "close in" range, two streams on different lines walk past each other. |
| Linger in an unowned ring | 0.35 × speed | not set | Makes points the place where the tides pile up and clash. |
| Rival mowing | 2 dmg / 0.4 s within 280 | not set | Rivals must thin your sparks to take a point (4 of yours block them). |
| Special cooldown | 14 s per spirit, benched ones tick | 14 s | Swapping in a rested spirit brings a ready Special: a small reward for the swap. |
| Their Core open | all three points yours | "shielded while they own any" and "once all three are yours" | Read as the stricter one: a neutral point keeps the shield. So the loss cause reads "held all three points" (the brief's "two points" example cannot happen). |
| Pre-warm | 10 s | not set | The tides are already flowing at 0:00. |

Everything else is the brief's: contact 4 hp/s within 30, rival shot 6 every 0.7 s within 500, Special hit 22, wind-up 1.2 s,
ring 260 / beam 90×700 / lunge 140, hero hp 100, bench heal 8 %/s, swap within 220 of home or inside a friendly ring, dip 0.6 s,
HERO DOWN 1.5 s, combo decay 1.5 s, hit-stop 0.12 s at 10 %, Nova 320 / Dash 0.8 s 600 units 180 wide / Drones 12 for 6 s within 380,
Core 400, shots 2 / sparks 1 / Special 30, point radius 140, capture +0.14 you, wave 12, point stream 1.5/s, brutes 1 in 12 with hp 6.

## Test results (`node tools/fun/musou.test.mjs all`, both viewports, real CDP touches, console clean, exit 0)

**touch** (390x844 and 360x640, identical outcomes)
- t1: a real touch on the pad's right edge turns −1.14 rad in 0.45 s, the left edge +0.96 to +1.05; the top gives 419–420
  units/s, and 0.6 s after lifting the speed is still 420 with the throttle at 1 and the rudder back to 0; the bottom gives 262.
- t2: two sparks placed in the cone die (2 KOs in 0.8 s); one behind, one behind-left and one 310 to the side live.
- t3: a real tap on the Special: specials 0 → 1, cooldown 14.0 → 12.8 after 1.2 s; a second tap during it fires nothing.
- t4: tapping Tide's portrait at (450, 1400) is refused with "Swap at a friendly point"; inside point 1 it swaps (dip, Tide
  active), and the benched Ember heals 40.9 → 48.9 in a second.
- t5: circling in the neutral middle ring with their sparks cleared: bar 0.42 at 3 s, then ally, "Point captured!", 12 sparks.
- t6: Scorpius' forced wind-up shows `winding` with kind ring; flying away at full throttle takes 0, circling over it takes
  exactly 22 and shows "DODGE the ring: ..."; Draco's beam: crossing it 0, flying along it 22.
- t7: all three points theirs and eight sparks at your base: Core 392, "Your base is under attack", the warning is up. Tap
  targets (x, y, w, h): Special 82×82, Burst 64×64, pad 370×253, portraits 56×56 at 390x844; 76, 60, 340×192, 56 at 360x640;
  all inside the viewport.

**fight**: seed 1, push wins at 2:27 (651 KOs); idle loses at 4:16: "Your Core fell while Scorpius and Lupus held all three
points".

**perf** (DPR 2, 200 forced sparks, a rival, a held pad touch, 6 s; JS time per frame): 390x844 p50 0.4 / p95 0.7 / max 1.2 ms,
360x640 p50 0.4 / p95 0.7 / max 1.0 ms, 59.3–59.5 fps (one earlier run saw a single 5.7 ms outlier). **4× CPU throttle**: 59.5 fps
at both sizes (p50 1.9–2.0 / p95 2.6–2.7 / max 6.3–6.9 ms). Edge's timer is coarsened to 0.1 ms.

**sims** (seeds 1–8, `step()`): idle 0–8 (median 4:16, 661 KOs; 5 by the Core with two rivals holding all three points, 3 by
all heroes down to Scorpius or Draco). Push 8–0 (median 2:40, range 2:11–3:25, 611 KOs, 10 rivals defeated).

**shots** at 390x844: `musou-start`, `-horde` (the tides meeting at the middle point), `-special` (Fury Nova's flash and ring,
"x6 KO!"), `-windup` (Scorpius' ring ahead), `-beam` (Draco's lane aimed at you), `-capture` (banner and gold ring), `-end`.

## My read

- The first minute is the fantasy: wedges streaming at you over the horizon, the cone mowing them, "+1"s and a combo in the
  hundreds, the Special's flash. The Chase camera carries it, exactly as F4 promised.
- The decisions are there but light: where to point the cone, when to hold a ring (thumb in a corner), when to spend the
  Special, when to break off a duel to swap. Dodging a telegraph is readable: the shape is on the ground ahead, the officer bar
  pulses, the edge arrow pulses if it is behind you.
- The push bot is relentless and dodges perfectly, so its 2:40 median is the floor; a person learning the pad should land
  around 4–6 minutes, but that is a guess until someone plays it.
- Burst: the bot fires it whenever four sparks line up, and it does add KOs, but the cone already mows; my prior (DIRECTION-G)
  is that it adds a button more than a decision. Judge it with `?burst=0`.

## Known gaps

- No counters/affinities yet (a rival's affinity telegraphed before the match, the lineup as the pre-sortie decision).
- Rivals do not combo, retreat or call reinforcements; there is no late "boss" rival.
- One map. No mid-match objectives (escort, timed hold), no KO-charged Musou gauge.
- The rival's basic shots are dodgeable only by turning; there is no "incoming" cue beyond the projectile itself.
- Sound is the tactics.html tick/tone set: functional, not yet Nintendo-grade.

## The three tunings I would make first after playing

1. **Moss's Drone Swarm is too strong** next to Nova and Dash (49 KOs in its first 1.5 s; a cast can top 100). Give drones a
   0.15 s touch cooldown on trash or cut them to 8, so the lineup choice is about style, not a clear best.
2. **Rival chip damage**: 6 hp every 0.7 s with lead is ~8 hp/s while you face it, which makes a duel a race rather than a
   dodge. Try 0.9 s and less lead so the telegraphs, not the chip, decide duels.
3. **Match length and pressure**: if people finish in under 4 minutes, make rivals go for the point you took last (a real
   "Ally point under attack!" pull-back) before touching Core hp; if they never open the Core, lower their stream from 6.5.
