(function () {
  "use strict";

  var fs = require("fs");
  var ROOT = "HOLO/TUNER";
  var TUNINGS_FILE = ROOT + "/TUNINGS.JSON";
  var STATE_FILE = "SETTINGS/TUNER_STATE.JSON";
  var W = h.getWidth ? h.getWidth() : 480;
  var H = h.getHeight ? h.getHeight() : 320;

  var removed = false;
  var tonePlaying = false;
  var activePath = "";
  var message = "SELECT A STRING";
  var pulse = 0;
  var drawTimer = null;
  var audioCheckTimer = null;
  var waveform = null;

  var fallbackTunings = [
    {
      name: "STANDARD",
      strings: [
        { label: "6 LOW E", note: "E2", freq: 82.41, file: "E2.wav" },
        { label: "5 A", note: "A2", freq: 110.00, file: "A2.wav" },
        { label: "4 D", note: "D3", freq: 146.83, file: "D3.wav" },
        { label: "3 G", note: "G3", freq: 196.00, file: "G3.wav" },
        { label: "2 B", note: "B3", freq: 246.94, file: "B3.wav" },
        { label: "1 HIGH E", note: "E4", freq: 329.63, file: "E4.wav" }
      ]
    },
    {
      name: "DROP D",
      strings: [
        { label: "6 LOW D", note: "D2", freq: 73.42, file: "D2.wav" },
        { label: "5 A", note: "A2", freq: 110.00, file: "A2.wav" },
        { label: "4 D", note: "D3", freq: 146.83, file: "D3.wav" },
        { label: "3 G", note: "G3", freq: 196.00, file: "G3.wav" },
        { label: "2 B", note: "B3", freq: 246.94, file: "B3.wav" },
        { label: "1 HIGH E", note: "E4", freq: 329.63, file: "E4.wav" }
      ]
    },
    {
      name: "HALF STEP DOWN",
      strings: [
        { label: "6 LOW Eb", note: "Eb2", freq: 77.78, file: "EB2.wav" },
        { label: "5 Ab", note: "Ab2", freq: 103.83, file: "AB2.wav" },
        { label: "4 Db", note: "Db3", freq: 138.59, file: "DB3.wav" },
        { label: "3 Gb", note: "Gb3", freq: 185.00, file: "GB3.wav" },
        { label: "2 Bb", note: "Bb3", freq: 233.08, file: "BB3.wav" },
        { label: "1 HIGH Eb", note: "Eb4", freq: 311.13, file: "EB4.wav" }
      ]
    },
    {
      name: "D STANDARD",
      strings: [
        { label: "6 LOW D", note: "D2", freq: 73.42, file: "D2.wav" },
        { label: "5 G", note: "G2", freq: 98.00, file: "G2.wav" },
        { label: "4 C", note: "C3", freq: 130.81, file: "C3.wav" },
        { label: "3 F", note: "F3", freq: 174.61, file: "F3.wav" },
        { label: "2 A", note: "A3", freq: 220.00, file: "A3.wav" },
        { label: "1 HIGH D", note: "D4", freq: 293.66, file: "D4.wav" }
      ]
    },
    {
      name: "OPEN G",
      strings: [
        { label: "6 LOW D", note: "D2", freq: 73.42, file: "D2.wav" },
        { label: "5 G", note: "G2", freq: 98.00, file: "G2.wav" },
        { label: "4 D", note: "D3", freq: 146.83, file: "D3.wav" },
        { label: "3 G", note: "G3", freq: 196.00, file: "G3.wav" },
        { label: "2 B", note: "B3", freq: 246.94, file: "B3.wav" },
        { label: "1 HIGH D", note: "D4", freq: 293.66, file: "D4.wav" }
      ]
    },
    {
      name: "7 STRING STANDARD",
      strings: [
        { label: "7 LOW B", note: "B1", freq: 61.74, file: "B1.wav" },
        { label: "6 LOW E", note: "E2", freq: 82.41, file: "E2.wav" },
        { label: "5 A", note: "A2", freq: 110.00, file: "A2.wav" },
        { label: "4 D", note: "D3", freq: 146.83, file: "D3.wav" },
        { label: "3 G", note: "G3", freq: 196.00, file: "G3.wav" },
        { label: "2 B", note: "B3", freq: 246.94, file: "B3.wav" },
        { label: "1 HIGH E", note: "E4", freq: 329.63, file: "E4.wav" }
      ]
    }
  ];

  function clamp(v, lo, hi) {
    v = parseInt(v, 10);
    if (isNaN(v)) v = lo;
    return Math.max(lo, Math.min(hi, v));
  }

  function loadTunings() {
    try {
      var data = JSON.parse(fs.readFileSync(TUNINGS_FILE));
      if (data && data.tunings && data.tunings.length) return data.tunings;
    } catch (e) {}
    return fallbackTunings;
  }

  function readState() {
    try {
      var data = JSON.parse(fs.readFileSync(STATE_FILE));
      if (data) return data;
    } catch (e) {}
    return { tuning: 0, string: 0 };
  }

  function saveState() {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ tuning: tuningIndex, string: stringIndex }));
    } catch (e) {}
  }

  var tunings = loadTunings();
  var saved = readState();
  var tuningIndex = clamp(saved.tuning, 0, tunings.length - 1);
  var stringIndex = clamp(saved.string, 0, tunings[tuningIndex].strings.length - 1);

  function selectedTuning() {
    return tunings[tuningIndex];
  }

  function selectedString() {
    return selectedTuning().strings[stringIndex];
  }

  function setFont(name) {
    try { h.setFont(name); } catch (e) {
      try { h.setFont("6x8", 2); } catch (e2) {}
    }
    return h;
  }

  function shade(x1, y1, x2, y2) {
    try { Pip.shadeBox(x1, y1, x2, y2); }
    catch (e) {
      h.setColor(1).fillRect(x1, y1, x2, y2);
      h.setColor(3).drawRect(x1, y1, x2, y2);
    }
  }

  function drawHeader() {
    h.setColor(3).setFontAlign(-1, -1);
    setFont("Monofonto23").drawString("GUITAR TUNER", 16, 10);
    h.setColor(1).drawLine(16, 38, W - 16, 38);
    h.setColor(2).setFontAlign(1, -1);
    setFont("Monofonto14").drawString("HAMCo STRING CALIBRATOR", W - 16, 16);
  }

  function drawStrings() {
    var strings = selectedTuning().strings;
    var top = 58;
    var rowH = strings.length > 6 ? 27 : 30;
    var i, y;

    h.setColor(2).setFontAlign(-1, -1);
    setFont("Monofonto14").drawString("TUNING: " + selectedTuning().name, 16, 45);

    for (i = 0; i < strings.length; i++) {
      y = top + i * rowH;
      if (i === stringIndex) shade(12, y - 2, 206, y + 22);
      h.setColor(i === stringIndex ? 3 : 2).setFontAlign(-1, -1);
      setFont("Monofonto16").drawString((i === stringIndex ? "> " : "  ") + strings[i].label, 20, y + 1);
      h.setColor(i === stringIndex ? 3 : 1).setFontAlign(1, -1);
      setFont("6x8").drawString(strings[i].note, 198, y + 7);
    }
  }

  function prepareWaveform() {
    if (waveform) return;
    try {
      waveform = new Uint16Array(80);
      var i;
      for (i = 0; i < 80; i += 2) waveform[i] = 236 + Math.floor((i / 78) * 222);
    } catch (e) { waveform = null; }
  }

  function drawOutputPanel() {
    var s = selectedString();
    var cx = 342;
    var noteY = 70;
    var railY = 168;
    var i, x, marker;

    h.setColor(1).drawRect(220, 50, W - 14, 258);
    h.setColor(2).setFontAlign(0, -1);
    setFont("Monofonto14").drawString("REFERENCE NOTE", cx, 56);

    h.setColor(3).setFontAlign(0, -1);
    setFont("Monofonto28").drawString(s.note, cx, noteY);
    h.setColor(2);
    setFont("Monofonto18").drawString(s.freq.toFixed(2) + " Hz", cx, 119);

    h.setColor(1).drawLine(240, railY, 444, railY);
    for (i = 0; i <= 20; i++) {
      x = 240 + i * 10;
      h.drawLine(x, railY - (i % 5 === 0 ? 8 : 4), x, railY + (i % 5 === 0 ? 8 : 4));
    }
    h.setColor(2).drawLine(cx, railY - 13, cx, railY + 13);

    marker = cx;
    if (tonePlaying) marker += Math.round(Math.sin(pulse * 0.35) * 4);
    h.setColor(tonePlaying ? 3 : 1).fillRect(marker - 3, railY - 18, marker + 3, railY + 18);

    h.setColor(tonePlaying ? 3 : 1).setFontAlign(0, -1);
    setFont("Monofonto14").drawString(tonePlaying ? "OUTPUT ACTIVE" : "OUTPUT STOPPED", cx, 188);

    prepareWaveform();
    if (waveform) {
      if (tonePlaying && Pip.getAudioWaveform) {
        try { Pip.getAudioWaveform(waveform, 215, 241); }
        catch (e) {
          for (i = 1; i < 80; i += 2) waveform[i] = 228 + Math.round(Math.sin((i + pulse * 4) * 0.27) * 11);
        }
      } else {
        for (i = 1; i < 80; i += 2) waveform[i] = 228;
      }
      h.setColor(tonePlaying ? 3 : 1);
      try { h.drawPolyAA(waveform); } catch (e2) {
        try { h.drawPoly(waveform); } catch (e3) {}
      }
    }

    h.setColor(1).setFontAlign(0, -1);
    setFont("6x8").drawString("MATCH YOUR GUITAR STRING TO THE PITCH", cx, 246);
  }

  function drawFooter() {
    h.setColor(1).drawLine(14, 274, W - 14, 274);
    h.setColor(2).setFontAlign(-1, -1);
    setFont("6x8").drawString("KNOB 1: STRING", 16, 281);
    h.setFontAlign(0, -1).drawString("PRESS: PLAY / STOP", W / 2, 281);
    h.setFontAlign(1, -1).drawString("KNOB 2: TUNING", W - 16, 281);
    h.setColor(1).setFontAlign(0, -1).drawString("HOLD KNOB 1 TO EXIT  //  " + message, W / 2, 299);
  }

  function draw() {
    if (removed) return;
    try {
      h.setClipRect(0, 0, W - 1, H - 1);
      h.setColor(0).fillRect(0, 0, W - 1, H - 1);
      drawHeader();
      drawStrings();
      drawOutputPanel();
      drawFooter();
      h.flip();
      try { Pip.lastFlip = getTime(); } catch (e2) {}
    } catch (e) {
      try { Pip.log("Guitar tuner draw error: " + (e.message || e), "errors.txt"); } catch (e3) {}
    }
  }

  function clearAudioCheck() {
    if (audioCheckTimer) {
      try { clearTimeout(audioCheckTimer); } catch (e) {}
      audioCheckTimer = null;
    }
  }

  function prepareAudio() {
    /* Maintenance apps can inherit the codec in an off/output-disabled state. */
    try { if (Pip.setDACPower) Pip.setDACPower(true); } catch (e) {}
    try { if (Pip.initDAC) Pip.initDAC(); } catch (e2) {}
    try { if (Pip.setDACMode) Pip.setDACMode("out"); } catch (e3) {}
    try { if (Pip.enableMCLK) Pip.enableMCLK(); } catch (e4) {}
    try { Pip.radioClipPlaying = 1; } catch (e5) {}
    try { if (Pip.kickIdleTimer) Pip.kickIdleTimer(); } catch (e6) {}
  }

  function audioIsRunning() {
    try { if (Pip.audioIsPlaying) return !!Pip.audioIsPlaying(); } catch (e) {}
    try {
      if (Pip.streamPlaying) {
        var v = Pip.streamPlaying();
        return v === "audio" || v === "both";
      }
    } catch (e2) {}
    /* Older firmware has no reliable playback query. Do not report a false failure. */
    return null;
  }

  function stopTone(redraw) {
    clearAudioCheck();
    tonePlaying = false;
    activePath = "";
    try { Pip.audioStop(); } catch (e) {}
    try { Pip.radioClipPlaying = 0; } catch (e2) {}
    message = "REFERENCE STOPPED";
    if (redraw !== false) draw();
  }

  function startToneFile(path) {
    prepareAudio();
    try { Pip.audioStop(); } catch (e) {}
    /* repeat is part of the documented file-streaming API. */
    Pip.audioStart(path, { repeat: true, debug: false });
  }

  function playTone() {
    var s = selectedString();
    var path = ROOT + "/TONES/" + s.file;
    clearAudioCheck();

    try {
      if (!fs.statSync(path)) throw "MISSING FILE";
    } catch (missing) {
      tonePlaying = false;
      activePath = "";
      message = "MISSING " + s.file;
      draw();
      return;
    }

    activePath = path;
    tonePlaying = true;
    message = "PLAYING " + s.note;

    try {
      startToneFile(path);
    } catch (e1) {
      tonePlaying = false;
      activePath = "";
      message = "AUDIO ERROR";
      try { Pip.log("Guitar tuner audio error: " + path + " / " + (e1.message || e1), "errors.txt"); } catch (e2) {}
      draw();
      return;
    }

    draw();

    /* Some firmware revisions accept the call but leave the DAC disabled. Retry once. */
    audioCheckTimer = setTimeout(function () {
      audioCheckTimer = null;
      if (removed || !tonePlaying || activePath !== path) return;
      if (audioIsRunning() === false) {
        try {
          startToneFile(path);
          message = "PLAYING " + s.note + " / RETRY";
          draw();
        } catch (e3) {
          tonePlaying = false;
          activePath = "";
          message = "AUDIO START FAILED";
          try { Pip.log("Guitar tuner retry error: " + path + " / " + (e3.message || e3), "errors.txt"); } catch (e4) {}
          draw();
        }
      }
    }, 350);
  }

  function toggleTone() {
    if (tonePlaying) stopTone(true);
    else playTone();
  }

  function restartIfPlaying() {
    saveState();
    if (tonePlaying) playTone();
    else draw();
  }

  function moveString(dir) {
    var strings = selectedTuning().strings;
    stringIndex += dir < 0 ? -1 : 1;
    if (stringIndex < 0) stringIndex = strings.length - 1;
    if (stringIndex >= strings.length) stringIndex = 0;
    message = "STRING " + selectedString().note;
    try { Pip.playSound && Pip.playSound("NEXT"); } catch (e) {}
    restartIfPlaying();
  }

  function moveTuning(dir) {
    tuningIndex += dir < 0 ? -1 : 1;
    if (tuningIndex < 0) tuningIndex = tunings.length - 1;
    if (tuningIndex >= tunings.length) tuningIndex = 0;
    stringIndex = clamp(stringIndex, 0, selectedTuning().strings.length - 1);
    message = selectedTuning().name;
    try { Pip.playSound && Pip.playSound("COLUMN"); } catch (e) {}
    restartIfPlaying();
  }

  function onKnob1(value, longPress) {
    if (removed) return;
    if (longPress) { exitApp(); return; }
    if (value === 0) {
      toggleTone();
      return;
    }
    moveString(value);
  }

  function onKnob2(value) {
    if (removed) return;
    if (value === 0) moveTuning(1);
    else moveTuning(value);
  }

  function remove() {
    if (removed) return;
    removed = true;
    saveState();
    clearAudioCheck();
    if (drawTimer) {
      try { clearInterval(drawTimer); } catch (e) {}
      drawTimer = null;
    }
    try { Pip.removeListener("knob1", onKnob1); } catch (e3) {}
    try { Pip.removeListener("knob2", onKnob2); } catch (e4) {}
    try { Pip.audioStop(); } catch (e5) {}
    try { Pip.radioClipPlaying = 0; } catch (e6) {}
    tonePlaying = false;
    activePath = "";
    waveform = null;
    try { h.setClipRect(0, 0, W - 1, H - 1); } catch (e6) {}
  }

  function exitApp() {
    if (removed) return;
    remove();
    try { if (Pip.changeMenu) Pip.changeMenu("HOLO"); }
    catch (e) {
      try { if (Pip.changeMenu) Pip.changeMenu(); } catch (e2) {}
    }
  }

  try { Pip.onExclusive("knob1", onKnob1); }
  catch (e) { try { Pip.on("knob1", onKnob1); } catch (e2) {} }

  try { Pip.onExclusive("knob2", onKnob2); }
  catch (e3) { try { Pip.on("knob2", onKnob2); } catch (e4) {} }

  prepareAudio();
  drawTimer = setInterval(function () {
    if (!removed && tonePlaying) {
      pulse++;
      draw();
    }
  }, 120);

  draw();

  return {
    id: "TUNER",
    notDefault: true,
    fullscreen: true,
    remove: remove
  };
});
