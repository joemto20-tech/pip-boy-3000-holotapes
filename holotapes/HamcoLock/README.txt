HAMCO LOCK - PIN Lock Screen
============================

A PIN lock screen for the Wand Company Pip-Boy 3000. Runs entirely as a
holotape - no custom firmware required.

INSTALL (SD card)
-----------------
  1. Copy every file in this folder EXCEPT HAMCOLOCK.info into:  HOLO/HAMCOLOCK/
     (this includes HAMCOLOCK.IMG, the menu icon).
  2. Copy HAMCOLOCK.info into:  APPINFO/
  3. G.AVI (the access-granted video) is included; replace it with your own if
     you like, keeping the path HOLO/HAMCOLOCK/G.AVI.
  4. Reboot so the Items list rescans.

USE
---
  - Play the "SET LOCK" holotape once. First run asks you to CREATE ACCESS CODE
    (a 4-digit PIN) - there is NO default password.
  - Playing the tape ARMS the lock. It then triggers per the mode you choose in
    settings.
  - Long-press DATA to open settings (PIN required).

MODES
-----
  STARTUP - lock on a full power-on / boot
  SLEEP   - lock on a quick wake from sleep
  BOTH    - lock on either
  OFF     - disabled

NOTES
-----
  - The lock arms when you play the tape and stays armed across sleep -> wake,
    but not across a full power-off. After a cold power-off, play the tape once
    to re-arm.
  - Config is saved to HOLO/HAMCOLOCK/LOCK.JSON automatically on first run.

FILES (all deploy to HOLO/HAMCOLOCK/ except HAMCOLOCK.info)
----------------------------------------------------------
  APP.JS        - holotape entry point
  SERVICE.JS    - shared lock service (arms the lock, mode logic)
  LOCK.JS       - lock / login screen
  GRANT.JS      - access-granted sound + video + reveal
  SETTINGS.JS   - settings menu (mode, PIN, faction)
  SETPIN.JS     - first-run PIN creation
  A.WAV                                   - access-granted sound
  G.AVI                                   - access-granted video
  HAMCOLOCK.IMG                           - menu icon
  HAMCOLOCK.info                          - menu registration (-> APPINFO/)

FACTION LOGOS (.BIN files - pick one in settings)
-------------------------------------------------
  VAULTTEC BROTHERHOOD NCR NCRSEAL ENCLAVE ENCLAVE1 LEGION REDTALON FIENDS
  VANGRAFFS GUNNERS OPERATORS KINGS BIGMT TUNNELSNAKES ATOMCATS GREATKHANS
  FOLLOWERS RESPONDERS VIPERS RANGERS MOTHMAN WHITEGLOVE SMUGGLERS HAM
  INTERSTATE80
