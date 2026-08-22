// Crafting screen. Scorched Rounds and Psycho from Dead Man's Lead.
(function (api, args) {
  args = args || {};
  let BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    selected = 0,
    message = '',
    stopped = 0,
    state = 0,
    story = 0,
    LEAD_PER_ROUND = 2,
    LEAD_PER_PSYCHO = 1;
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function readFile(path) {
    try {
      return fs.readFile(path);
    } catch (err) {
      return 0;
    }
  }
  function writeFile(path, data) {
    try {
      if (fs.writeFileSync) {
        fs.writeFileSync(path, data);
        return 1;
      }
    } catch (err) {}
    try {
      if (fs.writeFile) {
        fs.writeFile(path, data);
        return 1;
      }
    } catch (err2) {}
    return 0;
  }
  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (err) {
      return {};
    }
  }
  function syncPlayer() {
    try {
      player.modified = true;
      if (player.sync) player.sync();
    } catch (err) {}
  }
  function loadSave() {
    const point = playerRecord();
    if (point.wb) return point.wb;
    try {
      return JSON.parse(readFile(BASE + 'SAV.JSON') || '{}') || {};
    } catch (err) {
      return {};
    }
  }
  function saveState() {
    const point = playerRecord();
    state.story = story;
    try {
      point.wb = state;
      syncPlayer();
    } catch (err) {}
    writeFile(BASE + 'SAV.JSON', JSON.stringify(state));
  }
  function hasPrototype() {
    return !!(story.solomonDefeated || (story.rounds && story.rounds.SCORCHED));
  }
  function partCount() {
    return (
      (story.dogCases || story.dogQuest == 2 ? 1 : 0) +
      (story.hotelLead ? 1 : 0) +
      (story.hotelPowder ? 1 : 0) +
      (story.hotelPrimers ? 1 : 0) +
      (story.hotelSalt ? 1 : 0)
    );
  }
  function roundCount() {
    let count = parseInt(story.scorchRounds, 10);
    if (isNaN(count)) count = hasPrototype() ? 1 : 0;
    if (story.ammoCrafted && count < 6) count = 6;
    return Math.max(0, Math.min(6, count));
  }
  function leadCount() {
    return Math.max(0, parseInt(story.deadLead, 10) || 0);
  }
  function psychoCount() {
    const count = story.psycho === undefined ? story.hotLoads : story.psycho;
    return Math.max(0, Math.min(3, parseInt(count, 10) || 0));
  }
  function maxCraftable() {
    return Math.max(
      0,
      Math.min(6 - roundCount(), Math.floor(leadCount() / LEAD_PER_ROUND)),
    );
  }
  function drawRow(index, atY, name, detail) {
    if (index == selected) {
      h.setColor(2).fillRect(38, atY - 4, SCREEN_W - 39, atY + 20);
      h.setColor(0);
    } else h.setColor(3);
    h.setFontAlign(-1, -1);
    h.drawString((index == selected ? '> ' : '  ') + name, 52, atY);
    h.setFontAlign(1, -1);
    h.drawString(detail, SCREEN_W - 52, atY);
  }
  function drawAll() {
    const rounds = roundCount(),
      lead = leadCount(),
      psycho = psychoCount(),
      maxRounds = maxCraftable();
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2)
      .drawRect(14, 14, SCREEN_W - 15, SCREEN_H - 15)
      .drawRect(20, 20, SCREEN_W - 21, SCREEN_H - 21);
    h.setFontAlign(0, -1);
    setFont(2);
    h.setColor(3).drawString('BIG IRON WORKBENCH', SCREEN_W / 2, 32);
    setFont(1);
    h.setColor(2).drawString(
      'SCORCH ' +
        rounds +
        '/6   DEAD LEAD ' +
        lead +
        '   PSYCHO ' +
        psycho +
        '/3',
      SCREEN_W / 2,
      64,
    );
    h.drawString(
      hasPrototype()
        ? partCount() >= 5
          ? 'SCORCH RECIPE READY'
          : 'RECIPE PARTS ' + partCount() + '/5'
        : "NEED SOLOMON'S PROTOTYPE",
      SCREEN_W / 2,
      86,
    );
    drawRow(0, 122, 'CRAFT 1 SCORCHED ROUND', '2 LEAD');
    drawRow(1, 158, 'CRAFT MAX ROUNDS', 'x' + maxRounds);
    drawRow(2, 194, 'CRAFT 1 PSYCHO', '1 LEAD');
    drawRow(3, 230, 'LEAVE WORKBENCH', '');
    h.setFontAlign(0, -1);
    h.setColor(2).drawString(
      message || 'WHEEL TO CHOOSE / LEFT CLICK',
      SCREEN_W / 2,
      278,
    );
    api.flip();
  }
  function applyRounds(made) {
    story.scorchRounds = roundCount() + made;
    story.ammoCrafted = story.scorchRounds >= 6 ? 1 : 0;
    story.forgeReady = hasPrototype() && partCount() >= 5 ? 1 : 0;
    if (story.scorchRounds > 1) {
      story.rounds = story.rounds || {};
      story.rounds.COURIER = 1;
    }
  }
  function craftRounds(takeMax) {
    let made;
    if (!hasPrototype()) {
      message = "SOLOMON'S PROTOTYPE REQUIRED";
      drawAll();
      return;
    }
    if (partCount() < 5) {
      message = 'MISSING RECIPE PARTS ' + partCount() + '/5';
      drawAll();
      return;
    }
    if (roundCount() >= 6) {
      message = 'ALL SIX ROUNDS ARE READY';
      drawAll();
      return;
    }
    made = takeMax ? maxCraftable() : Math.min(1, maxCraftable());
    if (made < 1) {
      message = "NEED 2 DEAD MAN'S LEAD";
      drawAll();
      return;
    }
    story.deadLead = leadCount() - made * LEAD_PER_ROUND;
    applyRounds(made);
    saveState();
    message =
      made == 1
        ? 'CRAFTED 1 SCORCHED ROUND'
        : 'CRAFTED ' + made + ' SCORCHED ROUNDS';
    drawAll();
  }
  function craftPsycho() {
    const count = psychoCount();
    if (count >= 3) {
      message = 'PSYCHO CARRY LIMIT IS 3';
      drawAll();
      return;
    }
    if (leadCount() < LEAD_PER_PSYCHO) {
      message = "NEED 1 DEAD MAN'S LEAD";
      drawAll();
      return;
    }
    story.deadLead = leadCount() - LEAD_PER_PSYCHO;
    story.psycho = count + 1;
    saveState();
    message = 'CRAFTED 1 PSYCHO - ' + psychoCount() + '/3';
    drawAll();
  }
  function leaveBench() {
    if (stopped) return;
    stopped = 1;
    saveState();
    if (args.returnModule == 'HOTEL')
      api.hotel({
        map: 'HOTEL',
        mode: 'room',
        room: args.room,
        x: args.x,
        y: args.y,
        facing: args.facing,
        returnX: args.returnX,
        returnY: args.returnY,
        returnFacing: args.returnFacing,
        msg: 'LEFT WORKBENCH',
      });
    else
      api.house({
        interiorId: args.interiorId || 'CRATER_MOTEL',
        map: args.map,
        mode: args.mode,
        x: args.x,
        y: args.y,
        facing: args.facing,
        roomX: args.roomX,
        roomY: args.roomY,
        roomFacing: args.roomFacing,
        msg: 'LEFT WORKBENCH',
      });
  }
  function choose() {
    if (selected == 0) craftRounds(0);
    else if (selected == 1) craftRounds(1);
    else if (selected == 2) craftPsycho();
    else leaveBench();
  }
  function moveCursor(value) {
    if (!value || stopped) return;
    selected = (selected + (value > 0 ? 1 : 3)) % 4;
    message = '';
    drawAll();
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (dir === 0 && !held) choose();
    else moveCursor(dir);
  }
  function onKnob2(dir) {
    moveCursor(dir);
  }
  function teardown() {
    stopped = 1;
    state = story = 0;
  }
  state = loadSave();
  state.story = state.story || {};
  story = state.story;
  story.rounds = story.rounds || {};
  if (story.psycho === undefined)
    story.psycho = story.hotLoads === undefined ? 0 : story.hotLoads;
  saveState();
  drawAll();
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
