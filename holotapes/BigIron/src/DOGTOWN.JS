// World 3 - Dogtown Heights. Sheriff arrival scene, three-item delivery quest, Big Iron Hotel entrance.
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
    playerX = 820,
    playerY = 850,
    facing = 'up',
    message = 'WELCOME TO DOGTOWN HEIGHTS',
    action = 0,
    stopped = 0,
    busy = 0,
    introPhase = 0,
    introStage = 0,
    introLine = 0;
  let dogX = 820,
    dogY = 886,
    dogFacing = 'up',
    dogFrame = 0,
    dogImage = 0,
    dogKey = '',
    trailX = [820, 820, 820, 820, 820],
    trailY = [886, 886, 886, 886, 886],
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
    riding = args.bikeEquip === 1,
    bikeVX = 0,
    bikeVY = 0,
    sheriffX = 1010,
    sheriffY = 440,
    sheriffFacing = 'left',
    sheriffFrame = 0,
    sheriffImage = 0,
    sheriffKey = '';
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
      mapFile = E.openFile(BASE + 'W3.BIN', 'r');
    } catch (err) {
      mapFile = 0;
    }
    if (!mapFile) throw 'W3.BIN';
    collision = readFile(BASE + 'C3.BIN');
    if (!collision || collision.length < 1383) throw 'C3.BIN';
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
    state.story.deadLead = state.story.deadLead || 0;
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
    state.map = 'WORLD_03';
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
  function sheriffSprite() {
    let dir =
        sheriffFacing == 'left'
          ? 'L'
          : sheriffFacing == 'right'
            ? 'R'
            : sheriffFacing == 'up'
              ? 'U'
              : 'D',
      data;
    if (sheriffKey == dir) return sheriffImage;
    sheriffImage = 0;
    sheriffKey = dir;
    data = readFile(BASE + 'SHERIFF' + dir + '.BIN');
    if (data && data.length >= 289)
      sheriffImage = {
        width: 34,
        height: 34,
        bpp: 2,
        transparent: 0,
        buffer: data,
      };
    else
      sheriffImage =
        readFile(BASE + 'SHERIFF' + dir + '.IMG') ||
        readFile(BASE + 'RESIDENTD.IMG') ||
        0;
    return sheriffImage;
  }
  function drawSheriff() {
    let image, atX, atY;
    if (!introPhase) return;
    image = sheriffSprite();
    atX = sheriffX - camX - SPRITE_OFF_X;
    atY = sheriffY - camY - SPRITE_OFF_Y;
    if (image)
      try {
        h.setColor(3).drawImage(image, atX, atY);
        return;
      } catch (err) {}
    h.setColor(3).fillRect(atX + 10, atY + 6, atX + 30, atY + 38);
    h.setColor(0).drawString('S', atX + 16, atY + 15);
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
  function withinReach(atX, atY, reachX, reachY) {
    return (
      Math.abs(playerX + 17 - atX) <= reachX &&
      Math.abs(playerY + 30 - atY) <= reachY
    );
  }
  function isCleared(key) {
    return !!(state.cleared && state.cleared[key]);
  }
  function deliveredCount() {
    const record = storyData();
    return (
      (record.dogSupply ? 1 : 0) +
      (record.dogMeds ? 1 : 0) +
      (record.dogParts ? 1 : 0)
    );
  }
  function findAction() {
    if (introPhase) return 0;
    if (withinReach(1010, 440, 66, 50)) return 1;
    if (withinReach(168, 518, 62, 48)) return 2;
    if (withinReach(975, 670, 62, 48)) return 3;
    if (withinReach(1370, 668, 70, 54)) return 4;
    if (withinReach(620, 455, 64, 52)) return 5;
    if (!isCleared('d0') && withinReach(1215, 430, 78, 56)) return 6;
    if (withinReach(836, 206, 84, 58)) return 7;
    if (withinReach(1046, 844, 92, 66)) return 8;
    if (withinReach(820, 898, 84, 40)) return 9;
    return 0;
  }
  function promptFor(action) {
    const story = storyData(),
      foe = deliveredCount();
    if (action == 1)
      return story.dogQuest == 2
        ? 'SHERIFF: DOGTOWN OWES YOU'
        : story.dogQuest
          ? 'REPORT TO THE SHERIFF (' + foe + '/3)'
          : 'TALK TO THE SHERIFF?';
    if (action == 2)
      return story.dogSupply
        ? 'SUPPLY CRATE COLLECTED'
        : 'CHECK DOGTOWN SUPPLY?';
    if (action == 3)
      return story.dogMeds ? 'MEDICINE COLLECTED' : "CHECK DOC'S DELIVERY?";
    if (action == 4)
      return story.dogParts ? 'ENGINE PARTS COLLECTED' : 'CHECK THE GARAGE?';
    if (action == 5) return 'ENTER GENERAL STORE?';
    if (action == 6) return 'RADSCORPIONS IN THE PEN!';
    if (action == 7)
      return story.finalBossDefeated
        ? 'BIG IRON HOTEL - CLEARED'
        : story.ammoCrafted
          ? 'ENTER BIG IRON HOTEL - WARDEN WAITS'
          : story.dogQuest == 2
            ? 'ENTER BIG IRON HOTEL - FIND AMMO PARTS'
            : story.dogQuest
              ? 'ENTER HOTEL - CASING SET STILL NEEDED'
              : 'BIG IRON HOTEL - FIND THE SHERIFF FIRST';
    if (action == 8) return 'READ THE DOGTOWN SIGN?';
    if (action == 9) return "RETURN TO ROT'S CROSSING?";
    return message;
  }
  function drawFooter(force) {
    const chosen = findAction(),
      text = message || promptFor(chosen),
      key = chosen + '|' + text;
    action = chosen;
    if (!force && key == footerKey) return;
    footerKey = key;
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(chosen ? 3 : 2).drawString(
      clip(text, 40),
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function drawActors() {
    drawSheriff();
    drawDog();
    drawPlayer();
  }
  function drawAll() {
    drawPage();
    drawActors();
    drawFooter(1);
  }
  function idle() {
    if (playerFrame == 1) return;
    playerFrame = 1;
    restoreRows(playerY, playerY, dogY, dogY);
    drawActors();
    drawFooter(0);
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
    if (busy) return;
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
  function walkSheriffTo(toX, toY) {
    let oldX = sheriffX,
      oldY = sheriffY,
      stride = 8,
      moved = 0;
    if (Math.abs(sheriffX - toX) > stride) {
      if (sheriffX < toX) {
        sheriffX += stride;
        sheriffFacing = 'right';
      } else {
        sheriffX -= stride;
        sheriffFacing = 'left';
      }
      moved = 1;
    } else sheriffX = toX;
    if (!moved && Math.abs(sheriffY - toY) > stride) {
      if (sheriffY < toY) {
        sheriffY += stride;
        sheriffFacing = 'down';
      } else {
        sheriffY -= stride;
        sheriffFacing = 'up';
      }
      moved = 1;
    } else if (!moved) sheriffY = toY;
    if (moved) {
      sheriffFrame = (sheriffFrame + 1) % 3;
      restoreRows(oldY, sheriffY, playerY, dogY);
      drawActors();
      drawFooter(0);
      return 0;
    }
    return 1;
  }
  function introText() {
    return introLine == 0
      ? 'SHERIFF: HOLD UP, COURIER.'
      : introLine == 1
        ? "DOGTOWN'S SUPPLIES ARE SCATTERED."
        : introLine == 2
          ? 'FIND MEDICINE, PARTS, AND THE SUPPLY CRATE.'
          : 'THE HOTEL WORKSHOP MAY HOLD YOUR AMMO PARTS.';
  }
  function startIntro() {
    riding = 0;
    bikeVX = bikeVY = queueX = queueY = 0;
    playerKey = '';
    playerImage = 0;
    introPhase = 1;
    introStage = 0;
    introLine = 0;
    busy = 1;
    sheriffX = 1010;
    sheriffY = 440;
    sheriffFacing = 'left';
    message = "SOMEONE IS COMING FROM THE SHERIFF'S OFFICE";
  }
  function finishIntro() {
    const story = storyData();
    story.dogQuest = 1;
    story.dogArrivalDone = 1;
    introPhase = 0;
    busy = 0;
    sheriffImage = 0;
    sheriffKey = '';
    saveState();
    message = 'DOGTOWN DELIVERY QUEST STARTED';
    drawAll();
  }
  function introStep() {
    if (introPhase == 1) {
      if (introStage == 0) {
        if (walkSheriffTo(820, 440)) introStage = 1;
      } else if (introStage == 1) {
        if (walkSheriffTo(820, 790)) {
          introPhase = 2;
          introLine = 0;
          message = introText();
          drawFooter(1);
        }
      }
      return;
    }
    if (introPhase == 3) {
      if (introStage == 0) {
        if (walkSheriffTo(820, 440)) introStage = 1;
      } else if (introStage == 1) {
        if (walkSheriffTo(1010, 440)) finishIntro();
      }
    }
  }
  function introClick() {
    if (introPhase != 2) return;
    introLine++;
    if (introLine < 4) {
      message = introText();
      drawFooter(1);
      return;
    }
    introPhase = 3;
    introStage = 0;
    message = "SHERIFF: I'LL BE WAITING INSIDE.";
    drawFooter(1);
  }
  function tick() {
    let x = 0,
      y = 0;
    if (stopped) return;
    if (introPhase) introStep();
    else if (!busy) {
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
  function shutdown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    if (clickTimer) clearTimeout(clickTimer);
    frameTimer = clickTimer = 0;
    closeMap();
    collision = playerImage = dogImage = sheriffImage = trailX = trailY = 0;
  }
  function collectDelivery(key, label) {
    const record = storyData();
    if (!record.dogQuest) {
      message = 'THE SHERIFF HAS THE DELIVERY MANIFEST';
      drawFooter(1);
      return;
    }
    if (record[key]) {
      message = label + ' ALREADY COLLECTED';
      drawFooter(1);
      return;
    }
    record[key] = 1;
    record.deadLead = (parseInt(record.deadLead, 10) || 0) + 1;
    saveState();
    message = label + " + DEAD MAN'S LEAD (" + deliveredCount() + '/3)';
    drawFooter(1);
  }
  function talkToSheriff() {
    const record = storyData(),
      count = deliveredCount();
    if (!record.dogQuest) {
      record.dogQuest = 1;
      saveState();
      message = 'FETCH SUPPLY, MEDICINE, AND ENGINE PARTS';
    } else if (record.dogQuest == 1 && count < 3)
      message = 'DELIVERIES FOUND ' + count + '/3';
    else if (record.dogQuest == 1) {
      record.dogQuest = 2;
      record.dogCases = 1;
      record.rounds.DOGTOWN_CASES = 1;
      saveState();
      message = 'DOGTOWN CASING SET EARNED';
    } else message = 'DOGTOWN OWES YOU, COURIER';
    drawFooter(1);
  }
  function toCrossing() {
    const record = {
      map: 'WORLD_02',
      mode: 'image',
      x: 935,
      y: 840,
      facing: 'up',
      bikeEquip: riding ? 1 : 0,
      msg: 'RETURNED FROM DOGTOWN HEIGHTS',
    };
    saveState();
    shutdown();
    api.world(record);
  }
  function startBattle() {
    const payload = {
      enemy: 'RADSCORPION',
      map: 'WORLD_03',
      mode: 'image',
      x: playerX,
      y: playerY,
      facing: facing,
      interact: 'd0',
      once: true,
    };
    saveState();
    shutdown();
    api.battle(payload);
  }
  function openShop() {
    const payload = {
      vendor: 'DOGTOWN GENERAL',
      folder: 'Shop',
      map: 'WORLD_03',
      mode: 'image',
      x: playerX,
      y: playerY,
      facing: facing,
    };
    saveState();
    shutdown();
    api.shop(payload);
  }
  function activate() {
    const chosen = action,
      story = storyData();
    if (!chosen) {
      message = 'NOTHING HERE';
      drawFooter(1);
      return;
    }
    if (chosen == 1) talkToSheriff();
    else if (chosen == 2) collectDelivery('dogSupply', 'SUPPLY CRATE');
    else if (chosen == 3) collectDelivery('dogMeds', 'MEDICINE');
    else if (chosen == 4) collectDelivery('dogParts', 'ENGINE PARTS');
    else if (chosen == 5) openShop();
    else if (chosen == 6) startBattle();
    else if (chosen == 7) {
      if (!story.dogQuest) {
        message = 'THE SHERIFF KNOWS WHO HOLDS THE HOTEL KEY';
        drawFooter(1);
        return;
      }
      saveState();
      shutdown();
      api.hotel({
        map: 'WORLD_03',
        returnX: playerX,
        returnY: playerY,
        returnFacing: facing,
        room: 0,
        msg: 'ENTERED BIG IRON HOTEL',
      });
    } else if (chosen == 8) {
      message = 'WELCOME TO DOGTOWN HEIGHTS';
      drawFooter(1);
    } else if (chosen == 9) toCrossing();
  }
  function openPause() {
    if (busy || introPhase) return;
    queueX = queueY = 0;
    saveState();
    shutdown();
    api.pause({
      map: 'WORLD_03',
      mode: 'image',
      x: playerX,
      y: playerY,
      facing: facing,
      city: 'DOGTOWN HEIGHTS',
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
    if (introPhase) {
      introClick();
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
    if (stopped || !dir || introPhase) return;
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
  if (!storyUnlocked()) {
    stopped = 1;
    clickTimer = setTimeout(function () {
      clickTimer = 0;
      api.world({
        map: 'WORLD_02',
        mode: 'image',
        x: 935,
        y: 840,
        facing: 'up',
        msg: 'DOGTOWN LOCKED - DEFEAT SOLOMON RAY',
      });
    }, 90);
    return {
      k1: function () {},
      k2: function () {},
      remove: function () {
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = 0;
      },
    };
  }
  riding = riding && !!storyData().motorcycle;
  if (args && args.x !== undefined) {
    playerX = parseInt(args.x, 10);
    playerY = parseInt(args.y, 10);
    facing = args.facing || 'up';
  } else if (state.map == 'WORLD_03' && state.x !== undefined) {
    playerX = parseInt(state.x, 10);
    playerY = parseInt(state.y, 10);
    facing = state.facing || 'up';
  }
  if (
    isNaN(playerX) ||
    isNaN(playerY) ||
    playerX < 80 ||
    playerY < 80 ||
    playerX > MAP_W - 80 ||
    playerY > MAP_H - 25
  ) {
    playerX = 820;
    playerY = 850;
    facing = 'up';
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
  if (!storyData().dogQuest && !storyData().dogArrivalDone) startIntro();
  openMap();
  saveState();
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, save: saveState, remove: teardown };
});
