# The Salt Cup quest line

> Written by: Claude and Codex, 2026-11-20

MIRROR-SALT-ZONE MSZ34 and MSZ35. The Cup is one tracked chain, `mirror.cup`, started by telling the Marshal you want to
race: beat Sorrel Vane through the arches, show the Marshal (turn-in 1), cut a boom from a hulk in the Sail Graveyard,
bring it to the Scrapper (turn-in 2), clear the brine crabs off the pan road, tell the Brinewife (turn-in 3), the three
heats (Rim Run, Pan Slalom, Canyon Drop), then put down the Salt Colossus. The chain only completes after the boss (J454).
Four untracked side quests clear the skaters, the hounds, the wisps and the vultures.

The licence run and its turn-in are one of the nine tracked steps. Its
markers point to the race until the player beats Vane, then to the
Marshal. The legacy arches quest keeps its fact for the existing proof.
Each Cup step has MZ31 feedback at the place where it is earned. The
completion payoff runs on the Colossus defeat flag.

The race steps read each race's `<race>.beat` flag: a finish files only a fact, and the beat flag is the one thing a race
raises. The crab step latches on a region trigger at the camp (`mirror.cup.crabs.cleared`, when every crab's `dead:` flag
holds) because a crab comes back a minute after it falls and takes its `dead:` flag with it; the Brinewife's answer reads
the latch. The format refuses a quest that reads an undeclared flag, `dead:` ones too, so `cup.ts` declares every camp
body's and the Colossus's.

The talks stay in their region files; `cup.ts` extends each tree with the chain's answers (each shown only while its
step is open) and `shard.ts` swaps the extended trees in. The camps' ids and sizes moved to `camps.ts` so the regions
that place them and the quests that count them read one table. The Marshal's line about "that red sail of hers" now says
his, as everywhere else.
