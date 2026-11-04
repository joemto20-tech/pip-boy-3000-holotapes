# Native Notes 1.0.1 — installation

Adds **+ ADD NOTE** to the built-in **DATA → NOTES** screen. Your own notes are
saved on your Pip-Boy's SD card. The download contains code only, with no
personal notes, screenshots or device backups.

## Requirements

A Pip-Boy 3000 with the native Notes screen and the firmware keyboard API
(`Pip.createKeyboard`). The extension was tested on the development device;
compatibility with other firmware versions must be checked.

You need a way to read and upload files on the Pip-Boy's SD card. Preserve the
filenames and capitalization below. The supplied `.JS` files are compiled
Espruino binaries; copy them unchanged and do not open and re-save them in a
text editor.

## Install

1. Back up your SD card.
2. In your SD card's `JS` folder, copy your existing `NOTES.JS` to
   `NOTES.STOCK`. Keep a copy on your computer too. This must be the original
   Notes file from **your own device and firmware**.
3. Copy the download's `JS/NOTES_EDIT.JS` to your SD card's `JS/NOTES_EDIT.JS`.
4. Copy the download's `JS/NOTES.JS` to your SD card's `JS/NOTES.JS`, replacing
   the existing file only after making the backup in step 2.
5. Reopen **DATA → NOTES**, or restart the Pip-Boy.

For an update to this extension, keep the existing original `NOTES.STOCK`. Do
not replace it with an already modified `NOTES.JS`. After a firmware update, use
the original Notes file supplied by that new firmware instead.

Leave `DATA/F3/NOTES.DAT`, `DATA/NV/NOTES.DAT` and the original `.IMG` files
unchanged. No holotape registration or custom-notes data file is required.

## Use

Select **+ ADD NOTE**, enter a **TITLE**, and select **EDIT BODY**. Select a
line to type it and choose **Enter** on the keyboard to finish that field. Use
**+ ADD LINE** to add body lines, then choose **BACK → SAVE NOTE**.

Your note appears in the same native Notes list and preview pane. Hold the knob
on a custom note to edit or delete it. Choose **CANCEL**, or leave Notes, to
discard an unsaved draft.

The firmware keyboard uses the right wheel for columns and the left wheel for
rows; press the left wheel to type. Each body line is edited separately because
the native keyboard has one visible input line.

Custom notes are created automatically under `DATA/F3/MYNOTES.JSON` or
`DATA/NV/MYNOTES.JSON`, depending on the current game. The previous save is kept
as `.BAK`. Limits per game are 20 notes and an 8 KB document; each note allows
24 body lines and 1,600 body characters, subject to the keyboard's visible width
for each line.

## Restore the original Notes screen

Replace `JS/NOTES.JS` with a copy of your original `JS/NOTES.STOCK`, then reopen
Notes or restart the Pip-Boy. Keep `NOTES.STOCK` as a backup. Your custom-note
data stays on the SD card and will be available if you reinstall the extension.
