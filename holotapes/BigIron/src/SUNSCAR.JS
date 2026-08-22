// World 1 - Sunscar. Overworld walk, shops/interiors, resident warning, road south to Rot's Crossing.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    FOOTER_Y = 296,
    ROW_BYTES = 120,
    PAGE_BYTES = 35520,
    WALK_STEP = 6,
    FRAME_MS = 40,
    CLICK_MS = 280,
    SPRITE_SIZE = 42,
    SPRITE_OFF_X = 4,
    SPRITE_OFF_Y = 8;
  let mapFile = 0,
    collision = 0,
    state = 0,
    playerX = 704,
    playerY = 255,
    facing = 'down',
    message = 'WELCOME TO SUNSCAR',
    action = 0,
    stopped = 0,
    busy = 0;
  let dogX = 704,
    dogY = 291,
    dogFacing = 'down',
    dogFrame = 0,
    dogImage = 0,
    dogKey = '',
    trailX = [704, 704, 704, 704, 704],
    trailY = [291, 291, 291, 291, 291],
    trailIndex = 0;
  let playerImage = 0,
    playerKey = '',
    unusedPose = 1,
    playerFrame = 1,
    camX = 0,
    camY = 0,
    pageIndex = -1,
    clickTimer = 0,
    queueX = 0,
    queueY = 0,
    footerKey = '',
    frameTimer = 0,
    residentImage = 0,
    residentKey = '',
    RESIDENT_X = 1015,
    RESIDENT_Y = 845,
    warning = 0,
    riding = args.bikeEquip === 1,
    bikeVX = 0,
    bikeVY = 0,
    screenBytes = 0;
  function collect() {}
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
  function closeMap() {
    try {
      if (mapFile && mapFile.close) mapFile.close();
    } catch (err) {}
    mapFile = 0;
  }
  function hbuf() {
    if (!screenBytes) screenBytes = new Uint8Array(h.buffer);
    return screenBytes;
  }
  function openMap() {
    try {
      mapFile = E.openFile(BASE + 'W.BIN', 'r');
    } catch (err) {
      mapFile = 0;
    }
    if (!mapFile) throw 'W.BIN';
    collision = readFile(BASE + 'C.BIN');
    if (!collision || collision.length < 1350) throw 'C.BIN';
  }
  function loadSave() {
    let record = playerRecord(),
      saved = 0;
    if (record.wb && record.wb.map) return record.wb;
    try {
      saved = JSON.parse(readFile(BASE + 'SAV.JSON') || '{}');
    } catch (err) {
      saved = {};
    }
    return saved || {};
  }
  function storyData() {
    state.story = state.story || {};
    state.story.rounds = state.story.rounds || {};
    state.story.encounters = state.story.encounters || 0;
    state.story.deadLead = state.story.deadLead || 0;
    if (state.story.bikeStolen && !state.story.motorcycle)
      state.story.motorcycle = 1;
    return state.story;
  }
  function roundCount() {
    let story = storyData(),
      flags = story.rounds,
      count = 0,
      key;
    if (story.scorchRounds !== undefined)
      return Math.max(0, Math.min(6, parseInt(story.scorchRounds, 10) || 0));
    for (key in flags) if (flags[key]) count++;
    return count;
  }
  function saveState() {
    let record = playerRecord(),
      json;
    state.cleared = state.cleared || {};
    storyData();
    state.map = 'WORLD_01';
    state.mode = 'image';
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
  function saveGame() {
    saveState();
    message = 'GAME SAVED';
    return 1;
  }
  function isCleared(key) {
    if (!state.cleared || !state.cleared[key]) return 0;
    if (key == 'b0' && !storyData().rounds.SCORCHED) return 0;
    return 1;
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
      key = (riding ? 'MB' : 'P') + dir;
    if (playerKey == key) return playerImage;
    playerImage = 0;
    playerKey = key;
    data = readFile(BASE + key + '.BIN');
    if (riding && data && data.length >= 784)
      playerImage = {
        width: 56,
        height: 56,
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
  function noteDraw(x, y) {}
  function dogSprite() {
    const dir =
      dogFacing == 'left'
        ? 'L'
        : dogFacing == 'right'
          ? 'R'
          : dogFacing == 'up'
            ? 'U'
            : 'D';
    if (dogKey == dir) return dogImage;
    dogImage = 0;
    dogKey = dir;
    dogImage = readFile(BASE + 'D' + dir + '.IMG') || 0;
    return dogImage;
  }
  function residentWarned() {
    return storyData().residentWarned;
  }
  function residentSprite() {
    let data;
    if (residentKey == 'T') return residentImage;
    residentImage = 0;
    residentKey = 'T';
    data = readFile(BASE + 'T.BIN');
    if (data && data.length >= 289)
      residentImage = {
        width: 34,
        height: 34,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else residentImage = readFile(BASE + 'T.IMG') || 0;
    return residentImage;
  }
  function cameraX(atX) {
    atX += 17;
    return atX < 360
      ? 0
      : atX < 600
        ? 240
        : atX < 840
          ? 480
          : atX < 1080
            ? 720
            : 960;
  }
  function cameraY(atY) {
    atY += 17;
    return atY < 246
      ? 0
      : atY < 442
        ? 196
        : atY < 638
          ? 392
          : atY < 834
            ? 588
            : 784;
  }
  function pageFor() {
    return ((camY / 196) | 0) * 5 + ((camX / 240) | 0);
  }
  function drawPage() {
    let buffer = hbuf(),
      remaining = PAGE_BYTES,
      offset = 0,
      chunk,
      take;
    pageIndex = pageFor();
    mapFile.seek(pageIndex * PAGE_BYTES);
    while (remaining > 0) {
      take = remaining > 512 ? 512 : remaining;
      chunk = mapFile.read(take);
      if (!chunk) break;
      buffer.set(chunk, offset);
      offset += chunk.length;
      remaining -= chunk.length;
    }
  }
  function restoreRows(y1, y2, y3, y4) {
    let buffer,
      top,
      bottom,
      remaining,
      offset,
      take,
      chunk,
      spriteH = riding ? 56 : 42;
    if (!mapFile) return;
    top = Math.min(y1, y2, y3, y4) - camY - SPRITE_OFF_Y - 2;
    bottom = Math.max(y1, y2, y3, y4) + spriteH - camY + 2;
    top = Math.max(0, top | 0);
    bottom = Math.min(FOOTER_Y, bottom | 0);
    if (bottom <= top) return;
    remaining = (bottom - top) * ROW_BYTES;
    offset = top * ROW_BYTES;
    mapFile.seek(pageIndex * PAGE_BYTES + offset);
    buffer = hbuf();
    while (remaining > 0) {
      take = remaining > 512 ? 512 : remaining;
      chunk = mapFile.read(take);
      if (!chunk) break;
      buffer.set(chunk, offset);
      offset += chunk.length;
      remaining -= chunk.length;
    }
  }
  function drawPlayer() {
    const image = playerSprite(),
      atX = playerX - camX - (riding ? 11 : SPRITE_OFF_X),
      atY = playerY - camY - (riding ? 20 : SPRITE_OFF_Y);
    if (image)
      try {
        h.setColor(3);
        if (riding) h.drawImage(image, atX, atY);
        else h.drawImage(image, atX, atY, { frame: playerFrame % 3 });
        noteDraw(atX, atY);
        return;
      } catch (err) {
        try {
          h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        } catch (err2) {}
      }
    h.setColor(3).drawRect(atX + 11, atY + 7, atX + 30, atY + 37);
    noteDraw(atX, atY);
  }
  function drawDog() {
    let image, atX, atY;
    if (riding) return;
    image = dogSprite();
    atX = dogX - camX - SPRITE_OFF_X;
    atY = dogY - camY - SPRITE_OFF_Y;
    if (image)
      try {
        h.setColor(3).drawImage(image, atX, atY, { frame: dogFrame % 3 });
        return;
      } catch (err) {
        try {
          h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        } catch (err2) {}
      }
    h.setColor(3).fillRect(atX + 6, atY + 11, atX + 22, atY + 22);
    h.setColor(2).drawLine(atX + 6, atY + 22, atX + 5, atY + 30);
    h.drawLine(atX + 18, atY + 22, atX + 20, atY + 30);
  }
  function drawResident() {
    let image,
      atX = RESIDENT_X - camX - SPRITE_OFF_X,
      atY = RESIDENT_Y - camY - SPRITE_OFF_Y;
    if (
      atX < -SPRITE_SIZE ||
      atY < -SPRITE_SIZE ||
      atX >= SCREEN_W ||
      atY >= FOOTER_Y
    )
      return;
    image = residentSprite();
    if (image)
      try {
        h.setClipRect(atX, atY, atX + SPRITE_SIZE - 1, atY + SPRITE_SIZE - 1);
        h.setColor(3).drawImage(image, atX, atY);
        h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        return;
      } catch (err) {
        try {
          h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        } catch (err2) {}
      }
    h.setColor(2).fillRect(atX + 11, atY + 7, atX + 30, atY + 25);
    h.setColor(3).drawLine(atX + 20, atY + 25, atX + 20, atY + 39);
  }
  function collisionBit(col, row) {
    let index, byte;
    if (col < 0 || row < 0 || col >= 120 || row >= 90) return 1;
    index = row * 120 + col;
    byte = collision.charCodeAt(index >> 3);
    return (byte >> (7 - (index & 7))) & 1;
  }
  function blockedByResident(nextX, nextY) {
    return (
      nextX + 25 >= RESIDENT_X + 9 &&
      nextX + 9 <= RESIDENT_X + 25 &&
      nextY + 33 >= RESIDENT_Y + 25 &&
      nextY + 25 <= RESIDENT_Y + 33
    );
  }
  function blocked(atX, atY) {
    return (
      collisionBit(((atX + 9) / 12) | 0, ((atY + 25) / 12) | 0) ||
      collisionBit(((atX + 25) / 12) | 0, ((atY + 25) / 12) | 0) ||
      collisionBit(((atX + 9) / 12) | 0, ((atY + 33) / 12) | 0) ||
      collisionBit(((atX + 25) / 12) | 0, ((atY + 33) / 12) | 0) ||
      blockedByResident(atX, atY)
    );
  }
  function withinReach(atX, atY, reachX, reachY) {
    return (
      Math.abs(playerX + 17 - atX) <= reachX &&
      Math.abs(playerY + 30 - atY) <= reachY
    );
  }
  function withinReachAt(fromX, fromY, atX, atY, reachX, reachY) {
    return (
      Math.abs(fromX + 17 - atX) <= reachX &&
      Math.abs(fromY + 30 - atY) <= reachY
    );
  }
  function nearResident() {
    return withinReach(RESIDENT_X + 17, RESIDENT_Y + 30, 44, 40);
  }
  function findAction() {
    if (withinReach(320, 370, 52, 44)) return 2;
    if (withinReach(390, 610, 54, 44)) return 5;
    if (withinReach(1030, 545, 64, 48)) return 1;
    if (withinReach(285, 825, 58, 46)) return 6;
    if (withinReach(715, 950, 62, 46)) return 3;
    if (!residentWarned() && nearResident()) return 7;
    if (withinReach(1145, 810, 62, 48)) return 4;
    return 0;
  }
  function promptFor(action) {
    return action == 1
      ? 'ENTER TOWN HALL?'
      : action == 2
        ? "ENTER SUN KING'S MARKET?"
        : action == 3
          ? 'ENTER CRATER MOTEL?'
          : action == 4
            ? 'ENTER GUNS & AMMO?'
            : action == 5
              ? 'ENTER PAWN SHOP?'
              : action == 6
                ? "ENTER DOC'S CLINIC?"
                : action == 7
                  ? 'TALK TO RESIDENT?'
                  : message;
  }
  function drawFooter(force) {
    const rounds = roundCount(),
      chosen = findAction(),
      text = message || promptFor(chosen),
      key = rounds + '|' + text;
    action = chosen;
    if (!force && key == footerKey) return 0;
    footerKey = key;
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    h.setColor(3).fillPoly([
      6,
      FOOTER_Y - 22,
      6,
      FOOTER_Y - 4,
      22,
      FOOTER_Y - 13,
    ]);
    h.setColor(2).drawRect(25, FOOTER_Y - 22, 41, FOOTER_Y - 5);
    setFont(1);
    h.setFontAlign(0, 0);
    h.setColor(3).drawString(rounds, 33, FOOTER_Y - 13);
    setFont(2);
    h.setColor(chosen ? 3 : 2).drawString(
      clip(text, 38),
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    return 1;
  }
  function idle() {
    if (playerFrame == 1) return;
    playerFrame = 1;
    restoreRows(playerY, playerY, dogY, dogY);
    drawResident();
    drawDog();
    drawPlayer();
    drawFooter(0);
  }
  function tick() {
    let x = 0,
      y = 0;
    if (stopped) return;
    if (!busy) {
      if (riding && (bikeVX || bikeVY)) {
        x = bikeVX;
        y = bikeVY;
      } else if (queueX) {
        x = queueX < 0 ? -WALK_STEP : WALK_STEP;
        queueX -= x;
      } else if (queueY) {
        y = queueY < 0 ? -WALK_STEP : WALK_STEP;
        queueY -= y;
      }
      if (x || y) stepBy(x, y);
      else idle();
    }
    h.flip();
    Pip.lastFlip = getTime();
  }
  function drawAll() {
    if (stopped) return;
    camX = cameraX(playerX);
    camY = cameraY(playerY);
    drawPage();
    drawResident();
    drawDog();
    drawPlayer();
    drawFooter(1);
  }
  function stepBy(moveX, moveY) {
    let oldX = playerX,
      oldY = playerY,
      oldDogX = dogX,
      oldDogY = dogY,
      nextX = playerX + moveX,
      nextY = playerY + moveY,
      nextCamX,
      nextCamY,
      prevX,
      prevY,
      moved = 0;
    if (busy) return;
    if (moveX < 0) facing = 'left';
    else if (moveX > 0) facing = 'right';
    else if (moveY > 0) facing = 'down';
    else facing = 'up';
    if (nextX + 17 >= 700 && nextX + 17 <= 870 && nextY + 33 >= 1044) {
      queueX = queueY = 0;
      saveState();
      stopped = 1;
      if (frameTimer) clearInterval(frameTimer);
      frameTimer = 0;
      closeMap();
      riding = 0;
      bikeVX = bikeVY = 0;
      api.bridge({
        map: 'WORLD_02',
        mode: 'image',
        x: 1120,
        y: 126,
        facing: 'down',
        bikeEquip: 0,
        msg: "ENTERED ROT\'S CROSSING",
      });
      return;
    }
    if (!residentWarned() && withinReachAt(nextX, nextY, 977, 790, 66, 56)) {
      residentStart();
      return;
    }
    if (!blocked(nextX, nextY)) {
      playerX = nextX;
      playerY = nextY;
      message = '';
      moved = 1;
    } else if (riding) {
      bikeVX = bikeVY = 0;
      message = 'BIKE STOPPED';
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
    nextCamX = cameraX(playerX);
    nextCamY = cameraY(playerY);
    if (nextCamX != camX || nextCamY != camY) {
      drawAll();
      return;
    }
    restoreRows(oldY, playerY, oldDogY, dogY);
    drawResident();
    drawDog();
    drawPlayer();
    drawFooter(0);
  }
  function queueMove(moveX, moveY) {
    const cap = WALK_STEP * 4;
    if (stopped || busy) return;
    if (riding) {
      queueX = queueY = 0;
      if (moveX) {
        bikeVX = moveX < 0 ? -WALK_STEP : WALK_STEP;
        bikeVY = 0;
        facing = moveX < 0 ? 'left' : 'right';
      } else {
        bikeVY = moveY < 0 ? -WALK_STEP : WALK_STEP;
        bikeVX = 0;
        facing = moveY < 0 ? 'up' : 'down';
      }
      playerKey = '';
      return;
    }
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
  function closeWarning() {
    warning = 0;
    busy = 0;
    message = 'RESIDENT WARNED YOU';
    drawFooter(1);
  }
  function residentSpeak() {
    storyData().residentWarned = 1;
    saveState();
    busy = 1;
    warning = 1;
    message = 'RADSCORPIONS BY GUNS & AMMO!';
    drawFooter(1);
  }
  function residentStart() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
    }
    queueX = queueY = 0;
    residentSpeak();
  }
  function activate() {
    let chosen = action,
      foe,
      roll;
    if (!chosen) {
      message = 'NOTHING HERE';
      drawFooter(1);
      return;
    }
    if (chosen == 7) {
      if (residentWarned()) residentSpeak();
      else residentStart();
      return;
    }
    busy = 1;
    if (chosen != 5) saveGame();
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setFontAlign(0, 0);
    setFont(3);
    h.setColor(3).drawString(clip(promptFor(chosen), 24), SCREEN_W / 2, 132);
    if (chosen == 1)
      api.house({
        interiorId: 'TOWN_HALL',
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
      });
    else if (chosen == 2)
      api.house({
        interiorId: 'SUN_KINGS_MARKET',
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
      });
    else if (chosen == 3)
      api.house({
        interiorId: 'CRATER_MOTEL',
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
      });
    else if (chosen == 4)
      api.house({
        interiorId: 'GUNS_AMMO',
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
      });
    else if (chosen == 5)
      api.shop({
        vendor: 'SUNSCAR PAWN',
        folder: 'Shop',
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
      });
    else {
      if (chosen == 6) foe = Math.randInt(2) ? 'RADROACH' : 'RADSCORPION';
      else {
        roll = Math.randInt(3);
        foe = roll == 0 ? 'RAIDER' : roll == 1 ? 'RADROACH' : 'RADSCORPION';
      }
      api.battle({
        enemy: foe,
        map: 'WORLD_01',
        x: playerX,
        y: playerY,
        facing: facing,
        interact: 'b' + (chosen - 1),
        once: true,
      });
    }
  }
  function openPause() {
    if (busy) return;
    queueX = queueY = 0;
    saveGame();
    api.pause({
      map: 'WORLD_01',
      mode: 'image',
      x: playerX,
      y: playerY,
      facing: facing,
      city: 'SUNSCAR',
      story: storyData(),
      msg: message,
    });
  }
  function storeBike() {
    riding = 0;
    bikeVX = bikeVY = 0;
    playerKey = '';
    playerImage = 0;
    playerFrame = 1;
    message = 'MOTORCYCLE STORED';
    drawAll();
  }
  function onClick() {
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
      if (riding) storeBike();
      else openPause();
    } else
      clickTimer = setTimeout(function () {
        clickTimer = 0;
        if (!stopped) activate();
      }, CLICK_MS);
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (warning) {
      if (dir === 0) closeWarning();
      return;
    }
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
    if (stopped || warning || !dir) return;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = 0;
    }
    queueMove(dir, 0);
  }
  function teardown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    if (clickTimer) clearTimeout(clickTimer);
    frameTimer = clickTimer = 0;
    closeMap();
    collision =
      state =
      playerImage =
      dogImage =
      residentImage =
      trailX =
      trailY =
      screenBytes =
        0;
    collect();
  }
  state = loadSave();
  state.cleared = state.cleared || {};
  storyData();
  riding = riding && !!storyData().motorcycle;
  if (args.newGame) {
    state = {
      map: '',
      cleared: {},
      story: { rounds: {}, encounters: 0, deadLead: 0 },
    };
    riding = 0;
  }
  if (args && args.x !== undefined) {
    playerX = parseInt(args.x, 10);
    playerY = parseInt(args.y, 10);
    facing = args.facing || 'down';
  } else if (state.map == 'WORLD_01' && state.x !== undefined) {
    playerX = parseInt(state.x, 10);
    playerY = parseInt(state.y, 10);
    facing = state.facing || 'down';
  }
  if (
    isNaN(playerX) ||
    isNaN(playerY) ||
    playerX < 100 ||
    playerY < 100 ||
    playerX > 1400 ||
    playerY > 1040
  ) {
    playerX = 704;
    playerY = 255;
    facing = 'down';
  }
  dogX = playerX;
  dogY = playerY + 36;
  dogFacing = facing;
  trailX = [dogX, dogX, dogX, dogX, dogX];
  trailY = [dogY, dogY, dogY, dogY, dogY];
  if (args.msg) message = args.msg;
  if (riding) {
    if (facing == 'left') bikeVX = -WALK_STEP;
    else if (facing == 'right') bikeVX = WALK_STEP;
    else if (facing == 'up') bikeVY = -WALK_STEP;
    else bikeVY = WALK_STEP;
  }
  openMap();
  if (args.newGame) saveState();
  if (api.music) api.music(0);
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, save: saveGame, remove: teardown };
});
