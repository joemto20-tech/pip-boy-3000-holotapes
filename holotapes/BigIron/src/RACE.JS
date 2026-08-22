// Rot's Crossing track. Lane racer vs Rotjaw or an imported rival ghost; writes RACE.JSON records.
(function (api, args) {
  args = args || {};
  const BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    FOOTER_Y = 296,
    FRAME_MS = 40,
    FINISH = 2600,
    SAMPLE_EVERY = 8;
  let stopped = 0,
    finished = 0,
    won = 0,
    frames = 0,
    playerDist = 0,
    rivalDist = 0,
    throttle = 7,
    rivalSpeed = 6,
    playerLane = 1,
    rivalLane = 1,
    boost = 0,
    rivalBoost = 0,
    flash = 0,
    timer = 0,
    playerBike = 0,
    rivalBike = 0,
    message = '',
    storyRace = 1,
    ghost = 0,
    rivalName = 'ROTJAW',
    ghostFrames = 0,
    ghostLanes = '',
    lanePath = '',
    rivalFinished = 0,
    newRecord = 0;
  let OBSTACLE_AT = [280, 510, 760, 1010, 1280, 1540, 1810, 2070, 2320];
  let OBSTACLE_LANE = [0, 2, 1, 0, 2, 1, 2, 0, 1];
  let OBSTACLE_KIND = [0, 1, 0, 1, 0, 1, 0, 1, 0];
  let PLAYER_HIT = [0, 0, 0, 0, 0, 0, 0, 0, 0],
    RIVAL_HIT = [0, 0, 0, 0, 0, 0, 0, 0, 0];
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
  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }
  function cleanName(name) {
    name = String(name || 'COURIER').toUpperCase();
    name = name.replace(/[^A-Z0-9 _-]/g, '');
    return name.substr(0, 12) || 'COURIER';
  }
  function storyData() {
    const point = playerRecord(),
      story = point.wb || {};
    story.story = story.story || {};
    return story.story;
  }
  function playerSprite() {
    let data;
    if (playerBike) return playerBike;
    data = readFile(BASE + 'RACEP.BIN');
    playerBike =
      data && data.length >= 936
        ? { width: 72, height: 52, bpp: 2, transparent: 0, buffer: data }
        : 0;
    return playerBike;
  }
  function rivalSprite() {
    let data, key;
    if (rivalBike) return rivalBike;
    key = storyRace || !ghost ? 'RACER.BIN' : 'RACEP.BIN';
    data = readFile(BASE + key);
    rivalBike =
      data && data.length >= 936
        ? { width: 72, height: 52, bpp: 2, transparent: 0, buffer: data }
        : 0;
    return rivalBike;
  }
  function laneY(lane) {
    return 82 + lane * 68;
  }
  function formatTime(frames) {
    const tenths = Math.floor((frames * FRAME_MS) / 100);
    return Math.floor(tenths / 10) + '.' + (tenths % 10) + 's';
  }
  function loadGhost() {
    let raw, ghost;
    if (storyRace) return 0;
    raw = readFile(BASE + 'RIVAL.JSON');
    if (!raw) return 0;
    try {
      ghost = JSON.parse(raw);
    } catch (err) {
      return 0;
    }
    if (!ghost || !ghost.frames) return 0;
    ghost.frames = parseInt(ghost.frames, 10) || 0;
    if (ghost.frames < 80 || ghost.frames > 3000) return 0;
    ghost.name = cleanName(ghost.name || 'RIVAL');
    ghost.lanes = String(ghost.lanes || '');
    return ghost;
  }
  function drawRoad() {
    let index,
      atX,
      scroll = (playerDist * 3) % 72;
    h.setColor(3).fillRect(0, 0, SCREEN_W - 1, FOOTER_Y - 1);
    h.setColor(1).fillRect(0, 58, SCREEN_W - 1, 265);
    h.setColor(2).fillRect(0, 72, SCREEN_W - 1, 250);
    h.setColor(1).drawLine(0, 137, SCREEN_W - 1, 137);
    h.drawLine(0, 205, SCREEN_W - 1, 205);
    for (index = -1; index < 8; index++) {
      atX = index * 72 - scroll;
      h.setColor(3).fillRect(atX, 103, atX + 28, 107);
      h.fillRect(atX, 171, atX + 28, 175);
      h.fillRect(atX, 239, atX + 28, 243);
    }
    h.setColor(1);
    for (index = 0; index < 12; index++) {
      atX = index * 53 - ((playerDist * 2) % 636) - 30;
      h.fillRect(atX, 48, atX + 2, 57);
      h.fillRect(atX, 266, atX + 2, 277);
    }
  }
  function drawObstacle(index) {
    const atX = 92 + ((OBSTACLE_AT[index] - playerDist) >> 1),
      atY = laneY(OBSTACLE_LANE[index]) + 13;
    if (atX < -36 || atX > SCREEN_W + 10 || PLAYER_HIT[index]) return;
    if (OBSTACLE_KIND[index]) {
      h.setColor(3);
      h.drawLine(atX + 2, atY + 20, atX + 14, atY + 8);
      h.drawLine(atX + 14, atY + 8, atX + 26, atY + 20);
      h.drawLine(atX + 8, atY + 20, atX + 20, atY + 8);
      h.drawLine(atX + 20, atY + 8, atX + 32, atY + 20);
      h.setColor(1).fillRect(atX + 4, atY + 22, atX + 30, atY + 25);
    } else {
      h.setColor(0).fillRect(atX, atY, atX + 28, atY + 24);
      h.setColor(3).drawRect(atX + 3, atY + 3, atX + 25, atY + 21);
      h.drawLine(atX + 4, atY + 4, atX + 24, atY + 20);
      h.drawLine(atX + 24, atY + 4, atX + 4, atY + 20);
    }
  }
  function drawRider(atX, atY, isRival) {
    const image = isRival ? rivalSprite() : playerSprite(),
      label = isRival ? rivalName : 'YOU';
    if (image)
      try {
        h.drawImage(image, atX, atY);
      } catch (err) {}
    else {
      h.setColor(0).fillRect(atX + 8, atY + 14, atX + 62, atY + 34);
      h.setColor(3).drawCircle(atX + 14, atY + 42, 8);
      h.drawCircle(atX + 56, atY + 42, 8);
    }
    h.setFontAlign(0, -1);
    setFont(1);
    h.setColor(isRival ? 2 : 3).drawString(
      label.substr(0, 9),
      atX + 36,
      atY - 10,
    );
  }
  function drawBar(atX, atY, width, value, max) {
    const filled = Math.floor((width * clamp(value, 0, max)) / max);
    h.setColor(1).fillRect(atX, atY, atX + width, atY + 6);
    h.setColor(3).fillRect(atX, atY, atX + filled, atY + 6);
    h.setColor(2).drawRect(atX, atY, atX + width, atY + 6);
  }
  function drawAll() {
    let index,
      rivalX = 86 + Math.floor((rivalDist - playerDist) / 5);
    drawRoad();
    for (index = 0; index < OBSTACLE_AT.length; index++) drawObstacle(index);
    rivalX = clamp(rivalX, 42, 360);
    drawRider(rivalX, laneY(rivalLane), 1);
    drawRider(86, laneY(playerLane), 0);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, 51);
    h.setFontAlign(-1, -1);
    setFont(1);
    h.setColor(3).drawString("ROT'S CROSSING", 8, 5);
    h.setColor(2).drawString(
      'THROTTLE ' + throttle + (boost ? '  BOOST' : ''),
      8,
      21,
    );
    h.setFontAlign(1, -1);
    h.setColor(3).drawString(
      'YOU ' + Math.floor((playerDist * 100) / FINISH) + '%',
      SCREEN_W - 8,
      5,
    );
    h.setColor(2).drawString(
      rivalName + ' ' + Math.floor((rivalDist * 100) / FINISH) + '%',
      SCREEN_W - 8,
      21,
    );
    drawBar(8, 39, 218, playerDist, FINISH);
    drawBar(254, 39, 218, rivalDist, FINISH);
    h.setColor(0).fillRect(0, FOOTER_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setFontAlign(0, 0);
    setFont(1);
    h.setColor(2).drawString(
      message || 'UP/DOWN LANE  RIGHT WHEEL THROTTLE  HIT CHEVRONS TO BOOST',
      SCREEN_W / 2,
      FOOTER_Y + 11,
    );
  }
  function rivalAi() {
    let index, gap;
    if (frames % 42 == 0) rivalSpeed = 6 + Math.randInt(3);
    for (index = 0; index < OBSTACLE_AT.length; index++)
      if (!RIVAL_HIT[index]) {
        gap = OBSTACLE_AT[index] - rivalDist;
        if (gap > 35 && gap < 135) {
          if (OBSTACLE_KIND[index]) rivalLane = OBSTACLE_LANE[index];
          else if (OBSTACLE_LANE[index] == rivalLane)
            rivalLane = (rivalLane + (Math.randInt(2) ? 1 : 2)) % 3;
          break;
        }
      }
  }
  function rivalContact() {
    let index;
    for (index = 0; index < OBSTACLE_AT.length; index++)
      if (!RIVAL_HIT[index] && Math.abs(OBSTACLE_AT[index] - rivalDist) < 30) {
        RIVAL_HIT[index] = 1;
        if (OBSTACLE_LANE[index] == rivalLane && OBSTACLE_KIND[index])
          rivalBoost = 20;
        else if (OBSTACLE_LANE[index] == rivalLane && !OBSTACLE_KIND[index])
          rivalSpeed = Math.max(5, rivalSpeed - 1);
      }
  }
  function playerContact() {
    let index;
    for (index = 0; index < OBSTACLE_AT.length; index++)
      if (
        !PLAYER_HIT[index] &&
        OBSTACLE_LANE[index] == playerLane &&
        Math.abs(OBSTACLE_AT[index] - playerDist) < 34
      ) {
        PLAYER_HIT[index] = 1;
        if (OBSTACLE_KIND[index]) {
          boost = 22;
          playerDist += 16;
          message = 'BOOST';
        } else {
          throttle = Math.max(4, throttle - 2);
          playerDist = Math.max(0, playerDist - 45);
          flash = 8;
          message = 'CRATE HIT - THROTTLE DOWN';
        }
        return;
      }
  }
  function rivalStep() {
    let sample, lane;
    if (ghost) {
      rivalDist = Math.floor((FINISH * frames) / ghostFrames);
      if (rivalDist > FINISH) rivalDist = FINISH;
      if (ghostLanes) {
        sample = Math.floor(frames / SAMPLE_EVERY);
        if (sample >= ghostLanes.length) sample = ghostLanes.length - 1;
        if (sample >= 0) {
          lane = ghostLanes.charCodeAt(sample) - 48;
          if (lane >= 0 && lane <= 2) rivalLane = lane;
        }
      }
      return;
    }
    rivalAi();
    rivalDist += rivalSpeed + (rivalBoost ? 2 : 0);
    if (rivalBoost) rivalBoost--;
    rivalContact();
    if (rivalDist >= FINISH && !rivalFinished) {
      rivalDist = FINISH;
      rivalFinished = frames;
    }
  }
  function writeRecord(story) {
    const record = playerRecord(),
      entry = {
        version: 1,
        name: cleanName(record.name || 'COURIER'),
        frames: frames,
        lanes: lanePath,
      };
    story.trackBestFrames = frames;
    story.trackBestName = entry.name;
    writeFile(BASE + 'RACE.JSON', JSON.stringify(entry));
    newRecord = 1;
  }
  function saveResult(won) {
    const record = playerRecord(),
      state = record.wb || {},
      story = state.story || {};
    state.story = story;
    if (storyRace && won) {
      story.bikeRaceComplete = 1;
      story.bikeRunComplete = 1;
      story.bikeStolen = 1;
      story.motorcycle = 1;
      story.bikeTakenAt = 'ROTS_CROSSING';
      story.rotjawRaceWins = (parseInt(story.rotjawRaceWins, 10) || 0) + 1;
    } else if (!storyRace && playerDist >= FINISH) {
      story.trackRuns = (parseInt(story.trackRuns, 10) || 0) + 1;
      if (
        !(parseInt(story.trackBestFrames, 10) || 0) ||
        frames < parseInt(story.trackBestFrames, 10)
      )
        writeRecord(story);
    }
    state.map = 'WORLD_02';
    state.mode = 'image';
    state.x = parseInt(args.x, 10) || 1090;
    state.y = parseInt(args.y, 10) || 520;
    state.facing = args.facing || 'down';
    try {
      record.wb = state;
      syncPlayer();
    } catch (err) {}
  }
  function drawResult() {
    const rivalTime = ghost ? ghostFrames : rivalFinished;
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawRect(14, 14, SCREEN_W - 15, SCREEN_H - 15);
    h.setFontAlign(0, 0);
    if (storyRace) {
      setFont(3);
      h.setColor(3).drawString(
        won ? 'ROTJAW: KEEP IT.' : 'ROTJAW: NOT GOOD ENOUGH.',
        SCREEN_W / 2,
        72,
      );
      setFont(2);
      h.setColor(2).drawString(
        won ? 'THE KEYS ARE YOURS' : "HE'S STILL HOLDING THE KEYS",
        SCREEN_W / 2,
        122,
      );
      h.setColor(3).drawString(
        won
          ? 'TRACK TIME ' + formatTime(frames)
          : 'YOU REACHED ' + Math.floor((playerDist * 100) / FINISH) + '%',
        SCREEN_W / 2,
        164,
      );
    } else {
      setFont(3);
      h.setColor(3).drawString(
        newRecord ? 'NEW RECORD' : 'TRACK COMPLETE',
        SCREEN_W / 2,
        68,
      );
      setFont(2);
      h.setColor(2).drawString(
        'YOUR TIME ' + formatTime(frames),
        SCREEN_W / 2,
        112,
      );
      h.setColor(3).drawString(
        rivalName + ' ' + formatTime(rivalTime || frames),
        SCREEN_W / 2,
        150,
      );
      setFont(1);
      h.setColor(2).drawString(
        won ? 'YOU FINISHED AHEAD' : 'THE OTHER TIME WAS FASTER',
        SCREEN_W / 2,
        190,
      );
    }
    setFont(1);
    h.setColor(2).drawString(
      "LEFT CLICK TO RETURN TO ROT'S CROSSING",
      SCREEN_W / 2,
      250,
    );
    h.flip();
    try {
      Pip.lastFlip = getTime();
    } catch (err) {}
  }
  function finishRace(success) {
    if (finished) return;
    finished = 1;
    won = success ? 1 : 0;
    if (timer) clearInterval(timer);
    timer = 0;
    saveResult(won);
    drawResult();
  }
  function tick() {
    let speed,
      won = 0;
    if (stopped || finished) return;
    frames++;
    if (frames % SAMPLE_EVERY == 0 && lanePath.length < 96)
      lanePath += String(playerLane);
    rivalStep();
    speed = throttle + (boost ? 3 : 0);
    playerDist += speed;
    if (boost) boost--;
    playerContact();
    if (flash) flash--;
    if (frames % 24 == 0 && message) message = '';
    drawAll();
    if (flash) {
      h.setColor(0).drawRect(2, 54, SCREEN_W - 3, FOOTER_Y - 3);
      h.drawRect(5, 57, SCREEN_W - 6, FOOTER_Y - 6);
    }
    h.flip();
    try {
      Pip.lastFlip = getTime();
    } catch (err) {}
    if (storyRace) {
      if (playerDist >= FINISH || rivalDist >= FINISH) {
        if (!rivalFinished && rivalDist >= FINISH) rivalFinished = frames;
        won =
          playerDist >= FINISH &&
          (rivalDist < FINISH || playerDist >= rivalDist);
        finishRace(won);
      }
    } else {
      if (rivalDist >= FINISH && !rivalFinished)
        rivalFinished = ghost ? ghostFrames : frames;
      if (playerDist >= FINISH) {
        won = ghost
          ? frames <= ghostFrames
          : !rivalFinished || frames <= rivalFinished;
        finishRace(won);
      }
    }
  }
  function leaveTrack() {
    let note;
    if (stopped) return;
    stopped = 1;
    if (timer) clearInterval(timer);
    timer = 0;
    playerBike = rivalBike = 0;
    if (storyRace)
      note = won
        ? 'ROTJAW HANDED OVER THE KEYS'
        : 'ROTJAW IS STILL BY THE TRACK';
    else
      note = newRecord ? 'NEW TRACK RECORD SAVED' : 'RETURNED FROM THE TRACK';
    api.world({
      map: 'WORLD_02',
      mode: 'image',
      x: 1090,
      y: 535,
      facing: 'down',
      bikeEquip: 0,
      msg: note,
    });
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (finished) {
      if (dir === 0 && !held) leaveTrack();
      return;
    }
    if (dir === 0) return;
    if (!dir) return;
    playerLane = clamp(playerLane + (dir > 0 ? 1 : -1), 0, 2);
    message = 'LANE ' + (playerLane + 1);
  }
  function onKnob2(dir) {
    if (stopped || finished || !dir) return;
    throttle = clamp(throttle + (dir > 0 ? 1 : -1), 4, 9);
    message = 'THROTTLE ' + throttle;
  }
  function teardown() {
    stopped = 1;
    if (timer) clearInterval(timer);
    timer = 0;
    playerBike = rivalBike = ghost = 0;
    PLAYER_HIT = RIVAL_HIT = OBSTACLE_AT = OBSTACLE_LANE = OBSTACLE_KIND = 0;
  }
  storyRace = !storyData().bikeRaceComplete;
  ghost = loadGhost();
  if (ghost) {
    rivalName = ghost.name;
    ghostFrames = ghost.frames;
    ghostLanes = ghost.lanes;
  } else rivalName = 'ROTJAW';
  message = storyRace
    ? "ROTJAW: SHOW ME WHAT YOU'VE GOT"
    : 'HIT THE CHEVRONS FOR BOOST';
  drawAll();
  h.flip();
  try {
    Pip.lastFlip = getTime();
  } catch (err) {}
  timer = setInterval(tick, FRAME_MS);
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
