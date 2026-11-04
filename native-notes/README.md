# Native Notes editor

Add, read, edit and delete your own notes in **DATA → NOTES** on the Pip-Boy.
Notes save to the SD card.

## Install from source over USB

You need a Pip-Boy 3000 with the built-in on-screen keyboard, a Windows PC, a
USB data cable, and Node.js 22.18 or later.

1. Download the **notes-addition** branch of this repository and extract it.
2. Open PowerShell in the extracted repository folder containing `package.json`.
3. Install the dependencies and build the two device files:

   ```powershell
   npm install
   node native-notes/build.mjs
   ```

4. Connect your Pip-Boy over USB. Close other programs using its serial port.
5. Find its COM port in Windows Device Manager under **Ports (COM & LPT)**.
6. Run the installer, replacing `COM3` with your Pip-Boy's port:

   ```powershell
   ./native-notes/device.ps1 -Port COM3 -Install
   ```

7. Reopen **DATA → NOTES**, or restart the Pip-Boy.

The installer saves the original Notes screen as `JS/NOTES.STOCK` on your
Pip-Boy and copies the two new files into its `JS` folder.

For manual installation of the compiled files, follow [INSTALL.md](INSTALL.md).

## Use

1. Open **DATA → NOTES** and select **+ ADD NOTE**.
2. Select **TITLE**, type your title, then choose **Enter** on the keyboard.
3. Select **EDIT BODY** and choose a line to type. Select **Enter** to finish
   each line. Use **+ ADD LINE** for additional lines.
4. Choose **BACK → SAVE NOTE**.

Your note appears in the Notes list. Scroll to it to read it. Hold the knob on a
custom note to edit or delete it. Select **CANCEL** to discard a draft.

On the keyboard, turn the right wheel to select a column and the left wheel to
select a row. Press the left wheel to type.

## Restore the original Notes screen

Connect your Pip-Boy and run this command with its COM port:

```powershell
./native-notes/device.ps1 -Port COM3 -Restore
```

Reopen Notes or restart the Pip-Boy.
