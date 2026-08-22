// Big Iron - shell: splash, title menu, intro crawl, module router, native inventory bridge.
(function () {
  const SCREEN_W = h.getWidth ? h.getWidth() : 480,
    SCREEN_H = h.getHeight ? h.getHeight() : 320;
  let BASE = 'HOLO/BIGIRON/',
    active = 0,
    switching = 0,
    quitting = 0,
    loadTimer = 0,
    routeTimer = 0,
    exitTimer = 0;
  let nextModule = '',
    nextArgs = 0,
    nextDelay = 0,
    homeMode = typeof Pip.MODE == 'number' ? Pip.MODE : 1;
  let mode = 'splash',
    selected = 0,
    playing = 0,
    trackName = '',
    splashTimer = 0,
    introFile = 0,
    lastLine = 0,
    introTimer = 0,
    fadeStep = 0;
  let quiet = 0,
    quietTimer = 0;

  function collect() {
    try {
      if (E && E.gc) E.gc();
    } catch (err) {}
    try {
      if (E && E.defrag) E.defrag();
    } catch (err2) {}
  }
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function playUi(name) {
    try {
      if (Pip.playSound) Pip.playSound(name);
    } catch (err) {}
  }
  function flush() {
    h.flip();
    if (typeof getTime == 'function') Pip.lastFlip = getTime();
  }
  function holdFlip() {
    try {
      Pip.lastFlip = getTime() + 1;
    } catch (err) {}
  }
  function setQuiet(enable) {
    if (enable) {
      if (quiet) {
        holdFlip();
        return;
      }
      quiet = 1;
      try {
        if (Pip.stopTimers) Pip.stopTimers();
      } catch (err) {}
      try {
        if (Pip.timers) {
          if (Pip.timers.timeHeader) {
            clearInterval(Pip.timers.timeHeader);
            Pip.timers.timeHeader = 0;
          }
          if (Pip.timers.flip) {
            clearInterval(Pip.timers.flip);
            Pip.timers.flip = 0;
          }
        }
      } catch (err2) {}
      if (quietTimer) clearInterval(quietTimer);
      quietTimer = setInterval(holdFlip, 120);
      holdFlip();
    } else {
      if (quietTimer) {
        clearInterval(quietTimer);
        quietTimer = 0;
      }
      quiet = 0;
      try {
        if (Pip.stopTimers) Pip.stopTimers();
      } catch (err3) {}
      try {
        if (Pip.startTimers) Pip.startTimers();
      } catch (err4) {}
      try {
        if (Pip.setWatches) Pip.setWatches();
      } catch (err5) {}
    }
  }
  function drawStatus(title, detail) {
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setFontAlign(0, 0);
    setFont(3);
    h.setColor(3).drawString(title, SCREEN_W / 2, 126);
    setFont(1);
    h.setColor(2).drawString(detail || '', SCREEN_W / 2, 172);
    flush(0, SCREEN_H - 1);
  }

  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (err) {
      return {};
    }
  }
  function invPath(category) {
    return (
      'INV/' +
      (typeof NV != 'undefined' && NV ? 'NV' : 'F3') +
      '/' +
      category +
      '.INV'
    );
  }
  function invCount(category, itemId) {
    let file = 0,
      index = -1,
      entry = 0,
      count = 0;
    collect();
    try {
      file = new InvFile(invPath(category));
      index = file.indexOf(parseInt(itemId, 10) || itemId);
      if (index >= 0) {
        entry = file.get(index);
        count = Math.max(0, parseInt(entry && entry.cnt, 10) || 0);
      }
    } catch (err) {
      count = 0;
    } finally {
      try {
        if (file && file.close) file.close();
      } catch (err2) {}
      if (file)
        try {
          file.buf = 0;
        } catch (err3) {}
      file = entry = 0;
      collect();
    }
    return count;
  }
  function invAdd(category, itemId, count) {
    let file = 0,
      index = -1,
      entry = 0,
      ok = 0;
    count = Math.max(1, parseInt(count, 10) || 1);
    collect();
    try {
      file = new InvFile(invPath(category));
      index = file.indexOf(parseInt(itemId, 10) || itemId);
      if (index >= 0) {
        entry = file.get(index) || { id: itemId, cnt: 0, cnd: 100, fl: 0 };
        entry.cnt = Math.min(32767, (parseInt(entry.cnt, 10) || 0) + count);
        file.set(index, entry);
      } else
        file.add({
          id: parseInt(itemId, 10) || itemId,
          cnt: count,
          cnd: 100,
          fl: 0,
        });
      if (file.sync) file.sync();
      ok = 1;
    } catch (err) {
      ok = 0;
    } finally {
      try {
        if (file && file.close) file.close();
      } catch (err2) {}
      if (file)
        try {
          file.buf = 0;
        } catch (err3) {}
      file = entry = 0;
      collect();
    }
    return ok;
  }
  function invTake(category, itemId, count) {
    let file = 0,
      index = -1,
      entry = 0,
      left = 0,
      ok = 0;
    count = Math.max(1, parseInt(count, 10) || 1);
    collect();
    try {
      file = new InvFile(invPath(category));
      index = file.indexOf(parseInt(itemId, 10) || itemId);
      if (index < 0) throw 'missing';
      entry = file.get(index);
      left = parseInt(entry && entry.cnt, 10) || 0;
      if (left < count) throw 'empty';
      left -= count;
      if (left < 1 && file.remove) file.remove(index);
      else {
        entry.cnt = left;
        file.set(index, entry);
      }
      if (file.sync) file.sync();
      ok = 1;
    } catch (err) {
      ok = 0;
    } finally {
      try {
        if (file && file.close) file.close();
      } catch (err2) {}
      if (file)
        try {
          file.buf = 0;
        } catch (err3) {}
      file = entry = 0;
      collect();
    }
    return ok;
  }
  function equippedWeapon() {
    let record = playerRecord(),
      weaponId = 0,
      file = 0,
      entry = 0,
      value,
      name = 'FISTS',
      damage = 6;
    try {
      if (player && player.getav) weaponId = player.getav('equippedWeap');
    } catch (err) {}
    if (weaponId === undefined || weaponId === null || weaponId === '')
      weaponId = record.equippedWeap;
    if (weaponId === undefined || weaponId === null || weaponId === '')
      weaponId = record.equippedweap;
    weaponId = parseInt(weaponId, 10) || 0;
    if (weaponId)
      try {
        file = new DataFile('DATA/' + (NV ? 'NV' : 'F3') + '/WEAPONS.DAT');
        entry = file.getId(weaponId);
      } catch (err2) {
      } finally {
        try {
          if (file && file.close) file.close();
        } catch (err3) {}
      }
    if (entry) {
      value = entry.txt;
      if (value !== undefined && value !== null) name = String(value);
      value = parseFloat(
        entry.dam !== undefined
          ? entry.dam
          : entry.dmg !== undefined
            ? entry.dmg
            : entry.damage,
      );
      if (!isNaN(value) && value > 0) damage = Math.floor(value);
    }
    if (name.length > 20) name = name.substr(0, 19) + '~';
    return {
      weapon: name,
      weaponId: weaponId,
      dmg: damage,
      dt: 0,
      type: weaponId ? 'GUN' : 'MELEE',
    };
  }

  function blitFile(name) {
    let handle = 0,
      buffer = 0,
      offset,
      chunk;
    try {
      handle = E.openFile(BASE + name, 'r');
      if (!handle) return 0;
      buffer = new Uint8Array(h.buffer);
      offset = buffer.length;
      chunk = handle.read(256);
      while (chunk) {
        offset -= chunk.length;
        if (offset < 0) break;
        buffer.set(chunk, offset);
        chunk = handle.read(256);
      }
      handle.close();
      buffer = 0;
      return 1;
    } catch (err) {
      try {
        if (handle) handle.close();
      } catch (err2) {}
      return 0;
    }
  }
  function drawFallbackTitle() {
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setFontAlign(0, 0);
    h.setColor(2).drawRect(34, 24, SCREEN_W - 35, SCREEN_H - 25);
    setFont(4);
    h.setColor(3).drawString('BIG IRON', SCREEN_W / 2, 78);
    setFont(1);
    h.setColor(2).drawString('PB3000 RPG', SCREEN_W / 2, 116);
  }
  function drawChoices() {
    let rows = [145, 187, 229],
      index,
      labels = ['START NEW', 'LOAD GAME', 'DEMO MODE'];
    h.setFontAlign(0, 0);
    setFont(2);
    for (index = 0; index < 3; index++) {
      h.setColor(2).drawRect(
        118,
        rows[index],
        SCREEN_W - 119,
        rows[index] + 31,
      );
      h.setColor(selected == index ? 3 : 2).drawString(
        labels[index],
        SCREEN_W / 2,
        rows[index] + 8,
      );
    }
    h.setColor(3).fillPoly([
      96,
      rows[selected] + 9,
      96,
      rows[selected] + 21,
      108,
      rows[selected] + 15,
    ]);
    setFont(1);
    h.setColor(2).drawString('WHEEL TO CHOOSE / LEFT CLICK', SCREEN_W / 2, 286);
  }
  function drawMenu() {
    if (!blitFile('MENU.BIN')) drawFallbackTitle();
    drawChoices();
    flush(0, SCREEN_H - 1);
  }
  function showMenu() {
    if (splashTimer) {
      clearTimeout(splashTimer);
      splashTimer = 0;
    }
    if (switching || active) return;
    mode = 'menu';
    selected = 0;
    drawMenu();
    music('BICT');
  }
  function start() {
    selected = 0;
    mode = 'splash';
    if (blitFile('IMAGE.BIN') || blitFile('Startg1.BIN')) {
      flush(0, SCREEN_H - 1);
      splashTimer = setTimeout(showMenu, 1300);
    } else showMenu();
  }

  function music(name) {
    let path;
    if (!name) {
      playing = 0;
      trackName = '';
      try {
        if (Pip.audioStop) Pip.audioStop();
      } catch (err) {}
      try {
        Pip.radioClipPlaying = 0;
      } catch (err2) {}
      return;
    }
    if (quitting) return;
    name = String(name);
    if (playing && trackName == name) return;
    path = BASE + name + '.wav';
    try {
      // Pip.audioStart() stops whatever is playing, so no audioStop() first (agents.md 6).
      Pip.radioClipPlaying = 1;
      Pip.audioStart(path);
      playing = 1;
      trackName = name;
    } catch (err3) {
      playing = 0;
      trackName = '';
    }
  }

  function closeIntro() {
    try {
      if (introFile && introFile.close) introFile.close();
    } catch (err) {}
    introFile = 0;
  }
  function drawIntroLine(line) {
    let parts = line.split('|'),
      top = Math.floor(SCREEN_H / 2 - (parts.length - 1) * 12),
      index;
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2)
      .drawRect(18, 18, SCREEN_W - 19, SCREEN_H - 19)
      .drawRect(24, 24, SCREEN_W - 25, SCREEN_H - 25);
    h.setFontAlign(0, 0);
    setFont(2);
    for (index = 0; index < parts.length; index++) {
      h.setColor(parts[index].charAt(0) == '*' ? 2 : 3);
      h.drawString(parts[index], SCREEN_W / 2, top + index * 24);
    }
    setFont(1);
    h.setColor(2).drawString(
      lastLine ? '' : 'LEFT CLICK',
      SCREEN_W / 2,
      SCREEN_H - 34,
    );
    flush(0, SCREEN_H - 1);
    if (lastLine) {
      closeIntro();
      if (introTimer) clearTimeout(introTimer);
      introTimer = setTimeout(fadeIntro, 1500);
    }
  }
  function readIntroLine() {
    let header, len, line;
    if (!introFile) return;
    header = introFile.read(1);
    if (!header) {
      closeIntro();
      fadeIntro();
      return;
    }
    len = header.charCodeAt(0);
    lastLine = !!(len & 128);
    len &= 127;
    line = introFile.read(len) || '';
    drawIntroLine(line);
    line = 0;
  }
  function fadeIntro() {
    if (introTimer) {
      clearTimeout(introTimer);
      introTimer = 0;
    }
    if (mode != 'intro') return;
    fadeStep++;
    h.setColor(fadeStep < 3 ? fadeStep : 0).fillRect(
      0,
      0,
      SCREEN_W - 1,
      SCREEN_H - 1,
    );
    flush(0, SCREEN_H - 1);
    if (fadeStep < 3) {
      introTimer = setTimeout(fadeIntro, 180);
      return;
    }
    fadeStep = 0;
    lastLine = 0;
    music(0);
    collect();
    route('SUNSCAR', { newGame: true }, 90);
  }
  function startIntro() {
    if (splashTimer) {
      clearTimeout(splashTimer);
      splashTimer = 0;
    }
    mode = 'intro';
    lastLine = 0;
    fadeStep = 0;
    try {
      introFile = E.openFile(BASE + 'I.BIN', 'r');
    } catch (err) {
      introFile = 0;
    }
    if (!introFile) {
      music(0);
      route('SUNSCAR', { newGame: true }, 90);
      return;
    }
    readIntroLine();
  }

  function unloadModule() {
    let old = active;
    active = 0;
    if (old) {
      try {
        if (old.remove) old.remove();
      } catch (err) {}
      old = 0;
    }
    collect();
  }
  function loadModule() {
    let name = nextModule,
      args = nextArgs,
      source = 0,
      factory = 0;
    loadTimer = 0;
    nextModule = '';
    nextArgs = 0;
    nextDelay = 0;
    try {
      source = fs.readFile(BASE + name + '.JS');
      if (!source) throw name;
      factory = eval(source);
      source = 0;
      collect();
      active = factory(API, args || {});
      factory = args = 0;
      switching = 0;
      collect();
    } catch (err) {
      source = factory = args = 0;
      switching = 0;
      drawStatus('LOAD FAILED', String(err).substr(0, 36));
    }
  }
  function detachAndLoad() {
    routeTimer = 0;
    unloadModule();
    music(0);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    flush(0, SCREEN_H - 1);
    collect();
    drawStatus('LOADING', nextModule);
    loadTimer = setTimeout(loadModule, nextDelay);
  }
  function route(name, args, delay) {
    if (switching || quitting) return;
    switching = 1;
    mode = 'load';
    nextModule = name;
    nextArgs = args || {};
    nextDelay = delay === undefined ? 80 : delay;
    if (routeTimer) clearTimeout(routeTimer);
    if (loadTimer) clearTimeout(loadTimer);
    routeTimer = loadTimer = 0;
    setQuiet(1);
    routeTimer = setTimeout(detachAndLoad, 20);
  }
  function returnToWorld(args) {
    route(
      args && args.map == 'HOTEL'
        ? 'HOTEL'
        : args && args.map == 'WORLD_03'
          ? 'DOGTOWN'
          : args && args.map == 'WORLD_02'
            ? 'CROSSING'
            : 'SUNSCAR',
      args,
      100,
    );
  }
  function toMenu() {
    if (quitting) return;
    switching = 1;
    unloadModule();
    setQuiet(0);
    switching = 0;
    showMenu();
  }

  function exitApp() {
    if (quitting) return;
    quitting = 1;
    music(0);
    setQuiet(0);
    try {
      if (active && active.save) active.save(true);
    } catch (err) {}
    try {
      Pip.CURRENT.fullscreen = false;
    } catch (err2) {}
    try {
      Pip.emit('mode', homeMode, true);
    } catch (err3) {
      try {
        Pip.changeMenu();
      } catch (err4) {
        teardown();
      }
    }
    if (exitTimer) clearTimeout(exitTimer);
    exitTimer = setTimeout(function () {
      exitTimer = 0;
      try {
        Pip.changeMenu();
      } catch (err) {}
    }, 180);
  }
  function teardown() {
    switching = 1;
    if (splashTimer) clearTimeout(splashTimer);
    if (loadTimer) clearTimeout(loadTimer);
    if (routeTimer) clearTimeout(routeTimer);
    if (exitTimer) clearTimeout(exitTimer);
    if (introTimer) clearTimeout(introTimer);
    splashTimer = loadTimer = routeTimer = exitTimer = introTimer = 0;
    closeIntro();
    unloadModule();
    music(0);
    setQuiet(0);
    try {
      Pip.removeListener('knob1', onKnob1);
    } catch (err) {}
    try {
      Pip.removeListener('knob2', onKnob2);
    } catch (err2) {}
    try {
      Pip.CURRENT.fullscreen = false;
    } catch (err3) {}
    collect();
  }
  function onKnob1(dir, held) {
    if (switching) return;
    if (active && active.k1) {
      active.k1(dir, held);
      return;
    }
    if (mode == 'intro') {
      if (dir === 0 && !held && !lastLine) {
        playUi('SELECT');
        readIntroLine();
      }
      return;
    }
    if (mode == 'menu' && dir === 0 && !held) {
      playUi('SELECT');
      if (selected == 2) {
        music(0);
        route('DEMO', {}, 70);
      } else if (selected) {
        music(0);
        route('SUNSCAR', {}, 90);
      } else {
        music(0);
        route('INTRO', {}, 70);
      }
    }
  }
  function onKnob2(dir) {
    if (switching) return;
    if (active && active.k2) {
      active.k2(dir);
      return;
    }
    if (mode == 'menu' && dir) {
      selected = (selected + (dir > 0 ? 1 : 2)) % 3;
      drawMenu();
    }
  }

  const API = {
    base: BASE,
    w: SCREEN_W,
    h: SCREEN_H,
    flip: flush,
    gc: collect,
    equip: equippedWeapon,
    music: music,
    exit: exitApp,
    world: function (arg0) {
      route(
        arg0 && arg0.map == 'HOTEL'
          ? 'HOTEL'
          : arg0 && arg0.map == 'WORLD_03'
            ? 'DOGTOWN'
            : arg0 && arg0.map == 'WORLD_02'
              ? 'CROSSING'
              : 'SUNSCAR',
        arg0,
        100,
      );
    },
    returnWorld: returnToWorld,
    bridge: function (arg0) {
      route('CROSSING', arg0, 100);
    },
    ride: function (arg0) {
      route('RACE', arg0, 65);
    },
    battle: function (arg0) {
      route('BATTLE', arg0, 80);
    },
    shop: function (arg0) {
      route('SHOP', arg0, 55);
    },
    pause: function (arg0) {
      route('PAUSE', arg0, 55);
    },
    aid: function (arg0) {
      route('AID', arg0, 40);
    },
    house: function (arg0) {
      route('INTERIOR', arg0, 65);
    },
    hotel: function (arg0) {
      route('HOTEL', arg0, 70);
    },
    workbench: function (arg0) {
      route('WORKBENCH', arg0, 45);
    },
    invCount: invCount,
    invAdd: invAdd,
    invTake: invTake,
    menu: toMenu,
  };
  try {
    Pip.CURRENT.fullscreen = true;
  } catch (err) {}
  setQuiet(0);
  try {
    Pip.onExclusive('knob1', onKnob1);
  } catch (err2) {
    try {
      Pip.on('knob1', onKnob1);
    } catch (err3) {}
  }
  try {
    Pip.onExclusive('knob2', onKnob2);
  } catch (err4) {
    try {
      Pip.on('knob2', onKnob2);
    } catch (err5) {}
  }
  start();
  return {
    id: 'BIGIRON',
    notDefault: true,
    fullscreen: true,
    remove: teardown,
  };
});
