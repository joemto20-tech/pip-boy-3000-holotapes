// Attract mode. Wanders Sunscar on its own until a click returns to the title menu.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    FOOTER_Y = 296,
    ROW_BYTES = 120,
    PAGE_BYTES = 35520,
    WALK_STEP = 6,
    FRAME_MS = 70,
    SPRITE_SIZE = 42,
    SPRITE_OFF_X = 4,
    SPRITE_OFF_Y = 8;
  let mapFile = 0,
    collision = 0,
    playerX = 704,
    playerY = 255,
    facing = 'down',
    playerImage = 0,
    playerKey = '',
    playerFrame = 1,
    camX = 0,
    camY = 0,
    pageIndex = -1,
    frameTimer = 0,
    stopped = 0,
    stepsLeft = 0,
    direction = 1,
    message = 'DEMO MODE';
  function collect() {}
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
  function closeMap() {
    try {
      if (mapFile && mapFile.close) mapFile.close();
    } catch (err) {}
    mapFile = 0;
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
  function playerSprite() {
    let data,
      key =
        facing == 'down'
          ? 'PD'
          : facing == 'left'
            ? 'PL'
            : facing == 'right'
              ? 'PR'
              : 'PU';
    if (playerKey == key) return playerImage;
    playerImage = 0;
    playerKey = key;
    data = readFile(BASE + key + '.BIN');
    if (data && data.length >= 1323)
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
  function collisionBit(col, row) {
    let index, byte;
    if (col < 0 || row < 0 || col >= 120 || row >= 90) return 1;
    index = row * 120 + col;
    byte = collision.charCodeAt
      ? collision.charCodeAt(index >> 3)
      : collision[index >> 3];
    return (byte >> (7 - (index & 7))) & 1;
  }
  function blocked(atX, atY) {
    const left = atX + 9,
      right = atX + 25,
      top = atY + 25,
      bottom = atY + 33;
    return (
      atX < 0 ||
      atY < 0 ||
      atX + 34 > 1440 ||
      atY + 34 > 1080 ||
      collisionBit((left / 12) | 0, (top / 12) | 0) ||
      collisionBit((right / 12) | 0, (top / 12) | 0) ||
      collisionBit((left / 12) | 0, (bottom / 12) | 0) ||
      collisionBit((right / 12) | 0, (bottom / 12) | 0)
    );
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
  function restoreRows(fromY, toY) {
    let buffer,
      top = Math.max(0, (Math.min(fromY, toY) - camY - SPRITE_OFF_Y - 2) | 0),
      bottom = Math.min(
        FOOTER_Y,
        (Math.max(fromY, toY) + SPRITE_SIZE - camY + 2) | 0,
      ),
      remaining,
      offset,
      take,
      chunk;
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
      atX = playerX - camX - SPRITE_OFF_X,
      atY = playerY - camY - SPRITE_OFF_Y;
    if (image)
      try {
        h.setColor(3).drawImage(image, atX, atY, { frame: playerFrame % 3 });
        return;
      } catch (err) {
        try {
          h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        } catch (err2) {}
      }
    h.setColor(3).drawRect(atX + 11, atY + 7, atX + 30, atY + 37);
  }
  function drawFooter() {
    h.setClipRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, FOOTER_Y - 1, SCREEN_W - 1, FOOTER_Y - 1);
    h.setFontAlign(0, 0);
    setFont(2);
    h.setColor(3).drawString(
      'DEMO - LEFT CLICK MENU',
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
  }
  function drawAll() {
    camX = cameraX(playerX);
    camY = cameraY(playerY);
    drawPage();
    drawPlayer();
    drawFooter();
  }
  function pickDirection() {
    direction = Math.randInt(4);
    stepsLeft = 10 + Math.randInt(22);
  }
  function wander() {
    let oldX = playerX,
      oldY = playerY,
      moveX = direction == 0 ? -WALK_STEP : direction == 1 ? WALK_STEP : 0,
      moveY = direction == 2 ? -WALK_STEP : direction == 3 ? WALK_STEP : 0,
      nextX = playerX + moveX,
      nextY = playerY + moveY,
      nextCamX,
      nextCamY;
    if (moveX < 0) facing = 'left';
    else if (moveX > 0) facing = 'right';
    else if (moveY < 0) facing = 'up';
    else facing = 'down';
    if (stepsLeft-- <= 0 || blocked(nextX, nextY)) {
      pickDirection();
      return;
    }
    playerX = nextX;
    playerY = nextY;
    playerFrame = (playerFrame + 1) % 3;
    nextCamX = cameraX(playerX);
    nextCamY = cameraY(playerY);
    if (nextCamX != camX || nextCamY != camY) {
      drawAll();
      return;
    }
    restoreRows(oldY, playerY);
    drawPlayer();
    drawFooter();
  }
  function tick() {
    if (stopped) return;
    wander();
    h.flip();
    Pip.lastFlip = getTime();
  }
  function toMenu() {
    if (stopped) return;
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    frameTimer = 0;
    closeMap();
    collision = playerImage = 0;
    collect();
    if (api.menu) api.menu();
    else if (api.exit) api.exit();
  }
  function onKnob1(dir, held) {
    if (dir === 0 && !held) toMenu();
  }
  function onKnob2(dir) {}
  openMap();
  pickDirection();
  drawAll();
  tick();
  frameTimer = setInterval(tick, FRAME_MS);
  return {
    k1: onKnob1,
    k2: onKnob2,
    remove: function () {
      stopped = 1;
      if (frameTimer) clearInterval(frameTimer);
      frameTimer = 0;
      closeMap();
      collision = playerImage = 0;
      collect();
    },
  };
});
