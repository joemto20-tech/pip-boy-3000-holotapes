# Big Iron RPG

A wasteland RPG for the Pip-Boy 3000. Three walkable towns, video-driven
battles, a dirt-track race for a motorcycle, hotel crafting, and the Iron Warden
waiting at the end of it.

You arrive in **Sunscar** as a courier. Solomon Ray is holding the road south
from the Town Hall. Past him, **Rot's Crossing** has a tavern, a track, and
Rotjaw — who has a bike that is not yours yet. **Dogtown Heights** owes you a
casing set if you find the sheriff's three lost deliveries, and the Big Iron
Hotel above it holds the parts for six Scorched Rounds. You need all six before
the Iron Warden in the penthouse is worth walking up to.

## Controls

|              |                                                   |
| ------------ | ------------------------------------------------- |
| Left wheel   | Walk up / down                                    |
| Right wheel  | Walk left / right                                 |
| Left click   | Interact with whatever the footer is offering     |
| Double click | Pause menu (or store the motorcycle while riding) |

In battle the right wheel picks an action and the left click confirms it. On the
track the left wheel changes lane and the right wheel works the throttle — hit
the chevrons for a boost.

## Installation

Install from the holotape registry, or copy the files to `HOLO/BIGIRON/` on the
device.

Upgrading from an earlier build: **delete the old `HOLO/BIGIRON` folder first.**
The module names changed in 0.58.0 and leaving the old single-letter files
behind wastes space. Existing saves are compatible.

## Layout

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| `src/`     | Readable source. Edit here.                                    |
| `scripts/` | Minified modules, generated. This is what ships to the device. |
| `assets/`  | World maps, collision, interiors, sprites, audio.              |
| `video/`   | Per-enemy battle clips.                                        |
| `tools/`   | Build script, equivalence checker, and the Construction Kit.   |

### Building

```sh
cd tools && npm install && node build.mjs
```

Mangling and comment stripping only — no compression passes. `agents.md` §3.3
notes that Espruino does not block-scope `let`/`const`, so structural rewrites
are not worth the risk for a few hundred bytes. The build proves every generated
module is an **alpha-rename** of its source (identical AST, identical literals,
identifiers in bijection with their bindings) and fails rather than shipping if
it cannot. That also covers review rule R08.

`APP.JS` calls `eval()` on the other modules, so terser needs `mangle.eval`. The
build first asserts that no module references an `APP.JS` local, which is what
makes that safe.

### Compliance

`COMPLIANCE.md` records every `agents.md` R01-R15 result, and gives the reason
for each of the five `Pip.*` writes in `APP.JS` — two documented, three not, all
listed rather than buried.

### Construction Kit

`tools/BIGIRON-CONSTRUCTION-KIT.html` is a single-file editor for the game's
binary formats — open it in a browser, nothing is uploaded anywhere. It converts
artwork to and from world maps, sprites and full-screen images, and paints
collision.

Worlds are not single images: each `.BIN` is a stack of pre-rendered 480x296
screens, five or six across, and the camera snaps between them. The kit stitches
and re-slices that, so you work on the flat map. Collision painting includes a
walk test that runs the game's own four-corner foot probe at 6px steps and shows
anything walkable but sealed off from the spawn point.

## Modules

|                                              |                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `APP.JS`                                     | Shell: splash, title menu, intro, module router, native inventory bridge |
| `SUNSCAR.JS` `CROSSING.JS` `DOGTOWN.JS`      | The three overworlds                                                     |
| `BATTLE.JS`                                  | Turn-based battle, video-driven                                          |
| `INTERIOR.JS` `HOTEL.JS`                     | Shops and town hall; the six-room hotel                                  |
| `RACE.JS`                                    | The Rot's Crossing track                                                 |
| `WORKBENCH.JS` `AID.JS` `SHOP.JS` `PAUSE.JS` | Crafting, stimpaks, vendors, pause                                       |
| `INTRO.JS` `DEMO.JS`                         | New-game opening, attract mode                                           |

## Credits

Built by **@joemto20-tech** for the Pip-Boy 3000. Title music and battle clips
by the author.
