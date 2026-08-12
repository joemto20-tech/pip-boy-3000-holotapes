/* HAMCO LOCK - grant / video / reveal module.
 *
 * Lazily eval-loaded by LOCK.JS ONLY after a correct PIN, so waking the Pip only
 * has to eval the small login core. The full lock + this video/reveal code
 * eval'ing on top of the freshly rebuilt watch UI was the out-of-memory
 * (LOW_MEMORY/MEMORY) watchdog reboot on wake; by the time a PIN is entered the
 * heavy UI is gone and there is plenty of RAM to eval this.
 *
 * Factory args: (ctx) where ctx = {
 *   video, videoMs, rollMs : tunables owned by LOCK.JS (single tuning spot),
 *   finish()   : end the whole unlock  -> LOCK.JS leave("OPEN"),
 *   resetRoll(): clear the scroll/blit anim (shared with LOCK.JS),
 *   clearHud() : clear LOCK.JS HUD timers. }
 * Returns { start, abort }. LOCK.JS sets its own `granted` flag before start() and
 * calls abort() from cleanup(). All video/reveal state lives here.
 */
(function (ctx) {
  let W = h.getWidth(),
    H = h.getHeight();
  let VIDEO = ctx.video,
    VIDEO_MS = ctx.videoMs,
    ROLL_MS = ctx.rollMs;
  let alive = true,
    videoActive = false,
    videoStarted = 0,
    timersPaused = false,
    videoTimer = 0,
    rollTimer = 0;
  function videoLenMs() {
    let f = 0,
      d,
      i,
      b,
      mspf,
      fr;
    try {
      f = E.openFile(VIDEO, 'r');
      d = f.read(256);
      f.close();
      f = 0;
      i = d.indexOf('avih');
      if (i >= 0) {
        b = i + 8;
        mspf =
          d.charCodeAt(b) |
          (d.charCodeAt(b + 1) << 8) |
          (d.charCodeAt(b + 2) << 16);
        fr =
          d.charCodeAt(b + 16) |
          (d.charCodeAt(b + 17) << 8) |
          (d.charCodeAt(b + 18) << 16);
        if (mspf > 0 && fr > 0) return Math.round((fr * mspf) / 1000) + 200;
      }
    } catch (e) {
      try {
        if (f) f.close();
      } catch (x) {}
    }
    return VIDEO_MS;
  }
  function removeVideoListener() {
    try {
      Pip.removeListener('videoStopped', onVideoStopped);
    } catch (e) {}
  }
  function pauseDisplayForVideo() {
    try {
      if (Pip.stopTimers) {
        Pip.stopTimers(['timeHeader']);
        timersPaused = true;
      }
    } catch (e) {}
    try {
      if (Pip.blitOptions) {
        Pip.blitOptions.anim = [];
        Pip.blitOptions.y =
          Pip.settings && typeof Pip.settings.vShift === 'number'
            ? Pip.settings.vShift
            : 0;
        Pip.blitOptions.ydiff = 1;
        delete Pip.blitOptions.disable;
      }
    } catch (e2) {}
  }
  function restartDisplayTimers() {
    if (!timersPaused) return;
    timersPaused = false;
    try {
      if (Pip.startTimers) Pip.startTimers();
    } catch (e) {}
  }
  /* Hand control back to the OS as fast as possible: no scroll-reveal animation,
   no extra wait -- just clear the screen and finish (FW then draws the normal
   menu). ROLL_MS is intentionally unused now. */
  function endNow() {
    if (rollTimer) {
      clearTimeout(rollTimer);
      rollTimer = 0;
    }
    restartDisplayTimers();
    try {
      h.setColor(0).fillRect(0, 0, W - 1, H - 1);
      h.flip();
      Pip.lastFlip = getTime();
    } catch (e) {}
    ctx.resetRoll();
    ctx.finish();
  }
  function fallbackGrant() {
    videoActive = false;
    endNow();
  }
  function finishGrantVideo() {
    if (!alive || !videoActive) return;
    videoActive = false;
    try {
      if (Pip.videoStop) Pip.videoStop();
    } catch (e) {}
    if (videoTimer) clearTimeout(videoTimer);
    videoTimer = 0;
    removeVideoListener();
    ctx.clearHud();
    endNow();
  }
  function onVideoStopped() {
    if (!alive || !videoActive) return;
    try {
      if (videoStarted && getTime() - videoStarted < 0.7) return;
    } catch (e) {}
    finishGrantVideo();
  }
  function start() {
    if (!alive) return;
    try {
      if (Pip.videoStop) Pip.videoStop();
    } catch (e) {}
    videoActive = true;
    pauseDisplayForVideo();
    try {
      h.setColor(0).fillRect(0, 0, W - 1, H - 1);
      h.flip();
      Pip.lastFlip = getTime();
    } catch (e2) {}
    try {
      if (!Pip.videoStart) throw 'NO VIDEO';
      try {
        videoStarted = getTime();
      } catch (e3) {
        videoStarted = 0;
      }
      Pip.on('videoStopped', onVideoStopped);
      Pip.videoStart(VIDEO, { x: 0, y: 0, repeat: false, debug: false });
      videoTimer = setTimeout(function () {
        finishGrantVideo();
      }, videoLenMs());
    } catch (e4) {
      videoActive = false;
      removeVideoListener();
      ctx.clearHud();
      fallbackGrant();
    }
  }
  function abort() {
    alive = false;
    if (videoTimer) clearTimeout(videoTimer);
    videoTimer = 0;
    if (rollTimer) clearTimeout(rollTimer);
    rollTimer = 0;
    removeVideoListener();
    if (videoActive) {
      videoActive = false;
      try {
        if (Pip.videoStop) Pip.videoStop();
      } catch (e) {}
    }
    restartDisplayTimers();
  }
  return { start: start, abort: abort };
});
