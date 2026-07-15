# B.I.R.D.

Big Iron Render Dock is a focused local editor for Big Iron worlds, encounters, and sprites.

Install/use it locally:

1. Keep this repo folder on your PC. B.I.R.D. is local/offline and does not need pip-boy.com.
2. Double-click either `START_BIRD.bat` in the outer repo folder or `pip-boy-3000-holotapes/START_BIRD.bat`.
3. If you use PowerShell instead, run it from `pip-boy-3000-holotapes`:

```powershell
npm start
```

You can also run it from `pip-boy-3000-holotapes` with:

```powershell
npm start
```

Do not open `public/index.html` directly with `file://`. The editor needs the local server so it can read and save worlds.

It opens a local browser app and reads/writes the real Big Iron files under:

```text
holotapes/BigIron/Assets/DATA
```

The app is split into tabs:

- `World Builder` for tile collision, exits, encounters, NPCs, and quick world-art setup.
- `World Art` for drawing the exact background art, using presets, and saving IMG files.
- `Sprite Creator` for player, NPC, and scenery sprites. Player direction sprites save as `.IMG` for the current low-memory Big Iron build; NPC/scenery sprites save as `.JS`. Use `4` BPP when you want sixteen shade levels for extra detail.
- `Upload Checklist` for the manual Pip-Boy copy list.

Use `New World + Art` in World Builder to start a new map build with matching art, then use `Edit Art Tools` to jump into the full art editor.

B.I.R.D. can place the Big Iron story pieces directly in World Builder: regular encounters, NPC encounters, miniboss encounters with Judgment Round data, the Courier Round forge press, final boss encounters, and exits locked behind a required round.

World-specific NPC/scenery sprites are stored as `Assets/DATA/WORLD_XX/SPRITE_NAME.JS` and can be assigned to map decor as `WORLD_XX/SPRITE_NAME`.

The four player movement files should stay as:

```text
Assets/DATA/PLAYER_SPRITEUP.IMG
Assets/DATA/PLAYER_SPRITEDOWN.IMG
Assets/DATA/PLAYER_SPRITEL.IMG
Assets/DATA/PLAYER_SPRITER.IMG
```

Do not upload the old `PLAYER_SPRITE*.JS` files for the player.

The `Save Local Copy` button stores sprite backups under:

```text
tools/bird/exports/sprites
```

This does not add the sprite to Big Iron's upload list. Use `Save Runtime Sprite` when you want the sprite to become part of the game files.

If no worlds exist yet, B.I.R.D. still opens offline. Click `New`, enter a world id like `WORLD_05`, then click `Save World JSON`.
