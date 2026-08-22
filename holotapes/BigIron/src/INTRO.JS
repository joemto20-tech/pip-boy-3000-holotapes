// New-game opening. NPC walks up, delivers the briefing, player picks a starting weapon.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h;
  let npcImage = 0,
    npcX = 40,
    npcY = 160,
    npcFrame = 0,
    stage = 0,
    lineIndex = 0,
    scriptFile = 0,
    gunChoice = 0,
    gunIcons = [0, 0, 0],
    walkTimer = 0;
  const LINES_BEFORE = 4,
    LINES_TOTAL = 6;
  const GUNS = [
    { name: '10MM PISTOL', dmg: 12, icon: 'G1.IMG' },
    { name: 'SAWED-OFF SHOTGUN', dmg: 18, icon: 'G2.IMG' },
    { name: 'HUNTING RIFLE', dmg: 15, icon: 'G3.IMG' },
  ];
  function readFile(path) {
    try {
      return fs.readFile(path);
    } catch (err) {
      return 0;
    }
  }
  function writeFile(path, data) {
    try {
      fs.writeFile(path, data);
      return 1;
    } catch (err) {
      return 0;
    }
  }
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function clip(value, max) {
    value = value == null ? '' : String(value);
    return max && value.length > max ? value.substr(0, max - 1) + '~' : value;
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
      if (player && player.sync) player.sync();
    } catch (err) {}
  }
  function npcSprite() {
    let data;
    if (npcImage) return npcImage;
    data = readFile(BASE + 'RESIDENTD.BIN');
    if (data && data.length >= 289)
      npcImage = {
        width: 34,
        height: 34,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else npcImage = readFile(BASE + 'RESIDENTD.IMG') || 0;
    return npcImage;
  }
  function drawNpc() {
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    const image = npcSprite();
    if (image)
      try {
        h.setColor(3).drawImage(image, npcX, npcY);
        return;
      } catch (err) {}
    h.setColor(3).fillRect(npcX + 11, npcY + 7, npcX + 30, npcY + 37);
  }
  function walkStep() {
    npcX += 6;
    npcFrame++;
    drawNpc();
    h.flip();
    Pip.lastFlip = getTime();
    if (npcX >= SCREEN_W / 2 - 21) {
      clearInterval(walkTimer);
      walkTimer = 0;
      startSpeech();
    }
  }
  function drawSpeech(line) {
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
    h.setColor(2).drawString('LEFT CLICK', SCREEN_W / 2, SCREEN_H - 34);
    h.flip();
    Pip.lastFlip = getTime();
  }
  function closeScript() {
    try {
      if (scriptFile && scriptFile.close) scriptFile.close();
    } catch (err) {}
    scriptFile = 0;
  }
  function readNextLine() {
    let header, len, line, isLast;
    if (!scriptFile) {
      if (stage == 4) finish();
      else toGunPicker();
      return;
    }
    header = scriptFile.read(1);
    if (!header) {
      closeScript();
      if (stage == 4) finish();
      else toGunPicker();
      return;
    }
    len = header.charCodeAt(0);
    isLast = !!(len & 128);
    len &= 127;
    line = scriptFile.read(len) || '';
    lineIndex++;
    drawSpeech(line);
    line = 0;
    if (isLast) closeScript();
  }
  function advance() {
    if (stage == 2 && lineIndex >= LINES_BEFORE) {
      toGunPicker();
      return;
    }
    if (stage == 4 && lineIndex >= LINES_TOTAL) {
      finish();
      return;
    }
    readNextLine();
  }
  function startSpeech() {
    scriptFile = 0;
    try {
      scriptFile = E.openFile(BASE + 'Q.BIN', 'r');
    } catch (err) {
      scriptFile = 0;
    }
    lineIndex = 0;
    stage = 2;
    readNextLine();
  }
  function loadGunIcons() {
    let index;
    for (index = 0; index < 3; index++)
      gunIcons[index] = readFile(BASE + GUNS[index].icon) || 0;
  }
  function drawGunCard(index, atX, atY, chosen) {
    const image = gunIcons[index];
    h.setColor(chosen ? 3 : 2).drawRect(atX, atY, atX + 94, atY + 118);
    if (image) {
      try {
        h.setColor(3).drawImage(image, atX + 23, atY + 6);
      } catch (err) {}
    } else h.setColor(2).drawRect(atX + 23, atY + 6, atX + 70, atY + 53);
    h.setFontAlign(0, -1);
    setFont(1);
    h.setColor(chosen ? 3 : 2).drawString(
      clip(GUNS[index].name, 15),
      atX + 47,
      atY + 62,
    );
    h.drawString('DMG ' + GUNS[index].dmg, atX + 47, atY + 78);
  }
  function drawGunPicker() {
    let index;
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(3).drawString('CHOOSE YOUR WEAPON', SCREEN_W / 2, 40);
    for (index = 0; index < 3; index++)
      drawGunCard(index, 20 + index * 152, 90, index == gunChoice);
    setFont(1);
    h.setColor(2).drawString('ENEMIES SCALE TO YOUR WEAPON', SCREEN_W / 2, 272);
    h.drawString('WHEEL TO CHOOSE / CLICK TO TAKE', SCREEN_W / 2, 292);
    h.flip();
    Pip.lastFlip = getTime();
  }
  function toGunPicker() {
    stage = 3;
    gunIcons = [0, 0, 0];
    loadGunIcons();
    gunChoice = 0;
    drawGunPicker();
  }
  function moveGunCursor(dir) {
    gunChoice = (gunChoice + (dir < 0 ? -1 : 1) + 3) % 3;
    drawGunPicker();
  }
  function confirmGun() {
    stage = 4;
    readNextLine();
  }
  function finish() {
    const record = playerRecord(),
      gun = GUNS[gunChoice],
      state = {
        map: 'WORLD_01',
        mode: 'image',
        x: 704,
        y: 255,
        facing: 'down',
        cleared: {},
        story: {
          rounds: {},
          encounters: 0,
          deadLead: 0,
          weapon: { name: gun.name, dmg: gun.dmg, icon: gun.icon },
          weaponChosen: 1,
          loadoutChosen: 1,
        },
      };
    try {
      record.wb = state;
      syncPlayer();
    } catch (err) {}
    writeFile(BASE + 'SAV.JSON', JSON.stringify(state));
    gunIcons = 0;
    npcImage = 0;
    closeScript();
    if (api.world)
      api.world({
        x: 704,
        y: 255,
        facing: 'down',
        msg: 'FIND SOLOMON RAY IN TOWN HALL',
      });
  }
  function onKnob1(dir, held) {
    if (dir !== 0 || held || !stage) return;
    if (stage == 2 || stage == 4) {
      advance();
      return;
    }
    if (stage == 3) confirmGun();
  }
  function onKnob2(dir) {
    if (!dir || stage != 3) return;
    moveGunCursor(dir);
  }
  if (api.music) api.music(0);
  drawNpc();
  h.flip();
  Pip.lastFlip = getTime();
  walkTimer = setInterval(walkStep, 60);
  return {
    k1: onKnob1,
    k2: onKnob2,
    remove: function () {
      if (walkTimer) clearInterval(walkTimer);
      walkTimer = 0;
      closeScript();
    },
  };
});
