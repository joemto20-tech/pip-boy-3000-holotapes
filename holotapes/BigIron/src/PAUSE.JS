// Pause menu. STAT / INV / DATA / MAP tabs, motorcycle equip, exit.
(function (api, args) {
  args = args || {};
  let BASE = api.base || '',
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    tab = 0,
    row = 0,
    stopped = 0,
    mapImage = 0,
    playerImage = 0,
    frameTimer = 0,
    message = '';
  let TABS = ['STAT', 'INV', 'DATA', 'MAP'],
    story = args.story || {},
    profileData = {};
  const CONDITIONS = [
    'perceptioncondition',
    'endurancecondition',
    'leftattackcondition',
    'rightattackcondition',
    'rightmobilitycondition',
    'leftmobilitycondition',
  ];
  function playerRecord() {
    try {
      return player && player.player ? player.player : {};
    } catch (err) {
      return {};
    }
  }
  // Nothing ever supplied arg.profile, so STAT used to render an empty level-1 courier.
  // Read the live Pip-Boy record the same way the battle and aid modules do.
  function readProfile() {
    let record = playerRecord(),
      level,
      maxHp,
      maxAp,
      index,
      value,
      sum = 0;
    level = clamp(
      parseInt(record.level, 10) || 1,
      1,
      typeof NV != 'undefined' && NV ? 50 : 30,
    );
    maxHp = Math.max(
      60,
      70 + (parseInt(record.endurance, 10) || 5) * 10 + level * 5,
    );
    maxAp = Math.max(40, 60 + (parseInt(record.agility, 10) || 5) * 3);
    for (index = 0; index < 6; index++) {
      value = parseFloat(record[CONDITIONS[index]]);
      sum += isNaN(value) ? 100 : clamp(value, 0, 100);
    }
    return {
      name: record.name || 'COURIER',
      level: level,
      hp: Math.round(clamp(sum / 600, 0, 1) * maxHp),
      maxHp: maxHp,
      ap: clamp(parseInt(record.ap, 10) || maxAp, 0, maxAp),
      maxAp: maxAp,
      rad: clamp(
        parseInt(record.rad !== undefined ? record.rad : record.rads, 10) || 0,
        0,
        100,
      ),
    };
  }
  function readWeapon() {
    let stored = story.weapon,
      equipped = 0;
    if (stored && stored.name)
      return {
        weapon: stored.name,
        dmg: parseInt(stored.dmg, 10) || 6,
        type: 'GUN',
      };
    try {
      equipped = api.equip && api.equip();
    } catch (err) {}
    return equipped
      ? { weapon: equipped.weapon, dmg: equipped.dmg, type: equipped.type }
      : { weapon: 'FISTS', dmg: 6, type: 'MELEE' };
  }
  let summary = {
    weapon: profileData.weapon || 'FISTS',
    dmg: parseInt(profileData.dmg, 10) || 6,
    type: profileData.type || 'MELEE',
    rounds: 0,
    enc: parseInt(story.encounters, 10) || 0,
    deadLead: parseInt(story.deadLead, 10) || 0,
    psycho: 0,
    status: 'INCOMPLETE',
    bike: !!story.motorcycle,
    dq: parseInt(story.dogQuest, 10) || 0,
    df:
      (story.dogSupply ? 1 : 0) +
      (story.dogMeds ? 1 : 0) +
      (story.dogParts ? 1 : 0),
  };
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function clip(value, max) {
    value = value == null ? '' : String(value);
    return max && value.length > max ? value.substr(0, max - 1) + '~' : value;
  }
  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }
  function roundCount() {
    let flags = story.rounds || {},
      count = 0,
      key;
    if (story.scorchRounds !== undefined)
      return clamp(parseInt(story.scorchRounds, 10) || 0, 0, 6);
    for (key in flags) if (flags[key]) count++;
    return count;
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
  function readFile(path) {
    try {
      return fs.readFile(path);
    } catch (err) {}
    return 0;
  }
  function playerSprite() {
    let data;
    if (playerImage) return playerImage;
    data = readFile(BASE + 'PD.BIN');
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
    else playerImage = readFile(BASE + 'PD.IMG') || 0;
    return playerImage;
  }
  function drawBar(atX, atY, width, point) {
    const filled = Math.max(0, Math.min(width, Math.floor(width * point)));
    h.setColor(3).fillRect(atX, atY, atX + filled, atY + 8);
    h.setColor(1).fillRect(atX + filled, atY, atX + width, atY + 8);
    h.setColor(2).drawRect(atX, atY, atX + width, atY + 8);
  }
  function drawTabs() {
    let x = [60, 180, 300, 420],
      index;
    h.setFontAlign(0, -1);
    setFont(2);
    for (index = 0; index < 4; index++) {
      h.setColor(index == tab ? 3 : 2);
      h.drawString(TABS[index], x[index], 5);
      if (index == tab) h.drawLine(x[index] - 30, 29, x[index] + 30, 29);
    }
    h.setColor(2).drawLine(0, 36, SCREEN_W - 1, 36);
  }
  function drawPortrait() {
    const image = playerSprite(),
      x = 33,
      y = 70;
    h.setColor(2).drawRect(29, 58, 139, 185);
    if (image)
      try {
        h.setClipRect(30, 59, 138, 184);
        h.setColor(3).drawImage(image, x, y, { scale: 3, frame: 1 });
        h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        return;
      } catch (err) {
        try {
          h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
        } catch (err2) {}
      }
    h.setColor(3).fillRect(74, 76, 94, 96);
    h.drawLine(84, 96, 84, 146);
    h.drawLine(60, 112, 108, 112);
    h.drawLine(84, 146, 66, 174);
    h.drawLine(84, 146, 102, 174);
  }
  function drawActions(labels, top) {
    let index;
    h.setFontAlign(-1, -1);
    setFont(1);
    if (row >= labels.length) row = 0;
    for (index = 0; index < labels.length; index++) {
      h.setColor(index == row ? 3 : 2);
      h.drawString(
        (index == row ? '> ' : '  ') + labels[index],
        286,
        top + index * 18,
      );
    }
  }
  function drawStat() {
    const hp = clamp(
        parseInt(profileData.hp, 10) || 0,
        0,
        parseInt(profileData.maxHp, 10) || 100,
      ),
      maxHp = Math.max(1, parseInt(profileData.maxHp, 10) || 100),
      ap = clamp(
        parseInt(profileData.ap, 10) || 0,
        0,
        parseInt(profileData.maxAp, 10) || 80,
      ),
      maxAp = Math.max(1, parseInt(profileData.maxAp, 10) || 80),
      rads = clamp(parseInt(profileData.rad, 10) || 0, 0, 100);
    h.setFontAlign(-1, -1);
    setFont(2);
    h.setColor(3).drawString(
      clip(profileData.name || 'COURIER', 18) +
        '  LV ' +
        (parseInt(profileData.level, 10) || 1),
      16,
      48,
    );
    drawPortrait();
    setFont(1);
    h.setColor(3).drawString('HP  ' + hp + '/' + maxHp, 16, 202);
    drawBar(16, 220, 160, hp / maxHp);
    h.drawString('AP  ' + ap + '/' + maxAp, 16, 242);
    drawBar(16, 260, 160, ap / maxAp);
    h.drawString('RAD ' + rads + '%', 16, 282);
    drawBar(16, 300, 160, rads / 100);
    h.setColor(3).drawString('BIG IRON ' + summary.rounds + '/6', 236, 62);
    h.setColor(2).drawString('JUDGMENTS ' + summary.enc + '/20', 236, 82);
    h.drawString('DEAD LEAD ' + summary.deadLead + '  COST 2', 236, 102);
    h.drawString('PSYCHO ' + summary.psycho + '/3  COST 1', 236, 122);
    h.setColor(3).drawString(summary.status, 236, 148);
    h.setColor(2).drawString('CURRENT WEAPON', 236, 184);
    h.setColor(3).drawString(summary.weapon, 236, 204);
    h.setColor(2).drawString(
      'DMG ' + summary.dmg + '  ' + summary.type,
      236,
      224,
    );
    drawActions(['RESUME', 'SAVE LOCATION', 'EXIT GAME'], 252);
  }
  function drawInv() {
    let rows = [
        ['SCORCH ROUNDS', 'x' + summary.rounds],
        ['HOTEL PARTS', partCount() + '/5'],
        ["DEAD MAN'S LEAD", 'x' + summary.deadLead],
        ['PSYCHO', 'x' + summary.psycho],
        ['MOTORCYCLE', summary.bike ? 'RIDE' : 'LOCKED'],
        ['STIMPAKS', 'OPEN AID'],
      ],
      index,
      atY;
    h.setFontAlign(-1, -1);
    setFont(2);
    h.setColor(3).drawString('FIELD PACK', 16, 46);
    setFont(1);
    h.setColor(2).drawString('CURRENT WEAPON', 16, 78);
    h.setColor(3).drawString(summary.weapon, 16, 98);
    h.setColor(2).drawString(
      'DMG ' + summary.dmg + '  ' + summary.type,
      16,
      116,
    );
    h.setColor(3).drawString('BIG IRON ' + summary.rounds + '/6', 300, 78);
    h.setColor(2).drawString('JUDGMENTS ' + summary.enc + '/20', 300, 98);
    h.drawString(summary.status, 300, 116);
    h.setColor(2).drawRect(14, 142, SCREEN_W - 15, 292);
    h.setFontAlign(0, -1);
    h.setColor(3).drawString('QUEST GEAR', SCREEN_W / 2, 149);
    for (index = 0; index < 6; index++) {
      atY = 168 + index * 20;
      if (index == row) {
        h.setColor(2).fillRect(44, atY - 3, SCREEN_W - 45, atY + 14);
        h.setColor(0);
      } else h.setColor(3);
      h.setFontAlign(-1, -1);
      h.drawString((index == row ? '> ' : '  ') + rows[index][0], 64, atY);
      h.setFontAlign(1, -1);
      h.drawString(rows[index][1], SCREEN_W - 66, atY);
    }
    h.setFontAlign(0, -1);
    h.setColor(2).drawString(
      message ||
        (row == 4 && summary.bike
          ? 'SELECT TO RIDE'
          : row == 5
            ? 'SELECT TO OPEN NATIVE AID'
            : row == 3
              ? 'USE PSYCHO DURING BATTLE'
              : 'QUEST ITEM'),
      SCREEN_W / 2,
      300,
    );
  }
  function drawData() {
    h.setFontAlign(-1, -1);
    setFont(2);
    h.setColor(3).drawString('QUEST DATA', 18, 48);
    setFont(1);
    if (args.map == 'HOTEL') {
      h.setColor(3).drawString('> BIG IRON HOTEL', 18, 82);
      h.setColor(2).drawString(
        story.finalBossDefeated
          ? 'THE IRON WARDEN IS DEAD'
          : story.ammoCrafted
            ? 'OPEN THE PENTHOUSE DOOR'
            : 'SEARCH THE LOBBY DOORS',
        18,
        104,
      );
      h.drawString(
        'HOTEL PARTS ' + partCount() + '/5  DEAD LEAD ' + summary.deadLead,
        18,
        126,
      );
      h.setColor(3).drawString(
        'SCORCH ROUNDS ' + summary.rounds + '/6',
        18,
        170,
      );
      h.setColor(2).drawString(
        'WORKBENCH: ROUNDS 2 LEAD / PSYCHO 1 LEAD',
        18,
        194,
      );
      h.drawString(
        'ROOM ' + ((parseInt(args.room, 10) || 0) + 1) + ' OF 6',
        18,
        218,
      );
      h.setColor(3).drawString(summary.status, 18, 244);
      drawActions(['RESUME'], 282);
      return;
    }
    if (args.map == 'WORLD_03') {
      h.setColor(3).drawString('> DOGTOWN DELIVERY RUN', 18, 82);
      h.setColor(2).drawString(
        summary.dq ? 'REPORT TO THE SHERIFF' : 'MEET THE SHERIFF',
        18,
        104,
      );
      h.drawString('SUPPLY / DOC / GARAGE', 18, 126);
      h.setColor(3).drawString('DELIVERIES ' + summary.df + '/3', 18, 170);
      h.setColor(2).drawString(
        summary.dq == 2
          ? 'DOGTOWN SECURED'
          : summary.dq
            ? 'FETCH QUEST ACTIVE'
            : 'QUEST NOT STARTED',
        18,
        194,
      );
      h.drawString(
        'MOTORCYCLE: ' + (summary.bike ? 'READY' : 'LOCKED'),
        18,
        218,
      );
      h.setColor(3).drawString('FEWER FIGHTS. LONGER RIDES.', 18, 244);
      drawActions(['RESUME'], 282);
      return;
    }
    h.setColor(3).drawString('> FIND THE JUDGMENT ROUNDS', 18, 82);
    h.setColor(2).drawString('OPEN THE ROAD THROUGH SUNSCAR', 18, 104);
    h.drawString("FORGE THE COURIER'S ROUND", 18, 126);
    h.setColor(3).drawString('ROUNDS ' + summary.rounds + '/6', 18, 170);
    h.setColor(2).drawString('JUDGMENTS ' + summary.enc + '/20', 18, 192);
    h.drawString('DEAD LEAD ' + summary.deadLead + '  (2 PER ROUND)', 18, 214);
    h.setColor(3).drawString(summary.status, 18, 244);
    drawActions(['RESUME'], 282);
  }
  function drawMap() {
    let image,
      left = 14,
      top = 58,
      markX = parseInt(args.x, 10),
      markY = parseInt(args.y, 10),
      labels,
      index,
      room;
    if (args.map == 'HOTEL') {
      room = parseInt(args.room, 10) || 0;
      h.setFontAlign(-1, -1);
      setFont(2);
      h.setColor(3).drawString('BIG IRON HOTEL', 16, 42);
      h.setColor(2).drawRect(14, 58, 267, 245);
      for (index = 0; index < 6; index++) {
        h.setColor(index == room ? 3 : 2);
        h.drawRect(36, 70 + index * 27, 238, 90 + index * 27);
        h.drawString(
          (index == room ? '> ' : '  ') +
            (index + 1) +
            '  ' +
            [
              'MAIN LOBBY',
              'KITCHEN',
              'LAUNDRY',
              'BOILER ROOM',
              'AMMO WORKSHOP',
              'PENTHOUSE',
            ][index],
          46,
          76 + index * 27,
        );
      }
      h.setColor(3).drawString('HOTEL OBJECTIVE', 286, 54);
      setFont(1);
      h.setColor(2).drawString(
        story.ammoCrafted ? 'REACH THE PENTHOUSE' : 'COLLECT PARTS + DEAD LEAD',
        286,
        82,
      );
      h.drawString('SCORCH ROUNDS ' + summary.rounds + '/6', 286, 106);
      h.drawString('PSYCHO ' + summary.psycho + '/3  (1 LEAD EACH)', 286, 130);
      h.setColor(3).drawString(
        story.finalBossDefeated ? 'IRON WARDEN DEFEATED' : 'IRON WARDEN ACTIVE',
        286,
        166,
      );
      drawActions(['RESUME'], 282);
      return;
    }
    if (args.map == 'WORLD_03') {
      h.setFontAlign(-1, -1);
      setFont(2);
      h.setColor(3).drawString('DOGTOWN HEIGHTS', 16, 42);
      h.setColor(2).drawRect(14, 58, 267, 203);
      h.drawLine(80, 70, 80, 190);
      h.drawLine(145, 70, 145, 190);
      h.drawLine(210, 70, 210, 190);
      h.drawLine(25, 125, 255, 125);
      h.setColor(3).drawString('HOTEL', 90, 70);
      h.drawString('SHERIFF', 155, 104);
      h.setColor(2).drawString('SUPPLY', 22, 104);
      h.drawString('DOC', 155, 150);
      h.drawString('GARAGE', 210, 150);
      if (isNaN(markX)) markX = 820;
      if (isNaN(markY)) markY = 850;
      markX = 14 + Math.floor((clamp(markX, 0, 1672) * 253) / 1672);
      markY = 58 + Math.floor((clamp(markY, 0, 941) * 145) / 941);
      h.setColor(3).fillPoly([
        markX,
        markY - 5,
        markX - 5,
        markY + 5,
        markX + 5,
        markY + 5,
      ]);
      h.setColor(3).drawString('DELIVERY RUN', 286, 54);
      labels = ['SHERIFF', 'SUPPLY', 'DOC', 'GARAGE', 'GENERAL STORE'];
      setFont(1);
      for (index = 0; index < labels.length; index++) {
        h.setColor(index < 4 ? 3 : 2);
        h.drawString(
          (index < 4 ? '> ' : '  ') + labels[index],
          286,
          78 + index * 20,
        );
      }
      h.setColor(3).drawString('DELIVERIES ' + summary.df + '/3', 286, 190);
      h.setColor(2).drawString(
        'HOTEL: ' +
          (story.finalBossDefeated
            ? 'CLEARED'
            : story.ammoCrafted
              ? 'BOSS READY'
              : 'SEARCH FOR PARTS'),
        286,
        218,
      );
      drawActions(['RESUME'], 282);
      return;
    }
    if (args.map == 'WORLD_02') {
      h.setFontAlign(-1, -1);
      setFont(2);
      h.setColor(3).drawString("ROT'S CROSSING", 16, 42);
      h.setColor(2).drawRect(left - 2, top - 2, left + 253, top + 145);
      image = mapImage || readFile(BASE + 'CROSSMAP.BIN');
      if (image && image.length >= 9072) {
        mapImage = image;
        try {
          h.drawImage(
            { width: 252, height: 144, bpp: 2, buffer: image },
            left,
            top,
          );
        } catch (err) {}
      } else {
        h.drawLine(140, 64, 140, 197);
        h.drawLine(36, 130, 242, 130);
        h.setColor(3).drawRect(42, 74, 112, 118);
        h.drawString('TAVERN', 55, 88);
        h.setColor(2).drawCircle(92, 153, 12);
        h.drawString('BIKE', 112, 146);
        h.drawString('SUNSCAR', 160, 70);
        h.drawString('DOGTOWN', 160, 176);
      }
      if (isNaN(markX)) markX = 1120;
      if (isNaN(markY)) markY = 126;
      markX = left + Math.floor((clamp(markX, 0, 1672) * 252) / 1672);
      markY = top + Math.floor((clamp(markY, 0, 941) * 144) / 941);
      h.setColor(3).fillPoly([
        markX,
        markY - 5,
        markX - 5,
        markY + 5,
        markX + 5,
        markY + 5,
      ]);
      h.setColor(3).drawString('LOCATIONS', 286, 54);
      labels = ["ROT'S TAVERN", 'MOTORCYCLES', 'SUNSCAR ROAD', 'DOGTOWN ROAD'];
      setFont(1);
      for (index = 0; index < labels.length; index++) {
        h.setColor(index < 2 ? 3 : 2);
        h.drawString(
          (index < 2 ? '> ' : '  ') + labels[index],
          286,
          78 + index * 20,
        );
      }
      h.setColor(3).drawString(
        'TRACK: ' + (story.bikeRaceComplete ? 'RECORD MODE' : 'ROTJAW'),
        286,
        190,
      );
      h.setColor(2).drawString(
        'DOGTOWN ROAD: ' +
          (story.solomonDefeated || (story.rounds && story.rounds.SCORCHED)
            ? 'OPEN'
            : 'LOCKED'),
        286,
        218,
      );
      drawActions(['RESUME'], 282);
      return;
    }
    image = mapImage || readFile(BASE + 'M.IMG');
    labels = [
      "SUN KING'S MARKET",
      'PAWN SHOP',
      'TOWN HALL',
      "DOC'S CLINIC",
      'GUNS & AMMO',
      'CRATER MOTEL',
    ];
    mapImage = image || 0;
    h.setFontAlign(-1, -1);
    setFont(2);
    h.setColor(3).drawString('SUNSCAR FIELD MAP', 16, 42);
    h.setColor(2).drawRect(left - 2, top - 2, left + 253, top + 145);
    if (image)
      try {
        h.drawImage(image, left, top, { scale: 2 });
      } catch (err) {}
    if (isNaN(markX) || markX < 100) markX = 704;
    if (isNaN(markY) || markY < 100) markY = 255;
    markX = left + Math.floor((clamp(markX, 0, 1440) * 252) / 1440);
    markY = top + Math.floor((clamp(markY, 0, 1080) * 144) / 1080);
    h.setColor(3).fillPoly([
      markX,
      markY - 5,
      markX - 5,
      markY + 5,
      markX + 5,
      markY + 5,
    ]);
    h.setFontAlign(-1, -1);
    setFont(1);
    h.setColor(3).drawString('LOCATIONS', 286, 54);
    for (index = 0; index < labels.length; index++) {
      h.setColor(index < 3 ? 3 : 2);
      h.drawString(
        (index < 3 ? '> ' : '  ') + labels[index],
        286,
        78 + index * 18,
      );
    }
    h.setColor(3).drawString('BIG IRON ' + summary.rounds + '/6', 286, 202);
    h.setColor(2).drawString('JUDGMENTS ' + summary.enc + '/20', 286, 220);
    h.drawString('SOUTH ROAD: OPEN', 286, 244);
    drawActions(['RESUME'], 282);
  }
  function openAid() {
    const payload = {
      map: args.map,
      mode: args.mode,
      room: args.room,
      x: args.x,
      y: args.y,
      facing: args.facing,
      returnX: args.returnX,
      returnY: args.returnY,
      returnFacing: args.returnFacing,
      msg: message || args.msg || '',
    };
    shutdown();
    mapImage = playerImage = 0;
    profileData = story = summary = 0;
    api.aid(payload);
  }
  function drawAll() {
    if (stopped) return;
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    drawTabs();
    if (tab == 0) drawStat();
    else if (tab == 1) drawInv();
    else if (tab == 2) drawData();
    else drawMap();
  }
  function tick() {
    if (stopped) return;
    h.flip();
    Pip.lastFlip = getTime();
  }
  function shutdown() {
    stopped = 1;
    if (frameTimer) clearInterval(frameTimer);
    frameTimer = 0;
  }
  function resume(withBike) {
    shutdown();
    api.world({
      map: args.map,
      mode: args.mode,
      room: args.room,
      x: args.x,
      y: args.y,
      facing: args.facing,
      returnX: args.returnX,
      returnY: args.returnY,
      returnFacing: args.returnFacing,
      bikeEquip: withBike ? 1 : 0,
      msg: withBike ? 'MOTORCYCLE EQUIPPED' : message || args.msg || '',
    });
  }
  function choose() {
    if (tab == 1) {
      if (row == 4 && summary.bike) {
        resume(1);
        return;
      }
      if (row == 5) {
        openAid();
        return;
      }
      message = 'QUEST ITEM - CANNOT USE HERE';
      drawAll();
      return;
    }
    if (tab == 0) {
      if (row == 0) resume(0);
      else if (row == 1) {
        message = 'GAME SAVED';
        drawAll();
      } else {
        shutdown();
        api.exit();
      }
    } else resume(0);
  }
  function onKnob1(dir, held) {
    const old = tab;
    if (stopped) return;
    if (dir === 0) {
      if (!held) choose();
      return;
    }
    tab = (tab + (dir < 0 ? -1 : 1) + 4) % 4;
    row = 0;
    message = '';
    if (old == 0 && tab != 0) playerImage = 0;
    if (old == 3 && tab != 3) mapImage = 0;
    try {
      if (api.gc) api.gc();
    } catch (err) {}
    drawAll();
  }
  function onKnob2(dir) {
    let options;
    if (stopped || !dir) return;
    options = tab == 1 ? 6 : tab == 0 ? 3 : 1;
    row = (row + (dir < 0 ? -1 : 1) + options) % options;
    message = '';
    drawAll();
  }
  function teardown() {
    shutdown();
    mapImage = playerImage = profileData = story = summary = 0;
  }
  profileData = readProfile();
  (function () {
    const width = readWeapon();
    summary.weapon = width.weapon;
    summary.dmg = width.dmg;
    summary.type = width.type;
  })();
  summary.rounds = roundCount();
  summary.psycho = clamp(
    parseInt(story.psycho === undefined ? story.hotLoads : story.psycho, 10) ||
      0,
    0,
    3,
  );
  summary.status = story.finalBossDefeated
    ? 'HOTEL CLEARED'
    : summary.rounds >= 6
      ? '6 SCORCHED READY'
      : !story.solomonDefeated
        ? 'DEFEAT SOLOMON RAY'
        : story.dogQuest != 2
          ? 'FIND DOGTOWN CASINGS'
          : partCount() < 5
            ? 'FIND HOTEL PARTS'
            : summary.deadLead < 2
              ? "NEED 2 DEAD MAN'S LEAD"
              : 'CRAFT ROUNDS AT A BENCH';
  drawAll();
  tick();
  frameTimer = setInterval(tick, 40);
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
