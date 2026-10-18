# Tides: notes (grey-box prototype B)

**File:** `public/fun/tides.html` (one file, vanilla JS and canvas, opens from `file://`).
**Fantasy:** "The sky tells me what's coming. I read the stars and commit my swarm at the right moment, or hold it."
**Test harness:** `node public/fun/tides.test.mjs [sims|play|all]` from the worktree (msedge, 390×844, touch).
Options: `--seeds=1,2,3`, `--pols=idle,deathball,reader,lure`, `--log=reader`, `--T=key:value` (tuning override),
`--play=1,2 --secs=45`. Screenshots and `tides-sims.json` land in `shots/`.

## Rules as built (one page)

- **One verb, one army.** Tap the board: every spark you own goes there. Tap a rival Core: assault. Tap your Core or the
  big RECALL button: everything comes home. Sparks ordered home fly 1.5× ("the tide pulls home"), for every crew.
- **Production:** each Core adds a spark every 0.8 s up to 50 (a Starwell can push a crew over, to 90 at most).
- **Cores are warded.** You 120 hp, rivals 100, each with 3 turrets (20 hp, range 52, one-shot a spark every 1 s) that
  must fall before the Core can be hit. Outside events, sparks only *chip* a Core (0.04 per shot), so ordinary raids
  never decide a round. A Core breaks only inside the sky's events:
  - **Eclipse ◐** (10 s): every turret goes dark and every Core takes full damage (0.35 per shot, no turrets first).
  - **Blitz ⚔:** blitzing sparks hit Cores at 0.2 per shot and skip the turret-first rule. The blitzer's *own* Core is
    open (full damage) for 20 s while its army is out.
  - **Surge ✹** (closes the deck, at most 5:00): the wards are gone. Once turrets fall, any Core takes full damage.
- **The Track:** a band under the top bar shows the next three events with glyph, name and countdown (an active event
  shows `NOW 0:07`). Every event has an 8 s tell on the board and a banner that says what to do.
  - **Starfall ☄:** a dashed orange lane for 8 s, then it burns for 2.5 s: every spark inside dies, any crew. Lanes
    never cover a Core. They cross routes between Cores.
  - **Starwell ◎:** a dashed ring for 8 s, then open for 10 s. Live counts per crew sit above it. The crew with the
    most sparks inside at the close gets +25 sparks, +20% Core hp and its turrets rebuilt.
  - **Blitz ⚔:** "Corsairs will Blitz YOUR Core in 8 s". A dotted line and a filling ring at the blitzer. It recalls
    everything, then pours it all at the named Core.
  - **Eclipse ◐:** the board darkens over 8 s. Each rival Core shows a launch helper: `go in 3`, `GO now` or
    `too late`, worked out from your swarm's travel time.
  - **Rift ╱:** a seeded wall from one side. The Rift opens or closes it for 20 s and changes the way to one rival.
  - **Comet tail ✧:** a band along a route. Sparks inside fly 2× for 15 s.
- **Deck:** 14 events per round, one landing every 11–15 s from 0:14, never two landings at once. The Surge follows
  15 s after the last card. A hard end at Surge + 90 s ("the sky closed") is a loss.
