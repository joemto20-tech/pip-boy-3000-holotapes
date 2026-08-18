(function() {
  const ENCLAVE_LOGO = undefined; 
  let b = Pip.settings.brightness || 1; 

  const reports = [
    "REPORT 74: Vertibird patrols in Sector 4 report increased mutant activity. Purge authorized.",
    "LOG 481: President Eden's broadcast is reaching 87% of the Capital Wasteland. God bless the Enclave.",
    "DIRECTIVE: Brotherhood of Steel personnel spotted near Navarro. Engage with extreme prejudice.",
    "FACT: Advanced Power Armor Mk II utilizes lightweight composites, vastly superior to pre-war T-51b.",
    "WARNING: Poseidon Energy network anomalies detected. All tech personnel report to sublevel 3."
  ];
  let wrappedReports = [];

  const bootLines = [
    "[ 0.000000 ] Booting RobCo kernel (Sunscar build)...",
    "[ 0.014231 ] VFS: Mounted root (squashfs filesystem) readonly.",
    "[ 0.021553 ] ACPI: Core revision 20771023",
    "[ 0.041011 ] Warning: Unauthorized access detected in memory 0x4AF.",
    "[ 0.051220 ] CPU0: Local APIC disabled by BIOS -- reenabling.",
    "[ 0.062033 ] SMBIOS 2.4 present.",
    "[ 0.082140 ] Initializing remote override handler...",
    "[ 0.091122 ] DMI: RobCo Industries Pip-Boy 3000 Mark IV",
    "[ 0.103002 ] net eth0: Routing via SUNSCAR local relay...",
    "[ 0.110221 ] TCP cubic registered",
    "[ 0.120333 ] NET: Registered protocol family 17",
    "[ 0.140225 ] pci 0000:00:1a.0: Bypassing local security headers...",
    "[ 0.150444 ] Unpacking initramfs...",
    "[ 0.160555 ] Freeing initrd memory: 1204k freed",
    "[    OK    ] ENCLAVE SIGMA PROTOCOL ACCEPTED",
    "[ 0.201504 ] Establishing secure net...",
    "[ 0.221504 ] Handshake verified. Sigma datalink active."
  ];

  let tFreq = Math.randInt(8) + 2;
  let tAmp = Math.randInt(40) + 20;
  let pFreq = 5;
  let pAmp = 40;
  let offset = 0;
  
  let state = -1; // -1 = Booting, 0 = Seeking, 1 = Locked
  let bootPhase = 0; 
  let bootLineIdx = 0;
  let bootCharIdx = 0;
  let bootWait = 0;
  let bootTimer = 0;
  let logoProgress = 0;
  let glitchFired = false;
  let bootSoundPlayed = false;
  let wasAligned = false; 
  
  let scrollY = 0; 
  
  let redraw = 1;
  let frameInterval;
  let currentReportIdx = 0;

  // =========================================================
  // CPU OPTIMIZATION: RELATIVE GEOMETRY CACHE
  // =========================================================
  let staticStars18 = []; 
  let staticStars12 = []; 

  function precalcStarsRel(scale, outputArray) {
    let rStar = 3.5 * scale;
    for (let i = 0; i < 13; i++) {
      let pts = new Int16Array(20);
      let angle = (i * Math.PI * 2) / 13 - (Math.PI / 2);
      let scx = Math.cos(angle) * (45 * scale);
      let scy = Math.sin(angle) * (45 * scale);
      for(let j = 0; j < 10; j++) {
         let radius = (j % 2 === 0) ? rStar : rStar * 0.4;
         let a = (j * Math.PI * 2) / 10 - (Math.PI / 2);
         pts[j * 2] = Math.round(scx + Math.cos(a) * radius);
         pts[j * 2 + 1] = Math.round(scy + Math.sin(a) * radius);
      }
      outputArray.push(pts);
    }
  }

  precalcStarsRel(1.8, staticStars18); 
  precalcStarsRel(1.2, staticStars12); 

  setTimeout(function() {
    for (let i = 0; i < reports.length; i++) {
      wrappedReports.push(h.setFontMonofonto18().wrapString(reports[i], 440));
    }
  }, 0);

  function drawEnclaveLogo(cx, cy, scale, progress, precalcs, drawStars) {
    "ram";
    if (drawStars === undefined) drawStars = true;
    h.setColor(3); 
    let ex = Math.round(cx - (15 * scale));
    let ey = Math.round(cy - (20 * scale));
    let ew = Math.round(30 * scale);
    let eh = Math.round(40 * scale);
    let thick = Math.round(8 * scale);
    
    let r = h.fillRect.bind(h);

    if (progress < 100) {
      if (progress > 0) {
        let spineH = eh * Math.min(progress / 30, 1.0);
        r(ex, ey, ex + thick, ey + spineH);
      }
      if (progress > 30) {
        let p2 = Math.min((progress - 30) / 40, 1.0); 
        let ease = 1.0 - p2; 
        
        let tOff = Math.round(ease * 40);
        let bOff = Math.round(ease * 60);
        let p1Off = Math.round(ease * 30);
        let p2Off = Math.round(ease * 50);
        let p3Off = Math.round(ease * 70);

        r(ex + tOff, ey, ex + ew + tOff, ey + thick); 
        r(ex + bOff, ey + eh - thick, ex + ew + bOff, ey + eh); 
        r(ex + thick + Math.round(2 * scale) + p1Off, Math.round(cy - (5 * scale)), ex + ew + p1Off, Math.round(cy - (3 * scale)));
        r(ex + thick + Math.round(2 * scale) + p2Off, Math.round(cy - (1 * scale)), ex + ew + p2Off, Math.round(cy + (1 * scale)));
        r(ex + thick + Math.round(2 * scale) + p3Off, Math.round(cy + (3 * scale)), ex + ew + p3Off, Math.round(cy + (5 * scale)));
      }
      if (progress > 70 && drawStars) {
        let p3 = Math.min((progress - 70) / 30, 1.0);
        let numStars = Math.floor(p3 * 13);
        for (let i = 0; i < numStars; i++) {
          let pts = new Int16Array(20);
          for(let k=0; k<20; k+=2) { pts[k] = precalcs[i][k] + cx; pts[k+1] = precalcs[i][k+1] + cy; }
          h.fillPoly(pts);
        }
      }
    } else {
      r(ex, ey, ex + thick, ey + eh); 
      r(ex, ey, ex + ew, ey + thick); 
      r(ex, ey + eh - thick, ex + ew, ey + eh); 
      r(ex + thick + Math.round(2 * scale), Math.round(cy - (5 * scale)), ex + ew, Math.round(cy - (3 * scale)));
      r(ex + thick + Math.round(2 * scale), Math.round(cy - (1 * scale)), ex + ew, Math.round(cy + (1 * scale)));
      r(ex + thick + Math.round(2 * scale), Math.round(cy + (3 * scale)), ex + ew, Math.round(cy + (5 * scale)));
      if (drawStars) {
        for (let i = 0; i < 13; i++) {
          let pts = new Int16Array(20);
          for(let k=0; k<20; k+=2) { pts[k] = precalcs[i][k] + cx; pts[k+1] = precalcs[i][k+1] + cy; }
          h.fillPoly(pts);
        }
      }
    }
  }

  // =========================================================
  // HIGH-FPS SIGNAL DRAWING ROUTINE
  // =========================================================
  function drawWaves(tFreq, tAmp, pFreq, pAmp, offset, isAligned) {
    "jit";
    let s = Math.sin;
    let cy = 180; 
    let f1 = tFreq * 0.01;
    let f2 = pFreq * 0.01;
    
    h.setColor(2);
    for(let x = 60; x <= 420; x += 40) h.drawLine(x, 100, x, 260);
    for(let y = 120; y <= 240; y += 20) h.drawLine(20, y, 460, y);
    h.drawLine(20, cy, 460, cy); 

    let scanX = 20 + ((offset * 2) % 440);
    h.setColor(1);
    h.drawLine(scanX, 100, scanX, 260);

    h.setColor(2);
    let lx = 20;
    let ly = cy + s((20 + offset) * f1) * tAmp;
    
    for (let x = 28; x <= 460; x += 8) { 
      let y = cy + s((x + offset) * f1) * tAmp;
      if (!isAligned && Math.random() > 0.8) y += (Math.random() * 8 - 4);
      h.drawLine(lx, ly, x, y);
      lx = x; ly = y;
    }

    h.setColor(isAligned ? 3 : 1);
    lx = 20;
    ly = cy + s((20 + offset) * f2) * pAmp;
    
    for (let x = 26; x <= 460; x += 6) { 
      let y = cy + s((x + offset) * f2) * pAmp;
      h.drawLine(lx, ly, x, y);
      lx = x; ly = y;
    }

    let dotY = cy + s((scanX + offset) * f2) * pAmp;
    h.setColor(3);
    h.fillRect(scanX - 2, dotY - 2, scanX + 2, dotY + 2);
  }

  function draw() {
    "ram";
    if (!redraw) return;

    if (state === -1) {
      h.clearRect(0, 0, 479, 319);

      if (bootPhase === 0) {
        let sy = Math.floor(scrollY); 

        h.setColor(1).setFontMonofonto16().setFontAlign(0, -1);
        h.drawString("--- ROBCO PIP-OS V7.1.0.8 ---", 240, 10 + sy);
        h.drawString("COPYRIGHT 2075-2077 ROBCO INDUSTRIES", 240, 28 + sy);

        h.setFontAlign(-1, -1);
        for (let i = 0; i < bootLineIdx; i++) {
          h.drawString(bootLines[i], 15, 85 + (i * 20) + sy);
        }
        
        if (bootLineIdx < bootLines.length) {
          h.drawString(bootLines[bootLineIdx].substring(0, Math.floor(bootCharIdx)), 15, 85 + (bootLineIdx * 20) + sy);
        }

        if (ENCLAVE_LOGO) {
          let imgMetrics = h.imageMetrics(ENCLAVE_LOGO);
          h.drawImage(ENCLAVE_LOGO, 240 - (imgMetrics.width / 2), (160 + sy) - (imgMetrics.height / 2)); 
        } else {
          drawEnclaveLogo(240, 160 + sy, 1.8, logoProgress, staticStars18, true);
        }

      } else if (bootPhase === 1) {
        h.setColor(3).setFontMonofonto28().setFontAlign(0, 0);
        h.drawString("INITIATING EMERGENCY", 240, 140);
        h.drawString("ENCLAVE FREQUENCY", 240, 180);
        h.setFontAlign(-1, -1);
      }
    } else if (state === 0) {
      h.clearRect(0, 0, 479, 319);
      
      drawEnclaveLogo(240, 30, 0.5, 100, [], false);
      h.setColor(3).setFontMonofonto18().setFontAlign(0, 0);
      h.drawString("SIGNAL PARSER", 240, 60);

      h.setColor(1).setFontMonofonto16().setFontAlign(-1, -1);
      h.drawString("FREQ", 20, 75);
      let freqSegs = Math.round(pFreq); 
      for(let i=0; i<10; i++) {
        let mx = 65 + (i * 10);
        if(i < freqSegs) { h.setColor(3); h.fillRect(mx, 75, mx + 6, 87); } 
        else { h.setColor(2); h.drawRect(mx, 75, mx + 6, 87); }
      }

      h.setColor(1).setFontAlign(1, -1);
      h.drawString("AMP", 460, 75);
      let ampSegs = Math.round(((pAmp - 10) / 50) * 10);
      for(let i=0; i<10; i++) {
        let mx = 325 + (i * 10);
        if(i < ampSegs) { h.setColor(3); h.fillRect(mx, 75, mx + 6, 87); } 
        else { h.setColor(2); h.drawRect(mx, 75, mx + 6, 87); }
      }
      h.setFontAlign(-1, -1);

      h.clearRect(15, 95, 465, 295);
      h.setColor(1);
      h.drawRect(20, 100, 460, 260);

      let isAligned = (Math.abs(tFreq - pFreq) < 1.5 && Math.abs(tAmp - pAmp) < 8);
      drawWaves(tFreq, tAmp, pFreq, pAmp, offset, isAligned);

      if (isAligned) {
        h.setColor(3).setFontMonofonto16().setFontAlign(0, 0);
        h.drawString("ALIGNMENT REACHED - PRESS TO DECODE", 240, 280);
      }
      h.setFontAlign(-1, -1);
      
    } else if (state === 1) {
      h.clearRect(0, 0, 479, 319);
      if (ENCLAVE_LOGO) {
        let imgMetrics = h.imageMetrics(ENCLAVE_LOGO);
        h.drawImage(ENCLAVE_LOGO, 240 - (imgMetrics.width / 2), 20); 
      } else {
        drawEnclaveLogo(240, 70, 1.2, 100, staticStars12, true);
      }

      h.setColor(1).setFontMonofonto18().setFontAlign(-1, -1);
      if (wrappedReports[currentReportIdx]) {
        let lines = wrappedReports[currentReportIdx];
        for (let i = 0; i < lines.length; i++) {
          h.drawString(lines[i], 20, 150 + (i * 22));
        }
      }

      h.setColor(2).setFontMonofonto16().setFontAlign(0, 0);
      h.drawString("Press to intercept new transmission", 240, 280);
      h.setFontAlign(-1, -1);
    }
    redraw = 0;
  }

  function onFrame(h) { "ram";
    if (state === -1) {
      if (bootPhase === 0) {
        if (!bootSoundPlayed) {
          try { Pip.playSound("SELECT"); } catch(e) {}
          bootSoundPlayed = true;
        }

        // Sped up logo animation
        if (logoProgress < 100) {
          logoProgress += 4.5; 
        }

        // FASTER BOOT TEXT
        if (bootLineIdx < bootLines.length) {
          if (Math.random() > 0.4) {
            bootCharIdx += (Math.random() * 6 + 4); 
          } else {
            bootCharIdx += Math.randInt(30) + 15;   
          }

          if (bootCharIdx >= bootLines[bootLineIdx].length) {
            bootCharIdx = 0;
            bootLineIdx++;
            
            // Increased chance to skip lines
            if (bootLineIdx < bootLines.length && Math.random() > 0.6) {
               bootLineIdx++;
            }
          }
        }
        
        let textBottom = 85 + (bootLineIdx * 20);
        let targetScroll = 0;
        if (textBottom > 260) {
            targetScroll = -(textBottom - 260); 
        }
        scrollY += (targetScroll - scrollY) * 0.25; 
        
        if (targetScroll < 0 && logoProgress >= 100) {
          bootWait++;
          if (bootWait > 6) { 
            bootPhase = 1;
            bootTimer = 0; 
          }
        }
        redraw = 1;

      } else if (bootPhase === 1) {
        bootTimer++;
        if (bootTimer === 1 && !glitchFired) {
          Pip.screenGlitch(); 
          glitchFired = true;
        }
        
        if (bootTimer > 60) { 
          state = 0;
        }
        redraw = 1;
      }

    } else if (state === 0) {
      offset += 3; 
      redraw = 1;

      let isAligned = (Math.abs(tFreq - pFreq) < 1.5 && Math.abs(tAmp - pAmp) < 8);
      if (isAligned && !wasAligned) {
          try { Pip.playSound("SELECT"); } catch(e) {} 
      } else if (!isAligned && wasAligned) {
          try { Pip.playSound("TAB"); } catch(e) {}    
      }
      wasAligned = isAligned;
      // Removed LED_DOWNFIRE pulse for memory optimization
    }

    if (redraw) {
      draw();
      h.flip();
      Pip.lastFlip = getTime();
    }
  }

  function handlePress() {
    if (state === -1) return; 

    if (state === 0) {
      let isAligned = (Math.abs(tFreq - pFreq) < 1.5 && Math.abs(tAmp - pAmp) < 8);
      if (isAligned) {
        Pip.screenGlitch(); 
        Pip.fadeTo([
          { pin: LED_GREEN, target: b },
          { pin: LED_RED, target: 0 },
          { pin: LED_STATS, target: b },
          { pin: LED_ITEMS, target: b },
          { pin: LED_DATA, target: b }
        ]);
        state = 1;
        currentReportIdx = Math.randInt(reports.length);
      } else {
        try { Pip.playSound("ERROR"); } catch(e) { Pip.playSound("TAB"); } 
        Pip.fadeTo([
          { pin: LED_GREEN, target: 0 },
          { pin: LED_RED, target: b }
        ]).then(() => {
          setTimeout(() => {
            Pip.fadeTo([
              { pin: LED_GREEN, target: b / 2 },
              { pin: LED_RED, target: 0 }
            ]);
          }, 300);
        });
      }
    } else {
      tFreq = Math.randInt(8) + 2;
      tAmp = Math.randInt(40) + 20;
      state = 0;
      Pip.playSound("TAB");
      Pip.fadeTo([
        { pin: LED_STATS, target: 0 },
        { pin: LED_ITEMS, target: 0 },
        { pin: LED_DATA, target: 0 }
      ]);
    }
    redraw = 1;
  }

  function onKnob1(dir) {
    if (state === -1) return;
    if (dir === 0) handlePress();
    else if (state === 0) {
      pFreq = E.clip(pFreq + (dir * 0.5), 1, 10);
      let isAligned = (Math.abs(tFreq - pFreq) < 1.5 && Math.abs(tAmp - pAmp) < 8);
      if (!isAligned && Math.random() > 0.4) {
          try { Pip.playSound("STATIC"); } catch(e) { Pip.playSound("SCROLL"); }
      }
      redraw = 1;
    }
  }

  function onKnob2(dir) {
    if (state === -1) return;
    if (dir === 0) handlePress();
    else if (state === 0) {
      pAmp = E.clip(pAmp + (dir * 3), 10, 60);
      let isAligned = (Math.abs(tFreq - pFreq) < 1.5 && Math.abs(tAmp - pAmp) < 8);
      if (!isAligned && Math.random() > 0.4) {
          try { Pip.playSound("STATIC"); } catch(e) { Pip.playSound("SCROLL"); }
      }
      redraw = 1;
    }
  }

  Pip.onExclusive("knob1", onKnob1);
  Pip.onExclusive("knob2", onKnob2);
  
  Pip.fadeTo([
    { pin: LED_GREEN, target: b / 2 },
    { pin: LED_RED, target: 0 },
    { pin: LED_STATS, target: 0 },
    { pin: LED_ITEMS, target: 0 },
    { pin: LED_DATA, target: 0 }
  ]);

  frameInterval = setInterval(onFrame, 33, h); 

  return {
    id: "ENCLAVE",
    notDefault: true,
    fullscreen: true,
    remove: function() {
      clearInterval(frameInterval);
      Pip.removeListener("knob1", onKnob1);
      Pip.removeListener("knob2", onKnob2);
      h.clear();
      
      Pip.fadeTo([
        { pin: LED_STATS, target: 0 === Pip.MODE ? b : 0 },
        { pin: LED_ITEMS, target: 1 === Pip.MODE ? b : 0 },
        { pin: LED_DATA, target: 2 === Pip.MODE ? b : 0 },
        { pin: LED_RED, target: b },
        { pin: LED_GREEN, target: b / 2 },
        { pin: LED_DOWNFIRE, target: Pip.charging ? b : 0 }
      ]);
    }
  };
});