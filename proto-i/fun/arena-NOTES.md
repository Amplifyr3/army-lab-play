# I "Arena: four crews, one star system": notes (builder for Fable, 2026-10-20)

The owner on H2:
- "It's fun and engaging but a little too linear."
- "I wonder if we can combine aspects of it with our original free for all zone control style of gameplay where we're navigating
  the board, flipping space to our color, tryna take enemy bases? maybe star with four players?"
- "The diagonal cam did work best I feel."
- "Also I wonder what it would be like with dual sticks? One for movement and one for heading?"

I is a new file, `public/fun/arena.html`. It reuses H2's spirits, their kits, the base dome rules, the flak, the speed feel and the
C camera framing on an open four-crew board. Harness: `node tools/fun/arena.test.mjs [touch|perf|sims|shots|all] [--seeds 6]`.
Test API: `window.__fi`.

## What was built

- **The board.** A 6000 × 6000 square with four crews and a base in each corner:

  | Corner | Crew |
  |---|---|
  | Bottom left | you (blue) |
  | Bottom right | Scorpius (red) |
  | Top right | Draco (gold) |
  | Top left | Lupus (violet) |

  - The colour always means the same rival.
  - About 70 rocks lie between the bases, as cover from beams and bait for missiles.
- **The camera** is H2's C framing (45° pitch, 600 out) with the yaw fixed north. The minimap and the board share an orientation,
  and the push from your base toward the centre runs diagonally up-right on screen, as in C. There is no CAM chip; `?cam=A|D` stays
  for testing. The fog sits 500 ahead.
- **Territory.**
  - **The grid.** A 60 × 60 grid of 100-unit cells.
  - **Flipping.** A cell flips to a crew whose spirit or sparks hold it uncontested: 0.6 s for a spirit, 3 s for sparks. It takes
    three times longer when another crew already owns it, so their land is harder to take than open space. Two crews in one cell
    and nothing moves.
  - **Spread.** Every 1.6 s each neutral cell that touches exactly one crew's land joins it with a 10 % chance. Land spreads like
    water and stops at contested borders, where it touches two crews.
  - **Base ground.** The ground under a standing base can't be taken.
  - **Drawing.** The floor shows each crew's cells tinted, cells being flipped pulsing, and a glowing two-sided border wherever
    colours meet.
  - **The minimap** (top left) is the territory map: the bases, every rival with an intent letter (E expand, D defend, R raid,
    H home, ! on you) and a dashed line to its goal, and your view frame.
- **Land matters.**
  - **Output.** Each base pours sparks in packs of three. The rate is 0.25/s plus 0.0035 per cell, up to 1.6/s, and each crew can
    have at most 60 out.
  - **Regen and drain.** Your own land heals your spirit 2.5 hp/s and your base 6/s. Their land drains 2 hp/s, down to a floor of
    12 (it never kills on its own).
- **Sparks** (every crew):
  - **Fighting.** They fight foe sparks in reach and dive at enemy spirits within 300.
  - **Goals.** They push to frontier cells, escort their spirit (yours follow you 55 % of the time, ahead of your heading), and raid
    their crew's target base.
  - **Under an enemy dome** they wear the gun, then the Core, down at 1/s each.
  - **Chain bursts.** Your kills set off packmates, as in H.
- **Bases.**
  - Each base has one gun (volley, sweep beam or missiles, seeded) under a shield dome of radius 420, and a Core behind it.
  - H's rule holds: the gun out-ranges you (1650 against your 480), shots from outside the dome splash, and under it the gun can't
    touch you but the flak can.
  - **Order.** Break the gun (900), then the Core (700) opens.
  - **Elimination.** A Core breaking knocks that crew out. Its land and its remaining sparks go to the breaker (first claim), and
    its rival spirit is gone for good. A rival can knock another rival out too.
- **Win and lose.**
  - **Win:** last crew standing, or the most land at 9:00.
  - **Lose:** your Core falls, or someone holds more land at 9:00.
  - **End card.** It gives the cause and a way out, for example:
    - "Your Core fell to Draco at 6:12 (Draco's sparks broke your gun first)"
    - "Time: Lupus held the most land, 63% to your 13%"
  - **Warnings.** When your base is hit, a red "YOUR BASE IS UNDER ATTACK · DRACO" band with the gun's or the Core's bar appears,
    plus a callout and a blue "BASE!" edge chevron if your base is off screen. Off-screen guns firing at you get H2's red chevrons.
