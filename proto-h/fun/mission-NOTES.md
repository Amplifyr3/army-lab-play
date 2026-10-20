# H "Mission: take a star": notes (builder for Fable, 2026-10-20)

The owner on G4:
- "I think we went too hard towards league lol it doesn't really work without the levels and scaling and a team."
- "Let's swing the camera back around to 'our side', so we face the enemy head on and progress forward. Take the stars right?
  Let's actually make it a game about taking a star."
- "Something like an armored core experience where the level is a mission? ... I like the idea of demolishing tons of tiny enemies
  and then dueling with equals? Taking towers was still cool but I didn't like that we could simply out range them."

H is a new file, `public/fun/mission.html`, built on G4's engine: the expo stick, release-to-hover, the auto-fire cone, lock-on,
DASH with i-frames, the three spirits' SPECIAL and second ability, pooled sparks, and the perf budget. The lanes, the jungle, the
Leviathan, the outpost and the minimap are gone. Harness: `node tools/fun/mission.test.mjs [touch|perf|sims|shots|all] [--seeds 3]`
at 844x390 and 640x360, real CDP touches, DPR 2. Test API: `window.__fh`.

## What was built

- **The camera faces the star.**
  - It sits behind and above your mech: 640 from its focus, a 20° pitch, the focus 230 ahead of you.
  - The yaw is fixed: up the screen is always deeper into the system.
  - It follows you sideways with a 0.45 s lag. It stops 420 short of the corridor walls, so near a wall you drift off centre and
    can see the wall.
  - Your mech faces forward, or turns to the lock.
  - Locked on the guardian, the view frames you both. Under a dome it zooms out a little.
- **The star burns on the horizon and grows as you advance.** It is a sprite with slow rays, 20 000 units up the corridor. Its
  radius goes from about 60 px at the launch point to about 160 px at the corona. That is the progress meter.
- **Landscape,** with G3's turn-your-phone card. The game pauses in portrait.
- **One continuous sortie, in four stages, along a corridor 2500 wide.** Relays sit at y 250, 5500, 8050 and 10 750.

  | Stage | Where | What happens |
  |---|---|---|
  | 1. The Approach | three swarm sectors | Each sector is closed by a violet screen that drops when its swarm is cleared. A counter reads "SWARM SECTOR 2 · 44 LEFT · WAVE 4/9". A wave is a main formation (line, V, spiral or cloud), a second formation beside it, and sometimes gunships or bruisers |
  | 2. The Defence Line | Gate 1 (one battery), Gate 2 (two batteries) | Each battery sits in a shield dome in front of its gate, a red energy wall. The wall holds while any of its batteries stands |
  | 3. The Corona | an 820-radius ring of fire | The guardian ace duels you. The ring seals once you are in it, and the drone waves stop |
  | 4. The heart | the corona's centre | Hold the hexagram platform for 10 s while the last wave pours out of the star. Then the ignition |

- **Swarm feel.**
  - Drones are 1 hp. They fly in formation, then break and dive at you.
  - A drone that reaches you hurts you for 4 and dies. DASH or a charge through a swarm pops it instead.
  - **Chain bursts:** a drone you kill sets off the tight neighbours within 64, 0.055 s later, up to nine links. The ones about to pop
    flash white, so a line or a V goes off like a fuse. "CHAIN 9" pops under the KO counter.
  - **The mid tier:**
    - **Gunships** (10 hp) hold at 540, just outside your reach of 480. Before each three-shot burst they show a red aim line for
      0.55 s. To kill one you have to close in.
    - **Bruisers** (8 hp plus a 12 hp shield that regrows) push in. Their shockwave has a red ring with a 0.8 s wind-up.
  - Heavy kills get a 0.06 s hit-stop and a thump.
