# I5 "Arena: the tide": notes (builder for Fable, 2026-10-22)

I5 edits I4's `public/fun/arena.html` in place, per `playtests/fun/PROTO-I5-BRIEF.md`. I4 stays live at `proto-i4`, and its card on the index now points there. Harness: `node tools/fun/arena.test.mjs [touch|perf|sims|shots|all] [--seeds 8] [--only r1,f3]`. Test API: `window.__fi`.

The reframe: a single-player power fantasy for short sessions. Rivals are foils, asymmetry in your favour is fine, and matches are short, loud and often won. Two rules still hold: a loss is always explained, and idle never wins.

The owner on I4:
- Respawn timers didn't work: enemies came back far sooner than the toast said.
- Land grabbing felt awkward. They missed massive front lines in constant battle.
- The basic units felt like background.

## 1. Respawns: the bug and its proof

- **The cause.** `rivalStep` kept I2's rally rule (`T.rvRally`). While you were within `baseR + range` (900) of a rival's base, which is exactly where you kill it, its dead spirit came back in 3 s, whatever "BACK IN n s" said.
- **The fix.** The rule is deleted: the key, the branch and the I4 NOTES line (now struck through with a pointer here).
  - The other `respawnAt` writes are reset's `2 + e.k` opening stagger and the test-only `hideRivals`.
  - **The wait is now whole seconds** (the formula `8 + 6 × deaths + 0.025 t`, rounded up). So the toast, the minimap number beside the base and `respawnIn` all read the same number, and that number is when they return.
- **r1, measured.** Scorpius killed three times with the mech parked 382 from its base:

| | Toast | `respawnIn` | Back after |
|---|---|---|---|
| I4 (before the fix) | 9 / 15 / 21 | 8.15 / 14.28 / 20.40 | **3.02 / 3.02 / 3.03 s** |
| I5, Scorpius | 9 / 15 / 21 | 9 / 15 / 21 | 9.00 / 15.02 / 21.02 s |
| I5, your mech | 10 / 16 / 23 | 10 / 16 / 23 | 10.02 / 16.02 / 23.02 s |

## 2. Massive, constant front-line battles

