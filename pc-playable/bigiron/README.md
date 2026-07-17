# Big Iron PC Playable

This is a separate browser-playable PC version of the Big Iron holotape. It does not touch the Pip-Boy runtime, the Pip-Boy save files, or the minified holotape files.

## Run As A Page

Open `index.html` in a browser.

## Run Like An App

Double-click `START_BIGIRON_PC.bat`, then open `http://127.0.0.1:4173/`.

From Chrome or Edge, use the install button in the address bar to install it like an app. The app mode also enables the local offline cache.

The PC version keeps its menus and placeholder sprites drawn in code for now, so it does not depend on the Pip-Boy `.IMG` or `.BIN` menu art until the correct app assets are intentionally wired in.

## Controls

- Arrow keys or WASD: move / change menu choice
- Enter or Space: select / interact
- Escape or Backspace: back / pause
- P: pause on the world map

The PC save is stored in browser local storage as `bigiron-pc-save-v1`.
