(function() {
  const HOLOTAPE_DIR = 'HOLO/RCET/';

  let scene = null;
  let pending = null;
  let loading = null;
  let loadTimer = null;

  const app = {
    H: 320,
    W: 480,
    currentBright: null,
    currentVol: null,
    initialBright: null,
    initialVol: null,
    musicState: {
      currentStation: null,
      isAudioPlaying: false,
      isPlayAll: false,
      isRandom: false,
      lastPlayedName: null,
      playAllIdx: 0,
      playingName: null,
      playingPath: null,
      playingStation: null,
      randomQueue: [],
      randomQueueIdx: 0,
      scrollOffset: 0,
      selectedIdx: 0,
      songPage: 0,
      view: 'stations',
    },
    names: [
      'RobCo Entertainment Terminal',
      'RobCo Image Terminal',
      'RobCo Music Terminal',
      'RobCo Video Terminal',
    ],
    persistentMusic: false,
    sortDir: 1,
    version: '2.1.1',

    scenes: {
      INTRO: 'INTRO.JS',
      MENU: 'MENU.JS',
      MUSIC: 'MUSIC.JS',
      VIDEO: 'VIDEO.JS',
      IMAGES: 'IMAGES.JS',
      SETTINGS: 'SETTINGS.JS',
    },

    go: function (file, params) {
      if (!file) {
        logLoadError('app.go called without file', file);
      }
      pending = { file: file, params: params };

      if (!loadTimer) {
        loadTimer = setTimeout(loadScene, 0);
      }
    },

    gc: function () {
      try {
        process.memory(true);
        E.defrag();
      } catch (e) {}
    },

    isPersistentMusicPlaying: function () {
      return (
        app.persistentMusic &&
        app.musicState &&
        app.musicState.isAudioPlaying &&
        app.musicState.playingPath
      );
    },

    stopMusicPlayback: function () {
      const music = app.musicState;
      cleanPersistentAudio(true);
      music.isAudioPlaying = false;
      music.isPlayAll = false;
      music.isRandom = false;
      music.playingName = null;
      music.playingPath = null;
      music.playingStation = null;
      music.randomQueue = [];
      music.randomQueueIdx = 0;

      try {
        Pip.radioClipPlaying = false;
        Pip.audioStop();
      } catch (e) {}
    },
  };

  function drawError(file, err) {
    h.clear(0);
    h.setColor(3)
      .setFontMonofonto23()
      .setFontAlign(0, 0)
      .drawString('UNABLE TO LOAD', app.W / 2, app.H / 2 - 20);
    h.setColor(2)
      .setFontMonofonto16()
      .setFontAlign(0, 0)
      .drawString(file || 'NO SCENE FILE', app.W / 2, app.H / 2 + 12);
    h.setColor(1)
      .setFontMonofonto14()
      .setFontAlign(0, 0)
      .drawString(
        err && err.message
          ? err.message.slice(0, 34)
          : 'Try Reinstalling Holotape.',
        app.W / 2,
        app.H / 2 + 44,
      );
    h.flip();
    Pip.lastFlip = getTime();
  }

  function loadScene() {
    loadTimer = null;

    loading = pending;
    pending = null;

    if (!loading) return;

    if (scene) {
      scene.remove();
      scene = null;
      app.gc();
      loadTimer = setTimeout(openScene, 0);
      return;
    }

    openScene();
  }

  function logLoadError(msg, file, err) {
    try {
      console.log(
        'RobCo Entertainment Terminal scene load: ' +
          msg +
          ' file=' +
          (file || 'undefined') +
          (err ? ' error=' + ((err && err.message) || err) : ''),
      );
    } catch (e) {}
  }

  function cleanPersistentAudio(stopAudio) {
    const radio = Pip.radio;
    if (!radio) return;

    if (radio.rcetTimer) clearTimeout(radio.rcetTimer);
    if (radio.rcetWatch) clearInterval(radio.rcetWatch);
    radio.rcetTimer = 0;
    radio.rcetWatch = 0;
    radio.rcetNoNext = true;

    if (radio.rcetHandler) {
      try {
        Pip.removeListener('audioStopped', radio.rcetHandler);
      } catch (e) {}
    }
    radio.rcetHandler = null;
    radio.rcetState = null;
    radio.rcetOn = false;
    Pip.radioClipPlaying = false;

    if (stopAudio) {
      radio.rcetAllow = true;
      try {
        Pip.audioStop();
      } catch (e) {}
      radio.rcetAllow = false;
    }

    if (Pip._rcetStart) {
      Pip.audioStart = Pip._rcetStart;
      Pip._rcetStart = null;
    }
    if (Pip._rcetStop) {
      Pip.audioStop = Pip._rcetStop;
      Pip._rcetStop = null;
    }
  }

  function installPersistentAudioGuard() {
    const radio = Pip.radio;
    if (!radio) return false;

    if (!Pip._rcetStart && Pip.audioStart) {
      Pip._rcetStart = Pip.audioStart;
      Pip.audioStart = function () {
        const r = Pip.radio;
        if (r && r.rcetOn && !r.rcetAllow) return 0;
        if (r && r.rcetOn) markPersistentAudioInterrupted(r);
        return Pip._rcetStart.apply(Pip, arguments);
      };
    }
    if (!Pip._rcetStop && Pip.audioStop) {
      Pip._rcetStop = Pip.audioStop;
      Pip.audioStop = function () {
        const r = Pip.radio;
        if (r && r.rcetOn && !r.rcetAllow) return 0;
        if (r && r.rcetOn) markPersistentAudioInterrupted(r);
        return Pip._rcetStop.apply(Pip, arguments);
      };
    }

    return true;
  }

  function markPersistentAudioInterrupted(radio) {
    radio.rcetNoNext = true;
    if (radio.rcetTimer) clearTimeout(radio.rcetTimer);
    radio.rcetTimer = setTimeout(function () {
      const r = Pip.radio;
      if (!r) return;
      r.rcetNoNext = false;
      r.rcetTimer = 0;
    }, 700);
  }

  function openScene() {
    loadTimer = null;

    const p = loading;
    loading = null;

    if (!p) return;

    if (!p.file) {
      logLoadError('missing scene file', p.file);
      drawError(p.file, { message: 'Missing scene file' });
      return;
    }

    app.gc();

    try {
      scene = eval(fs.readFileSync(HOLOTAPE_DIR + p.file))(app, p.params);
    } catch (e) {
      logLoadError('failed to open scene', p.file, e);
      drawError(p.file, e);
    }
  }

  function armPersistentAudio() {
    const radio = Pip.radio;
    if (!radio || !installPersistentAudioGuard()) return;

    radio.rcetOn = true;
    radio.rcetState = app.musicState;
    radio.rcetNoNext = false;
    radio.rcetAllow = false;
    Pip.radioClipPlaying = true;

    if (radio.rcetHandler) {
      try {
        Pip.removeListener('audioStopped', radio.rcetHandler);
      } catch (e) {}
    }

    radio.rcetHandler = function () {
      const r = Pip.radio;
      if (!r || !r.rcetOn || r.rcetNoNext) return;
      setTimeout(function () {
        const rr = Pip.radio;
        if (!rr || !rr.rcetOn || rr.rcetNoNext) return;
        try {
          if (Pip.audioIsPlaying && Pip.audioIsPlaying()) return;
        } catch (e) {}
        playNextPersistentTrack();
      }, 30);
    };
    Pip.on('audioStopped', radio.rcetHandler);

    if (radio.rcetWatch) clearInterval(radio.rcetWatch);
    radio.rcetWatch = setInterval(function () {
      const r = Pip.radio;
      if (!r || !r.rcetOn) {
        if (r && r.rcetWatch) {
          clearInterval(r.rcetWatch);
          r.rcetWatch = 0;
        }
        return;
      }
      if (r.rcetNoNext) return;
      try {
        if (!Pip.audioIsPlaying || Pip.audioIsPlaying()) return;
      } catch (e) {
        return;
      }
      playNextPersistentTrack();
    }, 1500);
  }

  function findSongIndex(songs, name) {
    for (let i = 0; i < songs.length; i++) {
      if (songs[i].name === name) return i;
    }
    return -1;
  }

  function listPersistentSongs(stationName) {
    const songs = [];
    const base = 'MUSIC/' + stationName;
    let entries;
    try {
      entries = fs.readdir('/' + base);
    } catch (e) {
      try {
        entries = fs.readdir(base);
      } catch (e2) {
        entries = [];
      }
    }
    for (let i = 0; i < entries.length; i++) {
      const name = '' + entries[i];
      if (/\.wav$/i.test(name)) songs.push({ name: name });
    }
    songs.sort(function (a, b) {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      return an < bn ? -app.sortDir : an > bn ? app.sortDir : 0;
    });
    return songs;
  }

  function playPersistentPath(path) {
    const radio = Pip.radio;
    if (!radio) return false;

    radio.rcetNoNext = true;
    radio.rcetAllow = true;
    Pip.radioClipPlaying = true;
    try {
      Pip.audioStop();
    } catch (e) {}
    try {
      Pip.audioStart(path);
    } catch (e) {
      radio.rcetAllow = false;
      cleanPersistentAudio(false);
      return false;
    }
    radio.rcetAllow = false;
    if (radio.rcetTimer) clearTimeout(radio.rcetTimer);
    radio.rcetTimer = setTimeout(function () {
      const r = Pip.radio;
      if (!r) return;
      r.rcetNoNext = false;
      r.rcetTimer = 0;
    }, 700);
    return true;
  }

  function playNextPersistentTrack() {
    const radio = Pip.radio;
    const state = radio && radio.rcetState;
    let next;

    if (!state || !state.isAudioPlaying) {
      cleanPersistentAudio(false);
      return;
    }

    if (state.isRandom && state.randomQueue && state.randomQueue.length) {
      if (state.randomQueueIdx >= state.randomQueue.length) {
        state.randomQueueIdx = 0;
      }
      next = state.randomQueue[state.randomQueueIdx++];
    } else if (state.isPlayAll) {
      const station = state.playingStation || state.currentStation;
      const songs = listPersistentSongs(station);
      if (!songs.length) {
        cleanPersistentAudio(false);
        return;
      }
      if (state.playAllIdx >= songs.length) state.playAllIdx = 0;
      next = songs[state.playAllIdx++];
    } else {
      cleanPersistentAudio(false);
      return;
    }

    if (!next || !next.name) {
      cleanPersistentAudio(false);
      return;
    }

    const stationName = state.playingStation || state.currentStation;
    const full = 'MUSIC/' + stationName + '/' + next.name;
    state.playingPath = full;
    state.playingName = next.name.replace(/\.wav$/i, '');
    state.lastPlayedName = next.name;
    state.playingStation = stationName;

    if (state.isPlayAll) {
      const songs = listPersistentSongs(stationName);
      const idx = findSongIndex(songs, next.name);
      if (idx >= 0) state.songPage = Math.floor(idx / 8);
    }

    playPersistentPath(full);
  }

  function remove() {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }

    pending = null;
    loading = null;

    if (scene) {
      scene.remove();
      scene = null;
    }

    const keepMusicPlaying = app.isPersistentMusicPlaying();

    app.persistentMusic = false;

    if (keepMusicPlaying) {
      armPersistentAudio();
    } else {
      Pip.audioStop();
    }
    if (app.initialBright !== null) {
      try {
        Pip.setBrightness(app.initialBright);
      } catch (e) {}
    }
    if (!keepMusicPlaying && app.initialVol !== null) {
      try {
        Pip.setVol(app.initialVol);
      } catch (e) {}
    }
    h.clear();
    h.flip();
  }

  try {
    if (Pip.settings && typeof Pip.settings.volume === 'number') {
      app.initialVol = Pip.settings.volume;
      app.currentVol = app.initialVol;
    }
  } catch (e) {}

  try {
    if (typeof Pip.brightness === 'number') {
      app.initialBright = Pip.brightness;
      app.currentBright = app.initialBright;
    }
  } catch (e) {}

  try {
    if (Pip.radio && Pip.radio.rcetOn) {
      app.stopMusicPlayback();
    }
  } catch (e) {}

  app.go(app.scenes.INTRO);

  return {
    id: 'RCET',
    notDefault: true,
    fullscreen: true,
    remove: remove,
  };
});
