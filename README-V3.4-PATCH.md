# Super Mama Julia 64 — V3.4 patch

Replace the four files under `src/` with the versions in this patch:

- `config.js` — version 3.4.0, new save namespace `smj64-v4`
- `state.js` — level-bound checkpoint persistence and save migration
- `levels.js` — guaranteed 12 coins / 6 enemies for the corresponding quests
- `progression.js` — crystal collection no longer advances coin quests; heart pickup persists lives
- `game.js` — Continue resumes the saved level/checkpoint; checkpoints are level-bound; progress is persisted on level start, pause, damage, game over and completion; checkpoint is cleared on successful level transition

All five JS files pass `node --check`.

Upload/replace these files in the GitHub repository, then wait for GitHub Pages deployment.
