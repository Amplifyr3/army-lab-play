# F "Tactics": notes (Fable, 2026-10-18)

`tactics.html` is one file of vanilla JS and canvas 2D, no assets, opens from `file://`. Seed from `?seed=N` (default 1),
`?calm=1` removes the planning timer. Test harness: `node tools/fun/tactics.test.mjs [touch|combat|perf|shots|bot|sims|all]`
(msedge, hasTouch, DPR 2, 390x844 and 360x640). Test API on `window.__ft`.

## The round, as built

1. **Plan.** The strip at the top is the initiative timeline: six cards (your Bulwark 2, Lance 3, Dart 5; their Bulwark 1,
   Lance 4, Dart 6), low initiative plans first. The active card sits in the first slot at 1.14x and the done cards wrap to
   the end; cards slide, FFX style. On your ship's turn the camera flies in (zoom 0.45–1.1 so its budget ring fills about
   40 % of the screen); on a rival's turn the camera visits it for 0.95 s while it plans in secret and its engine glows on
   the side it will turn (truthful 80 %). The world drifts on a 5 % clock during planning (everyone idles along their
   heading at 1.6 px/s); paths are stored in the ship's own frame so the tether drifts with it.
   - **Draw** anywhere on the board: the path starts at the ship and follows the finger (resampled every 4 units, 5-point
     moving average, no snapping). It is cut at the budget (Dart 300, Lance 230, Bulwark 170; Afterburn +40 %). The ring
     around the ship is the budget and empties as you draw, the bar under the strip says the same, the line turns amber in
     the last 15 % and a tick plays when the budget is spent. Loops are fine (a path turning 300° or more counts as a
     loop). The ghost at the tip shows the final facing and its 90° sights.
   - **Lift** locks in after a 0.9 s grace ring (touch again to redraw; a tap locks in at once). The 9 s timer (ring on
     the card, countdown at the right) commits the last drawn path, or a hold-course path (straight, 40 % of budget) if
     nothing was drawn. Calm removes the timer.
   - **Two fingers** peek at the overview and never draw; a stroke in progress is cancelled by the second finger.
   - Rival reach discs (radius = budget) show where each rival could be.
2. **Fly.** Everyone flies at once at full speed (2.4 s for a full budget; shorter paths finish early). A path leaving the
   board stops at the edge, facing back in. No shooting during flight.
3. **Combat, the reveal.** Real seconds: 0–0.5 silence (engines dim, vignette); 0.5 heartbeat and the cards flip one by one
   (0.1 s apart, 0.28 s each; the back shows hull big and, for rivals, their intent); 1.15 arcs snap on in initiative
   order with rising notes, plus the relation lines between ships in each other's sights with TAILING / HEAD-ON /
   TOUCHING tags; 1.95 intent bubbles pop over each rival ("Tail Gun 6 → Dart", "Braces 3", "Locks on") with a dashed line
   to the target; 2.35 the hand slides up; 2.7 play opens. A tap after the arcs skips to play. The board is frozen.
   - **Positions** (all read from the poses reached): in arc = within 240 and ±45° of the nose; behind = in your arc and
     in the target's rear half; head-on = each in the other's arc; touching = within 56; abeam = in range and 60–120° off
     your nose.
   - **Hand**: one shared fleet deck, 5 cards a round, 3 Energy. Starter deck (10): Volley ×4 (1: 3 damage in arc), Tail
     Gun (2: 6 from behind), Joust (1: head-on, both take 4), Snapshot (0: 2 in arc), Lock On (1: this ship's next attack
     +3), Evade ×2 (1: block 4 this round). Pool for picks adds Ram (2: touching, 8 and 2 to you), Broadside (1: 4 abeam),
     Barrage (2: 2 to every enemy in arc), Feint (1: from behind, 1 damage and cancel its intent), Afterburn (1: next
     budget +40 %), Repair (1: +3 hull).
   - A card is **lit** only when its cost fits the Energy left and some pair of ships meets its position. Two taps: the card,
     then a lit target (gold rings; a dashed line shows which of your ships would fire: the one with a Lock On, else the
     highest initiative). Tapping an unlit card nudges it. DONE ends your hand; it turns blue when nothing is left to play.
   - **Intents** are honest: computed from the positions the rival reached, by its temperament's card weights (Ram likes
     Joust and Ram, Kite Volley at Mid and braces when threatened, Wisp Tail Gun), targeting kills and the wounded. A rival
     with nothing lit Locks On (+3 next attack) or, Kite under threat, braces 3 at once. Attack intents resolve after your
     hand in initiative order (highest first); a dead attacker's intent is lost ("attackers killed first" on the end card),
     a dead target's intent fizzles, Block absorbs, Feint cancels.
4. **Between battles.** When all three rivals fall, pick 1 of 3 cards from the pool; the next three rivals have +10 % hull
   per battle; your ships return at full hull; the deck persists. Three battles make a run. The end card names the cause
   and lists cards played, damage, Tail Guns and Jousts, the strongest lit card by round, blocks, cancels, loops, clips,
   timer commits and the deck.

Hull: Dart 8, Lance 10, Bulwark 14. Game ends when a side is destroyed, or after 30 rounds (stalemate).

## Bots (E2's honest planner over free paths)

