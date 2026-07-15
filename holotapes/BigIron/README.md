Big Iron RPG 

INSTALL
Install through the holotape registry like the other games.

For a manual SD-card copy, place these files under:
HOLO/BIGIRON/

Required:
  APP.JS
  battle.json
  CODE/
  DATA/
  ST.IMG
  PS.IMG
  VIDEO/

Optional:
  AUDIO/

VIDEO LAYOUT
Rename the current video set folder to:
HOLO/BIGIRON/VIDEO/Granny/

Every enemy folder uses the same filenames:
  BATTLE_IDLE.avi
  BATTLE_START.avi
  P_MOVE_1.avi
  P_MOVE_2.avi
  P_MOVE_3.avi
  P_MOVE_4.avi
  E_MOVE_1.avi
  E_MOVE_2.avi
  E_MOVE_3.avi
  E_MOVE_4.avi
  ENEMY_FAINT.avi
  PLAYER_FAINT.avi
  VICTORY.avi
  DEFEAT.avi


ADDING AN ENEMY
1. Duplicate the Granny folder and rename it.
2. Replace the AVI files but keep the same filenames.
3. Add an enemy entry to battle.json with a matching folder value.

ENCOUNTER SELECTION
  "enemy":"GRANNY"             exact enemy
  "enemy":"RANDOM"             any installed/configured enemy
  "enemy":["GRANNY","RADROACH"] random from that installed pool

An enemy is considered installed when its BATTLE_IDLE.avi exists. Missing enemy folders are skipped. A requested missing enemy falls back to another installed enemy.

PAUSE / EXIT
Double-press the main wheel. EXIT GAME saves silently, stops game video and timers, releases world/enemy caches, restores standard Pip timers and hardware watches, then uses the firmware menu-change path to reload the normal Pip-Boy page. It returns to the mode that was active before the holotape instead of forcing ITEMS.

START SCREEN
The holotape opens on a Big Iron title screen. Press the left wheel to start or continue from the saved map state.
