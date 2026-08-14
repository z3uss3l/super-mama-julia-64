# Super Mama Julia 64 — V4

Modularer Three.js-Browser-Plattformer mit Vite-Build, persistentem Progression-System, 15 Leveln, Gegnern, Bossen, Quests, Checkpoints und Touch-Steuerung.

## V4 technische Basis

- Three.js wird über npm als Build-Abhängigkeit verwaltet.
- Vite erzeugt einen selbstständigen Produktions-Bundle für GitHub Pages.
- Keine Laufzeit-Abhängigkeit vom jsDelivr-CDN mehr.
- `npm run check` prüft sämtliche JavaScript-Module auf Syntaxfehler.
- `npm run build` erzeugt `dist/`.
- GitHub Actions baut und veröffentlicht `dist/` automatisch nach jedem Push auf `main`.

## Lokal

```bash
npm install
npm run check
npm run dev
```

Für einen Produktionsbuild:

```bash
npm run build
npm run preview
```

Nicht per `file://` öffnen; ES-Module und der Vite-Build benötigen einen HTTP-Server.

## Architektur

- `src/main.js` — Bootstrap und Fatal-Error-Handling
- `src/game.js` — Game Loop und Orchestrierung
- `src/world.js` — Weltobjekte und Runtime-Entities
- `src/levels.js` — deterministischer Levelgenerator
- `src/entities.js` — Julia, Löwin, Gegner und Geometrie
- `src/physics.js` — Bewegung und Plattformkollision
- `src/progression.js` — Items, Quests und Unlocks
- `src/state.js` — Savegame und Migration
- `src/input.js` — Keyboard/Touch
- `src/ui.js` — HUD/Menüs
- `src/audio.js` — WebAudio
- `src/particles.js` — Partikeleffekte
- `src/camera.js` — Follow Camera

`julia.html` und `hulia.html` bleiben als kompatible Einstiegspunkte erhalten.

## Deployment

GitHub Pages wird durch `.github/workflows/pages.yml` gebaut. Die Seite verwendet relative Vite-Assets und funktioniert deshalb auch unter dem Repository-Unterpfad `/super-mama-julia-64/`.