- **Win:** break both rival Cores. **Lose:** your Core breaks, or the sky closes.
- **End card:** the cause names the event and the time ("Lost: your army was away when the Corsairs Blitz landed at
  2:01 (50 sparks against 4 at home)", "Won: your assault landed in the Eclipse at 3:10", "Won: you hit the Veil Core
  at 2:09 while its army was out on the Blitz"). Then time, taps and losses, and a 6-line decision log: each tap with
  its time and the event it answered or ignored ("risked ☄ Starfall: path crosses the lane (3 s)", "punished ⚔
  Corsairs Blitz: hit its emptied Core", "timed for ◐ Eclipse (lands inside it)"). Below that, **This sky**: the
  round's whole deck as glyphs, with the ones you answered ringed in gold.

## Deck design (the variety engine)

Seeds 1–5 are hand-authored decks (kind and order; Blitzes name who hits whom). Lane, well and wall positions, the void
layout and Core positions are drawn from the seed. Random seeds draw from weights (Starfall 3, Blitz 3, Eclipse 2.5,
Starwell 2, Rift 1, Comet 1), with no kind twice in a row, at least 2 Eclipses and at least 1 Blitz on you. The start
card shows each seed's first three glyphs and one line:

| Seed | Line on the card | What the round asks |
|---|---|---|
| 1 | Starfall ×5 across the middle · Corsairs blitz you twice · Eclipse ×3 | Where is it safe to stand? Lanes cut your routes. Lure the reckless Corsairs. |
| 2 | Eclipse at 0:14 · two Blitzes on you before 1:10 · one Starwell · two voids | The first Eclipse comes too early (`too late`), then it is defend-defend. Later Eclipses pay. |
| 3 | Starwell ×5 · the rivals blitz each other · Eclipse only late | An economy race. Punish the blitzer whose Core is open. |
| 4 | A wall seals the Corsairs · Rift opens it ×4 for 20 s · Comet tails ×2 | The map changes shape. Strike through the Rift while it is open. |
| 5 | Siege sky: Blitz ×6, four on you · Eclipse ×4 · one Starwell | Hold, hold, counter-punch. |

**The three most different seeds: 1, 3 and 5.** In the reader-policy sims, seed 1's taps are mostly Starfall dodges
and Eclipse strikes, and even the careful reader loses 63 sparks to lanes. Seed 3's taps are Starwell commits (×3)
and Blitz punishes (×2), and it is won by economy. Seed 5's taps are four "answered Blitz on you" holds, two
punishes and late Eclipse strikes, and it is a defensive rhythm. Seed 4 is the most different *map* (the wall changes
which rival is reachable).

## How the bots think (same rules, a bit slow, readable)

- Every 4–6 s: if their own Blitz lands within 15 s, they hold (and recall at 9 s). If their Core is threatened by 4
  or more sparks, they recall. A Starwell opening within 7 s: they go (Veil 90%, Corsairs 40%). An Eclipse already
  dark with more than 5 s left: they pour (Corsairs 70%, Veil 45%). They are slow, so they mostly land late.
- **Regular pours always go at you** (you wear the crown). Corsairs pour at 22 sparks, Veil at 34, or at 60% of that
  when your home guard is under 8 ("an empty crown tempts them": this is what makes the lure work). After a pour they
  rest 15 s, and the raid comes home after 18 s ("the tide goes out"). They never start a regular pour while an
  Eclipse is told: they hold their breath for the dark, and a plan made just before the tell is cancelled at launch.
- Rival-on-rival fights come only from the sky: named Blitzes, Starwell contests, Eclipse targeting, and the Surge,
  where they pour at whoever is weakest.
- **Starfall:** Corsairs are reckless. They ignore told lanes 70% of the time and react late (6 s). Veil pulls out
  after 3 s, 90% of the time.
- Every pour is telegraphed 3 s ahead: a growing ring at the rival Core and a dotted line to the target.

## Measured (30 seeds: 1–5 plus 25 random, headless, `tides.test.mjs sims`)

| Policy | Wins | Notes |
|---|---|---|
| idle (never taps) | 0/30 | 29 end as "the sky closed … you never committed your swarm"; 1 Blitz break |
| deathball (ignores the track, pours at the weakest Core when 25+ at home) | 0/30 | median loss 2:38; Blitz ×11, Eclipse ×7, Surge ×8, Starfall ×1 |
| lure only | 0/30 | triples Corsairs Starfall deaths (350 vs 113 idle), but never strikes |
| reader (heuristic: hold for Blitz on you, dodge lanes, strike Eclipses, punish blitzers, take safe Wells, counter-punch in the Surge) | 16/30 | wins 1:23 to 4:40, median 3:36; causes: Surge 10, Eclipse 4, Blitz punish 1, Starwell 1 |

The reader is a crude script with no eyes. With the GO helper and the 3 s telegraphs, a human who reads the board
should beat it. Real-tap Playwright runs with the same policy won seeds 1, 2 and 3 in 3:08, 3:10 and 4:15 (11, 11 and
23 taps).

**Frame time** (Edge, desktop, 390×844 at DPR 2, real-time play): 0.4–0.9 ms average, p95 under 2 ms. Rare single
spikes up to 5–12 ms, which look like GC or host jitter. At most about 230 sparks. Console: no errors.

## What I tuned (in order, and why)

1. Bots broke each other by 0:40–1:20 in most rounds (a Blitz on you emptied the blitzer, then the other rival
   finished it). That made every round a 1v1. Fix: regular pours go at the crown, and rival-on-rival fights only
   when the sky says.
2. Starfalls killed nobody: a swarm crosses a lane in about 1 s. Fix: the lane burns 2.5 s and is wider (half-width
   36).
3. Holding home did not stop a Blitz (Blitz sparks shredded Cores), and leaving home for an Eclipse got your empty Core
   broken in that same Eclipse. Fix: the ward model above. Raids only chip, Blitz damage is lower, bots use Eclipses
   late and never pour into a told one.
4. Spawn-camping: a rival parked on your Core killed every new spark. Fix: raids come home after 18 s.
5. Two minutes of dead time after the deck ran out (3:05 to 5:00). Fix: the Surge closes the deck.
6. Turrets one-shot sparks from out of range, so any strike outside the dark bled out. Fix: range 62 to 52, reload
   0.8 to 1.0 s.
7. Eclipse strikes failed when they arrived 1 s early, before the turrets were dark. Fix: the GO/wait launch helper.
8. Found and fixed: `coreOpen` counted Blitzes that had not landed yet.

## Clarity concerns at phone size

- Many labels at once: during a told Eclipse with a Blitz and a Starwell nearby, the board can carry 4–5 pills, and
  pills near the top-left Core get close to the banner. The banner (2–3 s) covers the top of the board.
- Spark counts are readable, but **who is pouring where** relies on a thin dotted line and a 3 s ring. Fine when
  calm, easy to miss when two pours and a Blitz overlap.
- Colour pairs: the Starfall orange and Blitz red are distinct from the crew colours. The Comet white band and the
  Eclipse shade are subtle by design. Crews also differ in silhouette (triangle, notched chevron, kite).
- The end card repeats "Won/Lost" in the title and in the cause. That is harmless.

## What I'd change next

1. **Let the swarm split once:** "send half" as a long press. All-or-nothing makes "commit" very binary and is the
   main reason the Eclipse is risky.
2. **Make the Eclipse the headline.** Today most reader wins land in the Surge. Options: a longer Eclipse (12 s), or
   bots that sometimes waste their pile into your guard just before it.
3. **Idle stalls instead of breaking.** The brief allows "loses or stalls", but a passive player should see their Core
   fall. A late "Grand Blitz" card (both rivals at you) would do it, and would be readable.
4. **Starwell snowball:** a crew that wins one Starwell (75 sparks) can crush a held home. Cap the bonus near 70, or
   give the bonus as production instead of instant sparks.
5. Sound: a rising tone through each tell, a gong when the Eclipse lands, a crackle along the burning lane.
6. A short in-round tutorial card for the first Starfall and the first Eclipse (seed 1 only).
