# G "Musou: take the stars": notes (builder for Fable, 2026-10-19)

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
