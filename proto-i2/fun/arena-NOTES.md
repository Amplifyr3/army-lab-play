# I2 "Arena: the hexagram": notes (builder for Fable, 2026-10-21)

The owner on I: "could we try a hex layout again? bring back in some of that sacred geometry? and yeah up the aggression".

I2 edits I's `public/fun/arena.html` in place. I stays live at `proto-i`. Harness: `node tools/fun/arena.test.mjs [touch|perf|sims|shots|all] [--seeds 8]`; test API `window.__fi`.

## What changed

- **The board.**
  - A flat-top hexagon of 2269 pointy-top hex cells (axial, radius 27, cell radius 63), centred on the old map.
  - Flips, the water-like spread and the border stops all run across the six hex edges.
  - Borders glow along hex edges, two-sided as before.
  - The hex edge holds everything in: you, sparks and rivals.
- **The hexagram (`?crews=3`, the default).**
  - You and two rivals sit on one triangle: you at the lower left, Scorpius right, Draco upper left. The colours stay.
  - Three star beacons (Vega, Altair, Deneb) sit on the other triangle.
  - The Heart is at the centre.
- **4 crews (`?crews=4`, or on the start card).**
  - Bases sit at four of the six corners in two opposite pairs: you and Scorpius, Draco and Lupus.
  - Two beacons sit on the remaining corners.
- **Beacons.**
  - To take one, stand on it uncontested: a spirit takes it in 3.5 s, sparks slowly. One already held takes 0.6× as fast.
  - Taking it flips and locks its ring (radius 2), then it grows its owner's land, one hex every 1.4 s, out to radius 6.
  - A held beacon is a relay: you swap there, heal slowly there, and relaunch there when you fall nearer to it than to your base.
  - Rivals relaunch at theirs too.
- **The Heart.**
  - A crew holding every beacon lights it. Its spark spawn doubles and its sparks hit 1.6× harder (fights and domes).
  - It also claims and locks the ring round the altar, and grows land from it.
  - Lose one beacon and it goes out. Each change gets a banner.
- **Sacred geometry, kept quiet.**
  - Faint gold hexagram lines. The piece of a line over each hex lights in its owner's colour, so the star fills in as crews take it.
  - Three gold circles: one inscribed in both triangles, one through all six points, one at a quarter.
  - A flower of life at the altar (seven circles in one ring), burning in the Heart crew's colour.
  - The gold board edge has a light at each corner, and each beacon has a small hexagram on the floor.
  - The start card has a flower-of-life mark.
- **The minimap** is a hexagon, with the hexagram and its circle drawn faintly. It shows beacons (star marks, ringed while being taken), the Heart, bases and intents (B beacon, * Heart). It redraws at most every 0.45 s.
- **Readability.**
  - A calm FRONT edge arrow points to the nearest edge with another colour when you're deep in one colour (more than 720 away). It's found by a walk over same-coloured hexes every 0.5 s.
  - Your hexes within two of your mech are tinted a little stronger.

## Aggression: what the rivals do now

- They think every 0.6 s (was 1.0) and retreat at 12% hull (was 22%). They head to the nearer of their base and their held beacons.
- **The cap on you holds every step.** It counts rivals hunting you or whose crew targets your base.
  - At most two while you lead the land (with ±4% hysteresis), one while you're behind.
  - Defending their own home is always allowed.
- **Smart pressure.**
  - **Backdoor:** while you're under another crew's dome, a rival raids your base.
  - **Help:** when you lead and it's close, a rival comes to pull you off instead.
  - **Territorial:** they pick their duels (you on their land, at a beacon they want, at their door, or you below 40 hull). Otherwise they keep expanding and raiding instead of chasing you to their deaths.
  - **Rally:** while you're under a dome, its dead rival respawns within 3 s.
- **Beacons and the Heart.**
  - Each rival opens by racing for the beacon it shares with you.
  - Its plan is re-rolled every 9–16 s: beacon or expand in the opening; then raid (45%), beacon, or expand.
  - A held beacon under attack is defended.
  - They go to put out anyone else's Heart, and go for the last beacon when they hold all the others.
