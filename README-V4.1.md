# Super Mama Julia 64 — V4.1 Round

Functional gameplay pass for the live Three.js/Vite build.

## Changed
- V4 save schema with migration from `smj64-v3`.
- Level-bound persistent checkpoints and continue state.
- Quest gating: levels cannot finish before their objective is fulfilled.
- Boss levels require the boss to be defeated.
- Guaranteed coin and enemy budgets for quest levels.
- Moving platforms.
- Visible hazards and goal portal.
- Lion unlock now has an actual combat effect.
- Ability HUD and checkpoint HUD.
- More reliable game-over/continue persistence.
- Version synchronized to 4.1.0.

## Replace
Copy the files in this package over the corresponding repository files:
- `package.json`
- `src/config.js`
- `src/state.js`
- `src/levels.js`
- `src/progression.js`
- `src/world.js`
- `src/ui.js`
- `src/game.js`

Then commit and let GitHub Actions build/deploy.