- **Three crews** (Fable's call): `LAYOUTS[3] = { crews: [240, 0, 120] }`, so you are lower left, Scorpius right and Draco upper left. The other three star points are empty geometry. `?crews=6` still runs (smoke-tested, 621 sparks at 60 s, no errors) but is untuned and untested.
- **Numbers.** `cap` 900 (the pool is 1000, leaving headroom for floods and hounds), `capCrew` 300, `spawnBase` 2.5/s, `spawnMax` 8/s, `pack` 10, `postGap` 2, `postMax` 40, `postPack` 8.
- **Packs and heralds.** A base spawns ten sparks at a time in a wedge (an offset per slot, kept while marching) behind a herald: slot 0, a dart 1.5× the size with a pennant pole and flag.
  - Each pack marches to the weakest stretch of its crew's line: the post most short of holders with the most foes facing it. Posts near the crew's push point get +4, and for your crew posts within 800 of you get +5.
  - On arrival the pack goes free, and the next post tick (1 s) hands it out.
- **Posts.** Posts sit on the enemy-facing front only, one every two hexes, nearest the push point first.
  - Each is held by up to 8 sparks in a double row facing the enemy hex. The crew puts `postShare` 55% of its sparks on the line; the rest push.
  - Holders keep a post within a hex of their old one while it has room, and free sparks fill the posts that are short.
  - Every third post shows a small crew pennant.
- **Always-on clashes.** Sparks fire a tracer at the nearest foe within `sparkRange` 170, every 0.6 s.
  - A hit (6% of tracers, `sparkHit`) does 1 of `sparkHp` 2. Most tracers are spectacle; see "my calls".
  - Tracers are a pooled ring of 720 streaks, drawn one path per crew and added only on screen.
  - A foe inside `engageR` 120 makes a spark stand and fight. Holders never leave their spot.
  - Every spark death is a 4–6 particle burst in its crew's colour (on screen only), plus a tick pitched by crew and limited to one every 45 ms.
- **The bulge.** At each post tick, a post whose holders (3 or more) outnumber the foes facing it 3:2 (`bulge` 1.5) steps its double row into the enemy hex in front of it. The push rule then claims the hex once the defenders there are gone.
  - f2 measured this on a straight front with no spawns: 32 vs 16 holders moved the land **+11.6 hexes** in 20 s, 16 vs 32 moved it **−7.8**, and 24 vs 24 moved it −0.8.
- **Lead-only is gone.** Every pack pushes somewhere. Rival crews feed their fronts the same way.
- **Off-screen coarse ticks.** A spark more than 2200 from the camera updates every third step with `dt × 3`: its fights, movement and fire.
  - The spatial grid stays for `nearestFoe`. The cached foe is re-sought every 12th step (every 4th when there is none).
  - Sims use the same path, since the camera follows you there too.
- **Silhouettes.** You are an arrow, Scorpius a barb (thrown-back hooks), Draco a chevron. Sparks draw a size up from I4 (17).

## 3. Land that feels like a tide

- **Sweeps.** A cell changes hands only next to ground its new crew held when the territory tick began, so land rolls one ring per tick (0.25 s) and never flips in patches. Claimability is I4's rule: nearer to the new crew's anchors than to the owner's.
  - f4: 48 cells taken over 20 s, **0 in patches**.
- **Ripples.** Every flip on screen gets a pooled ripple (at most 60): a 0.4 s scale pulse and a bright wash in the new colour.
  - Your flips tick up a pentatonic scale with how many fell in the last second (at most one tick per 50 ms).
- **Land pops.** Every 2 s, a gain of 1% or more since the last pop shows "+N%" beside the land share. It also shows bigger by your mech when you caused it (your KOs, or your flips within 600 of you).
- **The break meter.** There is one per rival crew.
  - Your KOs of its sparks within 450 of you fill it: 14 = full, and a titan kill nearby adds 6.
  - After 2 s without a KO it drains at 20% of full per second.
  - It is drawn over that crew's nearest post within 600 of you: a thin crew-blue bar under "BREAK", which reads "BROKEN" and refills during the cooldown.
- **LINE BROKEN!** fires with a punch (0.08), hit stop, a white flash, a double shockwave ring, a crack and stinger tone, and a vibration.
  - **The break point** is their cell nearest the KOs that borders your land, then 2 hexes on into their ground (`breakDeep`; see "my calls").
  - Their sparks within 500 scatter outward and die over 0.12–0.97 s. Those deaths count as your KOs, but they can't chain or refill the meter.
  - 16 of your sparks spawn in a wedge at the break point and push. Your sparks within 600 switch to push.
  - **The surge:** their non-locked cells within 4 hexes flip to you ring by ring over 1.2 s, and a big gold "+N%" pops at the break point straight away.
  - The meter rests 12 s. An OVERCHARGE orb drops.
  - `dev.breakAt(x, y)` triggers it for tests and shots. `stats.breaks`, `stats.breakLog` and `state().breakMeter { k, f, n, x, y, cd }` expose it.
- **Removed.**
  - Lead-only: `leadOnly`, and the HOLD fallback when you weren't leading.
  - The dotted push road and the push-point ring.
  - The never-set flip-progress cells (`prog`, `progC`).
  - Your titan's escort rule (`titanEscort`): it now walks with your push like any titan.
- **Presence.** `auraR` 520: inside it your sparks fire `auraDps` 2× as often and move `auraSpeed` 1.3× faster. A faint blue ring on the floor shows the aura.
- **Command mode stays.** ATTACK sends 60% of new packs to its spot.
- **Titans** draw at 0.6 scale within 300 of your mech, lerped back to full by 450 (f9: 36.7 px against 58.4).

## 4. Pace and rewards

- **4:00 matches** (`matchT` 240). DOMINATION wins sooner: 55% held for 5 s, counted down under your land share, ending on a "DOMINATION" callout. Breaking every Core still wins.
  - At 4:00 the most land wins. You lose if your Core falls or a rival has more land at 4:00.
  - The end card names the cause. The way out on a land loss points at breaking lines.
- **The levers in your favour** (all from the brief): `heroDmgMult` 6, `shieldMax` 50, `structDmgMult` 4, turrets 300 hp, `capOnYou` 1 always, honest respawns, `youSpawn` 1.25.
  - Your guns also one-shot sparks (`heroSparkDmg` 2).
- **Rivals stay dangerous.** Their specials, told dashes, chip fire, turret range (480) and telegraphs are unchanged.
  - Their crews push you first (`pushYouBias` −5). This is what makes idle lose: two crews out-flip an idle third, and their titans walk in.
  - Tuned to the 70–85% band: `rvHp` 800, `rvShield` 200, `rvShot` 15, `rvSpecial` 40, `titanHp` 2200, `coreHp` 2500 (Cores are a long last step, so most wins come by land).
- **Base warning band.** While a titan or a rival spirit is inside your base ring, a red band sits low on the screen: "YOUR BASE IS UNDER ATTACK · fly home or DEFEND", with your three turret pips. It stays until they leave or die.
  - DEFEND pulses red in command mode, and the hint moves up above the band.
  - `hud().warning` and `hud().defendPulse` expose it. Its log is `state().warnLog`.
- **Callouts in the big space:**
  - LINE BROKEN!, TITAN DOWN!, BASE TAKEN! (a Core you break) and DOMINATION, at priority 3.
  - OVERCHARGE!, at priority 2.
  - The combo and streak tiers, at priority 1.
  - Each scales in from 1.7× with a punch, a flash in its colour and a three-note stinger (higher for lower tiers). A lower-priority callout never cuts a higher one short: it waits its turn.
- **Combos.** The I4 combo now has a counter under the portrait that grows a size at each tier and shakes past 10, 25 and 50, with "x10", "x25 RAMPAGE" and "x50 MASSACRE" callouts.
- **OVERCHARGE.** A titan you kill, a line you break and a turret you break each drop an orb: a spinning gold hexagram on a gold floor ring, which lasts 10 s and blinks in its last 3.
  - Flying over it (70) gives 8 s of fire rate ×2, damage ×1.5 and speed ×1.2, with gold tracers, gold flames, a rising hum and a gold bar under the portrait.
  - f8 measured the shots doubling: 12 → 24 per 2 s.
- **The streak.** KOs without losing hull (shield hits don't count). Tiers: 10 HOT, 25 BLAZING, 50 UNSTOPPABLE.
  - Each tier is a callout and a longer, brighter engine flame.
  - It is drawn as a thin bar beside the portrait, filling toward the next tier, with the tier's name.
  - A hull hit resets it, with a "STREAK LOST · n" fizzle once n ≥ 5.
- **Unlocks.**
  - Progress is `localStorage['arena.progress']` = `{ v: 1, matches, wins, xp, unlocked, seen, equip }`. `?fresh=1` starts from nothing.
  - XP: 100 a win, 40 a loss, +1 a % of land, +2 a break, +10 a Core.
  - The sixteen unlocks, in `UNLOCKS`:

| XP | Unlock |
|---|---|
| first win | Moss |
| 100 | Ember Solar trim |
| 220 | title Linebreaker |
| 360 | Tide Pearl trim |
| 520 | Twin Nova (+25% radius) |
| 700 | Map: Crucible (seeds from 101) |
| 890 | Moss Spore trim |
| 1090 | title Tidecaller |
| 1300 | Long Dash (+30%) |
| 1520 | Drone Swarm 12 |
| 1750 | Map: Vesper (seeds from 201) |
| 1990 | title Titanfall |
| 2240 | Ember Cinder trim |
| 2500 | title Rampager |
| 2770 | Tide Abyss trim |
| 3050 | title Unstoppable |

  - A sim win earns 140–190 XP, so nearly every win opens one.
  - Trims, variants and titles equip when they open.
- **The reveal.** After the end card's stats, a card flips over (0.6 s), bursts twelve particles and plays a rising three-note stinger.
  - It shows the kind (NEW MECH, MECH TRIM, TITLE, ABILITY or MAP), the name, a line, and EQUIPPED, or "UNLOCKED · pick it on the start card" for a mech or map.
  - Several unlocks at once cycle every 2.4 s ("1 of 2").
  - Below it: "+N XP" and the bar toward the next unlock, with its name teased.
- **The start card.**
  - Moss is dashed and reads "LOCKED · win a match" until a win; a tap shakes it.
  - Under "Your mech" a chip row shows what you own for that mech, plus titles and maps. A tap equips or takes off.
  - Your title shows under the portrait and on the end card.
- API: `__fi.progress()`, `__fi.unlocks()`, `dev.setProgress(o)`, `state().streak { n, tier, best, lost }`, `state().hero.overcharge` and `fireRate`, `hud().pops`, `hud().ripples`, `hud().big`, `sizes().titanNear` and `titanFar`, `orbs()`, and `stats.breaks`, `drops`, `pickups`, `sparkShots`, `ripples`, `pops` and `deadBy` (the deaths ledger).

### Fable's calls (restated)

- Three crews, not six. `?crews=6` stays reachable but untuned.
- The respawn bug's cause and its fix: delete `rvRally`.
- Moss opens at the first win; you start with Ember and Tide.

### My calls (beyond the brief)

- **Respawn waits round up to whole seconds.** The brief's ±0.2 s against the toast's integer can't otherwise hold.
- **Most tracers miss** (`sparkHit` 0.06). At the brief's 1 dmg every 0.6 s on 2 hp, two lines in reach of each other evaporate in seconds, and the armies never reach 500.
  - At 6% the line grinds and the board holds 515–580 sparks at 90 s. The fights you see are real, just slow, and you are what kills in bulk.
- **Home ground and catch-up keep a rival line from caving in all the way.**
  - Home ground is rival crews only: their sparks fire up to 2.5× as fast near their own base (`homeFire` 1.5, fading from 1000 to 2400). Yours have you instead.
  - Catch-up: a crew with a thin army spawns up to 2× faster (`catchUp` 1).
  - `spawnPerCell` is 0.002, against the brief's implied 0.006. With more, whoever had land got more sparks, and one rival snowballed in a minute.
- **Posts man only the enemy-facing front.** Neutral-facing borders get no holders, so early armies expand.
- **The break point goes 2 hexes into their ground** (`breakDeep`). That way the 4-hex surge flips their ground (46 cells in f3) and not half of yours. The surge's "+N%" pops at the break, not when the surge ends.
- **The break meter counts chain-burst KOs.** A popped spark's packmates within 60 pop a beat later, so the meter often jumps several KOs at once.
- **Frame pacing.** The 60 fps cap now aims at a deadline instead of skipping any frame under 15 ms. Before, it dropped frames to rAF jitter (45 → 58 fps in I4's own measurement).
- **Perf.** Each crew's land fills one polygon per row run of its cells instead of a hexagon per cell (drawTerritory 1.2 → 0.4 ms a frame).
- **Callout priority**, so a combo tier never hides LINE BROKEN!
- **A reserve held at an old RALLY point goes free when the order moves.** It's an I4 bug: DEFEND after RALLY left the rally holders where they were.
- **Sims run every match from blank progress.** Earlier sims had unlocked Twin Nova on the page and changed later seeds.
- **Kept but grey:** the Heart (the brief keeps it), and map seeds are only fixed seed sets.

## Tuning table (mirrors `T`)

| Group | Values |
|---|---|
| You | top 400, expo 1.6, dead 0.12, stickR 60, accTau 0.18, decTau 0.07, accFloor 300, decFloor 700, faceRate 540, aimRate 1400, cone 35, coneDual 20, dualDmg 1.3, range 480, heroHp 100, landRegen 2.5, baseHeal 6, **shieldMax 50** (I4 40), shieldDelay 3, shieldRate 20, **heroDmgMult 6** (4), **structDmgMult 4** (3), specialCd 14, hopSpeed 1000, hopT 0.16, hopInv 0.32, hopCd 1.1, tapDash 0.2 |
| Kit | novaR 320, dashT 0.8, dashLen 600, dashW 180, droneT 6, droneR 400, drones 8, droneTrashCd 0.12, ramT 0.42, ramSpeed 1150, ramW 75, ramDmg 20, ramCd 7, wallT 4, wallLen 260, wallOff 110, wallCd 9, turretT 10, turretR 400, turretRate 3, turretCd 10 |
| Sparks | sparkSpeed 125, marchSpeed 220, engageR 120, **sparkHp 2, sparkRange 170, sparkFire 0.6, sparkHit 0.06, sparkDmg 1**, kamikaze 4 (5), **diveR 200, heroSparkDmg 2**, **capCrew 300** (50), **cap 900** (300), **pack 10** (6), **spawnBase 2.5** (0.8), **spawnPerCell 0.002** (0.004), **spawnMax 8** (3), **youSpawn 1.25, catchUp 1, homeFire 1.5, homeNear 1000, homeFar 2400, coarseR 2200, coarseN 3** |
| The line | **postGap 2** (3), **postMax 40** (22), **postPack 8, postShare 0.55, bulge 1.5**, pocketMax 60, polRaidAfter 60, polRaidReach 900, polInvade 99, postTick 1.0, pushStep 2, pushTime 14, defendR 300 |
| Territory | terrTick 0.25, baseCells 4, reach 3, takeReach 1, baseReach 4, titanReach 2, heroReach 2, heroAnchor 1, **leadR 900** (700), pushOpenBias 0, sticky 1 |
| The Heart | heartRing 2, heartHold 0.7, heartLose 0.5, heartTime 3, heartSpawn 2, heartDps 1.6 |
| Titans | titanEvery 75, titanJitter 15, titanBehind 0.75, **titanHp 2200** (1500), titanLife 70, titanSpeed 75, titanShotCd 3.0, titanWind 1.0, titanR 150, titanDmg 24, titanStruct 22, **titanFirst 50** (70), **titanNear 0.6** |
| Bases | baseR 420, **coreHp 2500** (1000), baseRegen 11, regenAfter 2.5, **turretHp 300** (400), turretRing 170, turretVolley 1.1, turretShots 2, turretShell 7, turretFlight 0.5, turretLead 0.5, turretSplash 70, turretSpread 46, turretAim 0.3, turretVsRv 4, turretVsTitan 1.5 |
| Rivals | **rvHp 800** (520), **rvShield 200** (120), rvSpeed 330, rvRange 340, **rvShot 15** (11), rvShotCd 0.7, rvShotR 540, rvLead 0.8, rvBolt 850, rvWind 1.1, **rvSpecial 40** (34), rvSpCd 5.5, rvAbCd 10, rvDashTell 0.42, rvDashT 0.25, rvDashSpeed 1400, rvDashCd 3.5, rvDashDmg 16, rvHunt 850, rvLeave 1300, rvStructDps 12, rvStructR 260, rvRecallAt 0.12, rvRecallHeal 30, rvThink 0.6, rvRetarget 12, rvVsRv 7, rvHelp 2600, rvGunRate 3, rvBackdoor 1, rvTerritorial 1, **pushYouBias −5** (0), pushLeadBias 0.5, raidLeadBias 0.7, pushHeart 0.25, **lateT 60** (150), pushLateLead 0.5, rvRaidShare 0.45, capRaids 1, auraR 520, **auraDps 2** (1), **auraSpeed 1.3**, auraAll 0, rvEvadeP 0.4, rvEvadeT 0.3, rvEvadeLen 260, rvClump 6 |
| Respawns | respBase 8, respPer 6, respTime 0.025, **rounded up to whole seconds** |
| Match | **matchT 240** (540), **raidAfter 45** (60), **domPct 55, domT 5** |
| Camera | camR 875, camPitch 45, flk 1.2, cyk 0.56, ahead 100, camTau 0.3, camXTau 0.3, zoomLockMax 1.3 |
| Minimums | minSpark 2.2, minHero 15, minRival 13, minTitan 24, minBar 44 |
| The tide | **rippleT 0.4, popEvery 2, popMin 1, popT 1.4, breakR 450, breakFull 14, breakTitan 6, breakWait 2, breakDecay 0.2, breakCd 12, breakShow 600, breakKill 500, breakFlood 16, breakSurge 4, surgeT 1.2, breakDeep 2** |
| Rewards | **xpWin 100, xpLoss 40, xpBreak 2, xpCore 10, bigT 1.6, orbT 10, orbR 70, overT 8, overFire 2, overDmg 1.5, overSpeed 1.2** |
| Feel | toastT 1.8, downCard 1.6, comboDecay 1.5, hitStop 0.12, slowMo 1.2, lowPulse 0.4 |
| Command | cmdSlow 0.15 |

Gone: rvRally, leadOnly, titanEscort, sparkDps, fightR, holdLeash, rallyLeash, rvSparkFollow, the flip-progress arrays.

## Results (DPR 2, msedge, real CDP touches)

`node tools/fun/arena.test.mjs all --seeds 8` exits 0: every check passes at both sizes, and console errors are none.

| Check | 844×390 | 640×360 |
|---|---|---|
| p0; c1 three bases on one triangle; c2–c7; a4–a11; b5 | pass | pass |
| d1–d10 (I4's, adapted: d5/d6 read T, d7 opens Moss first) | pass | pass |
| r1 respawn proof | pass | pass |
| f1 front density | pass | pass |
| f2 bulge | pass | pass |
| f3 line break | pass | pass |
| f4 sweeps and pops | pass | pass |
| f6 unlock reveal | pass | pass |
| f7 combo and streak | pass | pass |
| f8 overcharge | pass | pass |
| f9 titan scale and base warning | pass | pass |
| perf | pass | pass |
| sims (incl. f5) | pass | – |
| shots (19) | pass | – |

What the new checks measured (844):
- **f1.** 578 sparks at 90 s (yours 293, Scorpius 163, Draco 122). Standing at the busiest stretch of your front: 171 within 900, 117 of them fighting (68%). 379 tracers a second across the board.
- **f3.** The break fired on the 14th KO. 16 flooded, all 15 of theirs within 500 were gone 1.5 s later, and the surge flipped 46 cells. In the 7.5 s that followed, 28 more KOs left `breaks` at 1. One orb dropped.
- **f4.** 23 ripples live at once on screen; "+1%" pops in the HUD.
- **f6.** A fresh device's first win (seed 2, domination) gave +182 XP and opened Moss and the Ember Solar trim. The card showed Moss, "Next: Linebreaker · 182 / 220 XP".
  - After a reload, both were still in `progress()`. Moss was no longer locked, and the "Solar trim" chip showed.
  - A Core loss from zero gave +40 XP, opened nothing, and left the card closed.
- **f7.** 36 KOs reached a best combo of 36 with "x10" and "x25 RAMPAGE". 12 KOs reached streak HOT. A 10-point shield hit kept the streak; a hull hit reset it (lost 1).
- **f8.** The titan kill gave TITAN DOWN!, 1 drop and 1 pickup. OVERCHARGE read 7.9 s, the fire rate 6 → 12, and shots 12 → 24 per 2 s. It was 0 again after 8 s.
- **f9.** The near titan drew at 36.7 px against 58.4 full (0.63). The band read "YOUR BASE IS UNDER ATTACK · fly home or DEFEND" with pips 1/1/1, and DEFEND pulsed. Both were gone once the titan was.

Perf (DPR 2; the gate is p95 under 4 ms everywhere and 30+ fps at 4×):

| Case | 844 auto | 844 dual | 640 auto | 640 dual |
|---|---|---|---|---|
| 900 sparks live (fighting, tracers), p95 | 3.1 ms | 2.3 ms | 2.5 ms | 2.0 ms |
| 900 sparks at 4× throttle | 49 fps | 53 fps | 60 fps | 59 fps |
| Busiest real match (seed 4 at 2:30, 557 sparks, 3 titans), p95 | 2.5 ms | 2.1 ms | 2.4 ms | 2.1 ms |
| Busiest match at 4× | 57 fps | 59 fps | 59 fps | 60 fps |
| Command mode open, p95 | 2.1 ms | 1.6 ms | 1.7 ms | 1.2 ms |

- **The phone runs cool by construction.** Every spark field is a typed array. Darts and tracers draw one path per crew, ripples come from a pool of 60, and off-screen sparks tick at a third of the rate.
- **Unthrottled fps is 41–45 at 844 in headless Edge, while p95 sits under 3.1 ms.** Raw rAF in that page runs about 50 Hz, with frames missing vsync on the compositor side, so it isn't frame cost. The pass-2 build measures the same in the same probe.
- **One earlier full run measured 4.8 ms** (844 auto, busiest match), a fail. That was before the row-run territory fill (see "my calls"), which is what gives the margin above.

Sims (the scripted push player: dodges, specials, home when low, defends, grabs orbs, farms the busiest enemy stretch facing your line for breaks, rides the flood, raids broken neighbours turret by turret; idle: guns only):

| Sample | Push wins | Idle wins | Median end | Domination | Last crew standing | Your Core lost |
|---|---|---|---|---|---|---|
| Seeds 1–8 (the gate) | **6/8 (75%)** | 0/8 | 3:39 | 5 | 0 | 0 |
| Seeds 1–48 | **41/48 (85.4%)** | 0/48 | 3:33 | 32 | 5 | 0 |

- **48 seeds sits at the band's top edge.** The harness's own 48-seed line "fails" only because 85.4% > 85%.
- **The push player loses on land:** "Time: Draco held the most land, 62% to your 32%" and similar, in 7 of 48. In about half of them a rival broke the other rival and took its land, so you faced one big crew at the end.
- Breaks per push match: 4–15, median 12. Push downs: 5 in 48 matches.
- **Tuning is chaotic per seed.** rvShot 16 gives 38/48 but 8/8 on seeds 1–8; rvDashDmg 18 gives 39/48 but 5/8.

Shots (`shots/`, gitignored; 844 unless noted):
- start (chips), board, clash, break, overcharge, titan, warning, hud, minimap, command, orders, base, overshield, dual-aim, end (a loss), unlock (a first win)
- hud-640, start-640, portrait

## Design review (against the shots)

1. **Does the front look like an army at war, not background: dense lines, tracers, bursts?** Better than I4, not yet "massive".
   - `clash`: crew-coloured wedges with heralds' pennants march, both crews' darts mass on the border, and tracers and bursts are there. `break` shows a dense red line in the background.
   - But at camR 875 a spark is still a 10–15 px dart. In `hud` and `hud-640` the push player has just mown the stretch, and the line in view is thin.
   - The board has 500–600 sparks, spread over two long fronts, and 40–50% are marching at any time. f1's 171 within 900 is real, but a screenshot frames only part of that circle.
2. **When I arrive, does the line break open dramatically and the land surge?** Yes. `break`: LINE BROKEN! fills the centre, a big gold "+2%" sits at the break point, and the surge's pale-blue ripples run along the border. The OVERCHARGE orb spins where the line was and the flood heads in. The punch, flash, shockwave and crack aren't visible in a still.
3. **Does land feel like a tide I'm pushing?** In motion, mostly.
   - Flips are contiguous (f4, 0 patches) and ripple, and your flips tick up a scale.
   - The surges are the big moves. Between breaks, the bulge moves the line a hex or two at a time.
   - `board` shows clean, solid territory with no islands.
4. **Is the match over in 3–5 minutes with a clear win most of the time?** Yes in the sims: median 3:33, 32 of 48 by DOMINATION (`unlock`: "Domination at 3:03"). A human who doesn't break lines will run to 4:00 and lose on land.
5. **Did the end pay out: a reveal I'd want again?** `unlock`: the flipped card is gold-framed with Moss in its green, "UNLOCKED · pick it on the start card" and "1 of 2". Below it: +182 XP and the bar toward Linebreaker. `end` (a loss) still shows +49 XP and the teaser. It is grey-box: the card is text, with no mech art.
6. **Could I tell why I lost, when I lost?** Yes on the card.
   - `end`: "Out-flipped · Time: Draco held the most land, 55% to your 9%", with a way out that names the mechanic (14 KOs, the surge, 55% for 5 s). The base band (`warning`) covers titans and rivals at home.
   - Weak spot: nothing in the match warns that a rival is pulling ahead on land.
7. **Did the rival come back exactly when the countdown said?** Yes: r1, within 0.02 s of the number shown, with the mech parked at their base.
8. **Does it still run cool: p95 and 4× fps with the big armies?** Yes. 900 live sparks: p95 2.0–3.1 ms, 49–60 fps at 4×. Busiest match: p95 2.1–2.5 ms.

## An honest read

- **What works.**
  - The respawn fix is airtight and proven.
  - The break loop (feed the meter, crack, flood, surge, orb) is the best moment in the arena so far. It lands roughly every 20 s for a player who looks for it.
  - Land now reads as a tide: contiguous sweeps, ripples, pops.
  - The reward stack is constant: tier callouts every few seconds, the streak, orbs, and an unlock almost every win.
- **What's rough.**
  - **The dopamine may be too constant.** A push match has 8–13 x-tier and 3–4 streak callouts, plus 7 OVERCHARGE!s and 5–7 LINE BROKEN!s, in about 3 minutes. The combo seldom resets, so "x331" combos and 500+ streaks are normal, and the numbers stop meaning much.
  - **The units are denser but not yet a wall.** Most tracers miss (6%), so the line is a slow grind. Your guns and breaks do the killing, which is the power fantasy, but means the clash between lines reads as busy rather than brutal.
  - **48-seed win rate is 85%**, at the top of the band. Single knobs swing individual seeds a lot.
  - **The scripted player never dies** (5 downs in 48 matches), because it reads every telegraph. Humans will. The rivals' danger is untested against people.
  - **After you break one rival, the other often takes its land** and becomes the end boss. That's good drama, but it is the main loss pattern.
- **Open questions.**
  1. Should combo and streak callouts be rarer (for example a longer combo window but tiers at 25/50/100), so the big moments stay big?
  2. Should sparks be bigger again, or should the camera come in a little at fronts, so the line reads as the spectacle at phone size?
  3. Should the end boss get a tell? A "SCORPIUS IS PULLING AHEAD" band when a rival passes you on land, since that is how players will lose.
  4. Are map seeds enough for "maps"? Crucible and Vesper only change the seed set.
  5. Is the XP ladder right? A first loss usually opens the Solar trim (40 + land + breaks crosses 100).

---

# I4 "Arena: one mech, clear orders": notes (builder for Fable, 2026-10-21)

I4 edits I3's `public/fun/arena.html` in place, per `playtests/fun/PROTO-I4-BRIEF.md`. I3 stays live at `proto-i3` (its card on the index now points there). Harness: `node tools/fun/arena.test.mjs [touch|perf|sims|shots|all] [--seeds 8]`; test API `window.__fi`.

The owner's ten notes on I3, in short: the mech's colour didn't match its crew; the minimap was hard to see and they wanted a command mode; the rocks were more annoying than anything; respawn timers should grow; base defences were overtuned (out-ranged you, the Core shot you); territory damage was lame and they wanted an overshield; one ship per team; darkness across the top of the screen; zoom out further; the straight border cut across the hex tiles.

## What changed, note by note

1. **Colour identity.**
   - Your mech fills in crew blue (`CREW_COL[0]`) with a white outline. Its element colour is trim only: the engine flames, a thin inner line (the glyph at 55%), the Special's ring and nova, and the ability button's face.
   - Tracers, pellets, Moss's drones, Tide's wall, Ember's ram ring, the fire cone, the hull bars under the mech and on the portrait, and Moss's seed turret are all crew blue. `__fi.colours()` reports them.
   - Rivals, titans and sparks keep their crew colours. The minimap uses full-strength crew colours (the 0.75 darkening is gone).
2. **Minimap and command mode.**
   - **The minimap** is `VH × 0.42`, clamped to 140–176 px (164 at 844×390, 151 at 640×360; I3 was 82 and 76).
     - Territory comes from a 176 px raster built by true point-in-cell, so its outline is the board's zigzag. Fronts are brightened edge pixels.
     - Your mech is a white arrow in a pulsing white ring. Bases are crew squares in a white frame (red while under attack), with a white respawn count beside a rival base while its spirit is down. Titans are small crew hexagons, rivals are crew diamonds with their intent letter; both have a dark rim so they read on their own colour.
     - Also drawn: the Heart, your order, the hexagram faint, and the view frame. The frame is now the true ground footprint of the screen (the four corners projected onto the floor), clipped to the panel.
   - **Command mode**: tap the minimap and the board fills the height. Time runs at 15% (`T.cmdSlow`, in `frame()`; `__fi.step()` is unaffected). Sticks and buttons rest while it's open.
     - The right column holds RALLY, ATTACK, DEFEND and FOLLOW ME (each at least 56 px tall) and an X.
     - The big map is crisp: every cell drawn as a hexagon into a cached canvas, redrawn at most every 0.3 s. Fronts are white lines, the board edge gold, and each base carries its name.
     - **Taps.** DEFEND and FOLLOW ME act on one tap. RALLY and ATTACK arm (the button turns gold and the header says "TAP WHERE TO RALLY" or "TAP WHO TO ATTACK"); the next tap on the map places the order. With nothing armed, a tap on the map is smart: enemy land or an enemy base attacks, your base defends, your land or open ground rallies.
     - Placing an order closes the map with a toast ("RALLY SET", "ATTACK · LYRA", "DEFEND HOME", "FOLLOW ME: …"). A tap outside the board hexagon, or the X, closes with no change.
   - **Orders** (yours only; rivals keep their push logic):
     - **RALLY:** the push point is the spot. Waves march there and hold with a leash of 220 (`rallyLeash`); posts stay manned. Holders already at the point aren't re-sent every tick.
     - **ATTACK:** the push point is the spot while it isn't yours, and waves push from it toward that crew's base. Once you own the spot, the push point moves to your front cell nearest that base. The target is the crew that owns the spot, or the nearest enemy base; if that crew dies, the order retargets or clears.
     - **DEFEND:** waves hold 300 out from your base (`defendR`) and your titan guards home.
     - **FOLLOW ME** is I3's rule (`leadOnly`). With ATTACK your waves push wherever you are.
   - **The marker** on the board is a crew-blue flag in a ring, labelled RALLY or ATTACK · NAME; DEFEND rings your base with a dashed line. It is also on the map, and the dotted road runs from your base to the order point.
   - Test API: `cmd()`, `cmdOpen()`, `cmdClose()`, `cmdTap(x, y)`, `cmdProject(x, y)`, `order(kind, x, y)`, and `hud().order` (the marker's board and map rects).
3. **No rocks.** The debris field, its ray and collision code, `drawDebris`, the missile bait and `clearDebris` are deleted. The hex edge is the only wall, and you slide along it (`hexClamp`; d3 slides 293 along the top edge).
4. **Escalating respawns.**
   - Everyone respawns after `8 + 6 × deaths + 0.025 × t`: you (d4: 8.53, 15.28 and 22.19 s) and every rival (11.03, 17.56 and 24.25 s).
   - (I4 kept I2's `rvRally` exception here: a rival you killed at its own base was back in 3 s whatever its countdown said. I5 deleted it; it was the owner's respawn bug.)
   - The portrait shows your countdown, the toast says "EMBER DOWN · BACK IN n s", and the centre text reads "BACK IN n s AT YOUR BASE".
   - After 1.6 s down, the camera pans home where you will relaunch. The dark down-dim is only 0.35 and fades over those 1.6 s.
5. **Base defences.**
   - Deleted: the dome, the battery gun (volley, beam, missiles), the flak ring, the red range circle, shot splash, `H.inDome`, the dome tint and ripple, and the FLAK / range / missile / dome hints.
   - The Core never fires (`stats.coreShots` is 0).
   - **Three turrets per base**, on a ring of 170 round the Core, one facing the centre. Each has 400 hp and regenerates 11/s when left alone for 2.5 s. Every 1.1 s it fires a two-shell volley, 7 a shell, led 0.5 s.
     - Reach is exactly `T.range` (480): a turret targets you only when you stand within 480 of it, and a shell only hurts you if you are still within range + 20 of the turret that fired it.
     - Targets, in order: the nearest enemy spirit (you or a rival), a titan, then a spark (one pellet).
     - It aims for 0.3 s first, with a thin red line to you when you are the target. Each shell's landing ring is red when it's coming for you.
   - Rivals take 4× a shell (`turretVsRv`) and titans 1.5× (`turretVsTitan`).
   - The Core is sealed (a white hexagon cage) while any turret stands; nothing damages it, titans included. With all three down it reads "CORE OPEN" and shows its hull.
   - Each turret death pops with a toast ("DRACO TURRET DOWN · 2 LEFT"). The base label shows three pips.
   - Titans walk to the nearest standing turret and break it (`titanStruct`), then the Core. Rival spirits wear down the nearest turret, then the Core, within 260 (`rvStructR`). Sparks still do no structure damage.
   - Lock-on, auto-aim, `worldTap`, drones, Nova, Shield Dash and Ram all target turrets (`kind: 'turret'`, `i: k*3+j`; target codes `TUR0 - (k*3+j)` with `TUR0 = -1000`, clear of titans at -300 and below), and the Core once it is open.
   - The start card says: "Their turrets reach as far as you do: pick them off one by one, then break the Core."
6. **No drain, and the overshield.**
   - `landDrain`, the `drained` stat and its hint are deleted. Own-land regen (2.5/s) and base heal (6/s) stay.
   - Overshield: 40 over 100 hull. It soaks hits first and breaks spill into the hull. It waits 3 s after the last hit, then refills at 20/s.
   - Visuals: a point-up hexagon bubble in crew blue, its alpha the shield fraction; a white shimmer on every absorbed hit; a white shatter hexagon, shards and a crack tone when it breaks; a soft blue "shield up" ring and tone when it refills from empty. A white sliver sits above the hull bar under the mech and on the portrait.
   - Rivals get the same rule at 120 over 520, with the same bubble and a white sliver on their bar. All rival damage now goes through `rvDamage`.
   - The start card says "Everyone has an overshield".
7. **One mech.**
   - Pick Ember, Tide or Moss on the start card ("Your mech"). `HS` is now one slot, `HSL`.
   - Deleted: `trySwap`, `swapNow`, `launchNext`, the bench heal, the SWAP label, "all three down", the swap dip, `__fi.swap`, and the beacon and relay code (`BEA`, `relayFor`, beacon drawing and API).
   - One portrait, top right: the glyph in crew blue with element trim, the hull bar, the shield sliver, and BACK IN n while down.
8. **No darkness.** Fog is gone from every camera, along with `drawFog` and the fog term in `visibility()`. The low-hull pulse is weaker (max 0.4). d8 measures the top quarter at 1.05× the middle band at 844 and 1.08× at 640.
9. **Zoom.**
   - `camR` 875. `VIEWK` scales the view culling with it.
   - Minimum sizes: sparks 2.2 px half-size, mech 15, rivals 13, titans 24, bars 44 (`T.min*`, reported by `__fi.sizes()`).
   - The front glow line is 2.5 px and the hexagram line 1.8 px. At 844×390 the mech sits on its 15 px floor.
10. **The border follows the tiles.**
    - Every visible cell side with no neighbour is drawn as a gold segment: a 6 px glow at 0.25, then 2 px at 0.75. The six corner cells carry the corner lights at their outermost vertex.
    - The straight `hexCorner` outline is deleted. `vis()` reports `boardEdges`, `borderList` (cell and side) and `straightEdge: false`.
    - The minimap uses true point-in-cell; its panel frame stays a plain hexagon a little outside. `hexClamp` stays as the wall.

### Fable's calls (restated)

- Command mode slows time to 15%; it doesn't pause.
- The rocks are removed.
- One hero per crew; titans stay.

### Builder's calls (beyond the brief)

- **Tuning for the sims** (see Results):
  - `pushOpenBias` 1.2 → 0. Rivals no longer gang the crew whose spirit is away from its front. With slow rival respawns that crew was nearly always a rival, which handed the push player 75–85% of seeds.
  - `titanStruct` 16 → 22 and `turretVsTitan` 1.5. Titans break bases, so idle loses.
  - Kept but now tunable: `raidLeadBias` (0.7) and `pushLeadBias` (0.5).
- **Shells.** A turret volley is two lobbed shells (splash 70, flight 0.5 s, the second scattered up to 46 and 0.08 s later), not hitscan. You can dodge it with DASH or by turning. A spark target gets one instant pellet instead.
- **ATTACK on taken ground.** Once you own the attack spot, waves push from your front cell nearest the target base.
- **A tap on a base** with ATTACK armed attacks that base, even on your own land.
- **The camera when you're down** goes home after 1.6 s.
- **The end card.** Stat labels no longer wrap. New rows: turrets broken, and times you went down with the longest wait.
- **Fixed in passing (I3 bugs).**
  - `S.heartT` had four slots for six crews, so crews 4 and 5 produced NaN.
  - The hexagram's lit pieces only drew for crews 0–3.
  - Ram and Shield Dash used bit 32 for "hit the base", which Lyra's bit also used; they now use bit 64.
- **Files are LF now.** The checkout had CRLF; git's autocrlf restores it.
- **Shots aren't committed.** `shots/` is in `.gitignore`, so the PNGs are only in the worktree.

## Tuning table (mirrors `T`)

| Group | Values |
|---|---|
| You | top 400, expo 1.6, dead 0.12, stickR 60, accTau 0.18, decTau 0.07, accFloor 300, decFloor 700, faceRate 540, aimRate 1400, cone 35, coneDual 20, dualDmg 1.3, range 480, heroHp 100, landRegen 2.5, baseHeal 6, **shieldMax 40, shieldDelay 3, shieldRate 20**, heroDmgMult 4, structDmgMult 3, specialCd 14, hopSpeed 1000, hopT 0.16, hopInv 0.32, hopCd 1.1, tapDash 0.2 |
| Kit | novaR 320, dashT 0.8, dashLen 600, dashW 180, droneT 6, droneR 400, drones 8, droneTrashCd 0.12, ramT 0.42, ramSpeed 1150, ramW 75, ramDmg 20, ramCd 7, wallT 4, wallLen 260, wallOff 110, wallCd 9, turretT 10, turretR 400, turretRate 3, turretCd 10 (Moss's seed turret) |
| Sparks | sparkSpeed 125, engageR 120, fightR 40, sparkDps 0.7, sparkHp 1, kamikaze 5, capCrew 50, cap 300, pack 6, marchSpeed 220, spawnBase 0.8, spawnPerCell 0.004, spawnMax 3.0, sparkStructDps 0 |
| The line | postGap 3, postMax 22, pocketMax 60, polRaidAfter 60, polRaidReach 900, polInvade 99, postTick 1.0, holdLeash 150, pushStep 2, pushTime 14, **rallyLeash 220, defendR 300** |
| Territory | terrTick 0.25, baseCells 4, reach 3, takeReach 1, baseReach 4, titanReach 2, heroReach 2, heroAnchor 1, leadOnly 1, leadR 700, titanEscort 1, **pushOpenBias 0** (I3 1.2), sticky 1 |
| The Heart | heartRing 2, heartHold 0.7, heartLose 0.5, heartTime 3, heartSpawn 2, heartDps 1.6 |
| Titans | titanEvery 75, titanJitter 15, titanBehind 0.75, titanHp 1500, titanLife 70, titanSpeed 75, titanShotCd 3.0, titanWind 1.0, titanR 150, titanDmg 24, **titanStruct 22** (I3 16), titanFirst 70 |
| Bases | **baseR 420, coreHp 1000, baseRegen 11, regenAfter 2.5, turretHp 400, turretRing 170, turretVolley 1.1, turretShots 2, turretShell 7, turretFlight 0.5, turretLead 0.5, turretSplash 70, turretSpread 46, turretAim 0.3, turretVsRv 4, turretVsTitan 1.5** |
| Rivals | rvHp 520, **rvShield 120**, rvSpeed 330, rvRange 340, rvShot 11, rvShotCd 0.7, rvShotR 540, rvLead 0.8, rvBolt 850, rvWind 1.1, rvSpecial 34, rvSpCd 5.5, rvAbCd 10, rvDashTell 0.42, rvDashT 0.25, rvDashSpeed 1400, rvDashCd 3.5, rvDashDmg 16, rvHunt 850, rvLeave 1300, rvStructDps 12, **rvStructR 260**, rvRecallAt 0.12, rvRecallHeal 30, rvThink 0.6, rvRetarget 12, rvVsRv 7, rvHelp 2600, rvGunRate 3, rvRally 3 (deleted in I5), rvBackdoor 1, rvTerritorial 1, rvSparkFollow 0.42, pushYouBias 0, **pushLeadBias 0.5, raidLeadBias 0.7**, pushHeart 0.25, lateT 150, pushLateLead 0.5, rvRaidShare 0.45, capRaids 1, auraR 520, auraDps 1, auraAll 0, rvEvadeP 0.4, rvEvadeT 0.3, rvEvadeLen 260, rvClump 6 |
| Respawns | **respBase 8, respPer 6, respTime 0.025** (everyone) |
| Match | matchT 540, raidAfter 60 |
| Camera | **camR 875** (I3 700), camPitch 45, flk 1.2, cyk 0.56, ahead 100, camTau 0.3, camXTau 0.3, zoomLockMax 1.3 (no fog) |
| Minimums | **minSpark 2.2, minHero 15, minRival 13, minTitan 24, minBar 44** |
| Feel | toastT 1.8, downCard 1.6, comboDecay 1.5, hitStop 0.12, slowMo 1.2, **lowPulse 0.4** |
| Command | **cmdSlow 0.15** |

Gone: landDrain, benchHeal, swapDip, domeR, batRange, gunHp, every volley, beam, missile and flak key, shellR, shellDmg, rvGunDps, rvFlak, rvOpenBcn, rvRespBase, rvRespPer, bcnR, relayHeal, fog.

## Results (DPR 2, msedge, real CDP touches)

`node tools/fun/arena.test.mjs all --seeds 8` exits 0: every check passes at both sizes, and console errors are none.

| Check | 844×390 | 640×360 |
|---|---|---|
| p0, c1–c7, a4–a11, b5 (I3 checks; a4 reworked) | pass | pass |
| d1 colour identity | pass | pass |
| d2 minimap + command mode | pass | pass |
| d3 no obstacles | pass | pass |
| d4 escalating respawns | pass | pass |
| d5 base defences | pass | pass |
| d6 overshield, no drain | pass | pass |
| d7 one mech | pass | pass |
| d8 no darkness | pass | pass |
| d9 zoom sizes | pass | pass |
| d10 border on tiles | pass | pass |
| perf | pass | pass |
| shots (15) | pass | – |

What the checks measured:
- **a4.** A real tap on a turret ahead of you locks it (`turret`, i 7), and you break it in 16 s from range − 40 while the other two stay at 400. A told shell standing still costs 14 (shield). A real DASH tap: 0 lost, 0 hits, 2 dodges.
- **d1.** Every reported colour is `#5ec0ff`. The real-screenshot pixel distance at the mech's centre is 1 / 1 / 1 for Ember, Tide and Moss.
  - Deuteranopia (Machado 2009): the closest pair is you vs Lupus, distance 36.
  - **Grayscale luminance: 176 / 123 / 173 / 152 / 158 / 218.** You and Draco are 3 apart, and Lupus and Cygnus 6. In grayscale those pairs separate only by glyph and position.
- **d2.**
  - The map is 164 / 151 px wide. A real tap opens it, and the sim ran 0.15 s in 1 s real.
  - A real ATTACK, then a real tap on Lyra's land, gave "ATTACK · LYRA" with the push point on the spot.
  - RALLY (two real taps) held 19/19 and 18/18 of the wave within 300 after 30 s. DEFEND (one tap) gathered 29/29 and 34/35 within 650 of home.
  - FOLLOW ME cleared the order. A tap outside closed the map with the order unchanged, and the marker showed on the board and the map.
- **d5.**
  - At range + 60 you lose 0 in 5 s (the other turrets are 808 away); at range − 40 you lose 56.
  - With one turret down, its neighbour fires 3 volleys in 4 s ("DRACO TURRET DOWN · 2 LEFT").
  - The Core refuses a 100 hit while sealed and takes it (1000 → 900) once open. `coreShots` is 0.
- **d6.**
  - 10 s on Lupus land: hull 70 → 70.
  - A 30 hit: shield 10, hull 100, `shieldT` 3. Still 10 at 2.9 s, regenerating by 3.5 s, full by 5.5 s.
  - A 60 hit on a full shield: 0 shield, 80 hull; empty at 3 s, full at 5.05 s.
  - A rival: 120 → 20 after 100, hull 520.
- **d9.** The smallest on screen: spark 4.2, mech 15, rival 13, titan 47, bar 50.
- **d10.** 62 edge segments drawn near the north edge, 0 of them off a cell side.

Perf (DPR 2; both control modes pass the gate):

| Case | 844×390 auto | 844×390 dual | 640×360 auto | 640×360 dual |
|---|---|---|---|---|
| 280 sparks, p95 | 1.6 ms | 1.6 ms | 1.6 ms | 1.3 ms |
| 280 sparks at 4× throttle | 59 fps | 59 fps | 59 fps | 59 fps |
| Busiest real match, p95 | 2.3 ms | 2.6 ms | 2.5 ms | 2.3 ms |
| Busiest real match at 4× | 59 fps | 59 fps | 59 fps | 60 fps |
| Command mode open over a match, p95 | 2.1 ms | 2.3 ms | 2.3 ms | 2.3 ms |

The busiest match at 1× logged 48–51 fps in some runs, with p95 still under 3 ms. It looks like rAF jitter against the 60 fps cap in headless Edge (59 fps at 4× in the same runs), not frame cost; it isn't in the gate.

Sims:

| Sample | Scripted push | Idle |
|---|---|---|
| Seeds 1–8 (the gate) | 4/8 (50%) | 0/8 |
| Seeds 1–48 | 30/48 (62.5%) | 2/48 (seeds 26 and 40) |

- The 48-seed run "fails" the harness's pass line only on idle. Seeds 26 and 40 were near-ties: 24% to Lyra's 23%, and 24% to 18%. Push is in band.
- Across the 48 push seeds: 3 Core losses, 1 last-crew-standing win, 0.92 downs per match, and a longest wait of 33 s.
- The cap on you held: at most two rivals on you, one while you're behind.
- **Seeds 1–8, push.** One last-crew-standing win, three time wins (37%, 35%, 77%), two time losses, and two Core losses.
  - Seed 6: "Your Core fell to Lupus's titan at 7:41 (Lyra's titan broke your last turret first)".
  - Seed 7: "…Scorpius's titan…", after you had broken three Cores yourself.
- The push policy now breaks the nearest turret first, from the far side of it from the Core at range − 50, locked and strafing; then the Core.
- How I got there, all over 24–48 seeds in parallel pages:
  - I4 untuned: push 79%, idle 3/8 and 6/24.
  - Each of these left push at 70–85%: stronger titans, coreHp 1500–2600, structDmgMult 1.6–2.4, heroDmgMult 2.4–3, rival damage +30%, landRegen 1, rival spawn ×1.6, no shields, and halving your damage.
  - The lever that moved it was `pushOpenBias` (above).

## Design review (against the shots)

1. **Can I tell every crew apart, including my own mech, at a glance? Grayscale too?** In colour, yes.
   - `hud`, `base`, `titan`: your mech is the only crew-blue ship with a white outline and an orange inner line; rivals are solid crew glyphs, titans big crew hexagons.
   - Grayscale: partly. You (176) and Draco (173) are nearly the same grey, as are Lupus and Cygnus, so in grayscale they separate only by glyph shape and position. Deuteranopia holds (min distance 36).
   - The hue set is the brief's Okabe-Ito set, unchanged.
2. **Is the minimap readable at arm's length: where am I, where are the fronts, where is my order?**
   - `minimap`, `hud`: where I am, yes; the white arrow in its ring is the brightest thing in the panel.
   - Fronts: the colour boundaries read clearly. The brightened edge pixels are subtle at 164 px, so the colour change does most of the work.
   - My order: visible but small (a 6 px ring and flag; `orders` shows it top left). In command mode (`command`) it is big and labelled.
3. **Does the whole screen show the board, with nothing dark across the top?** Yes (`hud`, `hud-640`, `base`). d8 measures the top quarter at 1.05× and 1.08× the middle band. The only dimming left is the damage vignette and a weaker low-hull pulse.
4. **Is the view wider than I3's without the mech or a spark turning into specks?** Wider, yes.
   - At 844 the mech sits on its 15 px floor and reads fine inside its bubble; sparks are 4 px darts.
   - Titans are 47 px and can cover your mech when one walks over you. The `orders` shot (seed 2) has Lyra's titan right on top of it; I moved the `hud` shot to seed 5 for that reason.
5. **Does the board's edge follow the tiles?** Yes (`board`, `command`, `minimap`): a gold zigzag along the outer cell sides, and the minimap's territory has the same zigzag.
6. **Can I see the three turrets, which are down, and the Core's state, from where I fight?** The turrets, which are down, and the Core cage, yes (`base`, `titan`, `hud`). A downed turret is a dark disc with a grey X.
   - The label with its three pips sits just above the Core. It can still crowd the top edge when the base is far up the screen: in the `base` shot the name shows but its pips are clipped. `titan` and `hud` show the pips whole.
   - The red aim line makes "this turret is on me" readable.
7. **Can I see my shield and when it is back?** That I have one and how much, yes: the bubble, and the white sliver over the hull bar and on the portrait. Hits flash it white (`overshield`).
   - "When it is back": only implicitly. There is no countdown, just the sliver refilling and a blue ring when it fills from empty.
8. **Could an average strategy player follow command mode in two taps without reading anything?** Mostly. In `command` the four buttons are big, the armed one turns gold, and DEFEND and FOLLOW ME close on one tap.
   - "Without reading anything" is a stretch: the difference between a smart tap and an armed tap is carried by the header text ("TAP WHO TO ATTACK") and the sub-labels.
   - There is no visual preview of what a tap will do (a hover can't exist on a phone).
9. **Did I lose for a reason I was shown (turret range, respawn count, the order I set)?** Mostly.
   - Turret fire has a red aim line, a red landing ring and a shell, and you can only be hit where you can hit back.
   - The respawn count is on the portrait and in the centre text. The order shows on the board and the map.
   - The end card names who broke your Core and who broke your last turret.
   - The sims' Core losses (seeds 6, 7) were titans walking in while the push player was away. The only warnings were the BASE! chevron and an "under attack" toast. That's the weakest spot.

## An honest read

- **What works.**
  - The turret rule is clean and fair. You can always see who can hit you, picking turrets off from the edge of your range is a real skill, and the sealed-then-open Core reads well.
  - The wider view without fog and rocks is much calmer.
  - Command mode feels like a battle call, not a menu, because the board keeps moving at 15%.
  - One mech removes a whole layer of UI.
- **What's rough.**
  - Titans dominate the picture: at 47–64 px they cover your mech when they pass.
  - The minimap order marker is small.
  - The push sims are noisy (±8% per 32 seeds). The 50–65% band depends on `pushOpenBias 0`, and almost every other lever barely moved the rate.
  - Idle still wins a near-tie now and then over wide samples (seeds 1–8 are clean).
  - The scripted push player doesn't use orders at all, so the sims say nothing about whether orders are strong.
- **Open questions.**
  - Should DEFEND, or a titan heading for your base, raise the I3-style persistent warning ("your base is under attack: fly home or DEFEND")?
  - Should the map show a short preview ring under your finger before the order lands?
  - Should titans be drawn smaller near your mech?
  - Is 13 s for Ember to break a turret (structDmgMult 3, 400 hp) the right pace? It is about 18–22 s for Moss and Tide.
  - Grayscale: is shape enough to tell you from Draco, or should one of the two hues move?

---

# I3 "Arena: six fronts": notes (builder for Fable, 2026-10-21)

The owner on I2:
- "agreed four players is awkward, three fits but six would be better I think."
- "when playing everything seems like its flying around aimlessly? could we have it like we did before? where we are basically the suped up titans helping our waves push further (I'd still like actual titans to spawn occasionally)."
- "even from your screenshots there are tons of random holes all over the place."
- "I think we could zoom out even a tiny bit more, really minimal UI elements, especially the top of the screen."

I3 edits I2's `public/fun/arena.html` in place; I and I2 stay live. Harness: `node tools/fun/arena.test.mjs [touch|perf|sims|shots|all] [--seeds 8]`; test API `window.__fi`. It takes the original Take the Stars battle model, not its code:
- one army, no free ships;
- border first;
- lines that flow like water;
- swarms;
- Cores with turrets;
- only titans and spirits break Cores.

## What changed

- **Six crews**, one base at every corner of the hex: the hexagram's six points, its two triangles alternating.
  - Crews: you (lower left), Scorpius, Draco, Lupus, and two new rivals, Cygnus (Swan Beam, Feather Darts) and Lyra (Chord Ring, Echo Choir).
  - Six colours from an Okabe-Ito-style colour-blind-safe set, lifted for a dark board: blue, vermilion, orange, orchid, green, lemon.
  - The corner beacons are gone. The Heart is king of the hill: hold 70% of the ring round it (radius 2) for 3 s and it burns for you (spawn ×2, sparks hit 1.6×). It goes out below 50%.
- **Waves and fronts: every spark has a job.**
  - Each crew's front is recomputed every second, staggered, and posts are spaced 3 hexes along it (up to 22), enemy-facing first.
  - **Border first:** each unmanned post takes the nearest free spark. Holders stay within a hex of their post and fight within a leash.
  - Everything else marches out in packs of 6 at 220/s to the crew's push point, then pushes: hex by hex into the next foreign hex, leaning toward its aim.
  - Sparks never wander. The purpose check counts march, hold, push and fight; an aimless spark is one moving away from its job while not fighting.
- **Your push point follows you.** Fly to within 700 of a front and that stretch is where your waves go.
  - From home, or away from the fronts, your waves hold the line (they push only where you lead) and your titan guards home.
  - Rivals pick a neighbour to push (the weakest per facing hex, the leader, a crew whose spirit is away from its front, or the Heart 25% of the time).
- **Titans.**
  - Every crew launches one about every 60–90 s (75 ± 15), sooner (×0.75) when in the bottom half on land. The first comes at 70 s.
  - A titan has 1500 hp and walks at 75. It goes to its crew's push point, then on toward the nearest enemy base, a strong territory anchor (reach +2).
  - Its heavy shot is telegraphed for 1.0 s, radius 150: it wipes sparks, hits a spirit for 24 and other titans for 60.
  - Under a dome it breaks the base (16/s). It fades after 70 s.
  - Your guns, Nova, Shield Dash and Ram hit titans, and auto-aim locks onto them. Base guns and flak hit them too.
- **Territory: solid, no holes.**
  - Every 0.25 s each crew's distance to its nearest anchor is computed (base, every spark, a titan, its spirit only when on its own border).
  - A hex goes to the clearly nearest crew. It stays its owner's when the owner is within one step, and held ground falls only within one hex of the invaders, so a push is walked.
  - Ground no anchor reaches keeps its owner. Pockets of 60 hexes or fewer closed in by one crew fill, and orphaned scraps of 30 or fewer with nothing in them go to their main neighbour.
  - Spirits don't paint land deep in enemy ground: there they only break lines.
- **Camera and HUD.**
  - The camera sits 17% further out (camR 700), and spark darts are a little bigger.
  - The top of the screen is nearly empty: a 70% hexagonal minimap top left, with a small clock and your land % (plus "HEART") beside it.
  - Banners, callouts and the base-under-attack band are now one brief toast low in the middle (1.8 s). The KO counter and land bar are gone. Rival names show only as "ON YOU", base names only up close.
  - Your wave route is a faint dotted road from your base to your push point.
- **Balance.**
  - Base guns reach 950, so fronts are outside them and they defend the base.
  - Sparks do no damage to structures. Bases repair 11/s when left alone.
  - Production is 0.8 + 0.004 per hex, up to 3 per second per crew, with 50 per crew and 300 in all.

## Results (both sizes, DPR 2, real touches): all pass

- **Six bases and the hexagram:** bases sit at 240, 300, 0, 60, 120 and 180°, on the star's points.
- **Purpose:** over 36 samples of a pushed match, 0.03% of sparks were aimless (at most 0.5% in a sample), with no loiterers. About 60% were marching, 26% holding, 6% pushing and 8% fighting.
- **A front moves:** a 24-spark wave added 48 hexes of Lupus-ward front in 25 s over the control. The control also moves (131), because that crew pushes on its own.
- **Solid land:** after 3 minutes there were zero enclosed holes in 18 checks, no neutral hexes, and one piece per crew; 146 pockets were filled along the way.
- **Titans:** six launched by 90 s and 14 by 200 s, with gaps of 53–84 s. A lone titan took 242 hexes and walked 2013 in 40 s, against 0 without it.
- **Heart:** it lit for you after 3 s on the ring, doubled spawn (1.04 to 3.10 per second) and showed the toast. A rival taking the ring put it out, then lit it for them.
- **HUD:** at 844×390 the top HUD is a 94 px corner block (88 at 640×360) and the centre top is empty. I2 had a 129 px minimap panel plus a 58 px stack across the middle.
- **Perf:**

  | Case | Result |
  |---|---|
  | 280 sparks, DPR 2 | p95 1.1–1.3 ms |
  | 4× throttle | about 58–59 fps |
  | Busiest real six-crew match | p95 1.9–2.3 ms, about 58 fps at 4× |

- **Sims:**

  | Sample | Scripted push | Idle |
  |---|---|---|
  | Seeds 1–8 | 3/8 | 0/8 |
  | 96 seeds | 64/96 (67%) | 4/96 |

  - Never more than two rivals were on you, and never more than one while you were behind.
  - The scripted player now breaks lines: it holds the front facing its weakest neighbour and raids only a neighbour whose line it has pushed close, or a base already hurt.

## An honest read

- **What it fixes.**
  - Every ship has a job you can read: a line along the front, swarms marching out to where you are, pushers walking into enemy ground.
  - Land is solid colour with clean glowing fronts, exactly like the overview shot.
- **Idle doesn't win zero times over wide samples.** In about 4% of seeds an idle crew squeaks the most land in a close six-way split. Seeds 1–8 are clean.
  - The levers that sealed it in earlier builds (rivals ganging an absent crew, short guns, lead-only waves, ties losing) got it from about 15% to 4%. The last 4% are near-ties.
- **The middle game.**
  - Land fills in about 20 s and then fronts trade a few hexes at a time; a titan or a broken Core makes the big swings.
  - Six-way land at 9:00 is noisy: the scripted player's win rate swings from 38% on seeds 1–8 to 67% over 96.
- **Lead-only waves** make you matter (your waves push where you are) but may feel odd. Fly home to swap and your front goes quiet. Worth asking the owner.
- **On-screen numbers.** About 130–200 sparks are alive across six crews. A front fight shows a pack or two, not a sea of ships; production is the lever if they want more.
- **Rough edges.**
  - Titans and hp bars look oversized from the overview camera.
  - The rocks are big next to the hexes.
  - The staged line-break shot shows your wave marching to the front rather than the clash itself.

---

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