- **Rival spirits** (Scorpius, Draco, Lupus):
  - **The kit.** Each has its full kit from H: a special with a 1.1 s wind-up (Sting Ring, Breath Beam, Lunge), a 0.42 s dash
    tell, chip fire, and its second ability (Tail Needles, Fire Wake, Pack Howl).
  - **Thinking.** Each thinks once a second:
    - **recall** below 22 % (it heals at home);
    - **defend** when its base is threatened;
    - **raid** its target after 1:15, once it holds land;
    - **expand** into neutral cells otherwise.
  - **Raid targets.** Every 15 s each rival picks the weakest neighbour (base health, land, distance, some noise), and pulls a
    leader down if one runs 35 % ahead.
  - **Target spread.** At most one rival may have you as its raid target, at most two on anyone, and a rival only turns on you if
    fewer than two already are. So never all three. Rivals that meet scrap with each other (abstracted).
  - **Respawns** escalate as in G4: 8 s + 6 s × deaths + 0.025 s × match time.
- **Your spirits** are the three from H with their kits.
  - You swap at your base.
  - A spirit that falls comes back on the same escalating timer, and the healthiest benched one launches from your base.
- **Controls** (start card, remembered on the device as `fi.controls`; `?controls=auto|dual`):
  - **Auto-aim** is H2's scheme: one floating stick, the mech faces the lock (or where you fly), and the guns fire on their own.
  - **Dual stick:**
    - The left floating stick moves.
    - The right floating stick (the lower-right 40 %) sets your heading and **fires while held**. Releasing keeps the heading and
      stops the guns. A dashed heading line shows where they point.
    - A **quick tap** on the right zone (under 0.2 s, no drag) is a DASH toward your heading.
    - SPECIAL, the ability and DASH sit in a row above the right zone (60–64 px).
    - **Aiming is rewarded:** dual stick has a tighter cone (±20° against ±35°) and 1.3 × damage.

## Tuning (in `T`)

| | Value |
|---|---|
| Cell | 100 units; flip 0.6 s (spirit) / 3 s (sparks), × 3 on held land |
| Spread | tick 1.6 s, 10 % a cell |
| Base output | 0.25 + 0.0035 × cells, up to 1.6 sparks/s; 60 a crew, 260 in all |
| Your land / theirs | +2.5 / −2 hp/s (floor 12) |
| Gun / Core | 900 / 700; your damage × 3; sparks 1/s each; rival spirits 7/s |
| Rival spirit | 300 hp, your damage × 4; speed 290; special every 7.5 s; raids after 1:15 |
| Match | 9:00 |

**How it got there.**
- **The board filled too fast.** In the first build it was full in 70 s and every base sat at the spark cap, so land didn't change
  output. I slowed sparks' flips (1.5 s → 3 s), the spread (20 % → 10 % on smaller cells) and output.
- **The drain did nothing.** A spirit flipped enemy cells in 0.6 s, so it was never on their land for long. Held land now takes
  three times longer to flip.
- **Rival colours didn't stay put.** Rivals were shuffled per seed, so a colour didn't always mean the same rival; the line-up is now
  fixed.
- **The floor didn't read.** The space nebula is dimmer and the land tint stronger, so territory shows against it.

## Test results (`node tools/fun/arena.test.mjs all`: every check passes at 844x390 and 640x360, the console is clean, exit 0)

- **p0:** the portrait card shows and pauses; turning to landscape resumes it.
- **a1:** a cell under you flips (0.36 progress at 0.3 s, yours by 0.8 s). Two placed blocks grow on their own (98 → 364 cells and
  97 → 299 in 40 s). The one-cell gap between them stays neutral: a contested border.
- **a2:** output scales with land. At 130 cells the rate is 0.53/s and 9 sparks spawn in 15 s; at 1058 cells it is 1.6/s and 24
  spawn.
- **a3:** 4 s on your own land: 60 → 70. 1.5 s on theirs: 60 → 57 (3 drained). The floor holds at 12.
- **a4:**
  - At 1100 from Scorpius's (beam) gun: hull 100 → 85, the gun untouched.
  - At 470 (outside the dome): 30 splashes and the gun keeps all 900. At 260 (inside) it loses 90 in 3 s.
  - Flak: standing still takes a flak hit; a real DASH tap takes 0 and counts one dodge.
- **a5:**
  - Gun down, then the Core breaks: Draco is out by you. All 181 of its cells become yours, its 18 sparks turn, and the banner reads
    "YOU BROKE THE DRACO CORE".
  - Lupus knocked out by Scorpius: all 214 of its cells go to Scorpius.
- **a6:** the end causes:
  - last crew standing (a win);
  - "Your Core fell to Draco…" with a way out;
  - "Time: Lupus held the most land…" (a loss);
  - "Time: you held the most land…" (a win).

  The card shows "Victory on land".
