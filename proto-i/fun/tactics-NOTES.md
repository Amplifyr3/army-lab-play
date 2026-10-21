# F4 "Tactics: three ways to fly": notes (Fable, 2026-10-18)

`tactics.html` is one file of vanilla JS and canvas 2D, no assets, opens from `file://`. Seed from `?seed=N`, `?calm=1` removes
the planning timer, `?controls=stick|rehearse|chase|draw` picks the control mode (also a start-card toggle, remembered on the
device). Harness: `node tools/fun/tactics.test.mjs [touch|controls|combat|perf|shots|bot|sims|all]` (msedge, hasTouch, DPR 2,
390x844 and 360x640). Test API on `window.__ft`. F3 stays live at `proto-f3`.

F4 is F3's combat with three new control modes behind the `CONTROLS` boundary (`draw` is F2's momentum stroke, kept for
comparison but off the toggle). The rule the three share: **the input space is the ship's legal move space**, so every input is
legal and the path is exactly what was set. No stiffening, no "close enough". Every path is piecewise constant curvature
(`[length, curvature]` segments through `curvePath`), and the momentum rules are unchanged: speed within one step a turn, a
turn radius that widens with speed, no backtracking, loops only where the turn rate closes a circle (the Viper at speed 2).

## 1. Stick (flight-stick pad)

- The bottom panel is the pad. One row per speed the ship may fly next turn, fastest on top; a row's half-width is that
  speed's maximum turn angle, so the pad is a trapezoid whose **edges are the limits** (the Brawler at speed 2 shows rows
  3 / 2 / 1 at ±117° / ±107° / ±86°; the Viper at speed 3 shows 4 / 3 / 2 at ±347° / ±358° / ±382°, the widest row the slowest).
- Thumb anywhere: vertical picks the speed row, horizontal the turn fraction f ∈ [−1, 1] of that speed's maximum curvature.
  The exact path previews on the board live, with the ghost and its sights at the end.
- Shapes: **ARC** (one constant-curvature segment), **TURN EARLY** (half the length at the chosen curvature, then straight),
  **TURN LATE** (straight, then the turn). Chips above the pad; one tap, one thumb.
- Detents: the centre (dead straight, a 6 % dead zone that widens to 11 % once inside) and each speed row (8 px of hysteresis
  on the boundary): `vibrate(6)` plus a tick, once per crossing.
- Lift to lock with F's grace ring; touch again to adjust. A loop: hold the Viper hard at the edge at speed 2 (±382°).

## 2. Rehearse (fly the ghost)

- Touch the pad (or PLAY) and the ghost flies for 2.2 s real time. The stick: horizontal is rudder, as a fraction of the turn
  rate at the current speed; vertical is throttle, continuous between the slowest and fastest speed allowed this turn.
  Distance flown per second is speed × 60 / 2.2, so the throttle decides how far it goes; the new speed is the flown length
  rounded to a step. Rudder follows the thumb with a 0.12 s lag and the throttle with 0.25 s (no jerk); lifting the thumb
  centres the rudder and holds the throttle.
- **The path is recorded as flown**, one `[ds, k]` segment per frame (about 130 a flight). ⟲ REDO or a double-tap on the pad
  rearms instantly and as often as you like; LOCK keeps it. The board stays top-down, the camera following the ghost with the
  rivals' fans in view, then framing the whole path for the review.

## 3. Chase (third person)

- Rehearse, but once the camera has arrived the view dips (0.36 s) into a **cockpit behind and above your ship**: a manual
  perspective of the board plane (eye 70 behind and 60 above, pitched 32° down, focal length ≈ 0.92 × width, near plane at
  14) with the nose always up the screen, so left on the stick is left in view. Drawn: a horizon with a star band, a 150-unit
  world grid for the sense of motion, the board's red edge, the rivals' fans and ships (with names inside 900), your sights,
  the path flown so far behind you, and the ship itself fixed in the frame, banking with the rudder.
- When the flight ends the view dips back out to the top-down review with the path shown. REDO drops you back into the cockpit.
- Cost: the chase frame projects about 16 grid lines, 4 edges, 3 fans, 6 ships and the path; measured below.

## Bots

Unchanged from F3: the honest planner over 39 momentum candidates (7 arcs, 2 S-curves, 2 turn-then-straight, 2 straight-then-
turn per allowed speed), the same move space the Stick offers (plus the two-segment shapes), scored in expected dice damage.

## Test results (`node tools/fun/tactics.test.mjs all --seeds 24`, both viewports, real CDP touches, console clean)

