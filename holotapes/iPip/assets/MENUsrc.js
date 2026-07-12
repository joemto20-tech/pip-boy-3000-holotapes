(function (app) {
  const KNOB_UP = 1;
  const KNOB_DOWN = 2;
  const KNOB_PRESS = 3;

  const MENU_ITEMS = [
    {
      label: "MUSIC",
      desc: "Play WAV playlists from MUSIC/",
      scene: "MUSIC"
    },
    {
      label: "VIDEOS",
      desc: "Watch AVI clips from VIDEOS/",
      scene: "VIDEO"
    },
    {
      label: "IMAGES",
      desc: "View images from IMAGES/",
      scene: "IMAGES"
    },
    {
      label: "TURN OFF IPIP",
      desc: "Stop player and exit",
      off: true
    }
  ];

  const ROW_HEIGHT = 52;
  const MENU_TOP = 96;

  let selectedIndex = 0;

  function drawMenu() {
    h.clear(1);

    try {
      Pip.renderHeader();
      Pip.renderFooter();
    } catch (error) {
      h.setColor(1)
        .drawLine(0, 39, app.W - 1, 39)
        .drawLine(0, app.H - 30, app.W - 1, app.H - 30);
    }

    h.setColor(3)
      .setFontMonofonto16()
      .setFontAlign(-1, -1)
      .drawString("iPip Media Player", 18, 52);

    if (app.version) {
      const versionX = 18 + h.stringWidth("iPip Media Player") + 4;

      h.setColor(3)
        .setFont("6x8")
        .setFontAlign(-1, -1)
        .drawString("v" + app.version, versionX, 60);
    }

    h.setColor(1).drawLine(12, 76, app.W - 12, 76);

    for (let index = 0; index < MENU_ITEMS.length; index++) {
      drawMenuItem(index);
    }

    h.flip();
    Pip.lastFlip = getTime();
  }

  function drawMenuItem(index) {
    const y = MENU_TOP + index * ROW_HEIGHT;
    const isSelected = index === selectedIndex;

    if (isSelected) {
      h.setColor(1).fillRect(14, y, app.W - 14, y + ROW_HEIGHT - 8);
    }

    h.setColor(isSelected ? 3 : 2)
      .setFontMonofonto23()
      .setFontAlign(-1, -1)
      .drawString(MENU_ITEMS[index].label, 26, y + 4);

    h.setColor(isSelected ? 3 : 2)
      .setFont("6x8")
      .setFontAlign(-1, -1)
      .drawString(MENU_ITEMS[index].desc, 26, y + 30);
  }

  function moveSelection(direction) {
    selectedIndex += direction > 0 ? 1 : -1;

    if (selectedIndex < 0) {
      selectedIndex = 0;
    }

    if (selectedIndex >= MENU_ITEMS.length) {
      selectedIndex = MENU_ITEMS.length - 1;
    }

    drawMenu();
    playSound("HIGHLIGHT");
  }

  function handleKnob1(value) {
    if (value) {
      moveSelection(value);
    } else {
      activateSelection();
    }
  }

  function handleKnob2() {
    // Knob 2 is intentionally unused on this scene.
  }

  function remove() {
    Pip.removeListener("knob1", handleKnob1);
    Pip.removeListener("knob2", handleKnob2);
  }

  function turnOffIPip() {
    try {
      const backgroundAudio = Pip.iPipBg;

      if (backgroundAudio) {
        backgroundAudio.on = 0;
        backgroundAudio.path = 0;
        backgroundAudio.dir = 0;
        backgroundAudio.file = 0;

        Pip.radioClipPlaying = 0;
        backgroundAudio.allow = 1;

        try {
          if (Pip.audioStop) {
            Pip.audioStop();
          }
        } catch (error) {}

        try {
          if (backgroundAudio.h && Pip.removeListener) {
            Pip.removeListener("audioStopped", backgroundAudio.h);
          }
        } catch (error) {}

        try {
          if (backgroundAudio.s) {
            Pip.audioStart = backgroundAudio.s;
          }
        } catch (error) {}

        try {
          if (backgroundAudio.t) {
            Pip.audioStop = backgroundAudio.t;
          }
        } catch (error) {}

        Pip.iPipBg = 0;
      } else {
        Pip.radioClipPlaying = 0;

        try {
          if (Pip.audioStop) {
            Pip.audioStop();
          }
        } catch (error) {}
      }
    } catch (error) {}

    try {
      Pip.iPipStarted = false;
    } catch (error) {}

    try {
      if (Pip.emit) {
        Pip.emit("mode", 1);
      }
    } catch (error) {
      try {
        if (Pip.changeMenu) {
          Pip.changeMenu("HOLO");
        }
      } catch (fallbackError) {}
    }
  }

  function activateSelection() {
    playSound("TAB");

    const selectedItem = MENU_ITEMS[selectedIndex];

    if (selectedItem.off) {
      turnOffIPip();
    } else {
      app.go(app.scenes[selectedItem.scene]);
    }
  }

  function playSound(soundName) {
    try {
      if (Pip.playSound) {
        Pip.playSound(soundName);
      }
    } catch (error) {}
  }

  Pip.audioStop();
  Pip.onExclusive("knob1", handleKnob1);
  Pip.onExclusive("knob2", handleKnob2);

  drawMenu();

  return {
    remove: remove
  };
});
