// World 2 - Rot's Crossing. Tavern, Rotjaw at the track, roads to Sunscar and Dogtown.
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
  const MAP_W = 1672,
    MAP_H = 941,
    GRID_W = 140,
    GRID_H = 79,
    PAGE_COLS = 6,
    CAM_X = [0, 240, 480, 720, 960, 1192],
    CAM_Y = [0, 196, 392, 588, 645];
  let mapFile = 0,
    collision = 0,
    state = 0,
    playerX = 1268,
    playerY = 168,
    facing = 'down',
    message = "ROT'S CROSSING",
    action = 0,
    stopped = 0,
    busy = 0;
  let dogX = 1268,
    dogY = 204,
    dogFacing = 'down',
    dogFrame = 0,
    dogImage = 0,
    dogKey = '',
    trailX = [1268, 1268, 1268, 1268, 1268],
    trailY = [204, 204, 204, 204, 204],
    trailIndex = 0;
  let playerImage = 0,
    playerKey = '',
    playerFrame = 1,
    camX = 0,
    camY = 0,
    pageCol = 0,
    pageRow = 0,
    pageIndex = -1,
    clickTimer = 0,
    queueX = 0,
    queueY = 0,
    footerKey = '',
    frameTimer = 0,
    dialog = 0,
    choice = 0,
    talkStep = 0,
    rotjawImage = 0,
    riding = args.bikeEquip === 1,
    bikeVX = 0,
    bikeVY = 0;
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
  function openMap() {
    try {
      mapFile = E.openFile(BASE + 'W2.BIN', 'r');
    } catch (err) {
      mapFile = 0;
    }
    if (!mapFile) throw 'W2.BIN';
    collision = readFile(BASE + 'C2.BIN');
    if (!collision || collision.length < 1383) throw 'C2.BIN';
  }
  function loadSave() {
    let record = playerRecord(),
      saved = 0;
    if (record.wb) return record.wb;
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
    if (state.story.bikeStolen && !state.story.motorcycle)
      state.story.motorcycle = 1;
    return state.story;
  }
  function storyUnlocked() {
    const record = storyData();
    return !!(
      record.solomonDefeated ||
      (record.rounds && record.rounds.SCORCHED)
    );
  }
  function saveState() {
    let record = playerRecord(),
      json;
    state.cleared = state.cleared || {};
    storyData();
    state.map = 'WORLD_02';
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
  function rotjawSprite() {
    let data;
    if (rotjawImage) return rotjawImage;
    data = readFile(BASE + 'RBD.BIN');
    if (data && data.length >= 784) {
      rotjawImage = {
        width: 56,
        height: 56,
        bpp: 2,
        transparent: 0,
        buffer: data,
        size: 56,
      };
      return rotjawImage;
    }
    data = readFile(BASE + 'RJ.BIN');
    if (data && data.length >= 289)
      rotjawImage = {
        width: 34,
        height: 34,
        bpp: 2,
        transparent: 0,
        buffer: data,
        size: 34,
      };
    return rotjawImage;
  }
  function drawRotjaw() {
    let story = storyData(),
      image,
      atX,
      atY;
    if (story.bikeRaceComplete || !storyUnlocked()) return;
    image = rotjawSprite();
    atX = 1080 - camX - (((image && image.size) || 34) >> 1) + 17;
    atY = 490 - camY - SPRITE_OFF_Y;
    if (atX < -64 || atX > SCREEN_W || atY < -64 || atY > FOOTER_Y) return;
    if (image)
      try {
        h.setColor(3).drawImage(image, atX, atY);
        return;
      } catch (err) {}
    h.setColor(3).drawRect(atX + 7, atY + 4, atX + 26, atY + 31);
  }
  function colFor(atX) {
    atX += 17;
    return atX < 360
      ? 0
      : atX < 600
        ? 1
        : atX < 840
          ? 2
          : atX < 1080
            ? 3
            : atX < 1320
              ? 4
              : 5;
  }
  function rowFor(atY) {
    atY += 17;
    return atY < 246 ? 0 : atY < 442 ? 1 : atY < 638 ? 2 : atY < 736 ? 3 : 4;
  }
  function pageFor() {
    pageCol = colFor(playerX);
    pageRow = rowFor(playerY);
    camX = CAM_X[pageCol];
    camY = CAM_Y[pageRow];
    return pageRow * PAGE_COLS + pageCol;
  }
  function drawPage() {
    let buffer = new Uint8Array(h.buffer),
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
    buffer = 0;
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
      atX = playerX - camX - (riding ? 11 : SPRITE_OFF_X),
      atY = playerY - camY - (riding ? 20 : SPRITE_OFF_Y);
    if (image)
      try {
        h.setColor(3);
        if (riding) h.drawImage(image, atX, atY);
        else h.drawImage(image, atX, atY, { frame: playerFrame % 3 });
        return;
      } catch (err) {}
    h.setColor(3).drawRect(atX + 11, atY + 7, atX + 30, atY + 37);
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
      } catch (err) {}
    h.setColor(3).fillRect(atX + 6, atY + 11, atX + 22, atY + 22);
  }
  function collisionBit(col, row) {
    let index, byte;
    if (col < 0 || row < 0 || col >= GRID_W || row >= GRID_H) return 1;
    index = row * GRID_W + col;
    byte = collision.charCodeAt(index >> 3);
    return (byte >> (7 - (index & 7))) & 1;
  }
  function blocked(atX, atY) {
    const left = atX + 9,
      right = atX + 25,
      top = atY + 25,
      bottom = atY + 33;
    return (
      collisionBit((left / 12) | 0, (top / 12) | 0) ||
      collisionBit((right / 12) | 0, (top / 12) | 0) ||
      collisionBit((left / 12) | 0, (bottom / 12) | 0) ||
      collisionBit((right / 12) | 0, (bottom / 12) | 0)
    );
  }
  function playerCentre() {
    return [playerX + 17, playerY + 30];
  }
  function withinReach(atX, atY, reachX, reachY) {
    const centre = playerCentre();
    return (
      Math.abs(centre[0] - atX) <= reachX && Math.abs(centre[1] - atY) <= reachY
    );
  }
  function findAction() {
    if (withinReach(650, 520, 72, 58)) return 1;
    if (withinReach(1090, 520, 112, 72)) return 2;
    if (withinReach(1268, 168, 100, 68)) return 3;
    if (withinReach(1312, 540, 120, 86)) return 4;
    return 0;
  }
  function promptFor(action) {
    const story = storyData();
    return action == 1
      ? "ENTER ROT'S TAVERN?"
      : action == 2
        ? !storyUnlocked()
          ? 'ROTJAW: DEAL WITH SOLOMON RAY FIRST'
          : story.bikeRaceComplete
            ? 'TAKE ANOTHER LAP?'
            : 'ROTJAW IS WAITING BY THE TRACK'
        : action == 3
          ? 'RETURN TO SUNSCAR?'
          : action == 4
            ? storyUnlocked()
              ? 'TAKE THE DOGTOWN ROAD?'
              : 'DOGTOWN LOCKED - DEFEAT SOLOMON RAY'
            : message;
  }
  function drawFooter(force) {
    const chosen = findAction(),
      text = message || promptFor(chosen),
      key = chosen + '|' + text;
    action = chosen;
    if (!force && key == footerKey) return 0;
    footerKey = key;
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    setFont(2);
    h.setFontAlign(0, 0);
    h.setColor(chosen ? 3 : 2).drawString(
      clip(text, 40),
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    return 1;
  }
  function drawActors() {
    drawRotjaw();
    drawDog();
    drawPlayer();
  }
  function idle() {
    if (playerFrame == 1) return;
    playerFrame = 1;
    restoreRows(playerY, playerY, dogY, dogY);
    drawActors();
    drawFooter(0);
  }
  function tick() {
    let x = 0,
      y = 0;
    if (stopped) return;
    if (!busy && !dialog) {
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
    drawPage();
    drawActors();
    drawFooter(1);
  }
  function stepBy(moveX, moveY) {
    let oldX = playerX,
      oldY = playerY,
      oldDogX = dogX,
      oldDogY = dogY,
      nextX = playerX + moveX,
      nextY = playerY + moveY,
      nextCol,
      nextRow,
      prevX,
      prevY,
      moved = 0;
    if (busy || dialog) return;
    if (moveX < 0) facing = 'left';
    else if (moveX > 0) facing = 'right';
    else if (moveY > 0) facing = 'down';
    else facing = 'up';
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
    nextCol = colFor(playerX);
    nextRow = rowFor(playerY);
    if (nextCol != pageCol || nextRow != pageRow) {
      drawAll();
      return;
    }
    restoreRows(oldY, playerY, oldDogY, dogY);
    drawActors();
    drawFooter(0);
  }
  function queueMove(moveX, moveY) {
    const cap = WALK_STEP * 4;
    if (stopped || busy || dialog) return;
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
  function shutdown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    if (clickTimer) clearTimeout(clickTimer);
    frameTimer = clickTimer = 0;
    closeMap();
    collision = playerImage = dogImage = rotjawImage = trailX = trailY = 0;
    collect();
  }
  function toSunscar() {
    let payload;
    riding = 0;
    bikeVX = bikeVY = 0;
    playerKey = '';
    playerImage = 0;
    storyData().bikeActive = 0;
    saveState();
    payload = {
      map: 'WORLD_01',
      mode: 'image',
      x: 760,
      y: 996,
      facing: 'up',
      bikeEquip: 0,
      msg: 'RETURNED TO SUNSCAR',
    };
    shutdown();
    api.world(payload);
  }
  function startTrack() {
    if (!storyUnlocked()) {
      message = 'THE TRACK OPENS AFTER SOLOMON RAY FALLS';
      drawFooter(1);
      return;
    }
    saveState();
    shutdown();
    api.ride({ map: 'WORLD_02', x: playerX, y: playerY, facing: facing });
  }
  function toDogtown() {
    let payload;
    if (!storyUnlocked()) {
      message = 'DOGTOWN OPENS AFTER SOLOMON RAY FALLS';
      drawFooter(1);
      return;
    }
    storyData().bikeActive = 0;
    saveState();
    payload = {
      map: 'WORLD_03',
      mode: 'image',
      x: 820,
      y: 850,
      facing: 'up',
      bikeEquip: riding ? 1 : 0,
      msg: 'ARRIVED AT DOGTOWN HEIGHTS',
    };
    shutdown();
    api.world(payload);
  }
  function enterTavern() {
    const payload = {
      interiorId: 'ROT_TAVERN',
      map: 'WORLD_02',
      x: playerX,
      y: playerY,
      facing: facing,
    };
    saveState();
    shutdown();
    api.house(payload);
  }
  function drawChoice() {
    const record = storyData();
    h.setClipRect(0, 170, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 170, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawRect(8, 178, SCREEN_W - 9, SCREEN_H - 9);
    h.setFontAlign(0, -1);
    if (record.bikeRaceComplete) {
      setFont(2);
      h.setColor(3).drawString('THE TRACK', SCREEN_W / 2, 192);
      setFont(1);
      h.setColor(2).drawString(
        'YOUR BEST TIME IS SAVED AFTER EACH LAP',
        SCREEN_W / 2,
        218,
      );
      h.setColor(choice == 0 ? 3 : 2).drawString(
        (choice == 0 ? '> ' : '  ') + 'TAKE A LAP',
        145,
        252,
      );
      h.setColor(choice == 1 ? 3 : 2).drawString(
        (choice == 1 ? '> ' : '  ') + 'NOT NOW',
        335,
        252,
      );
      h.setColor(2).drawString('TURN WHEEL / LEFT CLICK', SCREEN_W / 2, 278);
    } else if (talkStep == 0) {
      setFont(2);
      h.setColor(3).drawString('ROTJAW', SCREEN_W / 2, 192);
      setFont(1);
      h.setColor(2).drawString("THAT BIKE ISN'T YOURS.", SCREEN_W / 2, 230);
      h.drawString('LEFT CLICK', SCREEN_W / 2, 276);
    } else if (talkStep == 1) {
      setFont(2);
      h.setColor(3).drawString('ROTJAW', SCREEN_W / 2, 192);
      setFont(1);
      h.setColor(2).drawString('BEAT ME AROUND THE TRACK.', SCREEN_W / 2, 224);
      h.drawString('THEN THE KEYS ARE YOURS.', SCREEN_W / 2, 242);
      h.drawString('LEFT CLICK', SCREEN_W / 2, 276);
    } else {
      setFont(2);
      h.setColor(3).drawString('ROTJAW', SCREEN_W / 2, 192);
      setFont(1);
      h.setColor(choice == 0 ? 3 : 2).drawString(
        (choice == 0 ? '> ' : '  ') + "YOU'RE ON",
        145,
        246,
      );
      h.setColor(choice == 1 ? 3 : 2).drawString(
        (choice == 1 ? '> ' : '  ') + 'WALK AWAY',
        335,
        246,
      );
      h.setColor(2).drawString('TURN WHEEL / LEFT CLICK', SCREEN_W / 2, 276);
    }
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function openChoice() {
    dialog = 1;
    choice = 0;
    talkStep = storyData().bikeRaceComplete ? 2 : 0;
    queueX = queueY = 0;
    drawChoice();
  }
  function confirmChoice() {
    if (!dialog) return;
    if (!storyData().bikeRaceComplete && talkStep < 2) {
      talkStep++;
      drawChoice();
      return;
    }
    dialog = 0;
    if (choice) {
      message = storyData().bikeRaceComplete
        ? 'TRACK CAN WAIT'
        : 'ROTJAW: FIGURED AS MUCH';
      drawAll();
    } else startTrack();
  }
  function activate() {
    const chosen = action;
    if (!chosen) {
      message = 'NOTHING HERE';
      drawFooter(1);
      return;
    }
    if (chosen == 1) {
      enterTavern();
      return;
    }
    if (chosen == 2) {
      if (!storyUnlocked()) {
        message = "ROTJAW WON'T TALK UNTIL SOLOMON RAY IS DEALT WITH";
        drawFooter(1);
        return;
      }
      openChoice();
      return;
    }
    if (chosen == 3) {
      toSunscar();
      return;
    }
    if (chosen == 4) {
      toDogtown();
      return;
    }
  }
  function openPause() {
    if (busy || dialog) return;
    queueX = queueY = 0;
    saveState();
    shutdown();
    api.pause({
      map: 'WORLD_02',
      mode: 'image',
      x: playerX,
      y: playerY,
      facing: facing,
      city: "ROT'S CROSSING",
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
    if (dialog) {
      confirmChoice();
      return;
    }
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
    if (dialog) {
      if (storyData().bikeRaceComplete || talkStep >= 2) {
        choice = choice ? 0 : 1;
        drawChoice();
      }
      return;
    }
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
  storyData();
  storyData().bikeActive = 0;
  riding = riding && !!storyData().motorcycle;
  if (args && args.x !== undefined) {
    playerX = parseInt(args.x, 10);
    playerY = parseInt(args.y, 10);
    facing = args.facing || 'down';
  } else if (state.map == 'WORLD_02' && state.x !== undefined) {
    playerX = parseInt(state.x, 10);
    playerY = parseInt(state.y, 10);
    facing = state.facing || 'down';
  }
  if (
    isNaN(playerX) ||
    isNaN(playerY) ||
    playerX < 80 ||
    playerY < 80 ||
    playerX > MAP_W - 80 ||
    playerY > MAP_H - 50
  ) {
    playerX = 1268;
    playerY = 168;
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
  saveState();
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, save: saveState, remove: teardown };
});
