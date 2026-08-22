// Vendor screen. Buys native AID items with caps from the Pip-Boy MISC inventory.
(function (api, args) {
  let BASE = api.base,
    SCREEN_W = api.w,
    SCREEN_H = api.h,
    PANEL_Y = 192,
    selected = 0,
    message = '',
    stopped = 0,
    caps = 0,
    videoTimer = 0,
    afterVideo = 0,
    CAP_ID = 15;
  const vendor = args.vendor || 'SUNSCAR TRADER',
    VIDEO_ROOT = args.videoRoot || BASE + 'VIDEO',
    folder = args.folder || 'Shop';
  let STOCK = [
    { id: 86377, name: 'STIMPAK', price: 35, own: 0, im: 0, file: 'S.IMG' },
    { id: 86375, name: 'RADAWAY', price: 20, own: 0, im: 0, file: 'R.IMG' },
    { id: 86376, name: 'RAD-X', price: 25, own: 0, im: 0, file: 'X.IMG' },
    {
      id: 831580,
      name: "DOCTOR'S BAG",
      price: 55,
      own: 0,
      im: 0,
      file: 'D.IMG',
    },
  ];
  let clipStart = '',
    clipIdle = '',
    clipBuy = '';
  function setFont(size) {
    try {
      h.setFont('6x8', size || 1);
    } catch (err) {}
  }
  function clip(value, max) {
    value = value == null ? '' : String(value);
    return max && value.length > max ? value.substr(0, max - 1) + '~' : value;
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
  function isNewVegas() {
    try {
      return typeof NV != 'undefined' && NV;
    } catch (err) {
      return 0;
    }
  }
  function invPath(category) {
    return 'INV/' + (isNewVegas() ? 'NV' : 'F3') + '/' + category + '.INV';
  }
  function closeMap(handle) {
    try {
      if (handle && handle.close) handle.close();
    } catch (err) {}
  }
  function exists(path) {
    try {
      return !!fs.statSync(path);
    } catch (err) {
      return false;
    }
  }
  function joinPath(left, right) {
    return (
      left + (left && left.charAt(left.length - 1) == '/' ? '' : '/') + right
    );
  }
  function readAsset(name) {
    try {
      return fs.readFile(BASE + name);
    } catch (err) {
      return 0;
    }
  }
  function clipPath(name) {
    const path = joinPath(joinPath(VIDEO_ROOT, folder), name);
    return exists(path) ? path : '';
  }
  function drawVendorPanel() {
    h.setClipRect(0, 0, SCREEN_W - 1, PANEL_Y - 1);
    h.setColor(0).fillRect(0, 0, SCREEN_W - 1, PANEL_Y - 1);
    h.setColor(2)
      .drawRect(14, 14, SCREEN_W - 15, PANEL_Y - 16)
      .drawRect(20, 20, SCREEN_W - 21, PANEL_Y - 22);
    h.setFontAlign(0, 0);
    setFont(3);
    h.setColor(3).drawString(clip(vendor, 20), SCREEN_W / 2, 74);
    setFont(1);
    h.setColor(2).drawString('TRADE TERMINAL', SCREEN_W / 2, 118);
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    blitRows(0, PANEL_Y - 1);
  }
  function itemCount(file, itemId) {
    let index,
      entry,
      count = 0;
    try {
      index = file.indexOf(itemId);
      if (index >= 0) {
        entry = file.get(index);
        count = parseInt(entry && entry.cnt, 10) || 0;
      }
    } catch (err) {}
    return count;
  }
  function loadStock() {
    let factory = 0,
      index;
    try {
      factory = new InvFile(invPath('MISC'));
      caps = itemCount(factory, CAP_ID);
    } catch (err) {
      caps = 0;
    } finally {
      closeMap(factory);
    }
    for (index = 0; index < 4; index++)
      STOCK[index].own = api.invCount
        ? api.invCount('AID', STOCK[index].id)
        : 0;
    for (index = 0; index < 4; index++)
      STOCK[index].im = readAsset(STOCK[index].file);
    clipStart = clipPath('BATTLE_START.avi');
    clipIdle = clipPath('BATTLE_IDLE.avi');
    clipBuy = clipPath('P_MOVE_1.avi');
  }
  function writeCaps(count) {
    let file = 0,
      index,
      entry,
      ok = 0;
    count = Math.max(0, Math.floor(count));
    try {
      file = new InvFile(invPath('MISC'));
      index = file.indexOf(CAP_ID);
      if (count < 1) {
        if (index >= 0) file.remove(index);
        ok = 1;
      } else if (index >= 0) {
        entry = file.get(index) || { id: CAP_ID };
        entry.cnt = count;
        file.set(index, entry);
        ok = 1;
      } else {
        entry = { id: CAP_ID, cnt: count };
        if (file.append) {
          file.append(entry);
          ok = 1;
        } else if (file.add) {
          file.add(entry);
          ok = 1;
        } else if (file.push) {
          file.push(entry);
          ok = 1;
        } else if (file.set) {
          file.set(parseInt(file.length, 10) || 0, entry);
          ok = 1;
        }
      }
      if (ok && file.sync) file.sync();
    } catch (err) {
      ok = 0;
    } finally {
      closeMap(file);
    }
    if (ok) caps = count;
    return ok;
  }
  function giveItem(item) {
    return api.invAdd ? api.invAdd('AID', item.id, 1) : 0;
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
      if (Pip.videoStop) Pip.videoStop();
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
    if (callback)
      try {
        callback();
      } catch (err2) {}
  }
  function playClip(path, loop, next) {
    stopVideo();
    afterVideo = next || 0;
    if (!path) {
      drawVendorPanel();
      if (next) videoTimer = setTimeout(videoEnded, 150);
      return;
    }
    try {
      if (!loop) Pip.on('videoStopped', videoEnded);
      Pip.videoStart(path, { x: 0, y: 0, repeat: !!loop, debug: false });
      if (next) videoTimer = setTimeout(videoEnded, 120000);
    } catch (err) {
      if (next) videoTimer = setTimeout(videoEnded, 150);
    }
  }
  function toIdle() {
    playClip(clipIdle, 1, 0);
    drawAll();
  }
  function drawIcon(item, atX, atY) {
    const image = item && item.im;
    if (!image) {
      h.setColor(2).drawRect(atX, atY, atX + 47, atY + 47);
      return;
    }
    try {
      h.setColor(3).drawImage(image, atX, atY);
    } catch (err) {}
  }
  function drawAll() {
    let index,
      rowY,
      item = selected < 4 ? STOCK[selected] : 0,
      rowCount = 5;
    h.setClipRect(0, PANEL_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(0).fillRect(0, PANEL_Y, SCREEN_W - 1, SCREEN_H - 1);
    h.setColor(2).drawLine(0, PANEL_Y, SCREEN_W - 1, PANEL_Y);
    h.setFontAlign(-1, -1);
    setFont(1);
    h.setColor(3).drawString(clip(vendor, 18), 8, 198);
    h.setColor(2).drawString('CAPS ' + caps, 330, 198);
    h.setColor(2).drawRect(8, 222, 59, 273);
    if (item) {
      drawIcon(item, 10, 224);
      h.setFontAlign(0, -1);
      h.drawString('OWN ' + item.own, 34, 278);
    } else {
      h.setFontAlign(0, 0);
      h.setColor(3).drawString('EXIT', 34, 248);
    }
    h.setFontAlign(0, -1);
    setFont(1);
    h.setColor(2).drawString(
      clip(message || 'SELECT AN ITEM', 42),
      SCREEN_W / 2,
      210,
    );
    for (index = 0; index < rowCount; index++) {
      rowY = 224 + index * 18;
      if (index == selected) {
        h.setColor(2).fillRect(78, rowY - 2, SCREEN_W - 10, rowY + 15);
        h.setColor(0);
      } else h.setColor(3);
      h.setFontAlign(-1, -1);
      if (index < 4)
        h.drawString(
          (index == selected ? '> ' : '  ') +
            STOCK[index].name +
            '  ' +
            STOCK[index].price,
          92,
          rowY,
        );
      else h.drawString((index == selected ? '> ' : '  ') + 'LEAVE', 92, rowY);
    }
    h.setClipRect(0, 0, SCREEN_W - 1, SCREEN_H - 1);
    blitRows(PANEL_Y, SCREEN_H - 1);
  }
  function buyItem() {
    const item = STOCK[selected];
    if (!item) return;
    if (caps < item.price) {
      message = 'NEED ' + item.price + ' CAPS';
      drawAll();
      return;
    }
    if (!writeCaps(caps - item.price)) {
      message = 'CAPS UPDATE FAILED';
      drawAll();
      return;
    }
    if (!giveItem(item)) {
      writeCaps(caps + item.price);
      message = 'BUY FAILED';
      drawAll();
      return;
    }
    item.own++;
    message = 'BOUGHT ' + item.name;
    drawAll();
    playClip(clipBuy, 0, toIdle);
  }
  function leaveShop() {
    let payload;
    if (stopped) return;
    stopped = 1;
    stopVideo();
    payload = {
      map: args.map || 'WORLD_01',
      mode: args.mode || 'tile',
      x: args.x,
      y: args.y,
      facing: args.facing,
      msg: 'TRADE CLOSED',
    };
    STOCK = 0;
    args = 0;
    if (api.returnWorld) api.returnWorld(payload, 520);
    else api.world(payload);
  }
  function onKnob1(dir, held) {
    if (stopped) return;
    if (dir === 0 && !held) {
      if (selected < 4) buyItem();
      else leaveShop();
    }
  }
  function onKnob2(dir) {
    if (stopped || !dir) return;
    selected = (selected + (dir < 0 ? -1 : 1) + 5) % 5;
    message = '';
    drawAll();
  }
  function teardown() {
    stopped = 1;
    stopVideo();
    STOCK = 0;
    args = 0;
    message = '';
  }
  loadStock();
  drawAll();
  playClip(clipStart, 0, toIdle);
  return { k1: onKnob1, k2: onKnob2, remove: teardown };
});
