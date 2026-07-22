# B.I.R.D. 2

B.I.R.D. is the local world and content editor for the compact Big Iron Pip-Boy runtime.

## Start

1. Open a terminal in `tools/bird`.
2. Run `npm start`.
3. Open the URL printed in the terminal.

The server starts at `http://127.0.0.1:7331/`. If that port is occupied, it automatically tries the next available port.

## Editors

- **World:** import a background, paint the 120x90 collision mask, set the player spawn, and place NPCs, triggers, and exits.
- **Interior:** edit a 480-pixel-wide streamed interior with collision rectangles and placed NPCs.
- **NPC:** assign 34x34 or 102x34 IMG sprites, collision, facing, interaction range, and movement.
- **Dialogue:** create up to three choices per node and connect battle, shop, confrontation, interior, world, close, and exit actions.
- **Media:** import PNG, BMP, JPG, IMG, BIN, AVI, and WAV files. Image presets produce device-ready IMG and BIN assets.
- **Build:** validates device budgets and exports a ZIP with readable source, `.MIN.JS` files, compact runtime modules, map data, collision data, NPC sprites, and `PIPBOY-UPLOAD.txt`.

Projects are saved in `tools/bird/projects`. Imported assets are saved in `tools/bird/workspace/assets`. Builds are saved in `tools/bird/exports/builds`.

## Checks

```powershell
npm run check
```

Readable files use `.js`. Generated compact copies use `.min.js`.