- **a7:** in a 6-minute match every intent shows up (expand 91, raid 178, hunt 100, defend 27, recall 30 samples). At most 2 rivals
  were on you at once, and at most 1 had you as its raid target.
- **a8** (dual stick, real two-finger touch):
  - The right stick held to the right gives a heading of 0.00 (east) and 4 shots in 0.8 s. The left stick flies you north at 400
    meanwhile.
  - Released: the heading stays 0.00 and there are 0 further shots.
  - A quick tap on the right zone dashes east (vx 1000).
- **a9** (hit areas):

  | | 844x390 | 640x360 |
  |---|---|---|
  | Auto buttons | 94 / 74 / 74 px | 86 / 68 / 68 px |
  | Dual buttons | 64 / 60 / 60 px | 64 / 60 / 60 px |

  Nothing overlaps either stick zone or another button.
- **a10:** auto-aim has no right zone, shoots a spark ahead on its own, locks a rival and turns to face it.
- **a11:** "Dual stick" tapped on the start card, then LAUNCH: it plays in dual and is still dual after a reload. `?controls=auto`
  overrides it.

**Perf** (DPR 2):

| | 220 forced sparks, p95 | 4× CPU throttle | A real match at 2:00 (206–236 sparks), p95 |
|---|---|---|---|
| Auto, 844x390 | 1.0 ms | 59 fps | 1.0 ms |
| Auto, 640x360 | 0.9 ms | 59 fps | 1.0 ms |
| Dual, 844x390 | 0.8 ms | 59 fps | 1.1–1.3 ms |
| Dual, 640x360 | 0.7 ms | 59 fps | 1.1–1.3 ms |

**Sims** (seeds 1–6, deterministic):

| Player | Seed 1 | Seed 2 | Seed 3 | Seed 4 | Seed 5 | Seed 6 |
|---|---|---|---|---|---|---|
| Expand-and-raid | wins on land at 9:00 (81 %) | wins on land at 9:00 (56 %) | wins, last standing at 7:55 | wins on land at 9:00 (63 %) | wins, last standing at 8:24 | wins, last standing at 8:50 |
| Idle | loses on land, 16 % | loses on land, 22 % | loses on land, 19 % | loses on land, 26 % | loses on land, 25 % | loses on land, 25 % |

- The push player breaks 2–3 Cores a match, downs 4–11 rival spirits, and loses none of its own.
- Rivals knock each other out in 3 of the 6 push runs.
- Idle: a rival always out-flips you. Draco's crew was knocked out by Lupus in 3 runs, and by 9:00 Lupus or Scorpius led.
- Never more than 2 rivals on you, nor more than 1 raiding you, in any run.

**Shots** (`shots/`): `arena-territory.png` (a blue and red border mid-match), `arena-assault.png` (under the Scorpius dome on its
gun), `arena-minimap.png`, `arena-dual-aim.png` (a real held right stick aiming up-right), `arena-end.png`, `arena-start.png`,
`arena-640.png`, `arena-portrait.png`.

## My read

- **Less linear: yes.**
  - Every minute you choose where to go: grab open space beside your land, cut a rival's front, defend, or raid the weakest base.
  - The minimap's colours and intent letters make that choice readable.
  - The board changes hands as Cores fall, and rivals take each other out, so seeds differ in who is left and where.
- **Still punchy: mostly.**
  - The spirit, the kits, chain bursts and the dome assaults all carry over.
  - But the swarm is thinner than H's sectors (sparks are spread over the board, not poured at you), so the moment-to-moment mowing
    is calmer. The hordes come at borders and in raids.
- **The bot is too strong.**
  - Expand-and-raid wins 6 of 6 and never loses a spirit, which suggests rivals are too soft against an expert. Human play will
    tell.
  - Next: more rival focus on a leading player, and slightly faster rival raids.
- **The territory reads on the minimap better than on the floor.**
  - At this zoom the view shows about 10 × 7 cells, so you are usually inside one colour.
  - The borders and holes read well when you're on them.
  - A border arrow at the screen edge toward the nearest frontier might help.
- **Dual stick against auto-aim.**
  - Dual stick works and tests cleanly: the heading is kept on release, the guns fire only while held, and tap-to-dash fires no false
    dashes in the tests.
  - It's more engaging when dueling a rival (you aim the tight cone), but it costs a thumb: no auto-lock, and your guns are silent
    when you lift.
  - Against swarms auto-aim is easier and feels more musou. Dual stick feels more like a shooter: precise but busier.
  - I'd keep auto-aim as the default and dual stick as an option; the 1.3 × damage keeps it fair.