**controls**
- k1: a real tap on the Chase toggle is remembered (`tactics.controls`); `?controls=rehearse` wins on load.
- k2: the Stick corners are the hardest legal moves: the Brawler's top-right is speed 3, f = 1, length 180, turn 113° of a
  117° maximum (the turn metric sums between 6-unit samples, so it reads one sample short of exact); bottom-left is speed 1,
  f = −1, length 60; the centre is dead straight; a half-right at speed 3 locks after the grace with the same hash.
- k3: detents tick once: into the centre (1), a ±3 px wiggle inside it (still 1), a row change (2), a ±3 px wiggle on the row
  boundary (still 2, and the row holds).
- k4: the Viper held at the edge at speed 2 turns 364° (a loop); at speed 4 it turns 347° (no loop); the Lancer's maximum turn
  is 234° / 195° / 178°; TURN EARLY gives two segments with half the turn.
- k5: the preview is the flight for all three ships (final heading equals the path's end, the new speed is the path's speed).
- k6: Rehearse, rudder 0.5 at full throttle for the whole flight: 2.2 s wall time, speed 3, length within 0.6 of the summed
  segments (about 175: the throttle ramps from 2), every segment's curvature within the tightest limit, the summed turn within
  20 % of rudder × length / R(3) (the rudder lag), and LOCK commits the same hash.
- k7: full rudder at the lowest throttle never exceeds 1/R(min); lifting mid-flight returns the rudder toward centre; REDO rearms
  with no segments and no path, and is repeatable.
- k8: Chase: the view is in the cockpit once the camera has arrived; a point 200 ahead projects to the screen centre above the
  ship, a point 100 to the right projects right, a point 3000 ahead sits just under the horizon, a point behind is not drawn;
  the thumb flies it in the chase view; the view returns to top-down with a flown path of 100+ segments; REDO goes back in.
  Frame time during the chase flight: see below.

**touch** (F2's stroke mode, `draw`): unchanged and passing. **combat** (F3's): unchanged and passing. **bot**: deterministic,
frozen through strokes, candidates within the turn rate.

**perf** (DPR 2): fly + reveal + orders + fireworks p50 0.5 / p95 0.9 / max 2.1–2.2 ms; **the chase flight p50 0.7–0.8 / p95
1.1–1.2 / max 1.2–1.5 ms** (the perspective is cheaper than the top-down reveal). Bot decisions 1.5–1.6 ms p50 / 1.9–2.3 p95 at
4× CPU throttle.

**sims** (24 seeds, unchanged from F3 since the planner and combat are the same): idle 0–24–0 (median 11), random 0–22–2 (19),
careful without orders 0–24–0 (10), careful with greedy orders 11–13–0 (10); damage per bad read 1.33–1.52 against 0.27–0.69
otherwise; killed before acting 28 theirs / 23 yours for the careful player.

## My read on the three

- **Stick is control.** It is the clearest instrument: the whole legal space on one panel, the limits visible as edges, the
  path exact and live. It feels like setting a dial, not flying. For a phone it is the most forgiving and the fastest to plan
  with, and loops read as "hold the edge", which is honest. Its weakness is that the move is one arc (or a two-piece), so the
  space is smaller than what Rehearse can record.
- **Rehearse feels like flying a plan.** The thumb steers and the path is what you flew; the fans are in view and the pace is
  slow enough to read. But it is also the mode where "flying" and "control" pull apart: a careful player wants to place the
  end pose, and steering to a spot in 2.2 s is a motor task, however gentle. Unlimited redo is what keeps it from being a
  reflex test, and the review beat with LOCK is what keeps it a plan.
- **Chase feels most like flying**, by a distance: the grid rushing under you, the fans ahead, the rivals rising over the
  horizon, left is left. It is also the mode where the board read is weakest while flying: you cannot see behind you, and the
  pull-back review is what restores the plan. As a hybrid it works: fly it once for feel, read the top-down, redo if the end
  pose is wrong. The projection is cheap enough for a phone.
- If the owner wants one: Stick for the player who plans, Chase for the player who wants to fly, and Rehearse is the step
  between. The honest risk is that Chase's fun is the camera, and the camera does not change the decision.

## What I would change next

- Stick: show the end pose's sights for a second shape at once (a faint ghost for TURN EARLY/LATE), and a tap on the board to
  aim the row at a target ("point me at it").
- Rehearse/Chase: a speed tick sound when the throttle crosses a step, and a ghost trail of the previous attempt for comparison.
- Chase: a small top-down inset in a corner while flying, to fix the "cannot see behind" gap without leaving the cockpit.
