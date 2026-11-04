# Install Native Notes

Native Notes adds **+ ADD NOTE** to **DATA → NOTES** and saves your notes on the
SD card. It requires a Pip-Boy 3000 with the built-in on-screen keyboard.

## Install the compiled files

Use the compiled `NOTES.JS` and `NOTES_EDIT.JS` files. To build them from this
repository, follow the
[source installation instructions](https://github.com/joemto20-tech/pip-boy-3000-holotapes/blob/notes-addition/native-notes/README.md).

1. Back up your SD card.
2. In your Pip-Boy's `JS` folder, copy the original `NOTES.JS` to `NOTES.STOCK`.
   Use the original file from your own Pip-Boy.
3. Copy the compiled files onto the SD card:

   | File            | SD-card destination                       |
   | --------------- | ----------------------------------------- |
   | `NOTES_EDIT.JS` | `JS/NOTES_EDIT.JS`                        |
   | `NOTES.JS`      | `JS/NOTES.JS` — replace the existing file |

4. Reopen **DATA → NOTES**, or restart your Pip-Boy.

Copy the compiled files unchanged, keeping their filenames and capitalization.
Keep the original `NOTES.STOCK` when updating this extension. After a firmware
update, use that firmware's original Notes file for `NOTES.STOCK`.

## Add a note

1. Open **DATA → NOTES → + ADD NOTE**.
2. Select **TITLE**, enter a title, then choose **Enter** on the keyboard.
3. Select **EDIT BODY** and choose a line to type. Choose **Enter** to finish
   each line. Use **+ ADD LINE** for additional lines.
4. Select **BACK → SAVE NOTE**.

Turn the right wheel to select a keyboard column and the left wheel to select a
row. Press the left wheel to type.

Scroll to your note to read it. Hold the knob on a custom note to edit or delete
it. Choose **CANCEL** to discard a draft.

## Restore the original Notes screen

Copy your original `JS/NOTES.STOCK` back to `JS/NOTES.JS`, then reopen Notes or
restart the Pip-Boy.