Each rival plans on its turn from 70 sampled paths within its budget (hold, straights, arcs ±30/60/90/135/180°, S-curves,
hooks, loops and late turns at 45/70/100 % of the budget), scored against a weighted model of every enemy's end pose
(15 predicted paths each: naive "keep going" 45 %, raised to 80 % when that ship's last path was nearly straight, plus
reasoned ends that would light a card on the rival). The pair utility is in **card damage**: A × the best card its position
would light (Tail Gun 6, Ram, Joust, Volley 3, weighted by temperament) − D × the best the enemy could play back + P × how far
into the enemy's rear half it sits + R × closeness to its preferred range + K × a kill; minus off-board paths and crowding an
ally's planned end. The pick is a softmax inside a window of the best (seeded per seed, round, ship and battle), so a bad
path never wins on noise. After a quiet round (no damage either way) they grow bold (A up, D down, range in). Tells: the
engine lean on the camera pass; the "Locks on" / "Braces" intents; Kite's circling hand. The rivals never read your paths:
they plan before you draw, and the bot suite checks the committed rival paths do not change with your strokes.

Cost: 70 candidates × 3 foes × 15 ends, end poses only; p50 0.8 ms / p95 1.3 ms on the desktop, 4.5 / 8.1–8.7 ms at 4× CPU
throttling, once per rival turn.

## Test results (`node tools/fun/tactics.test.mjs all --seeds 24`)

**touch** (real CDP touches, both viewports): start card taps (Calm then BEGIN; BEGIN 59 px, toggle 44 px); a 420 px
stroke stops at the budget (len 170 = budget, cut, live while drawing, locks after the grace, next ship comes up); a loop
stroke turns 364° (390) / 352° (360) inside the Lance's 230 budget and counts as a loop; after a bank and the flight every ship ends at its path's end facing its
final direction (dh 0, dEnd < 0.05 against the take-off pose; the board drifts about 3 units on the slow clock while the
others plan); the 1 s timer commits a hold path (68) and a stroke in progress as drawn; the camera sits at 0.96 (390) /
0.89 (360) against an overview of 0.42, two fingers peek to 0.42 and draw nothing, one finger draws again; a rival's pass
shows a lean.

**combat** (both viewports): the reveal is silent for 0.5 s (no flips, hand hidden), at 0.8 s three cards are flipping in
order (1, 0.71, 0.36, 0, 0, 0), intents are up at 2.0 s, play opens with 3 Energy and 5 cards; on a staged board (your
Lance behind their Bulwark, your Bulwark head-on with their Lance, Darts far off) Tail Gun is lit only on the Bulwark,
Joust only on the Lance, Volley on both and not the Dart, Evade on all three of yours; two real taps (Tail Gun, their
Bulwark) deal 6 and spend 2 Energy; tapping a non-target does nothing; with 0 Energy nothing is lit; DONE resolves the
intents (Evade 4 blocked a Volley 3 fully) and the round moves on; killing all three rivals offers three distinct picks,
a real tap on the second adds it to the deck and battle 2 starts on round 1; losing all three ends the run with a cause.

**perf** (DPR 2, a real fly + reveal + play): p50 0.5 / p95 1.0 / max 3.2 ms at 390x844; 0.5 / 0.8 / 2.8 at 360x640.

**bot**: the same seed gives the same three rival paths across re-plans and restarts, different seeds differ (10 of 10),
rival paths are frozen through your strokes, two whole scripted runs with one seed are identical (15 planning rounds).

**sims** (24 seeds, the greedy hand = biggest lit attack on the most wounded legal target, Evade on the biggest threat):

| path policy · cards | runs won | battle 1 won | battle 2 won | median rounds | dealt / taken per run | Tail Guns · Jousts | attackers killed first |
|---|---|---|---|---|---|---|---|
| idle (hold course) · greedy | 0 | 9 | 2 | 10 | 42 / 53 | 0.33 · 1.04 | 2.3 |
| random paths · greedy | 0 | 2 | 0 | 9 | 21 / 48 | 0.13 · 0.42 | 1.1 |
| sweep (the bot planner for you) · no cards | 0 | 0 | 0 | 4 | 5 / 43 | 0 · 0 | 0 |
| sweep · greedy | 6 | 18 | 11 | 16 | 78 / 72 | 0.88 · 1.42 | 3.6 |

Lit cards per round for the sweep player: Volley 1.1, Evade 0.94, Lock On 0.53, Snapshot 0.27, Joust 0.21, Tail Gun 0.06.
The strongest lit attack by round: Volley 32 %, Joust 18 %, Tail Gun 5 %, Ram 2 %; the rest of the rounds light no attack.

## Deviations from the brief, and why

- **No dice.** Combat is the card hand against intents, per the owner's revision; the dice stayed in E2.
- **Behind = the target's rear half**, not "outside its arc" (which would include the flanks) nor the rear quarter (which
  lit Tail Gun 1–2 % of rounds). The rear half lights it 3–6 % of rounds for scripted players, and Wisp intends it often.
- **Kite's brace and every Lock On apply at the reveal**, not after your hand: a block that lands after you have already
  played would be theatre. Attack intents wait for your hand, as in Slay the Spire.
- **Rival intents are one action each, from an open list** (no rival decks yet): the temperament weights stand in for the
  deck. Rival decks are the next step if the owner likes the shape.
- **Fleets start 540 apart** so round 1 already produces positions in range; at 680 the first combat was three "Locks on".
- **The hold-course default is 40 % of budget straight**, so a timed-out ship still moves and still faces forward.

## What I would change next

- Rival decks per temperament, with their own draw, so an intent can be bluff-free but still surprising.
- A per-round "what the positions bought you" line at the top of the reveal ("2 arcs on them, 1 on you, one tail").
- Drag-to-target as the alternative to the second tap, and a long-press on a card for its text.
- Repositioning cards (Sidestep) and a terrain feature (a cloud that hides sights) to vary which positions matter.
- The intents' bubbles overlap when rivals bunch; stack them in a column at the top of the view instead.
