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

B.I.R.D. opens on a new blank `WORLD_NEW` map by default. Existing maps are not loaded for editing until you choose one from the World selector or World Index and click the load/open button.

It opens a local browser app and reads/writes the real Big Iron files under:

```text
holotapes/BigIron/Assets/DATA
```

The app is split into GECK-style tabs:

- `World Index` for the six-map story chain, miniboss rounds, unlock flow, and live memory budgets.
- `World Builder` for tile collision, exits, encounters, NPCs, interior doors, shops, forge presses, and quick world-art setup.
- `Interior` for building lightweight door encounters that load `INTERIOR.JS`, assign an NPC sprite, show confrontation dialogue, then let the player fight or flee.
- `World Art` for drawing the exact background art, using presets, and saving IMG files.
- `Sprite Creator` for player, NPC, and scenery sprites. Player direction sprites and NPC sprites save as 34 x 34 `.IMG` files for the current low-memory Big Iron build; scenery decor can still save as small `.JS` snippets when needed. Use `4` BPP when you want sixteen shade levels for extra detail.
- `Battle UI` for sprite-battle layout previews and per-enemy battle/video/radiation/reload settings.
- `Items` for loot, aid, ammo/key items, weapons, icons, and real Pip-Boy write metadata.
- `Media & Build` for the manual Pip-Boy copy list, media inventory, and conversion targets.

World JSON is capped by B.I.R.D. before saving so the runtime stays under the Pip-Boy memory ceiling. The current limits are:

```text
World JSON: 2800 bytes
Grid:       48 x 32 tiles
Encounters: 18
Decor:      36
Exits:      8
Player/NPC: 34 x 34 IMG, 2 bpp
```

If a map goes red in the World Index or Memory Budget box, split content into another map/interior or remove extra decor/encounters before saving.

Use `New World + Art` in World Builder to start a new map build with matching art, then use `Edit Art Tools` to jump into the full art editor.

B.I.R.D. can place the Big Iron story pieces directly in World Builder: regular encounters, NPC encounters, interior confrontations, miniboss encounters with Judgment Round data, the Courier Round forge press, final boss encounters, shops, and exits locked behind a required round.

Interior encounters use compact world fields so the runtime stays small:

```json
{"type":"interior","room":"SUN KING'S HALL","enemy":"SOLOMON_RAY","dlg":"HOW YOU ENJOYING THE RADS?","ns":"SOLOMON_RAY"}
```

`dlg` is the confrontation line. `ns` is the optional NPC sprite name without `.IMG`; if no sprite is assigned, the runtime draws the lightweight fallback NPC.

To make an enemy/NPC sprite, use the enemy slot list in `Sprite Creator`, click `Use Slot` or `Assign Interior`, upload or draw the art, then click `Save Runtime Sprite`. B.I.R.D. writes the 34 x 34 `.IMG` into `Assets/DATA`, adds it to the upload metadata, and can select it in the Interior tab.

To make the map shop sprite, use `World Builder` -> `Shop Sprite` -> `Edit Shop Sprite`, upload or draw the art, then click `Save Runtime Sprite`. B.I.R.D. writes `Assets/DATA/SHOP_SPRITE.IMG`; upload it to `HOLO/BIGIRON/DATA/SHOP_SPRITE.IMG`.

Battle UI edits save to both:

```text
holotapes/BigIron/battle.json
holotapes/BigIron/Assets/battle.json
```

The Battle UI panel edits per-enemy command prompts, button labels, detail text, and battle pause labels. It does not replace the live player name, HP, weapon name, weapon damage, stim count hooks, world sprites, or interior confrontation sprites.

That keeps the runtime file and mirrored asset file from drifting apart.

NPC sprites are stored as `Assets/DATA/<ENEMY>_SPRITE.IMG` and can be assigned to interior confrontations or visible NPC slots. World-specific scenery snippets can still be stored as `Assets/DATA/WORLD_XX/SPRITE_NAME.JS` and assigned to map decor as `WORLD_XX/SPRITE_NAME`.

Shop sprites are stored as `Assets/DATA/SHOP_SPRITE.IMG` by default. Shop placement stores the selected sprite on the shop decor entry, and the runtime falls back to the simple `$` shop marker if the image is missing.

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
