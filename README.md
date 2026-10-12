# Timberborn — Population Growth & Breeding Projection Calculator (GCT-014)

Single static page, `index.html` + `calc.js`, no build step, no dependencies, no backend, no
account/login.

## What it does

Player picks their faction and enters current population, food surplus, water surplus (read off
their own overview/resource panels), and their breeding setup. The page shows:

- **Iron Teeth:** a full day-by-day projected population timeline (Breeding Pods produce kits on a
  fixed cycle up to a well-being-scaled equilibrium capacity), with the exact day the player's
  entered food or water surplus goes negative if that growth happens without more production, and
  an optional "days/weeks until population X" number.
- **Folktails:** no day-by-day curve (see "Correction" below) — instead, the game's own
  steady-state breeding ratio applied to the player's breeding-household count, plus a
  faction-independent "resource ceiling" (how many more beavers the player's current surplus alone
  can feed).

## Correction made during this build

The charter's input list ("number of Breeding Pods") describes the Iron Teeth faction only.
Folktails breed naturally in housing and don't build pods. No source found this session publishes
a per-day breeding probability for Folktails, so a day-by-day growth curve for that faction would
be fabricated. This build adds a faction toggle: full projection for Iron Teeth (fully sourced,
deterministic), and the official steady-state formula for Folktails instead of an invented curve.

## Data sources (fetched directly 2026-10-09)

- `timberborn.wiki.gg/wiki/Breeding_Pod` — pod cost (10 Logs), cycle (5 days, 5 Water + 5 Berries
  in, 1 kit out).
- `timberborn.wiki.gg/wiki/Breeding` — Iron Teeth capacity formula `k = Amax/5` with the
  well-being-band table (10/12/14/16/18/20/21/22 beavers/pod); Folktails equilibrium ratio
  `lifeExpectancy / 5`, whose worked example (60-day life expectancy → 1 kit per 12 adults) is
  reproduced exactly by this page's math (`test.js` Scenario C).
- `timberborn.wiki.gg/wiki/Nutrition` (2.67 Food/beaver/day) and `timberborn.wiki.gg/wiki/Thirst`
  (-70/33 = 2.121, used as 2.1 Water/beaver/day) — both corroborated by
  `timberborn.org/articles/population-management-guide`'s stated ranges (2.5-3 Food, ~2.1-2.25
  Water). That guide also states kits consume at the same rate as adults, which is why this page
  does not model a separate child rate.
- **Unresolved conflict, shipped as a player input rather than a fabricated default:** wiki.gg's
  breeding formula uses "5" as the kit maturation days; `timberborn.org/wiki/beaver-life-stages/kit`
  says kit maturation is 6 days at base Growth Speed (3-4 to longer with well-being). The page's
  "Kit maturation (days)" field defaults to 5 (the value the sourced formula is actually built on)
  and is editable.
- Competition re-check: `timberborn.calcspirit.com`, the Discord-maintained Google Sheet, and
  Calculator City's Timberborn entry are all production/resource planners — none describe a
  population-growth or breeding-timing projection. A live, unresolved player feature request
  ("Show population estimate on each breeding pod" on timberborn.featureupvote.com) confirms the
  gap is still real.

## Known limitations, stated on the page

- Iron Teeth growth is modeled as stopping once population reaches the well-being-scaled
  equilibrium capacity (pods × beavers/pod) rather than simulating individual aging/death — this
  matches the sourced formula's own meaning but is a simplification, stated in the correction box.
- Folktails has no week-by-week projection because no source publishes its per-day breeding chance;
  the steady-state estimate multiplies the official ratio by the player's household count, which is
  this page's own extrapolation (labeled as such), not a verified in-game total.

## Tests

`node test.js` — 3 hand-calculated scenarios (two Iron Teeth timelines, one Folktails ratio check
against the wiki's own worked example), 9 assertions, all passing. The same three scenarios are
re-run in-browser on page load and shown as a visible self-test line under Sources.
