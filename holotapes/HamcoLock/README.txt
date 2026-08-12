HAMCO LOCK - Holotape Edition (no CFW)
========================================

A PIN lock screen for the Wand Company Pip-Boy 3000. Runs entirely as a
holotape - NO custom firmware (CFW) file required.

INSTALL (SD card)
-----------------
  1. Copy every file in this folder EXCEPT HAMCOLOCK.info into:  HOLO/HAMCOLOCK/
  2. Copy HAMCOLOCK.info into:  APPINFO/
  3. Make sure APPINFO/HOLO.IMG exists (the menu icon).
  4. Put your boot video at:  HOLO/HAMCOLOCK/G.AVI
  5. Reboot so the Items list rescans.

USE
---
  - Play the "SET LOCK" holotape once. First run asks you to CREATE ACCESS CODE
    (a 4-digit PIN) - there is NO default password.
  - Playing the tape ARMS the lock. It then triggers on sleep -> wake per the
    mode you choose in settings (STARTUP / SLEEP / BOTH / OFF).
  - Long-press DATA to open settings (PIN required).

NOTES
-----
  - No-CFW behavior: the lock arms when you play the tape and stays armed across
    sleep -> wake, but NOT across a full power-off. After a cold power-off, play
    the tape once to re-arm. (For cold-boot autostart, use the separate CFW
    edition.)
  - Config is saved to HOLO/HAMCOLOCK/LOCK.JSON automatically on first run.

FILES (all deploy to HOLO/HAMCOLOCK/ except the .info)
----------------------------------------------------
  APP.JS SVC.JS L.JS S.JS SETPIN.JS   - the app
  A.WAV                               - access-granted sound
  E/F/H/I/L/N/R/T/V.BIN               - faction logos
  HAMCOLOCK.info                        - menu registration (-> APPINFO/)
  (add) G.AVI                         - your boot video (-> HOLO/HAMCOLOCK/)
