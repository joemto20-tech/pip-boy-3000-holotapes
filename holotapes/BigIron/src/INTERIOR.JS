// Single-room interiors (Town Hall, market, Guns & Ammo, Rot's Tavern, Crater Motel) with NPC dialogue.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    FOOTER_Y = 296,
    ROW_BYTES = 120,
    WALK_STEP = 6,
    FRAME_MS = 40;
  let interiorId = String(args.interiorId || 'CRATER_MOTEL').toUpperCase(),
    room = 0;
  let playerX = 223,
    playerY = 376,
    facing = 'up',
    camY = 0,
    message = '',
    action = 0,
    stopped = 0,
    locked = 0,
    mapFile = 0,
    playerImage = 0,
    playerKey = '',
    playerFrame = 1,
    queueX = 0,
    queueY = 0,
    frameTimer = 0;
  let dogX = 223,
    dogY = 412,
    dogFacing = 'up',
    dogFrame = 1,
    dogImage = 0,
    dogKey = '',
    trailX = [223, 223, 223, 223, 223],
    trailY = [412, 412, 412, 412, 412],
    trailIndex = 0;
  let npcImage = 0,
    npcKey = '',
    dialog = 0,
    choice = 0,
    ticks = 0;
  function roomConfig(interiorId) {
    const walls = [
      [0, 0, 480, 82],
      [0, 0, 18, 456],
      [462, 0, 18, 456],
      [0, 420, 200, 36],
      [280, 420, 200, 36],
    ];
    if (interiorId == 'SUN_KINGS_MARKET')
      return {
        name: "SUN KING'S MARKET",
        bg: 'SM.BIN',
        spawn: [223, 376, 'up'],
        col: walls.concat([
          [30, 100, 128, 70],
          [30, 205, 128, 70],
          [30, 310, 128, 70],
          [322, 100, 128, 70],
          [322, 205, 128, 70],
          [322, 310, 128, 70],
          [182, 94, 116, 58],
        ]),
        npc: {
          name: 'MARKET RAIDER',
          x: 223,
          y: 178,
          w: 34,
          h: 34,
          solid: 1,
          img: '',
          kind: 'raider',
          range: 50,
          text: 'SUN KING LEFT US THE KEYS. YOU CAN LEAVE OR BLEED.',
          enemy: 'RAIDER',
          key: 'b1',
        },
      };
    if (interiorId == 'GUNS_AMMO')
      return {
        name: 'GUNS & AMMO',
        bg: 'GA.BIN',
        spawn: [223, 376, 'up'],
        col: walls.concat([
          [28, 96, 130, 62],
          [322, 96, 130, 62],
          [28, 194, 144, 58],
          [308, 194, 144, 58],
          [56, 302, 124, 54],
          [300, 302, 124, 54],
          [188, 104, 104, 68],
        ]),
        npc: {
          name: 'RADSCORPION',
          x: 223,
          y: 244,
          w: 34,
          h: 34,
          solid: 1,
          img: 'RSC.BIN',
          kind: 'scorpion',
          range: 52,
          text: 'A RADSCORPION SCRAPES ACROSS THE DISPLAY FLOOR.',
          enemy: 'RADSCORPION',
          key: 'b3',
        },
      };
    if (interiorId == 'TOWN_HALL')
      return {
        name: 'SUNSCAR TOWN HALL',
        bg: 'TH.BIN',
        spawn: [223, 376, 'up'],
        col: walls.concat([
          [104, 88, 272, 70],
          [34, 188, 154, 48],
          [292, 188, 154, 48],
          [34, 272, 154, 48],
          [292, 272, 154, 48],
        ]),
        npc: {
          name: 'SOLOMON RAY',
          x: 223,
          y: 164,
          w: 34,
          h: 34,
          solid: 1,
          img: 'SR.BIN',
          kind: 'person',
          range: 52,
          text: 'HOW ARE YOU ENJOYING THE RADS?',
          enemy: 'SOLOMON_RAY',
          key: 'b0',
          bullet: 'SCORCHED',
          miniboss: 1,
        },
      };
    if (interiorId == 'ROT_TAVERN')
      return {
        name: "ROT'S TAVERN",
        bg: 'RT.BIN',
        spawn: [223, 376, 'up'],
        col: [
          [0, 0, 480, 108],
          [144, 120, 192, 48],
          [216, 168, 12, 12],
          [0, 108, 132, 84],
          [348, 108, 132, 96],
          [360, 204, 120, 12],
          [0, 192, 120, 48],
          [372, 216, 108, 24],
          [312, 276, 12, 24],
          [132, 288, 24, 36],
          [228, 252, 24, 72],
          [0, 240, 96, 96],
          [300, 300, 24, 36],
          [336, 312, 12, 24],
          [384, 240, 96, 96],
          [0, 336, 108, 12],
          [360, 336, 120, 12],
          [0, 348, 120, 24],
          [0, 372, 108, 12],
          [0, 384, 96, 24],
          [348, 348, 132, 60],
          [0, 408, 204, 24],
          [276, 408, 204, 24],
          [0, 432, 216, 24],
          [264, 432, 216, 24],
        ],
        npc: {
          name: 'ROTJAW',
          x: 214,
          y: 98,
          w: 34,
          h: 34,
          solid: 0,
          img: 'RJ.BIN',
          kind: 'person',
          range: 66,
          text: 'ROAD SOUTH IS OPEN. THE BIKES OUTSIDE ARE NOT YOURS.',
        },
      };
    return {
      name: 'CRATER MOTEL',
      bg: 'MT.BIN',
      spawn: [223, 376, 'up'],
      bench: { x: 240, y: 72, w: 192, h: 96, r: 24 },
      col: [
        [0, 0, 480, 72],
        [0, 72, 108, 12],
        [156, 72, 324, 12],
        [0, 84, 24, 12],
        [240, 84, 24, 36],
        [408, 96, 24, 24],
        [0, 96, 132, 48],
        [84, 144, 48, 12],
        [240, 120, 192, 48],
        [456, 84, 24, 84],
        [0, 144, 60, 36],
        [0, 180, 24, 12],
        [0, 192, 36, 12],
        [96, 156, 36, 48],
        [300, 204, 72, 12],
        [300, 216, 84, 36],
        [0, 204, 24, 60],
        [312, 252, 60, 12],
        [0, 264, 60, 12],
        [0, 276, 72, 24],
        [0, 300, 96, 24],
        [432, 168, 48, 156],
        [252, 312, 24, 24],
        [0, 324, 108, 24],
        [456, 324, 24, 24],
        [0, 348, 132, 12],
        [0, 360, 156, 36],
        [0, 396, 180, 12],
        [0, 408, 24, 12],
        [360, 348, 120, 72],
        [0, 420, 204, 36],
        [276, 420, 204, 36],
      ],
      npc: {
        name: 'MOTEL RESIDENT',
        x: 252,
        y: 314,
        w: 34,
        h: 34,
        solid: 1,
        img: 'G.IMG',
        kind: 'person',
        range: 46,
        text: 'SURE IS NICE TO HAVE A NOSE.',
      },
    };
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
  function readFile(path) {
    try {
      return fs.readFile(path);
    } catch (err) {
      return 0;
    }
  }
  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (err) {
      return {};
    }
  }
  function storyData() {
    const point = playerRecord(),
      width = point.wb || {};
    return width.story || {};
  }
  function psychoCount(story) {
    const value = story.psycho === undefined ? story.hotLoads : story.psycho;
    return Math.max(0, Math.min(3, parseInt(value, 10) || 0));
  }
  function roundCount(story) {
    let value = parseInt(story.scorchRounds, 10);
    if (isNaN(value))
      value =
        story.solomonDefeated || (story.rounds && story.rounds.SCORCHED)
          ? 1
          : 0;
    if (story.ammoCrafted && value < 6) value = 6;
    return Math.max(0, Math.min(6, value));
  }
  function benchLabel() {
    const story = storyData();
    return (
      'OPEN WORKBENCH - SCORCH ' +
      roundCount(story) +
      '/6 PSYCHO ' +
      psychoCount(story) +
      '/3'
    );
  }
  function isCleared(key) {
    const record = playerRecord(),
      state = record.wb || {};
    return !!(key && state.cleared && state.cleared[key]);
  }
  function npcPresent() {
    return room.npc && !isCleared(room.npc.key);
  }
  function closeMap() {
    try {
      if (mapFile && mapFile.close) mapFile.close();
    } catch (err) {}
    mapFile = 0;
  }
  function openMap() {
    try {
      mapFile = E.openFile(BASE + room.bg, 'r');
    } catch (err) {
      mapFile = 0;
    }
    if (!mapFile) throw room.bg;
  }
  function playerSprite() {
    let data,
      key =
        facing == 'down'
          ? 'IPD'
          : facing == 'left'
            ? 'IPL'
            : facing == 'right'
              ? 'IPR'
              : 'IPU';
    if (playerKey == key) return playerImage;
    playerImage = 0;
    playerKey = key;
    data = readFile(BASE + key + '.BIN');
    if (data && data.length >= 1587)
      playerImage = {
        width: 46,
        height: 46,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else playerImage = 0;
    return playerImage;
  }
  function dogSprite() {
    let dir =
        dogFacing == 'left'
          ? 'L'
          : dogFacing == 'right'
            ? 'R'
            : dogFacing == 'up'
              ? 'U'
              : 'D',
      data;
    if (dogKey == dir) return dogImage;
    dogImage = 0;
    dogKey = dir;
    data = readFile(BASE + 'D' + dir + '.BIN');
    if (data && data.length >= 441)
      dogImage = {
        width: 42,
        height: 42,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else dogImage = 0;
    return dogImage;
  }
  function npcSprite() {
    let npc = room.npc,
      file = npc && npc.img,
      data;
    if (!file) return 0;
    if (npcKey == file) return npcImage;
    npcImage = 0;
    npcKey = file;
    data = readFile(BASE + file) || 0;
    if (!data) return 0;
    if (/\.BIN$/i.test(file)) {
      if (data.length >= 441)
        npcImage = {
          width: 42,
          height: 42,
          bpp: 2,
          transparent: 0,
          buffer: data,
        };
      else if (data.length >= 289)
        npcImage = {
          width: 34,
          height: 34,
          bpp: 2,
          transparent: 0,
          buffer: data,
        };
      else npcImage = 0;
    } else npcImage = data;
    return npcImage;
  }
  function cameraTop(atY) {
    const maxTop = Math.max(0, 456 - FOOTER_Y),
      top = Math.floor((atY + 17 - FOOTER_Y / 2) / 80) * 80;
    return Math.max(0, Math.min(maxTop, top));
  }
  function drawPage() {
    let buffer = new Uint8Array(h.buffer),
      remaining = FOOTER_Y * ROW_BYTES,
      offset = 0,
      chunk,
      take;
    mapFile.seek(camY * ROW_BYTES);
    while (remaining > 0) {
      take = remaining > 512 ? 512 : remaining;
      chunk = mapFile.read(take);
      if (!chunk) break;
      buffer.set(chunk, offset);
      offset += chunk.length;
      remaining -= chunk.length;
    }
    buffer = 0;
  }
  function restoreRows(y1, y2, y3, y4) {
    let buffer,
      top = Math.max(0, Math.min(y1, y2, y3, y4) - camY - 10),
      bottom = Math.min(FOOTER_Y, Math.max(y1, y2, y3, y4) + 50 - camY),
      remaining,
      offset,
      take,
      chunk;
    if (bottom <= top) return;
    remaining = (bottom - top) * ROW_BYTES;
    offset = top * ROW_BYTES;
    mapFile.seek((camY + top) * ROW_BYTES);
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
  }
  function drawPlayer() {
    const image = playerSprite(),
      x = playerX - 6,
      y = playerY - camY - 10;
    if (image)
      try {
        h.setColor(3).drawImage(image, x, y, { frame: playerFrame % 3 });
        return;
      } catch (err) {}
    h.setColor(3).drawRect(x + 13, y + 9, x + 32, y + 39);
  }
  function drawDog() {
    const image = dogSprite(),
      x = dogX - 4,
      y = dogY - camY - 8;
    if (y + 42 < 0 || y >= FOOTER_Y) return;
    if (image)
      try {
        h.setColor(3).drawImage(image, x, y);
        return;
      } catch (err) {}
    h.setColor(3).fillRect(x + 6, y + 11, x + 22, y + 22);
    h.setColor(2).drawLine(x + 6, y + 22, x + 5, y + 30);
    h.drawLine(x + 18, y + 22, x + 20, y + 30);
  }
  function drawRaider(atX, atY) {
    h.setColor(2).fillRect(atX + 9, atY + 5, atX + 24, atY + 18);
    h.setColor(3).drawLine(atX + 5, atY + 4, atX + 28, atY + 4);
    h.drawLine(atX + 17, atY + 18, atX + 17, atY + 30);
    h.drawLine(atX + 8, atY + 22, atX + 27, atY + 22);
    h.drawLine(atX + 17, atY + 30, atX + 10, atY + 34);
    h.drawLine(atX + 17, atY + 30, atX + 24, atY + 34);
  }
  function drawScorpion(atX, atY) {
    h.setColor(2).fillRect(atX + 7, atY + 14, atX + 26, atY + 25);
    h.setColor(3).drawLine(atX + 7, atY + 16, atX + 2, atY + 9);
    h.drawLine(atX + 26, atY + 16, atX + 31, atY + 9);
    h.drawLine(atX + 7, atY + 24, atX + 2, atY + 31);
    h.drawLine(atX + 26, atY + 24, atX + 31, atY + 31);
    h.drawLine(atX + 16, atY + 14, atX + 22, atY + 6);
    h.drawLine(atX + 22, atY + 6, atX + 29, atY + 8);
    h.fillRect(atX + 12, atY + 10, atX + 20, atY + 16);
  }
  function drawNpc() {
    let count = room.npc,
      x,
      y,
      image;
    if (!npcPresent()) return;
    x = count.x;
    y = count.y - camY;
    if (y + count.h < 0 || y >= FOOTER_Y) return;
    image = npcSprite();
    if (image)
      try {
        h.setColor(3).drawImage(image, x, y);
        return;
      } catch (err) {}
    if (count.kind == 'scorpion') drawScorpion(x, y);
    else drawRaider(x, y);
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
  function blocked(atX, atY) {
    let index,
      rect,
      foe = room.npc;
    if (atX < 0 || atX + 34 > SCREEN_W || atY < 0 || atY + 34 > 456) return 1;
    for (index = 0; index < room.col.length; index++) {
      rect = room.col[index];
      if (overlaps(atX, atY, rect[0], rect[1], rect[2], rect[3])) return 1;
    }
    if (
      npcPresent() &&
      foe.solid &&
      overlaps(atX, atY, foe.x, foe.y, foe.w, foe.h)
    )
      return 1;
    return 0;
  }
  function withinReach(atX, atY, width, height, result) {
    const camX = playerX + 17,
      yy = playerY + 30;
    return (
      Math.abs(camX - (atX + width / 2)) <= width / 2 + result &&
      Math.abs(yy - (atY + height / 2)) <= height / 2 + result
    );
  }
  function findAction() {
    const foe = room.npc,
      bench = room.bench;
    if (npcPresent() && withinReach(foe.x, foe.y, foe.w, foe.h, foe.range))
      return 1;
    if (withinReach(200, 414, 80, 42, 8)) return 2;
    if (bench && withinReach(bench.x, bench.y, bench.w, bench.h, bench.r || 24))
      return 3;
    return 0;
  }
  function drawFooter() {
    let label;
    action = findAction();
    if (action == 1) label = 'TALK TO ' + room.npc.name + '?';
    else if (action == 2) label = 'LEAVE ' + room.name + '?';
    else if (action == 3) label = benchLabel();
    else label = message;
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(action ? 3 : 2).drawString(
      clip(label, 40),
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function drawActors() {
    drawNpc();
    drawDog();
    drawPlayer();
  }
  function drawAll() {
    camY = cameraTop(playerY);
    drawPage();
    drawActors();
    drawFooter();
  }
  function stepBy(moveX, moveY) {
    let oldX = playerX,
      oldY = playerY,
      oldDogX = dogX,
      oldDogY = dogY,
      nextX = playerX + moveX,
      nextY = playerY + moveY,
      nc,
      moved = 0,
      prevX,
      prevY;
    if (locked || dialog) return;
    if (moveX < 0) facing = 'left';
    else if (moveX > 0) facing = 'right';
    else if (moveY > 0) facing = 'down';
    else facing = 'up';
    if (!blocked(nextX, nextY)) {
      playerX = nextX;
      playerY = nextY;
      message = '';
      moved = 1;
    }
    if (moved) {
      prevX = trailX[trailIndex];
      prevY = trailY[trailIndex];
      trailX[trailIndex] = oldX;
      trailY[trailIndex] = oldY;
      trailIndex = (trailIndex + 1) % 5;
      dogX = prevX;
      dogY = prevY;
      if (dogX < oldDogX) dogFacing = 'left';
      else if (dogX > oldDogX) dogFacing = 'right';
      else if (dogY < oldDogY) dogFacing = 'up';
      else if (dogY > oldDogY) dogFacing = 'down';
      if (dogX != oldDogX || dogY != oldDogY) dogFrame = (dogFrame + 1) % 3;
      playerFrame = (playerFrame + 1) % 3;
    } else playerFrame = 1;
    nc = cameraTop(playerY);
    if (nc != camY) {
      drawAll();
      return;
    }
    restoreRows(oldY, playerY, oldDogY, dogY);
    drawActors();
    drawFooter();
  }
  function wrapText(text, width) {
    let words = String(text || '').split(' '),
      lines = [],
      line = '',
      index,
      candidate;
    for (index = 0; index < words.length; index++) {
      candidate = line ? line + ' ' + words[index] : words[index];
      if (candidate.length > width && line) {
        lines.push(line);
        line = words[index];
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }
  function drawDialogue() {
    let arg0 = wrapText(dialog.text, 48),
      index,
      enemy = !!dialog.enemy;
    h.setClipRect(0, 176, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 176, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawRect(8, 184, SCREEN_W - 9, SCREEN_H - 9);
    h.setFontAlign(-1, -1);
    setFont(1);
    h.setColor(3);
    for (index = 0; index < arg0.length; index++)
      h.drawString(arg0[index], 20, 196 + index * 13);
    if (enemy) {
      h.setColor(choice == 0 ? 3 : 2).drawString(
        (choice == 0 ? '> ' : '  ') + 'FIGHT',
        40,
        252,
      );
      h.setColor(choice == 1 ? 3 : 2).drawString(
        (choice == 1 ? '> ' : '  ') + 'BACK AWAY',
        250,
        252,
      );
    } else {
      h.setColor(3).drawString('> CLOSE', 40, 252);
    }
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function openDialogue() {
    let story;
    if (interiorId == 'ROT_TAVERN' && room.npc) {
      story = storyData();
      if (!(story.solomonDefeated || (story.rounds && story.rounds.SCORCHED)))
        room.npc.text =
          'HANDLE SOLOMON RAY FIRST. THEN WE CAN TALK ABOUT THE BIKE.';
      else if (!story.bikeRaceComplete)
        room.npc.text = 'YOU WANT THAT BIKE? FIND ME OUT BY THE TRACK.';
      else
        room.npc.text =
          'YOU EARNED THE KEYS. THE TRACK IS OPEN IF YOU WANT ANOTHER LAP.';
    }
    dialog = room.npc;
    choice = 0;
    drawDialogue();
  }
  function leaveRoom() {
    let payload;
    if (stopped) return;
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    frameTimer = 0;
    closeMap();
    payload = {
      map: args.map || 'WORLD_01',
      mode: 'image',
      x: args.x,
      y: args.y,
      facing: args.facing || 'down',
      msg: 'LEFT ' + room.name,
    };
    if (api.returnWorld) api.returnWorld(payload, 300);
    else api.world(payload);
  }
  function startFight() {
    let npc = dialog,
      payload;
    if (!npc || !npc.enemy) return;
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    frameTimer = 0;
    closeMap();
    payload = {
      enemy: npc.enemy,
      map: args.map || 'WORLD_01',
      mode: 'image',
      x: args.x,
      y: args.y,
      facing: args.facing || 'down',
      interact: npc.key,
      once: !!npc.key,
      miniboss: !!npc.miniboss,
      bullet: npc.bullet,
    };
    dialog = 0;
    api.battle(payload);
  }
  function confirmChoice() {
    if (!dialog) return;
    if (!dialog.enemy) {
      dialog = 0;
      drawAll();
      return;
    }
    if (choice) {
      dialog = 0;
      message = 'YOU BACK AWAY';
      drawAll();
    } else startFight();
  }
  function activate() {
    if (dialog) {
      confirmChoice();
      return;
    }
    if (action == 1) {
      openDialogue();
      return;
    }
    if (action == 2) {
      leaveRoom();
      return;
    }
    if (action == 3) {
      stopped = 1;
      if (frameTimer) clearInterval(frameTimer);
      frameTimer = 0;
      closeMap();
      api.workbench({
        returnModule: 'INTERIOR',
        interiorId: interiorId,
        map: args.map,
        mode: args.mode,
        x: args.x,
        y: args.y,
        facing: args.facing,
        roomX: playerX,
        roomY: playerY,
        roomFacing: facing,
        msg: 'AT THE CRATER MOTEL WORKBENCH',
      });
      return;
    }
    message = 'NOTHING HERE';
    drawFooter();
  }
  function queueMove(moveX, moveY) {
    const cap = WALK_STEP * 4;
    if (stopped || locked || dialog) return;
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
  function tick() {
    let x = 0,
      y = 0;
    if (stopped) return;
    ticks++;
    if (!locked && !dialog) {
      if (queueX) {
        x = queueX < 0 ? -WALK_STEP : WALK_STEP;
        queueX -= x;
      } else if (queueY) {
        y = queueY < 0 ? -WALK_STEP : WALK_STEP;
        queueY -= y;
      }
      if (x || y) stepBy(x, y);
    }
    h.flip();
    Pip.lastFlip = getTime();
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (dir === 0 && !held) {
      activate();
      return;
    }
    queueMove(0, dir);
  }
  function onKnob2(dir) {
    if (stopped || !dir) return;
    if (dialog && dialog.enemy) {
      choice = choice ? 0 : 1;
      drawDialogue();
      return;
    }
    queueMove(dir, 0);
  }
  function teardown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    frameTimer = 0;
    closeMap();
    playerImage = dogImage = npcImage = dialog = trailX = trailY = 0;
  }
  room = roomConfig(interiorId);
  playerX =
    args.roomX !== undefined
      ? parseInt(args.roomX, 10) || room.spawn[0]
      : room.spawn[0];
  playerY =
    args.roomY !== undefined
      ? parseInt(args.roomY, 10) || room.spawn[1]
      : room.spawn[1];
  facing = args.roomFacing || room.spawn[2];
  dogX = playerX;
  dogY = playerY + 36;
  dogFacing = facing;
  trailX = [dogX, dogX, dogX, dogX, dogX];
  trailY = [dogY, dogY, dogY, dogY, dogY];
  message = room.name;
  playerSprite();
  dogSprite();
  if (room.npc && room.npc.img) npcSprite();
  openMap();
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