- **Their kit.**
  - Your Special or Ram near a rival is dashed through 40% of the time: a short hop with i-frames, half the time straight through you, which can clip you.
  - Specials are cast into clumps of 6+ enemy sparks.
  - Chip fire is faster and better led: 11 dmg every 0.7 s, bolts at 850, lead 0.8.
  - Their guns now fire on their own at enemy sparks in reach, as yours do (3/s, thin pale tracers).
  - In I they never shot sparks, and that was most of your land edge.
- **Tougher everything.**
  - Rival hull is 520.
  - Bases are 1200 gun and 1000 Core, and repair 11 hp/s once left alone for 2.5 s, so raids must commit.
  - Spark kamikaze is 5, and spark damage to domes is 1.4.
- **Respawn.** A rival comes back in 6 s plus 1 s per death (capped). It has one spirit, not three.

## Results (both sizes, DPR 2, real touches): all pass

- **Touch:** every test passes at both sizes.
  - Hex flip and spread, with a contested hex staying neutral.
  - Edge borders and the hexagram drawn and lighting up.
  - Output, regen and drain, dome rules with a real DASH tap.
  - Elimination, which hands over beacons too.
  - Win and loss, with the end card's Heart row.
  - Beacon capture, ring lock, land growth, relay swap and relay relaunch.
  - Heart ignition (spawn ×2) and going out.
  - The 4-crew layout, by tap and by URL.
  - Intents and the cap.
  - Evade and clump casts.
  - The frontier arrow and the hex edge.
  - Dual stick, hit areas, auto-aim, controls persistence.
- **Perf:**

  | Case | Result |
  |---|---|
  | 220 sparks | p95 1.1–1.3 ms |
  | 4× throttle | about 58 fps |
  | Busiest real match, 3 and 4 crews | p95 1.3–1.6 ms |

- **Sims, seeds 1–8:**

  | Crews | Push wins | Spirits lost (per seed) | Idle |
  |---|---|---|---|
  | 3 | 6/8 | 1, 1, 1, 5, 4, 1, 5, 3 | 0/8 |
  | 4 | 4/8 | 2, 2, 4, 2, 1, 0, 2, 2 | 0/8 |

  - Never more than two rivals were on you, and never more than one while you were behind.
- **Wider samples** (8 seeds swing ±1–2 wins):
  - 3 crews: 93/144 (65%).
  - 4 crews: 19/48 (40%).

## An honest read

- **The scripted player was very hard to slow down.** About 40 tuning runs said so: plain stat bumps did nothing or made it easier.
  - Stronger rivals hunted the player and died, then sat out escalating respawns while the player out-landed them.
  - What worked was smarter, not harder: backdoor raids, help, rally, territorial duels, the opening beacon race, rival guns at sparks, flat rival respawn, and base repair.
- **Land is mostly won in the opening.** Spread does almost all the flipping, seeded by base rings and beacon rings. Most matches go to 9:00 on a few points of land.
  - That's tense in the sims, but a human may find the middle minutes static, with borders that barely move once the board fills (about minute 3).
  - Worth watching: a slower spread made the scripted player win more, not less.
- **3 crews against 4.**
  - 3 crews reads cleanly: a clear star, two rivals, and every beacon a border dispute between two neighbours.
  - 4 crews is harder (40%) and busier. The Heart needs only two beacons, so it lights and flips far more often. Your one near beacon is contested by your neighbour, and the far one is rarely yours. Matches end tighter (four-way 25–30% splits).
  - The hexagram motif is weaker with 4 crews: bases no longer make a triangle.
- **Known rough edges.**
  - The FRONT arrow and the BASE! arrow can sit side by side at the lower edge.
  - Rival tracers at sparks add screen noise in big fights.
  - Rocks are large next to the smaller hex board.

---

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
