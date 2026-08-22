// Low-memory aid screen. Reads and spends the Pip-Boy native Stimpak inventory.
(function (api, args) {
  let SCREEN_W = api.w,
    SCREEN_H = api.h,
    STIMPAK_ID = 86377,
    stimpaks = 0,
    selected = 0,
    message = '',
    stopped = 0;
  const CONDITIONS = [
    'perceptioncondition',
    'endurancecondition',
    'leftattackcondition',
    'rightattackcondition',
    'rightmobilitycondition',
    'leftmobilitycondition',
  ];
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }
  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (err) {
      return {};
    }
  }
  function level() {
    const value = parseInt(playerRecord().level, 10) || 1;
    return clamp(value, 1, typeof NV != 'undefined' && NV ? 50 : 30);
  }
  function maxHp() {
    return Math.max(
      60,
      70 + (parseInt(playerRecord().endurance, 10) || 5) * 10 + level() * 5,
    );
  }
  function readHp() {
    let record = playerRecord(),
      max = maxHp(),
      index,
      value,
      sum = 0;
    for (index = 0; index < 6; index++) {
      value = parseFloat(record[CONDITIONS[index]]);
      sum += isNaN(value) ? 100 : clamp(value, 0, 100);
    }
    return [Math.round(clamp(sum / 600, 0, 1) * max), max];
  }
  function syncPlayer() {
    try {
      player.modified = true;
      if (player.sync) player.sync();
    } catch (err) {}
  }
  function useStimpak() {
    let hp = readHp(),
      record = playerRecord(),
      index,
      value,
      scaled;
    if (hp[0] >= hp[1]) {
      message = 'HP ALREADY FULL';
      return;
    }
    if (stimpaks < 1) {
      message = 'NO STIMPAKS';
      return;
    }
    if (!api.invTake || !api.invTake('AID', STIMPAK_ID, 1)) {
      stimpaks = api.invCount ? api.invCount('AID', STIMPAK_ID) : 0;
      message = 'STIMPAK INVENTORY CHANGED';
      return;
    }
    stimpaks--;
    scaled = (Math.max(25, Math.round(hp[1] * 0.35)) * 100) / hp[1];
    for (index = 0; index < 6; index++) {
      value = parseFloat(record[CONDITIONS[index]]);
      if (isNaN(value)) value = 100;
      record[CONDITIONS[index]] = clamp(Math.round(value + scaled), 0, 100);
    }
    syncPlayer();
    message = 'HEALED 35% - ' + stimpaks + ' LEFT';
  }
  function drawAll() {
    let hp = readHp(),
      rows = [166, 210],
      index,
      labels = ['USE STIMPAK', 'RETURN TO GAME'];
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2)
      .drawRect(18, 18, SCREEN_W - 19, SCREEN_H - 19)
      .drawRect(24, 24, SCREEN_W - 25, SCREEN_H - 25);
    h.setFontAlign(0, 0);
    setFont(3);
    h.setColor(3).drawString('AID / STIMPAKS', SCREEN_W / 2, 57);
    setFont(2);
    h.setColor(2).drawString(
      'NATIVE INVENTORY  x' + stimpaks,
      SCREEN_W / 2,
      96,
    );
    h.setColor(3).drawString('HP ' + hp[0] + ' / ' + hp[1], SCREEN_W / 2, 126);
    for (index = 0; index < 2; index++) {
      h.setColor(2).drawRect(96, rows[index], SCREEN_W - 97, rows[index] + 31);
      h.setColor(index == selected ? 3 : 2).drawString(
        (index == selected ? '> ' : '') + labels[index],
        SCREEN_W / 2,
        rows[index] + 9,
      );
    }
    setFont(1);
    h.setColor(2).drawString(
      message || 'STIMPAKS ARE SHARED WITH PIP-BOY AID',
      SCREEN_W / 2,
      274,
    );
    h.flip();
    try {
      Pip.lastFlip = getTime();
    } catch (err) {}
  }
  function resume() {
    if (stopped) return;
    stopped = 1;
    api.world({
      map: args.map || 'WORLD_01',
      mode: args.mode || 'image',
      room: args.room,
      x: args.x,
      y: args.y,
      facing: args.facing,
      returnX: args.returnX,
      returnY: args.returnY,
      returnFacing: args.returnFacing,
      msg: message || args.msg || '',
    });
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (dir === 0 && !held) {
      if (selected) {
        resume();
        return;
      }
      useStimpak();
      drawAll();
    }
  }
  function onKnob2(dir) {
    if (stopped || !dir) return;
    selected = selected ? 0 : 1;
    message = '';
    drawAll();
  }
  function teardown() {
    stopped = 1;
    args = 0;
  }
  stimpaks = api.invCount ? api.invCount('AID', STIMPAK_ID) : 0;
  drawAll();
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
