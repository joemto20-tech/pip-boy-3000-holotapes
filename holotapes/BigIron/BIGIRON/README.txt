Big Iron RPG - ENEMY FOLDER BUILD

INSTALL
Copy APP.JS, battle.json, and DATA to:
HOLO/BIGIRON/

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

VAULT_OPEN.avi may be placed either directly in VIDEO or inside VIDEO/Granny.

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
