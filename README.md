# Super Mama Julia 64 — Reborn

A substantially expanded 3D browser game based on the working `hulia.html` prototype.

## What changed

- 10 distinct worlds instead of the small prototype set
- persistent `localStorage` save system
- continue/new-game/save reset flow
- 10 per-world quests and quest rewards
- coins, crystals, keys, hearts, mushrooms, rocks and secret stars
- Julia ↔ Löwin transformation
- unlockable double-jump and dash abilities
- melee attack plus throwable rocks
- multiple enemy archetypes and multi-hit bosses
- boss projectiles and phases
- checkpoints
- combo scoring
- level timing / best times
- particle effects and screen shake
- responsive Android touch controls
- keyboard controls
- pause / resume
- `julia.html` and `index.html` are the canonical game entry points

## Controls

- A/D or ←/→: move
- W / Space / ↑: jump
- E / Shift: attack / throw
- F: dash (unlocked later)
- P / Escape: pause
- Touch controls are shown below the game on mobile

## Run

Open `index.html` or `julia.html` in a current browser. The game uses Three.js r128 from cdnjs.

## Origin

`hulia.html` was used as the functional prototype reference. The original prototype already contained 3D movement, enemies, items, bosses, lava and touch controls; this version reorganizes that foundation into a larger game loop and progression system.

## GitHub Pages

The repository is intentionally static. `index.html` can be published directly with GitHub Pages; no build step is required.
