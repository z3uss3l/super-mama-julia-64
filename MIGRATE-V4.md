# V4 Migration

Replace the repository working tree with this V4 source.

## Keep

- `legacy/` original prototypes
- `src/` as the only authoritative runtime source
- `index.html`, `julia.html`, `hulia.html`

## Remove obsolete root duplicates

The following files at repository root are obsolete duplicates of `src/` and should be deleted after uploading V4:

- `config.js`
- `game.js`
- `levels.js`
- `progression.js`
- `state.js`

They are not imported by the V4 entry point.

## Deployment

Commit the V4 files to `main`. GitHub Actions will run:

1. `npm install`
2. `npm run check`
3. `npm run build`
4. deploy `dist/` to GitHub Pages

The runtime no longer depends on a browser import map or a jsDelivr Three.js URL.
