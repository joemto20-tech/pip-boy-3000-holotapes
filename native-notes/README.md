# Native Notes editor

Adds custom text notes directly to the Pip-Boy's existing **DATA → NOTES**
screen. The original screen still handles the stock text, image and audio
entries. No game `.DAT` or `.IMG` file is rewritten.

## On the Pip-Boy

1. Open **DATA → NOTES** and press the knob on **+ ADD NOTE**.
2. Select **TITLE**, type with the firmware keyboard and choose **Enter**.
3. Select **EDIT BODY**. Select a line to type it; use **+ ADD LINE** for
   additional lines. Choose **BACK** when finished.
4. Choose **SAVE NOTE**. Your note appears at the top of the same Notes list.
   Scroll to it to read it in the native preview pane.

Hold the knob on one of your custom notes to edit or delete it. Deletion has a
confirmation screen. **CANCEL** or leaving the Notes screen discards an unsaved
draft. The original game notes remain read-only.

The native keyboard uses the right wheel to select a column, the left wheel to
select a row, and a left-wheel press to type. Select **Enter** to finish each
field. Its visible input width limits a line, so the body editor works one line
at a time.

## Storage and recovery

- Fallout 3: `DATA/F3/MYNOTES.JSON` on the SD card.
- New Vegas: `DATA/NV/MYNOTES.JSON` on the SD card.
- Format: `{"version":1,"notes":[{"title":"Title","body":"Line 1\nLine 2"}]}`.
- Limits per game: 20 custom notes and an 8 KB serialized document; per note: 80
  title characters, 1,600 body characters and 24 body lines. Actual keyboard
  line length depends on the visible pixel width.
- A save is first written to `.NEW` and read back. The existing file is then
  renamed to `.BAK` before the new file replaces it. The last saved version is
  preserved. If power is lost between renames, a missing main file is read from
  `.BAK` on the next visit. An unreadable main file is never silently
  overwritten.

Firmware/game-data updates may replace `JS/NOTES.JS`. Reinstall the extension
after an update, using the matching updated stock Notes screen as its backup.
Keep an external SD-card backup as usual.

## Source and installation

For an end-user download, publish the compiled `NOTES.JS` and `NOTES_EDIT.JS`
under a `JS/` folder, together with [INSTALL.md](INSTALL.md). Attach that ZIP to
a GitHub Release. Publish source files in this repository; exclude the local
`backups/` directory and all `MYNOTES.JSON`, `.BAK`, `.NEW` and screenshot
files.

This is a native-screen extension, not a new holotape. It needs no holotape
metadata, icon or registry entry. Source files are TypeScript. Generated device
files are written under `dist/native-notes/` and must not be committed.

From the repository directory, after installing its development dependencies:

```powershell
node node_modules/typescript/bin/tsc --noEmit --project native-notes/tsconfig.json
node --test native-notes/test.mjs
node native-notes/build.mjs
./native-notes/device.ps1 -Port COM3 -Install
```

The installer reads and backs up the current device files under local
`native-notes/backups/`, preserves the original device Notes code in
`JS/NOTES.STOCK`, uploads both new files to staging names, checks their exact
readback and verifies they evaluate to factories before replacing the active
entry point. It does not change custom-note data during installation.

Installed code:

| Build output                      | SD-card destination |
| --------------------------------- | ------------------- |
| `dist/native-notes/NOTES.JS`      | `JS/NOTES.JS`       |
| `dist/native-notes/NOTES_EDIT.JS` | `JS/NOTES_EDIT.JS`  |

Restore the original screen, keeping custom notes on the SD card:

```powershell
./native-notes/device.ps1 -Port COM3 -Restore
```

The adapter is based on the stock Notes code and APIs inspected directly on the
connected Pip-Boy. The stock implementation is loaded unchanged with local API
adapters; no firmware globals are replaced. Compatibility must be checked again
if a firmware update changes the Notes screen's API usage.

## Validation

The test suite covers the native list overlay, unchanged stock note types,
add/edit/delete, multiline entry, cancellation, screen cleanup, per-game
storage, backup recovery, write/rename failures and storage limits. Device
validation additionally checks the actual interpreter and native screen.
