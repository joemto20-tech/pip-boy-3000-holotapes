// Turn-based battle. Video-driven enemy moves, Iron Warden plate fight, Psycho/Stimpak actions.
(function (api, args) {
  let BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    PANEL_Y = 192,
    enemyRoot = '',
    foe = 0,
    foeHp = 1,
    foeMaxHp = 1,
    playerHp = 1,
    playerMaxHp = 1,
    level = 1,
    selected = 0,
    phase = 0,
    locked = 1,
    stopped = 0,
    message = '',
    weapon = 0,
    turnTimer = 0,
    videoTimer = 0,
    afterVideo = 0,
    playerRoot = '',
    radTimer = 0,
    radLed = 0,
    pressAt = 0,
    playerName = 'WANDERER';
  let bossHeals = 0,
    lastMove = -1,
    ammo = 0,
    plates = 0,
    charge = 0,
    bonus = '',
    boost = 0,
    stims = 0;
  const CONDITIONS = [
    'perceptioncondition',
    'endurancecondition',
    'leftattackcondition',
    'rightattackcondition',
    'rightmobilitycondition',
    'leftmobilitycondition',
  ];
  const VIDEO_OPTS = { x: 0, y: 0, repeat: false, debug: false };
  const LEDS = [
    { pin: LED_RED, target: 0 },
    { pin: LED_GREEN, target: 0 },
    { pin: LED_BLUE, target: 0 },
  ];
  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }
  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (x) {
      return {};
    }
  }
  function stat(key, fallback) {
    const value = parseInt(playerRecord()[key], 10);
    return isNaN(value) ? fallback : value;
  }
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function clip(value, max) {
    value = value == null ? '' : String(value);
    return value.length > max ? value.substr(0, max - 1) + '~' : value;
  }
  function exists(path) {
    try {
      return !!fs.statSync(path);
    } catch (err) {
      return false;
    }
  }
  function folderFor(foeId) {
    foeId = String(foeId || '').toUpperCase();
    return foeId == 'RAIDER'
      ? 'RAIDER'
      : foeId == 'RADSCORPION' || foeId == 'RADROACH'
        ? 'RADSCORPION'
        : foeId == 'SOLOMON_RAY' || foeId == 'IRON_WARDEN'
          ? 'SOLOMON_RAY'
          : 'RAIDER';
  }
  // Resolve a folder that actually holds the clip we are about to ask for. SOLOMON_RAY ships
  // enemy moves only, so player-side clips fall through to the first complete enemy folder.
  function resolveRoot(preferred, probeClip) {
    let order = [preferred, 'RAIDER', 'RADSCORPION', 'SOLOMON_RAY'],
      index,
      folder;
    for (index = 0; index < order.length; index++) {
      folder = BASE + 'VIDEO/' + order[index] + '/';
      if (exists(folder + probeClip)) return folder;
    }
    return '';
  }
  function clipPath(clip) {
    const isPlayer =
        clip == 'P_MOVE_1.avi' ||
        clip == 'P_MOVE_2.avi' ||
        clip == 'PLAYER_FAINT.avi' ||
        clip == 'ENEMY_FAINT.avi' ||
        clip == 'VICTORY.avi' ||
        clip == 'DEFEAT.avi',
      dir = isPlayer ? playerRoot : enemyRoot;
    return dir ? dir + clip : '';
  }
  function blitRows(top, bottom) {
    const opts = Pip.blitOptions;
    if (!opts) {
      api.flip();
      return;
    }
    opts.y1 = Math.max(0, top | 0);
    opts.y2 = Math.max(opts.y1, Math.min(SCREEN_H - 1, bottom | 0));
    try {
      h.flip();
      if (typeof getTime == 'function') Pip.lastFlip = getTime();
    } finally {
      delete opts.y1;
      delete opts.y2;
    }
  }
  function syncPlayer() {
    try {
      player.modified = true;
      if (player.sync) player.sync();
    } catch (x) {}
  }
  function storyData() {
    const record = playerRecord(),
      save = record.wb || (record.wb = {}),
      story = save.story || (save.story = {});
    story.rounds = story.rounds || {};
    if (story.psycho === undefined)
      story.psycho = story.hotLoads === undefined ? 0 : story.hotLoads;
    return story;
  }
  function psychoCount() {
    return clamp(parseInt(storyData().psycho, 10) || 0, 0, 3);
  }
  function stimCount() {
    return Math.max(0, parseInt(stims, 10) || 0);
  }
  function readHp() {
    let record = playerRecord(),
      index,
      value,
      sum = 0;
    level = clamp(stat('level', 1), 1, NV ? 50 : 30);
    playerMaxHp = Math.max(60, 70 + stat('endurance', 5) * 10 + level * 5);
    for (index = 0; index < 6; index++) {
      value = parseFloat(record[CONDITIONS[index]]);
      sum += isNaN(value) ? 100 : clamp(value, 0, 100);
    }
    playerHp = clamp(Math.round((sum / 600) * playerMaxHp), 0, playerMaxHp);
  }
  function applyDamage(delta, persist) {
    let record = playerRecord(),
      index,
      value,
      scaled = (delta * 100) / playerMaxHp;
    readHp();
    for (index = 0; index < 6; index++) {
      value = parseFloat(record[CONDITIONS[index]]);
      if (isNaN(value)) value = 100;
      record[CONDITIONS[index]] = clamp(Math.round(value + scaled), 0, 100);
    }
    if (persist) syncPlayer();
    readHp();
  }
  function defineFoe(foeId) {
    let roll;
    if (foeId instanceof Array) foeId = foeId[Math.randInt(foeId.length)];
    foeId = String(foeId || 'RANDOM')
      .toUpperCase()
      .replace(/ /g, '_');
    if (foeId == 'RANDOM') {
      roll = Math.randInt(3);
      foeId = roll ? (roll == 1 ? 'RAIDER' : 'RADSCORPION') : 'RADROACH';
    }
    if (foeId == 'IRON_WARDEN')
      foe = {
        id: foeId,
        name: 'IRON WARDEN',
        level: 14,
        hp: 360,
        hits: 6,
        xp: 220,
        rad: 4,
        boss: 2,
        heals: 3,
      };
    else if (foeId == 'SOLOMON_RAY')
      foe = {
        id: foeId,
        name: 'SOLOMON RAY',
        level: 8,
        hp: 135,
        hits: 9,
        xp: 70,
        rad: 3,
        boss: 1,
        heals: 1,
      };
    else if (foeId == 'RAIDER')
      foe = { id: foeId, name: 'RAIDER', level: 5, hp: 70, hits: 5, xp: 32 };
    else if (foeId == 'RADSCORPION')
      foe = {
        id: foeId,
        name: 'RADSCORPION',
        level: 10,
        hp: 100,
        hits: 7,
        xp: 45,
      };
    else if (foeId == 'RADROACH')
      foe = { id: foeId, name: 'RADROACH', level: 4, hp: 55, hits: 4, xp: 24 };
    else
      foe = { id: 'GRANNY', name: 'GRANNY', level: 6, hp: 75, hits: 6, xp: 35 };
    foeMaxHp = foe.hp;
    foeHp = foeMaxHp;
    bossHeals = foe.heals || 0;
    plates = foe.id == 'IRON_WARDEN' ? 6 : 0;
  }
  function plateArmour() {
    const data = clamp(parseInt(weapon && weapon.dmg, 10) || 12, 8, 24),
      lost = 6 - plates;
    return Math.max(30, Math.round(16 + data * 1.15 + lost * 3));
  }
  function scaleFoe() {
    const data = clamp(parseInt(weapon && weapon.dmg, 10) || 12, 8, 24);
    if (foe.id == 'IRON_WARDEN') foeMaxHp = plateArmour();
    else
      foeMaxHp = Math.max(
        data * 3,
        Math.round(foe.hp * 0.35 + data * (foe.hits || 5) * 0.65),
      );
    foeHp = foeMaxHp;
  }
  function setLed(red, green, blue) {
    try {
      const brightness =
        Pip.settings && Pip.settings.brightness !== undefined
          ? Pip.settings.brightness
          : 1;
      LEDS[0].target = red * brightness;
      LEDS[1].target = green * brightness;
      LEDS[2].target = blue * brightness;
      Pip.fadeTo(LEDS);
    } catch (err) {}
  }
  function stopRads() {
    if (radTimer) {
      clearTimeout(radTimer);
      radTimer = 0;
    }
    radLed = 0;
    setLed(1, 0.5, 0);
  }
  function radTick() {
    let record,
      value,
      dose = foe.rad,
      radXLeft;
    if (stopped || phase == 3 || !foe.rad) return;
    radLed = !radLed;
    setLed(1, radLed ? 0 : 0.5, 0);
    record = playerRecord();
    radXLeft = (record.wb && parseInt(record.wb.rx, 10)) || 0;
    if (radXLeft > 0) {
      dose = Math.max(1, dose - 2);
      record.wb.rx = radXLeft - 1;
    }
    value =
      parseInt(record.rad !== undefined ? record.rad : record.rads || 0, 10) ||
      0;
    if (record.rad !== undefined) record.rad = clamp(value + dose, 0, 100);
    else record.rads = clamp(value + dose, 0, 100);
    message = (radXLeft > 0 ? 'RAD-X ' : 'SOLAR RADS ') + '+' + dose;
    drawStatus();
    radTimer = setTimeout(radTick, 4000);
  }
  function drawBar(atX, atY, width, value, max) {
    const ratio = max ? clamp(value / max, 0, 1) : 0;
    h.setColor(2).drawRect(atX, atY, atX + width, atY + 7);
    h.setColor(1).fillRect(atX + 2, atY + 2, atX + width - 2, atY + 5);
    if (ratio)
      h.setColor(3).fillRect(
        atX + 2,
        atY + 2,
        atX + 2 + Math.floor((width - 4) * ratio),
        atY + 5,
      );
  }
  function healAmount() {
    return Math.max(25, Math.round(playerMaxHp * 0.35));
  }
  function baseDamage() {
    return Math.max(1, Math.floor((weapon && weapon.dmg) || 6));
  }
  function shownDamage() {
    const data = baseDamage();
    return boost > 0 ? Math.max(data + 1, Math.round(data * 1.5)) : data;
  }
  function rollDamage() {
    const data = shownDamage();
    if (boost > 0) boost--;
    return data;
  }
  function drawChoiceBox(index, atX, width, name, detail) {
    if (phase == 1 && index == selected) {
      h.setColor(2).fillRect(atX, 241, atX + width, 276);
      h.setColor(0);
    } else {
      h.setColor(2).drawRect(atX, 241, atX + width, 276);
      h.setColor(3);
    }
    setFont(1);
    h.setFontAlign(-1, -1);
    h.drawString(
      (phase == 1 && index == selected ? '> ' : '  ') + name,
      atX + 5,
      246,
    );
    h.drawString(detail, atX + 12, 262);
  }
  function drawActions(wholeScreen) {
    const damage = shownDamage(),
      stimpaks = stimCount(),
      psycho = psychoCount(),
      boostLabel = boost > 0 ? 'ACTIVE ' + boost : 'x' + psycho;
    h.setColor(0).fillRect(4, 240, 476, 277);
    if (foe && foe.id == 'IRON_WARDEN') {
      drawChoiceBox(0, 5, 112, 'ATTACK', 'DMG ' + damage);
      drawChoiceBox(1, 122, 112, 'SCORCH', 'x' + ammo);
      drawChoiceBox(2, 239, 112, 'STIM', 'x' + stimpaks);
      drawChoiceBox(3, 356, 119, 'PSYCHO', boostLabel);
    } else {
      drawChoiceBox(0, 5, 150, 'ATTACK', 'DMG ' + damage);
      drawChoiceBox(
        1,
        164,
        150,
        'STIMPAK',
        'HEAL ' + healAmount() + ' x' + stimpaks,
      );
      drawChoiceBox(2, 323, 152, 'PSYCHO', boostLabel);
    }
    if (!wholeScreen) blitRows(239, 278);
  }
  function drawStatus(noFlip) {
    if (stopped) return;
    try {
      h.setClipRect(0, PANEL_Y, SCREEN_W - 1, 240);
      h.setColor(0).fillRect(0, PANEL_Y, SCREEN_W - 1, 240);
      h.setColor(2).drawLine(0, PANEL_Y, SCREEN_W - 1, PANEL_Y);
      setFont(1);
      h.setFontAlign(-1, -1);
      h.setColor(3).drawString(clip(playerName, 14) + ' LV' + level, 8, 196);
      h.drawString(clip(foe.name, 14) + ' LV' + foe.level, 250, 196);
      drawBar(8, 210, 210, playerHp, playerMaxHp);
      drawBar(250, 210, 222, foeHp, foeMaxHp);
      h.setColor(2).drawString('HP ' + playerHp + '/' + playerMaxHp, 8, 220);
      h.drawString(
        foe.id == 'IRON_WARDEN'
          ? clip('PLATES ' + plates + '  ARMOR ' + foeHp + '/' + foeMaxHp, 27)
          : 'HP ' + foeHp + '/' + foeMaxHp,
        250,
        220,
      );
      h.setFontAlign(0, -1);
      h.setColor(3).drawString(clip(message, 54), SCREEN_W / 2, 230);
      h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
      if (!noFlip) blitRows(PANEL_Y, 240);
    } catch (err) {}
  }
  function drawAll() {
    drawStatus(1);
    drawActions(1);
    blitRows(PANEL_Y, 278);
  }
  function stopVideo() {
    try {
      Pip.removeListener('videoStopped', videoEnded);
    } catch (err) {}
    if (videoTimer) {
      clearTimeout(videoTimer);
      videoTimer = 0;
    }
    afterVideo = 0;
    try {
      Pip.videoStop();
    } catch (err2) {}
  }
  function videoEnded() {
    const callback = afterVideo;
    afterVideo = 0;
    if (videoTimer) {
      clearTimeout(videoTimer);
      videoTimer = 0;
    }
    try {
      Pip.removeListener('videoStopped', videoEnded);
    } catch (err) {}
    if (callback) callback();
  }
  function playClip(clip, loop, next, timeout) {
    const path = clipPath(clip);
    stopVideo();
    afterVideo = next || 0;
    if (!path) {
      if (next) videoTimer = setTimeout(videoEnded, 250);
      return;
    }
    try {
      VIDEO_OPTS.repeat = !!loop;
      if (!loop) Pip.on('videoStopped', videoEnded);
      Pip.videoStart(path, VIDEO_OPTS);
      if (next) videoTimer = setTimeout(videoEnded, timeout || 1600);
    } catch (err) {
      if (next) videoTimer = setTimeout(videoEnded, 250);
    }
  }
  function takeStimpak() {
    const chunk = stimCount();
    if (chunk < 1) return 0;
    if (!api.invTake || !api.invTake('AID', 86377, 1)) {
      stims = api.invCount ? api.invCount('AID', 86377) : 0;
      return 0;
    }
    stims = chunk - 1;
    return 1;
  }
  function toIdle() {
    phase = 1;
    locked = 0;
    if (foe.id == 'IRON_WARDEN')
      message =
        foeHp <= 0
          ? 'PLATE BROKEN - SCORCH OR HEAL'
          : 'BREAK THE PLATE - ARMOR ' + foeHp;
    else message = 'CHOOSE AN ACTION';
    playClip('BATTLE_IDLE.avi', 1, 0);
    drawAll();
    if (foe.rad && !radTimer) radTimer = setTimeout(radTick, 750);
  }
  function chooseFoeMove() {
    let hpRatio = playerMaxHp ? playerHp / playerMaxHp : 1,
      foeRatio = foeMaxHp ? foeHp / foeMaxHp : 1,
      weaponDmg = weapon && weapon.dmg ? weapon.dmg : 6,
      weights = [3, 3, 3, 3],
      index,
      total = 0,
      roll,
      move,
      tries = 0;
    if (foe.id == 'IRON_WARDEN' && foeHp <= 0 && bossHeals > 0) return 4;
    if (
      foe.boss &&
      bossHeals > 0 &&
      foeHp < foeMaxHp &&
      foeRatio < (foe.id == 'IRON_WARDEN' ? 0.72 : 0.48) &&
      Math.randInt(100) < (foe.id == 'IRON_WARDEN' ? 42 : 72)
    )
      return 4;
    if (foe.id == 'IRON_WARDEN') {
      if (hpRatio <= 0.35) weights = [1, 6, 7, 2];
      else if (plates <= 2) weights = [2, 5, 6, 3];
      else if (plates <= 4) weights = [3, 4, 5, 3];
      else weights = [4, 3, 2, 4];
    } else if (foe.id == 'SOLOMON_RAY') {
      if (hpRatio <= 0.35) weights = [1, 5, 6, 2];
      else if (foeRatio <= 0.5) weights = [3, 5, 4, 2];
      else weights = [4, 3, 3, 2];
    } else if (hpRatio <= 0.35) weights = [2, 4, 6, 1];
    else if (weaponDmg >= 15) weights = [3, 5, 5, 2];
    else if (hpRatio >= 0.8) weights = [4, 2, 1, 5];
    for (index = 0; index < 4; index++) total += weights[index];
    do {
      roll = Math.randInt(total);
      for (index = 0; index < 4; index++) {
        if (roll < weights[index]) {
          move = index;
          break;
        }
        roll -= weights[index];
      }
      tries++;
    } while (move == lastMove && tries < 3);
    lastMove = move;
    return move;
  }
  function foeMoveStats(index) {
    let power, name;
    if (foe.id == 'IRON_WARDEN') {
      if (index == 0) {
        power = 19;
        name = 'HAMMER SHOT';
      } else if (index == 1) {
        power = 23;
        name = 'IRON VERDICT';
      } else if (index == 2) {
        power = 27;
        name = 'EXECUTION';
      } else {
        power = 17;
        name = 'HOTEL FIRE';
      }
    } else if (foe.id == 'SOLOMON_RAY') {
      if (index == 0) {
        power = 16;
        name = 'SUNBURST';
      } else if (index == 1) {
        power = 20;
        name = 'RAD JUDGMENT';
      } else if (index == 2) {
        power = 23;
        name = 'CINDER SHOT';
      } else {
        power = 14;
        name = 'TAKE COVER';
      }
    } else {
      if (index == 0) {
        power = 18;
        name = 'STINGER';
      } else if (index == 1) {
        power = 21;
        name = 'CLAW';
      } else if (index == 2) {
        power = 24;
        name = 'RAD SPIT';
      } else {
        power = 15;
        name = 'BURROW';
      }
    }
    return [power, name];
  }
  function foeTurn() {
    let move = chooseFoeMove(),
      stats,
      power,
      moveName;
    if (move == 4) {
      phase = 2;
      bossHeals--;
      stats =
        foe.id == 'IRON_WARDEN'
          ? Math.max(14, Math.round(foeMaxHp * 0.5))
          : Math.max(24, Math.round(foeMaxHp * 0.22));
      message =
        foe.id == 'IRON_WARDEN'
          ? 'WARDEN REPAIRS THE PLATE'
          : foe.name + ' USES A STIM';
      drawAll();
      playClip(
        'E_MOVE_4.avi',
        0,
        function () {
          foeHp = clamp(foeHp + stats, 0, foeMaxHp);
          charge = foe.id == 'IRON_WARDEN' ? 7 : 4;
          message =
            foe.id == 'IRON_WARDEN'
              ? 'ARMOR REPAIRED - WEAPON OVERCHARGED'
              : foe.name + ' HEALED AND OVERCHARGED';
          drawStatus();
          turnTimer = setTimeout(toIdle, 360);
        },
        1500,
      );
      return;
    }
    stats = foeMoveStats(move);
    power = stats[0];
    moveName = stats[1];
    phase = 2;
    message = foe.name + ' USED ' + moveName;
    drawAll();
    playClip(
      'E_MOVE_' + (move + 1) + '.avi',
      0,
      function () {
        const data = Math.max(
          1,
          power +
            Math.floor(foe.level * 0.4) +
            charge -
            Math.floor((weapon.dt || 0) * 0.8),
        );
        charge = 0;
        applyDamage(-data, 0);
        message = 'YOU TOOK ' + data + ' DAMAGE';
        drawStatus();
        if (playerHp <= 0)
          playClip(
            'PLAYER_FAINT.avi',
            0,
            function () {
              playClip(
                'DEFEAT.avi',
                0,
                function () {
                  finishBattle(0);
                },
                8500,
              );
            },
            3600,
          );
        else turnTimer = setTimeout(toIdle, 320);
      },
      1500,
    );
  }
  function saveResult(won) {
    let record = playerRecord(),
      state = record.wb || {},
      story;
    state.map = args && args.map ? args.map : state.map || 'WORLD_01';
    state.mode = 'image';
    state.x = args.x;
    state.y = args.y;
    state.facing = args.facing || 'up';
    state.cleared = state.cleared || {};
    state.story = state.story || {};
    story = state.story;
    if (won && args.once && args.interact && !state.cleared[args.interact]) {
      state.cleared[args.interact] = 1;
      story.encounters = (parseInt(story.encounters, 10) || 0) + 1;
      story.deadLead = (parseInt(story.deadLead, 10) || 0) + 1;
      if (args.bullet) {
        story.rounds = story.rounds || {};
        story.rounds[args.bullet] = 1;
      }
    }
    if (won && foe && foe.id == 'SOLOMON_RAY') {
      story.rounds = story.rounds || {};
      story.rounds.SCORCHED = 1;
      story.solomonDefeated = 1;
      story.scorchRounds = Math.max(1, parseInt(story.scorchRounds, 10) || 0);
    }
    if (won && foe && foe.id == 'IRON_WARDEN') {
      story.finalBossDefeated = 1;
      story.hotelCleared = 1;
      story.gameComplete = 1;
      story.scorchRounds = 0;
      story.rounds = story.rounds || {};
      story.rounds.COURIER = 1;
    }
    record.wb = state;
    syncPlayer();
  }
  function finishBattle(won) {
    let record = playerRecord(),
      summary;
    phase = 3;
    locked = 1;
    stopRads();
    stopVideo();
    bonus = '';
    if (won) {
      record.xp = (parseInt(record.xp, 10) || 0) + (foe.xp || 0);
      syncPlayer();
      summary =
        foe.id == 'IRON_WARDEN' ? 'HOTEL CLEARED' : '+' + foe.xp + ' XP';
    } else summary = 'TRY AGAIN';
    saveResult(won);
    if (won && bonus) summary = bonus;
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawRect(10, 10, SCREEN_W - 11, SCREEN_H - 11);
    h.setFontAlign(0, 0);
    setFont(4);
    h.setColor(3).drawString(won ? 'VICTORY' : 'DEFEAT', SCREEN_W / 2, 70);
    setFont(2);
    h.drawString(summary, SCREEN_W / 2, 126);
    setFont(1);
    h.setColor(2).drawString('RETURNING TO MAP', SCREEN_W / 2, 238);
    api.flip(0, SCREEN_H - 1);
    args.map = args.map || (record.wb && record.wb.map) || 'WORLD_01';
    args.mode = 'image';
    args.msg = won ? summary + ' - SAVE RECOMMENDED' : 'TRY AGAIN';
    delete args.enemy;
    delete args.music;
    foe = weapon = 0;
    message = '';
    if (api.returnWorld) api.returnWorld(args, 700);
    else api.world(args);
    args = 0;
  }
  function useStimpak() {
    let old;
    readHp();
    if (playerHp >= playerMaxHp) {
      locked = 0;
      phase = 1;
      message = 'HP ALREADY FULL';
      drawStatus();
      drawActions(0);
      return;
    }
    if (!takeStimpak()) {
      locked = 0;
      phase = 1;
      message = 'NO STIMPAKS';
      drawStatus();
      drawActions(0);
      return;
    }
    old = playerHp;
    applyDamage(healAmount(), 1);
    message = 'HEALED ' + (playerHp - old) + ' HP';
    drawAll();
    turnTimer = setTimeout(foeTurn, 420);
  }
  function usePsycho() {
    const state = storyData(),
      chunk = psychoCount();
    if (boost > 0) {
      locked = 0;
      phase = 1;
      message = 'PSYCHO ALREADY ACTIVE - ' + boost + ' ATTACKS LEFT';
      drawStatus();
      drawActions(0);
      return;
    }
    if (chunk < 1) {
      locked = 0;
      phase = 1;
      message = 'NO PSYCHO - CRAFT AT A WORKBENCH';
      drawStatus();
      drawActions(0);
      return;
    }
    state.psycho = chunk - 1;
    syncPlayer();
    boost = 3;
    message = 'PSYCHO USED - DAMAGE +50% FOR 3 ATTACKS';
    drawAll();
    turnTimer = setTimeout(foeTurn, 420);
  }
  function attackPlate() {
    let data;
    if (foeHp <= 0) {
      locked = 0;
      phase = 1;
      message = 'PLATE BROKEN - USE A SCORCHED ROUND';
      drawStatus();
      drawActions(0);
      return;
    }
    data = rollDamage();
    message =
      'ATTACKING ARMOR - DMG ' +
      data +
      (boost > 0 ? '  BOOST ' + boost + ' LEFT' : '');
    drawAll();
    playClip(
      weapon.type == 'MELEE' ? 'P_MOVE_2.avi' : 'P_MOVE_1.avi',
      0,
      function () {
        foeHp = clamp(foeHp - data, 0, foeMaxHp);
        if (foeHp <= 0) {
          message = 'PLATE BROKEN - CHOOSE SCORCH OR HEAL';
          drawStatus();
          drawActions(0);
          turnTimer = setTimeout(toIdle, 260);
        } else {
          message = 'PLATE ARMOR TOOK ' + data + ' DAMAGE';
          drawStatus();
          turnTimer = setTimeout(foeTurn, 320);
        }
      },
      1500,
    );
  }
  function fireScorch() {
    if (foeHp > 0) {
      locked = 0;
      phase = 1;
      message = 'PLATE STILL ARMORED - ATTACK FIRST';
      drawStatus();
      drawActions(0);
      return;
    }
    if (ammo < 1) {
      locked = 0;
      phase = 1;
      message = 'NO SCORCH ROUNDS';
      drawStatus();
      drawActions(0);
      return;
    }
    ammo--;
    message = 'SCORCHED ROUND FIRED';
    drawAll();
    playClip(
      'P_MOVE_1.avi',
      0,
      function () {
        plates = Math.max(0, plates - 1);
        if (plates <= 0) {
          message = 'FINAL PLATE DESTROYED';
          drawStatus();
          drawActions(0);
          playClip(
            'ENEMY_FAINT.avi',
            0,
            function () {
              playClip(
                'VICTORY.avi',
                0,
                function () {
                  finishBattle(1);
                },
                8500,
              );
            },
            3600,
          );
          return;
        }
        foeMaxHp = plateArmour();
        foeHp = foeMaxHp;
        selected = 0;
        message = 'PLATE DESTROYED - ' + plates + ' REMAIN';
        drawStatus();
        drawActions(0);
        turnTimer = setTimeout(foeTurn, 360);
      },
      1500,
    );
  }
  function takeAction() {
    let data;
    if (locked || phase != 1) return;
    locked = 1;
    phase = 2;
    if (foe.id == 'IRON_WARDEN') {
      if (selected == 3) {
        usePsycho();
        return;
      }
      if (selected == 2) {
        useStimpak();
        return;
      }
      if (selected == 1) {
        fireScorch();
        return;
      }
      attackPlate();
      return;
    }
    if (selected == 2) {
      usePsycho();
      return;
    }
    if (selected == 1) {
      useStimpak();
      return;
    }
    data = rollDamage();
    message =
      'ATTACK DMG ' + data + (boost > 0 ? '  BOOST ' + boost + ' LEFT' : '');
    drawAll();
    playClip(
      weapon.type == 'MELEE' ? 'P_MOVE_2.avi' : 'P_MOVE_1.avi',
      0,
      function () {
        foeHp = clamp(foeHp - data, 0, foeMaxHp);
        message = foe.name + ' TOOK ' + data + ' DAMAGE';
        drawStatus();
        if (foeHp <= 0)
          playClip(
            'ENEMY_FAINT.avi',
            0,
            function () {
              playClip(
                'VICTORY.avi',
                0,
                function () {
                  finishBattle(1);
                },
                8500,
              );
            },
            3600,
          );
        else turnTimer = setTimeout(foeTurn, 320);
      },
      1500,
    );
  }
  function onKnob1(dir, held) {
    let now = 0;
    if (stopped || dir !== 0 || held) return;
    try {
      now = getTime();
    } catch (err) {}
    if (now && pressAt && now - pressAt < 0.28) return;
    pressAt = now || pressAt + 1;
    takeAction();
  }
  function onKnob2(dir) {
    let options;
    if (stopped || !dir || locked || phase != 1) return;
    options = foe && foe.id == 'IRON_WARDEN' ? 4 : 3;
    selected = (selected + (dir > 0 ? 1 : options - 1)) % options;
    drawActions(0);
  }
  function storyWeapon() {
    const record = playerRecord(),
      save = record.wb || {},
      story = save.story || {},
      stored = story.weapon;
    return stored && stored.name ? stored : 0;
  }
  function boot() {
    let story, storedWeapon;
    if (stopped || !args) return;
    boost = 0;
    defineFoe(args.enemy);
    enemyRoot = resolveRoot(folderFor(foe.id), 'E_MOVE_1.avi');
    playerRoot = resolveRoot(folderFor(foe.id), 'P_MOVE_1.avi');
    readHp();
    stims = api.invCount ? api.invCount('AID', 86377) : 0;
    playerName = clip(playerRecord().name || 'WANDERER', 14);
    story = (playerRecord().wb && playerRecord().wb.story) || {};
    ammo =
      foe.id == 'IRON_WARDEN'
        ? clamp(parseInt(story.scorchRounds, 10) || 0, 0, 6)
        : 0;
    storedWeapon = storyWeapon();
    if (storedWeapon)
      weapon = {
        weapon: storedWeapon.name,
        dmg: storedWeapon.dmg || 6,
        dt: storedWeapon.dt || 0,
        type: 'GUN',
      };
    else {
      try {
        weapon = api.equip();
      } catch (err) {}
      if (!weapon) weapon = { weapon: 'FISTS', dmg: 6, dt: 0, type: 'MELEE' };
    }
    scaleFoe();
    message =
      foe.id == 'IRON_WARDEN'
        ? 'BREAK EACH PLATE. THEN SCORCH IT.'
        : 'A WILD ' + foe.name + ' APPEARED';
    drawAll();
    playClip(
      'BATTLE_START.avi',
      0,
      function () {
        turnTimer = setTimeout(toIdle, 100);
      },
      7500,
    );
  }
  function teardown() {
    stopped = 1;
    if (turnTimer) clearTimeout(turnTimer);
    if (radTimer) clearTimeout(radTimer);
    turnTimer = radTimer = 0;
    stopVideo();
    foe = weapon = args = 0;
    message = '';
  }
  turnTimer = setTimeout(boot, 80);
  return {
    k1: onKnob1,
    k2: onKnob2,
    save: function () {
      if (args) saveResult(0);
    },
    remove: teardown,
  };
});