- **Your tide.** Three small blue craft launch from behind you every 3.5 s, up to 42. They advance beside you and shoot drones.
  - At a gate they make for the nearest battery. Inside its dome each one wears its core down by 2/s, until the flak kills it. So
    escorting them is a way in.
  - In the duel they hold the corona's rim and watch.
- **The batteries out-range you.**
  - Your reach is 480 (the cone on the floor). A battery's reach is 1650, drawn as a dashed red line on the floor and labelled
    "BATTERY REACH".
  - **Volley:** four shells every 3 s, aimed where you are heading (0.55 s of lead). Each lands on a red circle with a closing ring,
    1.25–1.7 s after it fires, and you see it lob in from the battery.
  - **Sweep beam:** a 1.1 s wind-up shows the line it starts on and the arc it covers. Then it sweeps across your path, and debris
    (and Tide's Bulwark) stops it. So a rock is cover.
  - **Missiles:** five homing missiles every 4.6 s. They turn at 1.7 rad/s and burst on debris, so you can bait them into it.
- **The dome.**
  - **Outside it, your shots do nothing.** They splash on the dome where they hit and ripple it. After a few splashes a hint says so.
  - Entering it ripples it, shimmers, and gives a short buzz.
  - **Under it the battery's main gun can't touch you.** It can't depress: shells and missiles burst on the dome. It turns on your
    tide outside instead.
  - **Inside, it vents flak.** A 1 s wind-up tints the dome floor red and pulses a ring at the core. Then a bright wave sweeps the
    floor from the core to the dome's edge in 0.42 s, for 18. DASH as the wave reaches you and its i-frames take it.
  - The core (1400 hp) breaks with a white flash, a 0.18 s hit-stop, slow motion, a shake and a crumble. Then "GATE 1 OPEN", and the
    gate stays open for the rest of the sortie.
- **Relays, swaps and falls.**
  - A relay lights as you cross its dashed line, with a callout. It is the only place to swap (portraits, top right; they show SWAP
    gold inside a lit ring) and the place you relaunch from.
  - Benched spirits heal 4 %/s. The active one doesn't heal: you rest a spirit by swapping it out.
  - A fallen spirit stays down. The card reads "MOSS FELL / to the Gate 2 battery's volley inside its dome / Tide launches from
    Relay 2".
  - Lighting the next relay rekindles one fallen spirit at 60 %.
  - Losing all three fails the sortie.
- **The guardian: an equal with your kind of kit.**

  | Guardian | Special (1.1 s wind-up) | Second ability | Ultimate (phase 3, a 2 s warning) |
  |---|---|---|---|
  | Scorpius | Sting Ring (dashes in, then a ring of 270) | Tail Needles (3 homing) | Supernova: 3 expanding rings; DASH each one |
  | Draco | Breath Beam (760 × 96) | Fire Wake (a dash leaves a burning line) | Dragon Sweep: a 250° beam; get into the gap, or DASH it |
  | Lupus | Lunge (to where you stand) | Pack Howl (5 fast hounds) | The Hunt: three lunges, each one told |

  - **Shared kit.** Each one strafes at about 340 and has chip fire. Its dash has a 0.42 s tell, an arrow on the floor.
  - **Phases.** Phase 2 at 60 % brings a guard wing: a ring of 12 drones and 2 gunships, with the ace shielded for 1.5 s. Phase 3 at
    30 % unlocks the ultimate, which comes every 14 s.
  - **Framing.** Letterbox bars, the title "DUEL: DRACO, GUARDIAN OF THUBAN", a boss bar with phase ticks, and a full-width red
    "ULTIMATE" band with a countdown and how to dodge it.
- **Take the star.** The guardian falls with a hit-stop, slow motion and "DRACO FALLS". Then "HOLD THE HEART":
  - The bar fills over 10 s on the platform and drains slowly off it.
  - The last wave comes out of the star every 1.3 s, with gunship pairs at 30 % and 70 %.
  - **The ignition:**
    - A flash in your spirit's colour. The star blooms and turns your colour, and the rays spin up.
    - The camera tilts up and pulls back (the yaw is still fixed).
    - Your controls step aside. A star chart draws on the right: a circle with its hexagram, the three stars, and a gold line from
      the centre to the star you took (stars you took before keep their lines; this per-browser memory lives in localStorage).
    - "ANTARES IS YOURS".
  - **The result card** "Star taken: Antares": time, KOs and best combo, longest chain, batteries broken, the duel (time, damage
    taken, tells dodged, ultimates), and the spirits that fell.
- **The fail card** "Sortie failed: Kakkab" names each fall in order with its source and where it happened:
  - For example: "Moss fell to the Gate 2 west battery's flak ring inside its dome. Before that, Ember to a drone swarm on the
    Approach; Tide to the Gate 2 west battery's volley on the run-in to Gate 2."
  - Then "Way out: Inside a dome, DASH just as the bright flak wave reaches you."
  - RETRY, SAME STAR, STAR CHART.
- **Three stars on the start card** (tap one, then SORTIE). Seeds above 3 repeat the three with new layouts.

  | Star | Guardian | Debris | Swarm | Batteries (Gate 1 · Gate 2) |
  |---|---|---|---|---|
  | Antares | Scorpius | rocks | lines, V's, spirals; gunships | volley · volley + beam |
  | Thuban | Draco | station wrecks (big cover) | spirals, clouds, V's; bruisers | beam · missiles + volley |
  | Kakkab | Lupus | dense ice | clouds, V's, lines; gunships and bruisers | missiles · beam + missiles |

- **The HUD.**
  - A mission track (top left) shows the stage name, the relays, the screens, the gates, the corona and the heart, plus your
    furthest progress and where you are.
  - Top centre: the KO counter, the combo and the chain.
  - Portraits sit top right. SPECIAL, DASH and the ability sit bottom right, as in G4. The stick is on the left 40 %.
  - Hints show bottom centre, wrapped to two lines, clear of the stick and the buttons.

## Tuning (in `T` and `Y`)

| | Value |
|---|---|
| Your speed | 400; expo 1.6, dead zone 12 %, release hovers in 0.23 s |
| Your reach | 480, cone ±35° |
| Battery reach | 1650 |
| Dome | radius 380 |
| Core | 1400 hp; your damage × 3; Ember's twin guns both fire on a lone core |
| Volley | 4 shells / 3 s, 16 each in a radius of 105 |
| Beam | sweeps 0.8 rad in 1.3 s, 24 |
| Missiles | 5 / 4.6 s, 12 each |
| Flak | every 3.4 s while anything is under the dome; 1 s wind-up, 18 |
| Sectors | 9 / 10 / 12 waves, each × 1.6 plus a second formation; the next wave comes when 15 % of the last is down and 2.1 s have passed, or after 4.5 s |
| Patrols | every 9 s, only when you linger outside a sector; growing 8 % a patrol |
| Guardian | 2500 hp, your damage × 4; speed 300; special every 6.5 s; dash tell 0.42 s; ultimate warning 2 s |
| Hold | 10 s; off the heart it drains 5 %/s |

**How the pacing got there.** The first build's push player won in 3:07: it flew through the Approach in 20 s. So:
- The Approach became three swarm sectors with screens.
- The relays moved out of the batteries' reach. The first layout put Relay 1 inside Gate 1's volley.
- Waves were paced by kills with a minimum gap. When they came as fast as they died, the screen was rarely busy, so each wave now
  brings two formations: peaks of 60–100 drones.
- The core went from 640 to 1400 hp and the guardian from 1100 to 2500.
- A reset bug (the last sortie's state leaking into the next) made the sims order-dependent. Fixed: `reset` now clears all of `S`,
  so a seed gives the same sortie every time.

## Test results

`node tools/fun/mission.test.mjs all`: every check passes at both sizes, the console is clean, exit 0.

**Touch suite** (both viewports; real CDP touches, DPR 2):

- **p0:** the portrait card shows and the game pauses; turning to landscape resumes it.
- **t1:** through a whole push sortie there is one yaw value (π/2), and a point 600 ahead projects above you in 91 of 91 samples. A
  real stick up flies forward at 400 with no sideways drift; stick right flies right.
- **t2:** a full push gives 400; a 25 % push gives 18.8 (4.7 %). Release hovers in 0.23 s, with 0 drift over 2 s.
- **t3:** the star's radius grows as you advance (rounded):

  | Where | 844x390 | 640x360 |
  |---|---|---|
  | Launch | 53 px | 49 px |
  | Relay 1 | 72 px | 66 px |
  | Corona | 123 px | 113 px |

  That is × 2.33 at both sizes.
- **t4:** sector 1 under the push player: 9 waves, a peak of 48 enemies on screen, then down to a few. 270 KOs and chains of 9. The
  screen drops at 0:20 ("SECTOR 1 CLEAR: SCREEN DOWN").
- **t5:** standing 1000 from Gate 1's volley battery (your reach is 480, its reach 1650): 8 shells, 3 hits out of your reach, hull
  100 → 52. The core is untouched and none of your shots reach it.
- **t6:** at 440 (outside the 380 dome, inside your reach) 30 shots splash on the dome and the core keeps its full hp. At 250, inside,
  the core loses 90 in 3 s.
- **t7:** a real stick flight enters the dome after 1.0 s (it ripples; the hint shows). The core breaks; "GATE 1 OPEN". The gate is
  still open 40 s later, and the real stick then flies you through it (y 8365, past the gate at 7600).
- **t8:** the flak ring fires on cue (wind-up 0.98 s). Standing still costs 18 (one flak hit). A real DASH tap as the wave arrives
  (0.32 s of i-frames) costs 0 and counts one dodge.
- **t9:** a swap by a real portrait tap works at the launch relay. At y 3000 it is refused ("Swap at a lit relay"). Relay 1 lights as
  you fly through its line (with its callout), and a swap there works.
- **t10:** a spirit felled by "the Gate 1 battery's volley" (on the run-in to Gate 1) stays down. The next one relaunches 60 from
  Relay 1. Crossing Relay 2 rekindles the fallen one (benched again).
- **t11:** the Draco duel:
  - "DUEL: DRACO, GUARDIAN OF THUBAN", and in 8 s not one drone or new wave.
  - The Breath Beam does nothing for 0.9 s of its 1.1 s wind-up, then takes 22.
  - The dash shows its tell for 0.42 s, then moves.
  - At 60 %: phase 2, "GUARD WING!" and 12 enemies. At 30 %: phase 3, "BURNS HOT: ULTIMATE COMING".
  - 1.0 s later: "ULTIMATE: DRAGON SWEEP", with its sweep telegraphed.
- **t12:** "HOLD THE HEART". The hold bar is 0.50 after 5 s on the heart, and drops to 0.40 after 2 s off it, with 25 of the last
  wave on screen. It ignites 6 s after you get back on, and the card says "Star taken: Antares".
- **t13:** the fail card:
  - "Sortie failed: Kakkab"
  - "Moss fell to the Gate 2 west battery's flak ring inside its dome. Before that, Ember to a drone swarm inside its dome; Tide to the
    Gate 2 west battery's volley inside its dome."
  - "Way out: Inside a dome, DASH just as the bright flak wave reaches you."
- **t14:** hit areas, in px:

  | Control | 844x390 | 640x360 |
  |---|---|---|
  | SPECIAL | 94 | 86 |
  | DASH | 74 | 68 |
  | Ability | 74 | 68 |
  | Portraits | 56 | 56 |

  None overlap each other or the stick zone (40 % of the width).
- **t15:** a real tap on Kakkab, then SORTIE: the sortie starts on Kakkab with Lupus.

**Perf** (DPR 2):

| | 844x390 | 640x360 |
|---|---|---|
| 220 forced drones, p95 / max | 1.1 / 1.4 ms | 1.1 / 1.5 ms |
| 4× CPU throttle | 59.5 fps, p95 5.0 ms | 59.5 fps, p95 4.7 ms |
| The densest real moment (Thuban's sector 2, 85 alive) | p95 1.0 ms | p95 0.9 ms |
| The Gate 2 run-in | p95 1.1 ms | p95 1.0 ms |

**Sims** (deterministic, 15 min cap):

| Star | Push | Duel | Idle |
|---|---|---|---|
| Antares | wins at 6:10, 1303 KOs | 93 s | fails at 4:01 |
| Thuban | wins at 6:42, 1864 KOs | 74 s | fails at 7:01 |
| Kakkab | wins at 6:29, 1588 KOs | 107 s | fails at 4:37 |

- **Push timeline (Antares):**

  | Stage | Start |
  |---|---|
  | Sectors | 0:02 |
  | Gate 1 | 1:10 |
  | Gate 2 | 2:08 |
  | Duel | 4:16 |
  | Heart | 5:50 |

  All three batteries fall in every run. One or two spirits fall per run (one is rekindled).
- **Idle:** the guns fire on their own, but the gunships of the patrols hold just outside your reach. All three spirits fall to "a
  gunship's burst on the Approach", and the card's way out is "A gunship fires along its red line: step off it, then close in."
- **Six seeds** (seeds 4–6 replay the three stars with new layouts), measured before the last trim of core and guardian hp (1500 →
  1400 and 2800 → 2500): push 6 of 6 (6:06–7:10, median 6:37), idle 0 of 6. The trim took about 15–30 s off each.

## My read

- **The fantasy reads now.** You face the star the whole way, and it grows over the horizon. The four stages give a real arc:
  - a mow, with chains popping through a V like a fuse;
  - a run-in under shells;
  - the dome sanctuary with its flak rhythm;
  - a duel, a hold, and a finale.

  "The level is a mission", and the end card is about the mission.
- **The out-range problem is solved by rule, not by numbers.** You can't hurt a battery from outside its dome at any range, and it
  can't touch you inside it. So the decision is when to commit to the run-in, and whether to bring your tide. The danger moves from
  the volley outside to the flak inside.
- **The duel needs a human to judge it.** The bot reads every tell perfectly; in the sims it is hit by 1 tell in 41 and by about
  half the ultimates. The Dragon Sweep and the Supernova are the hard ones. 74–107 s may feel long for a human; a first-timer will
  take longer than the bot all round.
- **Risks:**
  - The swarm sectors may feel like a waiting room if waves die faster than they arrive. They are paced at 2.1–4.5 s a wave, and peak
    at 60–100 on screen.
  - Rocks can hide drones at mid distance.
  - Gate 2's two batteries take about 2 minutes, which may drag.
  - The fixed forward view makes debris near the camera big; near debris fades, but large wrecks still block a lot of Thuban's
    floor.

## Next tunings

1. **The duel's length.** Try 2000 hp, or a shorter phase 3 with ultimates every 10 s. Watch whether humans can read the
   Dragon Sweep's gap.
2. **Gate 2.** Make it one bigger battery, or let a broken battery's dome collapse to weaken its partner (−30 %), so the second run-in
   is faster.
3. **The swarm.** Add formations that react: a spiral that tightens when you are near, and a V that splits around you. Make the chain
   radius grow with combo, so a big chain feels earned.
4. **The heart's last wave** kills a spirit in 2 of the 3 push runs. Either telegraph it from the star (a flare 1 s before), or let lit
   relays send a final tide.
5. **The star chart as mission select.** The three stars sit on the hexagram already; tapping a lit or unlit star on the start card
   could be the mission select, with a constellation line per star taken.
