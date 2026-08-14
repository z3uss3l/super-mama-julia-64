# Super Mama Julia 64 — V5.4.2-phone

## Start

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## V5.4.2-phone Fix

- Startscreen uses the correct `#screen` selector.
- Explicit z-index layers for canvas, HUD, touch controls and start/pause screen.
- Startscreen receives pointer events; the canvas cannot cover the menu.
- Complete `src/` included; no source files omitted.
