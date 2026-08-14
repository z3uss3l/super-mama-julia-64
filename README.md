# Super Mama Julia 64 — V3.3 modular

Modulare Three.js-Browsergame-Basis.

## Start

**Nicht per `file://` öffnen.** Das Projekt verwendet ES-Module.

### Ohne Installation

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080/` öffnen.

### Mit Vite

```bash
npm install
npm run dev
```

## Architektur

- `src/game.js` — Game Loop und Orchestrierung
- `src/world.js` — Weltobjekte
- `src/levels.js` — Levelgenerator
- `src/entities.js` — Spielfiguren/Gegner
- `src/physics.js` — Bewegung/Kollision
- `src/progression.js` — Items und Freischaltungen
- `src/state.js` — Savegame
- `src/input.js` — Keyboard/Touch
- `src/ui.js` — HUD/Menüs
- `src/audio.js` — WebAudio
- `src/particles.js` — Partikeleffekte
- `src/camera.js` — Follow Camera

`julia.html` und `hulia.html` sind Kompatibilitäts-Einstiegspunkte und leiten auf `index.html` weiter.

## V3.3.1 Fixes

- WorldRuntime besitzt seinen eigenen Objekt-Container und entfernt nicht mehr versehentlich das Player-Modell.
- Levelwechsel entfernt alte Projektile, Partikel, Player- und Löwin-Modelle sauber.
- `meshBox`-Runtime-Fehler beim Levelstart beseitigt.
- HUD-Levelanzeige korrigiert.

## V3.3.2 Fix

- Dash velocity is no longer overwritten by the normal movement controller during the dash window.
