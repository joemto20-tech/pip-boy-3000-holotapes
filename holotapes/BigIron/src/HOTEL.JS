// Big Iron Hotel. Six-room lobby hub, part collection, workbench, Iron Warden penthouse.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    FOOTER_Y = 296,
    WALK_STEP = 6,
    FRAME_MS = 40,
    CLICK_MS = 280;
  let state = 0,
    story = 0,
    room = 0,
    playerX = 223,
    playerY = 232,
    facing = 'up',
    playerImage = 0,
    playerKey = '',
    playerFrame = 1,
    queueX = 0,
    queueY = 0,
    frameTimer = 0,
    clickTimer = 0,
    stopped = 0,
    message = 'BIG IRON HOTEL',
    mapFile = 0,
    bgRoom = -1;
  const ROOM_NAMES = [
    'MAIN LOBBY',
    'KITCHEN',
    'LAUNDRY',
    'BOILER ROOM',
    'AMMO WORKSHOP',
    'PENTHOUSE',
  ];
  const PART_KEYS = ['hotelLead', 'hotelPowder', 'hotelPrimers', 'hotelSalt'],
    PART_LABELS = [
      'MOLTEN LEAD',
      'BLACK POWDER',
      'PRIMER STRIP',
      'SCORCH SALTS',
    ];
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
  function syncPlayer() {
    try {
      player.modified = true;
      if (player.sync) player.sync();
    } catch (err) {}
  }
  function loadSave() {
    let point = playerRecord(),
      record = 0;
    if (point.wb) return point.wb;
    try {
      record = JSON.parse(readFile(BASE + 'SAV.JSON') || '{}') || {};
    } catch (err) {
      record = {};
    }
    return record;
  }
  function storyData() {
    state.story = state.story || {};
    state.story.rounds = state.story.rounds || {};
    return state.story;
  }
  function saveState() {
    let record = playerRecord(),
      json;
    state.cleared = state.cleared || {};
    story = storyData();
    story.hotelRoom = room;
    story.hotelReturnX =
      story.hotelReturnX === undefined
        ? parseInt(args.returnX, 10) || 815
        : story.hotelReturnX;
    story.hotelReturnY =
      story.hotelReturnY === undefined
        ? parseInt(args.returnY, 10) || 263
        : story.hotelReturnY;
    story.hotelReturnFacing =
      story.hotelReturnFacing || args.returnFacing || 'down';
    state.map = 'HOTEL';
    state.mode = 'room';
    state.room = room;
    state.x = playerX;
    state.y = playerY;
    state.facing = facing;
    try {
      record.wb = state;
      syncPlayer();
    } catch (err) {}
    json = JSON.stringify(state);
    writeFile(BASE + 'SAV.JSON', json);
    return 1;
  }
  function isCleared(key) {
    return !!(state.cleared && state.cleared[key]);
  }
  function hasPrototype() {
    return !!(story.solomonDefeated || (story.rounds && story.rounds.SCORCHED));
  }
  function hasCasings() {
    return !!(story.dogCases || story.dogQuest == 2);
  }
  function partCount() {
    return (
      (hasCasings() ? 1 : 0) +
      (story.hotelLead ? 1 : 0) +
      (story.hotelPowder ? 1 : 0) +
      (story.hotelPrimers ? 1 : 0) +
      (story.hotelSalt ? 1 : 0)
    );
  }
  function leadCount() {
    return Math.max(0, parseInt(story.deadLead, 10) || 0);
  }
  function psychoCount() {
    const value = story.psycho === undefined ? story.hotLoads : story.psycho;
    return Math.max(0, Math.min(3, parseInt(value, 10) || 0));
  }
  function roundCount() {
    let value = parseInt(story.scorchRounds, 10);
    if (isNaN(value)) value = hasPrototype() ? 1 : 0;
    if (story.ammoCrafted && value < 6) value = 6;
    return Math.max(0, Math.min(6, value));
  }
  function closeRoomArt() {
    try {
      if (mapFile && mapFile.close) mapFile.close();
    } catch (err) {}
    mapFile = 0;
    bgRoom = -1;
  }
  function openRoomArt() {
    if (mapFile && bgRoom == room) return 1;
    closeRoomArt();
    try {
      mapFile = E.openFile(BASE + 'HR' + room + '.BIN', 'r');
      bgRoom = room;
    } catch (err) {
      mapFile = 0;
      bgRoom = -1;
    }
    return !!mapFile;
  }
  function drawRoomArt() {
    let buffer,
      remaining = FOOTER_Y * 120,
      offset = 0,
      take,
      chunk;
    if (!openRoomArt()) return 0;
    try {
      mapFile.seek(0);
      buffer = new Uint8Array(h.buffer);
      remaining = FOOTER_Y * 120;
      while (remaining > 0) {
        take = remaining > 512 ? 512 : remaining;
        chunk = mapFile.read(take);
        if (!chunk) break;
        buffer.set(chunk, offset);
        offset += chunk.length;
        remaining -= chunk.length;
      }
      buffer = 0;
      return remaining <= 0;
    } catch (err) {
      buffer = 0;
      return 0;
    }
  }
  function restoreRows(fromY, toY) {
    let top = Math.max(0, Math.min(fromY, toY) - 12),
      bottom = Math.min(FOOTER_Y, Math.max(fromY, toY) + 52),
      buffer,
      remaining,
      offset,
      take,
      chunk;
    if (!openRoomArt()) return 0;
    try {
      remaining = (bottom - top) * 120;
      offset = top * 120;
      mapFile.seek(offset);
      buffer = new Uint8Array(h.buffer);
      while (remaining > 0) {
        take = remaining > 512 ? 512 : remaining;
        chunk = mapFile.read(take);
        if (!chunk) break;
        buffer.set(chunk, offset);
        offset += chunk.length;
        remaining -= chunk.length;
      }
      buffer = 0;
      return remaining <= 0;
    } catch (err) {
      buffer = 0;
      return 0;
    }
  }
  function playerSprite() {
    let data,
      dir =
        facing == 'down'
          ? 'D'
          : facing == 'left'
            ? 'L'
            : facing == 'right'
              ? 'R'
              : 'U',
      key = (room ? 'IP' : 'P') + dir;
    if (playerKey == key) return playerImage;
    playerImage = 0;
    playerKey = key;
    data = readFile(BASE + key + '.BIN');
    if (room && data && data.length >= 1587)
      playerImage = {
        width: 46,
        height: 46,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else if (data && data.length >= 1323)
      playerImage = {
        width: 42,
        height: 42,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else if (data && data.length >= 867)
      playerImage = {
        width: 34,
        height: 34,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else playerImage = readFile(BASE + key + '.IMG') || 0;
    return playerImage;
  }
  function drawPlayer() {
    const image = playerSprite(),
      entry = room ? 6 : 4,
      y = room ? 10 : 8;
    if (image)
      try {
        h.setColor(3).drawImage(image, playerX - entry, playerY - y, {
          frame: playerFrame % 3,
        });
        return;
      } catch (err) {}
    h.setColor(3).drawRect(
      playerX + 7,
      playerY - 1,
      playerX + 26,
      playerY + 29,
    );
  }
  function roomEnemy() {
    if (room == 0 && !isCleared('h0'))
      return {
        enemy: 'RAIDER',
        key: 'h0',
        x: 224,
        y: 116,
        name: 'LOBBY ENFORCER',
      };
    if (room == 2 && !isCleared('h1'))
      return {
        enemy: 'RADSCORPION',
        key: 'h1',
        x: 224,
        y: 120,
        name: 'NEST GUARD',
      };
    if (room == 3 && !isCleared('h2'))
      return {
        enemy: 'RAIDER',
        key: 'h2',
        x: 224,
        y: 116,
        name: 'BOILER RAIDER',
      };
    if (room == 5 && !story.finalBossDefeated)
      return {
        enemy: 'IRON_WARDEN',
        key: 'hotelBoss',
        x: 214,
        y: 96,
        name: 'IRON WARDEN',
        finalBoss: 1,
      };
    return 0;
  }
  function roomPartIndex() {
    return room < 4 ? room : -1;
  }
  function partPresent() {
    const index = roomPartIndex();
    return index >= 0 && !story[PART_KEYS[index]];
  }
  function partPos() {
    if (room == 0) return [102, 176];
    if (room == 1) return [344, 118];
    if (room == 2) return [96, 112];
    return [354, 180];
  }
  function overlaps(fromX, fromY, boxX, boxY, boxW, boxH) {
    const left = fromX + 9,
      right = fromX + 25,
      bottom = fromY + 25,
      lower = fromY + 33;
    return (
      right >= boxX &&
      left < boxX + boxW &&
      lower >= boxY &&
      bottom < boxY + boxH
    );
  }
  function hitsFurniture(atX, atY) {
    if (room == 0)
      return (
        overlaps(atX, atY, 18, 102, 46, 18) ||
        overlaps(atX, atY, 18, 176, 46, 22) ||
        overlaps(atX, atY, 418, 106, 44, 80) ||
        overlaps(atX, atY, 30, 198, 414, 46) ||
        overlaps(atX, atY, 18, 18, 66, 76) ||
        overlaps(atX, atY, 116, 18, 54, 76) ||
        overlaps(atX, atY, 210, 18, 50, 76) ||
        overlaps(atX, atY, 300, 18, 55, 76) ||
        overlaps(atX, atY, 397, 18, 65, 76)
      );
    if (room == 1)
      return (
        overlaps(atX, atY, 48, 46, 68, 72) ||
        overlaps(atX, atY, 48, 132, 50, 86) ||
        overlaps(atX, atY, 188, 44, 58, 80) ||
        overlaps(atX, atY, 278, 48, 96, 62) ||
        overlaps(atX, atY, 344, 126, 28, 30) ||
        overlaps(atX, atY, 364, 112, 62, 108)
      );
    if (room == 2)
      return (
        overlaps(atX, atY, 48, 46, 68, 72) ||
        overlaps(atX, atY, 48, 126, 54, 102) ||
        overlaps(atX, atY, 118, 44, 58, 60) ||
        overlaps(atX, atY, 206, 48, 128, 60) ||
        overlaps(atX, atY, 306, 84, 118, 52) ||
        overlaps(atX, atY, 82, 178, 92, 48) ||
        overlaps(atX, atY, 316, 198, 98, 36) ||
        overlaps(atX, atY, 402, 148, 28, 90)
      );
    if (room == 3)
      return (
        overlaps(atX, atY, 70, 44, 132, 42) ||
        overlaps(atX, atY, 244, 44, 102, 42) ||
        overlaps(atX, atY, 48, 144, 88, 82) ||
        overlaps(atX, atY, 180, 122, 104, 80) ||
        overlaps(atX, atY, 334, 106, 92, 124)
      );
    if (room == 4)
      return (
        overlaps(atX, atY, 50, 46, 66, 72) ||
        overlaps(atX, atY, 132, 48, 54, 62) ||
        overlaps(atX, atY, 230, 48, 120, 58) ||
        overlaps(atX, atY, 326, 108, 96, 52) ||
        overlaps(atX, atY, 48, 140, 30, 84) ||
        overlaps(atX, atY, 72, 162, 108, 58) ||
        overlaps(atX, atY, 278, 182, 142, 48)
      );
    if (room == 5)
      return (
        overlaps(atX, atY, 50, 46, 66, 72) ||
        overlaps(atX, atY, 132, 48, 54, 62) ||
        overlaps(atX, atY, 250, 50, 94, 50) ||
        overlaps(atX, atY, 318, 92, 108, 50) ||
        overlaps(atX, atY, 48, 138, 122, 84) ||
        overlaps(atX, atY, 300, 146, 24, 24) ||
        overlaps(atX, atY, 344, 176, 88, 64)
      );
    return 0;
  }
  function blocked(atX, atY) {
    const foe = roomEnemy(),
      southDoor = room && atX + 17 >= 205 && atX + 17 <= 275,
      westDoor = room == 0 && atY + 30 >= 118 && atY + 30 <= 176;
    if (atX < 18 && !westDoor) return 1;
    if (atX + 34 > 462) return 1;
    if (atY < 18) return 1;
    if (atY + 34 > 278 && !southDoor) return 1;
    if (hitsFurniture(atX, atY)) return 1;
    if (foe && overlaps(atX, atY, foe.x, foe.y, 40, 44)) return 1;
    return 0;
  }
  function withinReach(atX, atY, reachX, reachY) {
    return (
      Math.abs(playerX + 17 - atX) <= reachX &&
      Math.abs(playerY + 30 - atY) <= reachY
    );
  }
  function lobbyDoorX(roomIndex) {
    return roomIndex == 1
      ? 100
      : roomIndex == 2
        ? 190
        : roomIndex == 3
          ? 280
          : 375;
  }
  function enterRoom(roomIndex) {
    if (!isCleared('h0')) {
      message = 'THE ENFORCER BLOCKS THE HOTEL DOORS';
      drawAll();
      return;
    }
    if (roomIndex == 5 && roundCount() < 6) {
      message = 'PENTHOUSE LOCKED - SCORCH ROUNDS ' + roundCount() + '/6';
      drawAll();
      return;
    }
    room = roomIndex;
    playerX = 223;
    playerY = 232;
    facing = 'up';
    queueX = queueY = 0;
    playerFrame = 1;
    playerImage = 0;
    playerKey = '';
    closeRoomArt();
    message = ROOM_NAMES[room];
    saveState();
    drawAll();
  }
  function returnToLobby() {
    const from = room;
    room = 0;
    if (from == 5) {
      playerX = 380;
      playerY = 126;
      facing = 'left';
    } else {
      playerX = lobbyDoorX(from) - 17;
      playerY = 104;
      facing = 'down';
    }
    queueX = queueY = 0;
    playerFrame = 1;
    playerImage = 0;
    playerKey = '';
    closeRoomArt();
    message = 'MAIN LOBBY';
    saveState();
    drawAll();
  }
  function stepBy(moveX, moveY) {
    const oldX = playerX,
      oldY = playerY,
      nextX = playerX + moveX,
      nextY = playerY + moveY;
    if (stopped) return;
    if (moveX < 0) facing = 'left';
    else if (moveX > 0) facing = 'right';
    else if (moveY < 0) facing = 'up';
    else facing = 'down';
    if (
      room == 0 &&
      moveX < 0 &&
      nextX < 18 &&
      nextY + 30 >= 118 &&
      nextY + 30 <= 176
    ) {
      leaveHotel();
      return;
    }
    if (
      room > 0 &&
      moveY > 0 &&
      nextY + 34 > 278 &&
      nextX + 17 >= 205 &&
      nextX + 17 <= 275
    ) {
      returnToLobby();
      return;
    }
    if (!blocked(nextX, nextY)) {
      playerX = nextX;
      playerY = nextY;
      playerFrame = (playerFrame + 1) % 3;
      message = '';
    } else playerFrame = 1;
    if (!restoreRows(oldY, playerY)) {
      drawAll();
      return;
    }
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(3).drawString(
      'BIG IRON HOTEL - ' + ROOM_NAMES[room],
      SCREEN_W / 2,
      22,
    );
    drawPart();
    drawEnemy();
    drawPlayer();
    drawFooter();
  }
  function queueMove(moveX, moveY) {
    const cap = WALK_STEP * 4;
    if (stopped) return;
    if (moveX) {
      queueX += moveX < 0 ? -WALK_STEP : WALK_STEP;
      if (queueX > cap) queueX = cap;
      if (queueX < -cap) queueX = -cap;
      queueY = 0;
    } else {
      queueY += moveY < 0 ? -WALK_STEP : WALK_STEP;
      if (queueY > cap) queueY = cap;
      if (queueY < -cap) queueY = -cap;
      queueX = 0;
    }
  }
  function drawFloor() {
    let atX, atY;
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, FOOTER_Y - 1);
    for (atY = 28; atY < 270; atY += 24)
      for (atX = 24; atX < 456; atX += 24) {
        h.setColor(((atX + atY) / 24) & 1 ? 1 : 0).fillRect(
          atX,
          atY,
          atX + 22,
          atY + 22,
        );
      }
    h.setColor(2)
      .fillRect(0, 0, SCREEN_W - 1, 18)
      .fillRect(0, 278, SCREEN_W - 1, FOOTER_Y - 1)
      .fillRect(0, 0, 18, FOOTER_Y - 1)
      .fillRect(462, 0, SCREEN_W - 1, FOOTER_Y - 1);
    h.setColor(0).fillRect(205, 0, 275, 20);
    h.fillRect(205, 276, 275, FOOTER_Y - 1);
    h.setColor(3).drawLine(205, 18, 275, 18);
    h.drawLine(205, 278, 275, 278);
  }
  function drawRoomShapes() {
    h.setColor(2);
    if (room == 0) {
      h.drawRect(66, 72, 216, 124);
      h.drawRect(310, 72, 406, 120);
      h.drawRect(306, 196, 416, 234);
      h.setFontAlign(0, 0);
      setFont(1);
      h.drawString('DESK', 141, 98);
      h.drawString('REGISTER', 358, 94);
    } else if (room == 1) {
      h.drawRect(50, 72, 160, 126);
      h.drawRect(188, 130, 296, 188);
      h.drawRect(326, 60, 430, 118);
      h.drawString('STOVE', 105, 98);
      h.drawString('TABLE', 242, 158);
    } else if (room == 2) {
      h.drawCircle(107, 187, 22);
      h.drawCircle(373, 187, 22);
      h.drawRect(180, 66, 300, 112);
      h.drawString('WASH', 240, 88);
    } else if (room == 3) {
      h.drawRect(50, 68, 132, 184);
      h.drawRect(348, 68, 430, 184);
      h.drawRect(180, 172, 300, 214);
      h.drawString('BOILER', 91, 126);
      h.drawString('BOILER', 389, 126);
    } else if (room == 4) {
      h.drawRect(72, 76, 214, 128);
      h.drawRect(266, 76, 408, 128);
      h.drawRect(154, 166, 326, 220);
      h.setColor(3).drawString('WORKBENCH', 240, 186);
      h.setColor(2).drawString(
        'ROUNDS ' + roundCount() + '/6  LEAD ' + leadCount(),
        240,
        202,
      );
      h.drawString('PSYCHO ' + psychoCount() + '/3', 240, 214);
    } else {
      h.drawRect(54, 66, 148, 122);
      h.drawRect(332, 66, 426, 122);
      h.drawRect(70, 194, 188, 230);
      h.drawRect(292, 194, 410, 230);
      h.setColor(3);
      setFont(2);
      h.drawString(
        story.finalBossDefeated ? 'WARDEN DEFEATED' : 'PENTHOUSE',
        240,
        44,
      );
    }
  }
  function drawEnemy() {
    let count = roomEnemy(),
      x,
      y;
    if (!count) return;
    x = count.x;
    y = count.y;
    if (count.enemy == 'RADSCORPION') {
      h.setColor(2).fillRect(x + 5, y + 14, x + 34, y + 28);
      h.setColor(3).drawLine(x + 5, y + 16, x - 2, y + 7);
      h.drawLine(x + 34, y + 16, x + 41, y + 7);
      h.drawLine(x + 18, y + 14, x + 26, y + 2);
      h.drawLine(x + 26, y + 2, x + 38, y + 6);
    } else {
      h.setColor(count.finalBoss ? 3 : 2).fillRect(
        x + 10,
        y + 4,
        x + 29,
        y + 22,
      );
      h.drawLine(x + 19, y + 22, x + 19, y + 42);
      h.drawLine(x + 4, y + 28, x + 35, y + 28);
      h.drawLine(x + 19, y + 42, x + 7, y + 51);
      h.drawLine(x + 19, y + 42, x + 31, y + 51);
      if (count.finalBoss) {
        h.drawRect(x + 3, y + 1, x + 36, y + 54);
        h.drawLine(x - 5, y + 12, x + 44, y + 12);
      }
    }
  }
  function drawPart() {
    let point, index;
    if (!partPresent()) return;
    point = partPos();
    index = roomPartIndex();
    h.setColor(3).drawRect(point[0], point[1], point[0] + 28, point[1] + 18);
    h.drawLine(point[0] + 5, point[1] + 5, point[0] + 23, point[1] + 5);
    h.drawLine(point[0] + 5, point[1] + 12, point[0] + 23, point[1] + 12);
    h.setColor(2);
    setFont(1);
    h.setFontAlign(0, -1);
    h.drawString(clip(PART_LABELS[index], 16), point[0] + 14, point[1] + 22);
  }
  function findAction() {
    let foe = roomEnemy(),
      pos;
    if (foe && withinReach(foe.x + 20, foe.y + 30, 58, 54)) return 1;
    if (partPresent()) {
      pos = partPos();
      if (withinReach(pos[0] + 14, pos[1] + 10, 44, 38)) return 2;
    }
    if (room == 4 && withinReach(240, 194, 105, 62)) return 3;
    if (room == 0) {
      if (withinReach(100, 72, 28, 34)) return 10;
      if (withinReach(190, 72, 28, 34)) return 11;
      if (withinReach(280, 72, 28, 34)) return 12;
      if (withinReach(375, 72, 28, 34)) return 13;
      if (withinReach(405, 146, 44, 54)) return 14;
    }
    return 0;
  }
  function promptFor(action) {
    let foe = roomEnemy(),
      partIndex = roomPartIndex(),
      roomIndex;
    if (action == 1)
      return foe.finalBoss
        ? roundCount() >= 6
          ? 'CHALLENGE THE IRON WARDEN?'
          : 'YOU NEED SIX SCORCH ROUNDS - ' + roundCount() + '/6'
        : 'FIGHT ' + foe.name + '?';
    if (action == 2) return 'TAKE ' + PART_LABELS[partIndex] + '?';
    if (action == 3)
      return (
        'OPEN WORKBENCH - ROUNDS ' +
        roundCount() +
        '/6 PSYCHO ' +
        psychoCount() +
        '/3'
      );
    if (action >= 10) {
      roomIndex = action - 9;
      if (!isCleared('h0')) return 'THE ENFORCER BLOCKS THE HOTEL DOORS';
      if (roomIndex == 5 && roundCount() < 6)
        return 'PENTHOUSE LOCKED - ROUNDS ' + roundCount() + '/6';
      return 'ENTER ' + ROOM_NAMES[roomIndex] + '?';
    }
    if (message) return message;
    return room == 0
      ? 'LEFT HALL RETURNS TO DOGTOWN'
      : 'SOUTH DOOR RETURNS TO MAIN LOBBY';
  }
  function drawFooter() {
    const arg0 = findAction(),
      target = promptFor(arg0);
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(arg0 ? 3 : 2).drawString(
      clip(target, 42),
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function drawAll() {
    if (stopped) return;
    if (!drawRoomArt()) {
      drawFloor();
      drawRoomShapes();
    }
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(3).drawString(
      'BIG IRON HOTEL - ' + ROOM_NAMES[room],
      SCREEN_W / 2,
      22,
    );
    drawPart();
    drawEnemy();
    drawPlayer();
    drawFooter();
  }
  function takePart() {
    const index = roomPartIndex();
    if (index < 0 || !partPresent()) {
      message = 'NOTHING LEFT HERE';
      drawAll();
      return;
    }
    story[PART_KEYS[index]] = 1;
    saveState();
    message = PART_LABELS[index] + ' COLLECTED - PARTS ' + partCount() + '/5';
    drawAll();
  }
  function openWorkbench() {
    shutdown();
    api.workbench({
      returnModule: 'HOTEL',
      map: 'HOTEL',
      mode: 'room',
      room: room,
      x: playerX,
      y: playerY,
      facing: facing,
      returnX: story.hotelReturnX,
      returnY: story.hotelReturnY,
      returnFacing: story.hotelReturnFacing,
    });
  }
  function shutdown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    if (clickTimer) clearTimeout(clickTimer);
    frameTimer = clickTimer = 0;
    playerImage = 0;
    closeRoomArt();
  }
  function startBattle(foe) {
    let payload;
    if (foe.finalBoss && roundCount() < 6) {
      message = 'THE WARDEN REQUIRES SIX ROUNDS - ' + roundCount() + '/6';
      drawAll();
      return;
    }
    saveState();
    payload = {
      enemy: foe.enemy,
      map: 'HOTEL',
      mode: 'room',
      room: room,
      x: playerX,
      y: playerY,
      facing: facing,
      returnX: story.hotelReturnX,
      returnY: story.hotelReturnY,
      returnFacing: story.hotelReturnFacing,
      interact: foe.key,
      once: true,
      finalBoss: !!foe.finalBoss,
    };
    shutdown();
    api.battle(payload);
  }
  function activate() {
    let chosen = findAction(),
      foe;
    if (chosen == 1) {
      foe = roomEnemy();
      if (foe) startBattle(foe);
      return;
    }
    if (chosen == 2) {
      takePart();
      return;
    }
    if (chosen == 3) {
      openWorkbench();
      return;
    }
    if (chosen >= 10) {
      enterRoom(chosen - 9);
      return;
    }
    message = 'NOTHING HERE';
    drawAll();
  }
  function leaveHotel() {
    const payload = {
      map: 'WORLD_03',
      mode: 'image',
      x: story.hotelReturnX || 815,
      y: story.hotelReturnY || 263,
      facing: story.hotelReturnFacing || 'down',
      msg: story.finalBossDefeated
        ? 'BIG IRON HOTEL CLEARED'
        : 'LEFT BIG IRON HOTEL',
    };
    saveState();
    shutdown();
    api.world(payload);
  }
  function openPause() {
    saveState();
    shutdown();
    api.pause({
      map: 'HOTEL',
      mode: 'room',
      room: room,
      x: playerX,
      y: playerY,
      facing: facing,
      returnX: story.hotelReturnX,
      returnY: story.hotelReturnY,
      returnFacing: story.hotelReturnFacing,
      city: 'BIG IRON HOTEL',
      story: story,
      msg: message,
    });
  }
  function onClick() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
      openPause();
    } else
      clickTimer = setTimeout(function () {
        clickTimer = 0;
        if (!stopped) activate();
      }, CLICK_MS);
  }
  function tick() {
    let x = 0,
      y = 0;
    if (stopped) return;
    if (queueX) {
      x = queueX < 0 ? -WALK_STEP : WALK_STEP;
      queueX -= x;
    } else if (queueY) {
      y = queueY < 0 ? -WALK_STEP : WALK_STEP;
      queueY -= y;
    }
    if (x || y) stepBy(x, y);
    h.flip();
    Pip.lastFlip = getTime();
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (dir === 0) {
      onClick();
      return;
    }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
    }
    queueMove(0, dir);
  }
  function onKnob2(dir) {
    if (stopped || !dir) return;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
    }
    queueMove(dir, 0);
  }
  function teardown() {
    if (!stopped) shutdown();
  }
  state = loadSave();
  state.cleared = state.cleared || {};
  story = storyData();
  if (story.dogQuest == 2 && !story.dogCases) story.dogCases = 1;
  room =
    args.room !== undefined
      ? parseInt(args.room, 10)
      : state.map == 'HOTEL' && state.room !== undefined
        ? parseInt(state.room, 10)
        : parseInt(story.hotelRoom, 10) || 0;
  if (isNaN(room) || room < 0 || room > 5) room = 0;
  if (args.x !== undefined) {
    playerX = parseInt(args.x, 10);
    playerY = parseInt(args.y, 10);
    facing = args.facing || 'up';
  } else if (state.map == 'HOTEL' && state.x !== undefined) {
    playerX = parseInt(state.x, 10);
    playerY = parseInt(state.y, 10);
    facing = state.facing || 'up';
  }
  if (
    isNaN(playerX) ||
    isNaN(playerY) ||
    playerX < 20 ||
    playerX > 426 ||
    playerY < 20 ||
    playerY > 244
  ) {
    playerX = 223;
    playerY = 232;
    facing = 'up';
  }
  if (args.returnX !== undefined)
    story.hotelReturnX = parseInt(args.returnX, 10) || 815;
  if (args.returnY !== undefined)
    story.hotelReturnY = parseInt(args.returnY, 10) || 263;
  if (args.returnFacing) story.hotelReturnFacing = args.returnFacing;
  if (args.msg) message = args.msg;
  saveState();
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, save: saveState, remove: teardown };
});
