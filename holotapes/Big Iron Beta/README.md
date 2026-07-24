# BIG IRON 0.45.2 — Rot's Crossing Transition Fix

This build opens the southern Sunscar road and adds the next exterior area without adding directory depth to the hot runtime files.

## Rot's Crossing exterior

- The old `WAIT FOR THE DLC` barrier is removed.
- Walking south from Sunscar loads a second streamed exterior world.
- The new world uses `W2.BIN` and `C2.BIN` from the BIGIRON root.
- Rot's Tavern can be entered and exited like the other walkable interiors.
- Chuck follows the player in the exterior and inside the tavern.
- The north road returns to Sunscar.
- The south bridge provides the walking route toward Dogtown Heights.

## Motorcycle choice

Walk up to the lower motorcycle and click it. The prompt offers:

- `STEAL IT` — immediately starts the motorcycle run.
- `WALK SOUTH` — leaves the bike and uses the walking transition.

Stealing the motorcycle is stored in the player's BIG IRON save state.

## 20-second motorcycle run

- The road scrolls continuously for 20 seconds.
- Right wheel: steer left/right.
- Left wheel: move up/down.
- Left-wheel click: shoot.
- Radscorpion hit: +100 score.
- Motorcycle collision: -50 score.
- Best score and hit total are saved under the BIG IRON story state.

The run currently ends on the Dogtown Heights arrival screen and returns to Rot's Crossing for testing. The handoff is isolated in `H.JS`, ready to route into the Dogtown world module when that map is added.

## New short root files

- `X.JS` — Rot's Crossing exterior engine
- `H.JS` — highway motorcycle minigame
- `W2.BIN` — exterior background pages
- `C2.BIN` — exterior collision map
- `RT.BIN` — Rot's Tavern interior
- `BU.BIN`, `BD.BIN`, `BL.BIN`, `BR.BIN` — motorcycle sprites

## 0.45.1 asset update

- Replaced W2 with the supplied RT map and rebuilt its collision field.
- Updated the motorcycle up/down sprites.
- Replaced placeholder road-run Radscorpions with the supplied sprite.
- The motorcycle pose now follows up, down, left, and right input briefly before returning forward.
- Adjusted all Rot's Crossing entry, tavern, bike, and road-exit coordinates to the new map.

## 0.45.2 transition fix

- Removed forced `A.gc()` calls from active gameplay modules.
- The main APP shell now remains the sole owner of garbage collection after module unload.
- Fixes the `ReferenceError: play is not defined` crash when entering Rot's Tavern from W2.
- Applies the same protection to Sunscar, interiors, pause, shop, demo, and motorcycle-run cleanup.

## 0.45.3 tavern + crossing update

- Reverted Rot's Crossing to the earlier exterior road layout.
- Restored the visible motorcycle encounter trigger on that exterior.
- Converted the supplied tavern artwork into a 480x456 2bpp BIN (`RT.BIN`) for the interior system.
- Updated Rot's Tavern collision blocks and bartender placement to fit the new layout.

## 0.45.4 Rotjaw + side-run update

- Replaced the tavern bartender sprite with Rotjaw (`RJ.BIN`).
- Replaced the Guns & Ammo interior Radscorpion with a dedicated sprite (`RSC.BIN`).
- Updated the road-run Radscorpion sprite from the supplied image.
- Changed the motorcycle sequence to a horizontal side-scrolling run so the default bike pose is the side view.
- Adjusted the road-run art treatment to feel closer to the Big Iron world.

## 0.45.5 scenery + bike sprite update

- Replaced the Dogtown run's drawn shrubs with the supplied shrub sprite (`SH.BIN`).
- Replaced the Dogtown run's drawn cacti with the supplied cactus sprite (`CA.BIN`).
- Replaced all four motorcycle direction sprites with the improved set.
- Kept the horizontal side-scrolling Dogtown run and earlier Rot's Crossing / tavern setup intact.

## 0.46.0 motorcycle inventory and auto-ride

- Added broken road sections to the Dogtown motorcycle run. Each break has one visible ramp lane; hitting the correct lane awards jump points, while missing it costs score.
- Completing the stolen-bike run adds MOTORCYCLE to the BIG IRON inventory.
- Selecting MOTORCYCLE from INV returns to the current exterior using the directional motorcycle sprite.
- While mounted, the bike continues moving until the player changes direction or hits collision.
- Double-click while mounted stores the bike and returns to the normal player sprite.
- Double-click while walking continues to open Pause.
- Motorcycle travel works in Sunscar and Rot's Crossing and remains active when crossing between those exterior worlds.

## 0.46.1 motorcycle state fix

- Active riding now requires the saved `story.motorcycle` unlock.
- Entering Rot's Crossing before completing the motorcycle run can no longer auto-equip the bike.
- Returning to Sunscar always stores the motorcycle and loads the player on foot.

## 0.46.2 motorcycle state repair

- Fixed the prior 0.46.1 archives being nested one directory too deep.
- Rot's Crossing always loads on foot when entered from Sunscar.
- Returning to Sunscar always stores the motorcycle and loads the player on foot.
- Active riding now uses a dedicated one-use `mount` argument only sent by the inventory selection.
- Pause inventory reads the live saved story and migrates older `bikeStolen` saves to the `motorcycle` unlock.
- The bike is no longer marked stolen until the motorcycle run completes.

## 0.47.0 Dogtown Heights

- Added Dogtown Heights as `WORLD_03` / the second major story world. Rot's Crossing remains the connector area.
- Completing or walking through the Dogtown motorcycle run now loads Dogtown Heights.
- Added a 1672x941 streamed exterior (`W3.BIN`) and collision map (`C3.BIN`).
- Motorcycle inventory riding and continuous auto-ride work throughout Dogtown.
- Added the Dogtown Delivery Run: collect the Supply crate, Doc's medicine, and Garage engine parts, then report to the Sheriff.
- Each delivery contributes one Judgment encounter and the Sheriff awards the Dogtown round when all three are returned.
- Added one optional Radscorpion encounter at the livestock pen and a reusable General Store.
- Hotel and other interiors are intentionally reserved for later dedicated interior art.

## 0.47.1 motorcycle state repair

- Fixed the `ride` state/function name collision in Rot's Crossing.
- Old save flags can no longer auto-mount the player.
- Only selecting MOTORCYCLE in Pause > INV sends the one-time `bikeEquip` command.
- Entering Rot's Crossing from Sunscar and arriving at Dogtown after the run always starts on foot.
- Returning to Sunscar always stores the motorcycle.

## 0.47.2 Dogtown return-router fix

- Fixed `returnWorld()` so `WORLD_03` loads `Q.JS`.
- The motorcycle run now routes directly through the map-aware world loader.
- Dogtown battles, shops, Pause, and later interiors can now return to Dogtown correctly.
- Dogtown arrival remains on foot at the valid south-road spawn.
