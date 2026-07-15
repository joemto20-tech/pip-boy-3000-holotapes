"use strict";

const $ = (id) => document.getElementById(id);
const state = {
  info: null,
  world: null,
  painting: false,
  sprite: null,
  spritePainting: false,
  art: null,
  artPainting: false,
  artStart: null
};

const quickTools = [
  ["G", "Grass"], ["P", "Path"], ["B", "Block"], ["H", "House"], ["D", "Door"], ["S", "Sand"],
  ["spawn", "Spawn"], ["exit", "Exit"], ["regular", "Regular"], ["npcEncounter", "NPC Enc"], ["boss", "Boss"], ["shoot", "Shoot"], ["erase", "Erase"],
  ["tree", "Tree"], ["npc", "NPC"], ["camp", "Camp"], ["sign", "Sign"], ["rocks", "Rocks"]
];

const PLAYER_SPRITE_WIDTH = 34;
const PLAYER_SPRITE_HEIGHT = 34;
const PLAYER_SPRITE_BPP = 2;

const spritePresets = {
  blank: { label: "Blank 34x34", width: PLAYER_SPRITE_WIDTH, height: PLAYER_SPRITE_HEIGHT, bpp: PLAYER_SPRITE_BPP, pixels: null },
  pocketHero: { label: "Pocket RPG Hero", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008ABBBBBA0000", "0008ABBBBBBA0000",
    "0008FFFCCFFF0000", "000FDDDDDDDF0000", "000FDDCDCDDF0000", "0000FDDDDDF00000",
    "000007EEEE700000", "000077E99E770000", "00077E9999E77000", "00070E9999E07000",
    "00000EEEEEE00000", "0000066666600000", "0000660006600000", "0006600000660000"
  ] },
  vaultWanderer: { label: "Vault Wanderer", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "000007FFFF700000",
    "000077BBBB770000", "0007BB2222BB7000", "0007B25552B7000", "0000B25552B00000",
    "0000025552000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  courierDuster: { label: "Courier Duster", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "0000077777000000",
    "0000776666770000", "0007663333667000", "0007633333367000", "0007633E33367000",
    "0000033333000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  armoredCourier: { label: "Armored Courier", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "000007BBBB700000",
    "00007BEEEEB70000", "0007BEE44EEB7000", "0007BE4CC4EB7000", "0000BE4CC4EB0000",
    "00000EEEEEE00000", "0000066666600000", "0000660006600000", "0006600000660000"
  ] },
  vaultScout: { label: "Vault Scout", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "0000072227000000",
    "0000772222770000", "0007225555227000", "0007225EE5227000", "0000725555270000",
    "0000025552000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  wastelandMedic: { label: "Wasteland Medic", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "000007FFFF700000",
    "0000777777770000", "0007FF7777FF7000", "0007F77DD77F7000", "0000F77DD77F0000",
    "0000077777700000", "0000066666600000", "0000660006600000", "0006600000660000"
  ] },
  raiderRunner: { label: "Raider Runner", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "0000073337000000",
    "0000773BB3770000", "000733B33B37000", "00073BB33BB7000", "0000733333370000",
    "0000033333000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  ghoulDrifter: { label: "Ghoul Drifter", width: 16, height: 16, bpp: 4, rows: [
    "0000007777000000", "0000079999700000", "000079AAAA970000", "0007AA9999AA0000",
    "000A9666669A0000", "000A9696969A0000", "0000A96669A00000", "0000073337000000",
    "0000776666770000", "0007663333667000", "0007633B33367000", "0000633333360000",
    "0000033333000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  brotherhoodSquire: { label: "Brotherhood Squire", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "000007EEEE700000",
    "00007E4444E70000", "0007E44BB44E7000", "0007E4BEEB4E7000", "0000E44BB44E0000",
    "0000044444400000", "0000066666600000", "0000660006600000", "0006600000660000"
  ] },
  trailSheriff: { label: "Trail Sheriff", width: 16, height: 16, bpp: 4, rows: [
    "0000008888000000", "000008AAAA800000", "00008AFFFFA80000", "0008FFCCCCFF0000",
    "000FCDDDDDCF0000", "000FCD9D9DCF0000", "0000FCDDDCF00000", "0000077777000000",
    "0000776666770000", "0007663333667000", "0007633E33367000", "0007633333367000",
    "0000033E33000000", "0000066666000000", "0000660006600000", "0006600000660000"
  ] },
  ranger: { label: "Ranger", width: 16, height: 16, rows: [
    "0003333333330000", "0032222222223000", "0322222222222300", "3222222222222230",
    "3222211111222230", "3222110011222230", "3222110011222230", "0322111111222300",
    "0032221111223000", "0032222222223000", "0322202222022300", "3222202200222230",
    "3222022200222230", "0320022002202300", "0030022002203000", "0003330033330000"
  ] },
  radroach: { label: "Radroach", width: 16, height: 16, rows: [
    "0000003300000000", "0000032233000000", "0003222222330000", "0032222222223000",
    "0322202220222300", "3222022222202230", "3222223333222230", "0322233333322300",
    "0032233333323000", "0322223333222300", "3222022222202230", "0322202220222300",
    "0030022002203000", "0300200000220300", "3003000000030030", "0000000000000000"
  ] },
  tree: { label: "Tree", width: 16, height: 16, rows: [
    "0000003300000000", "0000033333000000", "0000333333300000", "0003333333330000",
    "0033333333333000", "0000333333300000", "0000333333300000", "0000033333000000",
    "0000003330000000", "0000003230000000", "0000003230000000", "0000003230000000",
    "0000003230000000", "0000033333000000", "0000000000000000", "0000000000000000"
  ] },
  camp: { label: "Camp", width: 16, height: 16, rows: [
    "0000000000000000", "0000000300000000", "0000003330000000", "0000033233000000",
    "0000332223300000", "0003322222330000", "0033222222233000", "0332222222223300",
    "0033333333333000", "0000300300300000", "0003330033330000", "0033000000033000",
    "0330000000003300", "0000000000000000", "0000000000000000", "0000000000000000"
  ] }
};

const artPresets = {
  blank: { label: "Blank", make: (w, h) => Array(w * h).fill(0) },
  desertTrail: { label: "Desert Trail", make: (w, h) => landscapeArt(w, h, "desertTrail") },
  ruinedTown: { label: "Ruined Town", make: (w, h) => landscapeArt(w, h, "ruinedTown") },
  canyonPass: { label: "Canyon Pass", make: (w, h) => landscapeArt(w, h, "canyonPass") },
  vaultRoad: { label: "Vault Road", make: (w, h) => landscapeArt(w, h, "vaultRoad") },
  dryRiver: { label: "Dry River", make: (w, h) => landscapeArt(w, h, "dryRiver") },
  railYard: { label: "Rail Yard", make: (w, h) => landscapeArt(w, h, "railYard") },
  irradiatedPond: { label: "Irradiated Pond", make: (w, h) => landscapeArt(w, h, "irradiatedPond") },
  nightCamp: { label: "Night Camp", make: (w, h) => landscapeArt(w, h, "nightCamp") },
  caveMouth: { label: "Cave Mouth", make: (w, h) => landscapeArt(w, h, "caveMouth") }
};

function setStatus(text, bad) {
  $("status").textContent = text;
  $("status").style.color = bad ? "var(--red)" : "var(--amber)";
}

async function api(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!body.ok) throw new Error(body.error || "B.I.R.D. request failed.");
  return body;
}

function rows(width, height, fill) {
  return Array.from({ length: height }, () => fill.repeat(width));
}

function newWorld(id = "WORLD_01", width = 42, height = 24) {
  state.world = {
    id,
    tile: 16,
    scale: 24,
    spawn: [2, 2],
    rows: rows(width, height, "G"),
    interacts: [],
    exits: [],
    decor: []
  };
  renderWorld();
}

function selectedWorldFile() {
  return `${cleanId($("worldId").value || state.world && state.world.id || "WORLD_NEW")}.JSON`;
}

function ensureOption(select, value, label) {
  if (!select || !value) return;
  if (![...select.options].some((option) => option.value === value)) {
    select.insertAdjacentHTML("beforeend", `<option value="${value}">${label || value}</option>`);
  }
  select.value = value;
}

function showView(view) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  document.querySelectorAll("[data-view-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.viewPanel !== view));
}

function artJsonForWorld(world) {
  const id = cleanId(world && world.id || world && world.file || "WORLD_ART");
  return world && world.image ? world.image.replace(/\.IMG$/i, ".JSON") : `${id}_ART.JSON`;
}

function worldFileForArt(name) {
  const base = cleanId(String(name || "").replace(/\.JSON$/i, "").replace(/_ART$/i, ""));
  return state.info && state.info.worlds && state.info.worlds.includes(`${base}.JSON`) ? `${base}.JSON` : "";
}

function worldWidth() {
  return state.world && state.world.rows[0] ? state.world.rows[0].length : 42;
}

function worldHeight() {
  return state.world && state.world.rows ? state.world.rows.length : 24;
}

function objectAt(list, x, y) {
  return (list || []).find((item) => item && item.x === x && item.y === y);
}

function decorMark(type) {
  return { tree: "T", npc: "N", camp: "C", sign: "S", rocks: "R" }[type] || "?";
}

function encounterMark(item) {
  if (!item) return "";
  if (item.type === "shoot") return "SH";
  if (item.boss) return "B!";
  if (item.npc) return "N!";
  return "E";
}

function renderWorld() {
  const world = state.world;
  if (!world) return;
  const grid = $("worldGrid");
  const width = worldWidth();
  const height = worldHeight();
  const cells = [];
  grid.style.gridTemplateColumns = `repeat(${width}, 16px)`;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const tile = (world.rows[y][x] || "G").toLowerCase();
      const interact = objectAt(world.interacts, x, y);
      const exit = objectAt(world.exits, x, y);
      const decor = objectAt(world.decor, x, y);
      const isSpawn = world.spawn && world.spawn[0] === x && world.spawn[1] === y;
      const mark = exit ? ">" : interact ? encounterMark(interact) : decor ? decorMark(decor.type) : "";
      cells.push(`<div class="cell ${tile}${isSpawn ? " spawn" : ""}" data-x="${x}" data-y="${y}" data-mark="${mark}"></div>`);
    }
  }
  grid.innerHTML = cells.join("");
  $("worldTitle").textContent = world.id;
  $("worldId").value = world.id;
  $("worldCols").value = width;
  $("worldRows").value = height;
  $("worldReadout").textContent = `${width} x ${height} - ${world.interacts.length} encounters`;
  $("worldJson").value = JSON.stringify(world, null, 2);
}

function cleanId(value) {
  return String(value || "WORLD_01").replace(/[^a-z0-9_]+/gi, "_").replace(/^_+|_+$/g, "").toUpperCase() || "WORLD_01";
}

function cleanOptionalId(value) {
  return String(value || "").replace(/[^a-z0-9_]+/gi, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

function artIndex(art, x, y) {
  return y * art.width + x;
}

function setPixel(pixels, width, height, x, y, value, size = 1) {
  const half = Math.floor(size / 2);
  for (let yy = y - half; yy <= y + half; yy += 1) {
    for (let xx = x - half; xx <= x + half; xx += 1) {
      if (xx >= 0 && yy >= 0 && xx < width && yy < height) pixels[yy * width + xx] = value;
    }
  }
}

function drawLinePixels(pixels, width, height, x0, y0, x1, y1, value, size = 1) {
  let dx = Math.abs(x1 - x0);
  let sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0);
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(pixels, width, height, x0, y0, value, size);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function drawRectPixels(pixels, width, height, x0, y0, x1, y1, value, size = 1, fill = false) {
  const left = Math.max(0, Math.min(x0, x1));
  const right = Math.min(width - 1, Math.max(x0, x1));
  const top = Math.max(0, Math.min(y0, y1));
  const bottom = Math.min(height - 1, Math.max(y0, y1));
  if (fill) {
    for (let y = top; y <= bottom; y += 1) for (let x = left; x <= right; x += 1) pixels[y * width + x] = value;
    return;
  }
  drawLinePixels(pixels, width, height, left, top, right, top, value, size);
  drawLinePixels(pixels, width, height, right, top, right, bottom, value, size);
  drawLinePixels(pixels, width, height, right, bottom, left, bottom, value, size);
  drawLinePixels(pixels, width, height, left, bottom, left, top, value, size);
}

function fillPixels(pixels, width, height, x, y, value) {
  const start = pixels[y * width + x];
  const stack = [[x, y]];
  let guard = width * height;
  if (start === value) return;
  while (stack.length && guard-- > 0) {
    const point = stack.pop();
    const px = point[0];
    const py = point[1];
    const idx = py * width + px;
    if (px < 0 || py < 0 || px >= width || py >= height || pixels[idx] !== start) continue;
    pixels[idx] = value;
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
}

function landscapeArt(width, height, kind) {
  const pixels = Array(width * height).fill(0);
  const horizon = Math.floor(height * 0.38);
  const roadCenter = Math.floor(width * 0.5);
  const roadBottom = Math.floor(width * 0.42);
  const roadTop = Math.max(8, Math.floor(width * 0.08));
  const put = (x, y, value, size = 1) => setPixel(pixels, width, height, Math.round(x), Math.round(y), value, size);
  const line = (x0, y0, x1, y1, value, size = 1) => drawLinePixels(pixels, width, height, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), value, size);
  const rect = (x0, y0, x1, y1, value, fill = true) => drawRectPixels(pixels, width, height, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), value, 1, fill);

  for (let y = 0; y < height; y += 1) {
    const v = y < horizon ? (y % 7 === 0 ? 1 : 0) : (y % 5 === 0 ? 1 : 2);
    for (let x = 0; x < width; x += 1) pixels[y * width + x] = v;
  }

  if (kind !== "caveMouth") {
    line(0, horizon, width - 1, horizon + 4, 2, 2);
    line(roadCenter - roadTop, horizon, roadCenter - roadBottom, height - 1, 3, 2);
    line(roadCenter + roadTop, horizon, roadCenter + roadBottom, height - 1, 3, 2);
    drawRectPixels(pixels, width, height, roadCenter - roadBottom, horizon, roadCenter + roadBottom, height - 1, 1, 1, true);
  }

  if (kind === "desertTrail") {
    for (let i = 0; i < 20; i += 1) put((i * 37) % width, horizon + 8 + ((i * 19) % (height - horizon - 12)), i % 2 ? 2 : 3, 2);
    line(width * .08, horizon + 8, width * .22, horizon - 12, 2, 2);
    line(width * .22, horizon - 12, width * .35, horizon + 6, 2, 2);
    line(width * .70, horizon + 4, width * .84, horizon - 16, 2, 2);
    line(width * .84, horizon - 16, width * .98, horizon + 6, 2, 2);
  } else if (kind === "ruinedTown") {
    for (let i = 0; i < 7; i += 1) {
      const x = 8 + i * Math.floor(width / 8);
      const y = horizon - 8 - (i % 3) * 5;
      rect(x, y, x + 18, horizon + 20, i % 2 ? 1 : 2, true);
      rect(x + 4, y + 6, x + 8, y + 12, 0, true);
      rect(x + 11, y + 5, x + 15, y + 14, 0, true);
    }
  } else if (kind === "canyonPass") {
    rect(0, horizon - 8, width * .25, height - 1, 1, true);
    rect(width * .76, horizon - 14, width - 1, height - 1, 1, true);
    line(width * .25, horizon - 8, width * .36, height - 1, 3, 3);
    line(width * .76, horizon - 14, width * .62, height - 1, 3, 3);
  } else if (kind === "vaultRoad") {
    rect(width * .38, horizon - 16, width * .62, horizon + 28, 1, true);
    rect(width * .44, horizon - 5, width * .56, horizon + 28, 0, true);
    line(width * .41, horizon - 16, width * .59, horizon - 16, 3, 2);
    line(width * .5, horizon - 22, width * .5, horizon + 32, 2, 1);
  } else if (kind === "dryRiver") {
    drawRectPixels(pixels, width, height, width * .1, horizon + 14, width * .82, height - 1, 0, 1, true);
    line(width * .1, horizon + 14, width * .38, height - 1, 3, 2);
    line(width * .82, horizon + 14, width * .60, height - 1, 3, 2);
    for (let i = 0; i < 12; i += 1) line(i * 21, height - 10 - (i % 5) * 7, i * 21 + 24, height - 18 - (i % 4) * 5, 1, 1);
  } else if (kind === "railYard") {
    for (let r = -2; r <= 2; r += 1) {
      line(width * .5 + r * 16, horizon, width * .5 + r * 44, height - 1, 3, 1);
      line(width * .5 + r * 16 + 8, horizon, width * .5 + r * 44 + 30, height - 1, 2, 1);
    }
    for (let y = horizon + 8; y < height; y += 11) line(width * .18, y, width * .82, y + 2, 1, 1);
  } else if (kind === "irradiatedPond") {
    drawRectPixels(pixels, width, height, width * .28, horizon + 18, width * .72, height - 18, 3, 1, true);
    for (let i = 0; i < 7; i += 1) line(width * .28, horizon + 22 + i * 10, width * .72, horizon + 18 + i * 9, i % 2 ? 2 : 0, 1);
    put(width * .75, horizon + 12, 3, 3);
    put(width * .78, horizon + 4, 2, 2);
  } else if (kind === "nightCamp") {
    for (let y = 0; y < horizon; y += 1) for (let x = 0; x < width; x += 1) pixels[y * width + x] = (x + y) % 19 === 0 ? 3 : 0;
    rect(width * .44, horizon + 28, width * .56, horizon + 38, 3, true);
    line(width * .47, horizon + 27, width * .5, horizon + 10, 2, 2);
    line(width * .53, horizon + 27, width * .5, horizon + 10, 2, 2);
    rect(width * .43, horizon + 39, width * .57, horizon + 42, 1, true);
  } else if (kind === "caveMouth") {
    for (let y = horizon; y < height; y += 1) for (let x = 0; x < width; x += 1) pixels[y * width + x] = 1;
    drawRectPixels(pixels, width, height, width * .25, horizon - 8, width * .75, height - 1, 0, 1, true);
    line(width * .25, horizon - 8, width * .5, horizon - 32, 3, 3);
    line(width * .75, horizon - 8, width * .5, horizon - 32, 3, 3);
    line(width * .35, height - 1, width * .45, horizon + 25, 2, 2);
    line(width * .65, height - 1, width * .55, horizon + 25, 2, 2);
  }
  return pixels;
}

function makeArt(width = 240, height = 148, fill = 0) {
  state.art = { name: cleanId($("artName").value || "WORLD_ART"), width, height, bpp: 2, pixels: Array(width * height).fill(fill) };
  renderArt();
}

function makeArtForWorld(presetKey) {
  const preset = artPresets[presetKey || $("worldArtPreset").value] || artPresets.blank;
  const width = Math.max(32, Math.min(255, Number($("artWidth").value) || 240));
  const height = Math.max(32, Math.min(255, Number($("artHeight").value) || 148));
  const worldId = cleanId($("worldId").value || state.world && state.world.id || "WORLD_NEW");
  state.art = { name: `${worldId}_ART`, width, height, bpp: 2, pixels: preset.make(width, height) };
  $("artName").value = state.art.name;
  ensureOption($("artWorld"), selectedWorldFile(), worldId);
  renderArt();
}

function imageName(file) {
  return cleanId(String(file && file.name || "IMPORTED_ART").replace(/\.[^.]+$/g, ""));
}

function imageDrawRect(image, width, height, mode) {
  if (mode === "stretch") return { sx: 0, sy: 0, sw: image.width, sh: image.height, dx: 0, dy: 0, dw: width, dh: height };
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  if (mode === "crop") {
    const sw = sourceRatio > targetRatio ? image.height * targetRatio : image.width;
    const sh = sourceRatio > targetRatio ? image.height : image.width / targetRatio;
    return { sx: (image.width - sw) / 2, sy: (image.height - sh) / 2, sw, sh, dx: 0, dy: 0, dw: width, dh: height };
  }
  const dw = sourceRatio > targetRatio ? width : height * sourceRatio;
  const dh = sourceRatio > targetRatio ? width / sourceRatio : height;
  return { sx: 0, sy: 0, sw: image.width, sh: image.height, dx: (width - dw) / 2, dy: (height - dh) / 2, dw, dh };
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Pick an image first."));
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be loaded."));
    };
    image.src = url;
  });
}

function readBinaryFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Pick an IMG file first."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("That IMG file could not be read."));
    reader.readAsArrayBuffer(file);
  });
}

async function convertImageToArt() {
  const file = $("imageImport").files && $("imageImport").files[0];
  const image = await loadImageFile(file);
  const width = Math.max(32, Math.min(255, Number($("artWidth").value) || 240));
  const height = Math.max(32, Math.min(255, Number($("artHeight").value) || 148));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rect = imageDrawRect(image, width, height, $("imageImportMode").value);
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const pixels = [];
  for (let index = 0; index < rgba.length; index += 4) {
    const alpha = rgba[index + 3] / 255;
    const luma = (rgba[index] * 0.299 + rgba[index + 1] * 0.587 + rgba[index + 2] * 0.114) * alpha;
    pixels.push(Math.max(0, Math.min(3, Math.round(luma / 85))));
  }
  const baseName = imageName(file);
  const worldId = state.world ? state.world.id : cleanId($("worldId").value || "WORLD");
  const currentName = cleanId($("artName").value || "");
  const defaultName = !currentName || currentName === `${worldId}_ART` || currentName === "WORLD_ART";
  state.art = { name: defaultName ? `${worldId}_${baseName}` : currentName, width, height, bpp: 2, pixels };
  $("artName").value = state.art.name;
  ensureOption($("artWorld"), selectedWorldFile(), worldId);
  renderArt();
  setStatus(`Converted ${file.name} to art JSON`);
}

function renderArt() {
  const art = state.art;
  if (!art) return;
  const canvas = $("artCanvas");
  const ctx = canvas.getContext("2d");
  const scale = Math.max(1, Math.floor(Math.min(960 / art.width, 560 / art.height)));
  const colors = ["#031003", "#315e2b", "#83d45e", "#dcff9d"];
  canvas.width = art.width * scale;
  canvas.height = art.height * scale;
  canvas.style.width = `${art.width * scale}px`;
  canvas.style.height = `${art.height * scale}px`;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < art.height; y += 1) {
    for (let x = 0; x < art.width; x += 1) {
      ctx.fillStyle = colors[art.pixels[artIndex(art, x, y)] || 0];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  $("artName").value = art.name;
  $("artWidth").value = art.width;
  $("artHeight").value = art.height;
  $("artTitle").textContent = art.name;
  $("artReadout").textContent = `${art.width} x ${art.height} - 2 bpp`;
  $("artJson").value = JSON.stringify(art, null, 2);
}

function artPoint(event) {
  const canvas = $("artCanvas");
  const art = state.art;
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(art.width - 1, Math.floor((event.clientX - rect.left) * art.width / rect.width))),
    y: Math.max(0, Math.min(art.height - 1, Math.floor((event.clientY - rect.top) * art.height / rect.height)))
  };
}

function paintArtPoint(point, fillRect) {
  const art = state.art;
  const value = Number($("artBrush").value) || 0;
  const size = Math.max(1, Math.min(16, Number($("artBrushSize").value) || 1));
  const tool = $("artTool").value;
  if (!art) return;
  if (tool === "fill") {
    fillPixels(art.pixels, art.width, art.height, point.x, point.y, value);
  } else if (tool === "line" && state.artStart) {
    drawLinePixels(art.pixels, art.width, art.height, state.artStart.x, state.artStart.y, point.x, point.y, value, size);
  } else if (tool === "rect" && state.artStart) {
    drawRectPixels(art.pixels, art.width, art.height, state.artStart.x, state.artStart.y, point.x, point.y, value, size, !!fillRect);
  } else if (tool === "brush") {
    setPixel(art.pixels, art.width, art.height, point.x, point.y, value, size);
  }
  renderArt();
}

function placeEncounter(tool, x, y) {
  const world = state.world;
  const enemy = $("encEnemy").value || "RANDOM";
  const prompt = $("encPrompt").value || (tool === "finalBoss" ? "FINAL BOSS?" : tool === "miniboss" ? "MINIBOSS?" : tool === "forge" ? "FORGE FINAL ROUND?" : tool === "boss" ? "BOSS?" : tool === "shoot" ? "TAKE SHOT?" : tool === "npcEncounter" ? "TALK?" : "ENCOUNTER?");
  const once = $("encOnce").checked;
  const pickedSprite = $("decorSprite").value;
  const minRegular = Math.max(0, Math.min(20, Number($("minRegular").value) || 0));
  const bullet = cleanOptionalId($("bulletId").value || "");
  world.interacts = (world.interacts || []).filter((item) => !(item.x === x && item.y === y));
  if (tool === "npcEncounter") {
    world.decor = (world.decor || []).filter((item) => !(item.x === x && item.y === y));
    world.decor.push({ id: `${world.id.toLowerCase()}_npc_${x}_${y}`, type: "npc", x, y, sprite: pickedSprite || "NPC_SPRITE", facing: $("npcFacing").value || "right" });
  }
  const base = {
    id: `${world.id.toLowerCase()}_${tool}_${x}_${y}`,
    x,
    y,
    prompt,
    once
  };
  if (tool === "shoot") {
    world.interacts.push({ ...base, type: "shoot", target: $("shootTarget").value || "RADROACH", enemy: $("shootTarget").value || "RADROACH" });
  } else if (tool === "forge") {
    world.interacts.push({ ...base, type: "forge", once: false });
  } else if (tool === "miniboss") {
    const music = $("encMusic").value;
    const interact = {
      ...base,
      type: "battle",
      boss: true,
      miniboss: true,
      enemy,
      music: music === "false" ? false : (music || "NVTH")
    };
    if (minRegular > 2) interact.minRegular = minRegular;
    if (bullet) interact.bullet = bullet;
    world.interacts.push(interact);
  } else if (tool === "finalBoss") {
    const music = $("encMusic").value;
    world.interacts.push({
      ...base,
      type: "battle",
      boss: true,
      finalBoss: true,
      enemy,
      music: music === "false" ? false : (music || "NVTH")
    });
  } else if (tool === "boss") {
    const music = $("encMusic").value;
    world.interacts.push({
      ...base,
      type: "battle",
      boss: true,
      enemy,
      music: music === "false" ? false : (music || "NVTH")
    });
  } else {
    const music = $("encMusic").value;
    const interact = {
      ...base,
      type: "battle",
      npc: tool === "npcEncounter",
      enemy,
      music: music === "false" ? false : (music || undefined)
    };
    if (tool === "npcEncounter") {
      interact.decorId = `${world.id.toLowerCase()}_npc_${x}_${y}`;
      interact.patrol = $("npcPatrol").value || "horizontal";
      interact.dir = $("npcFacing").value || "right";
      interact.range = Math.max(0, Math.min(12, Number($("npcRange").value) || 0));
      interact.sight = 6;
    }
    world.interacts.push(interact);
  }
}

function applyWorldTool(x, y) {
  const world = state.world;
  const tool = $("worldTool").value;
  if (!world) return;
  if ("GPBHDSX".includes(tool)) {
    const row = world.rows[y].split("");
    row[x] = tool;
    world.rows[y] = row.join("");
  } else if (tool === "spawn") {
    world.spawn = [x, y];
  } else if (tool === "exit") {
    const requiredRound = cleanOptionalId($("exitRequiredRound").value || "");
    const exit = {
      id: `${world.id.toLowerCase()}_exit_${x}_${y}`,
      x,
      y,
      to: cleanId($("exitTo").value || "WORLD_02"),
      spawn: [Number($("exitX").value) || 2, Number($("exitY").value) || 2],
      facing: $("exitFacing").value || "down"
    };
    if (requiredRound) exit.requiresRound = requiredRound;
    world.exits = (world.exits || []).filter((item) => !(item.x === x && item.y === y));
    world.exits.push(exit);
  } else if (tool === "regular" || tool === "boss" || tool === "shoot" || tool === "npcEncounter" || tool === "miniboss" || tool === "forge" || tool === "finalBoss") {
    placeEncounter(tool, x, y);
  } else if (["tree", "npc", "camp", "sign", "rocks"].includes(tool)) {
    world.decor = (world.decor || []).filter((item) => !(item.x === x && item.y === y));
    world.decor.push({ id: `${world.id.toLowerCase()}_${tool}_${x}_${y}`, type: tool, x, y, sprite: $("decorSprite").value || `${tool.toUpperCase()}_SPRITE` });
  } else if (tool === "erase") {
    world.interacts = (world.interacts || []).filter((item) => !(item.x === x && item.y === y));
    world.exits = (world.exits || []).filter((item) => !(item.x === x && item.y === y));
    world.decor = (world.decor || []).filter((item) => !(item.x === x && item.y === y));
  }
  renderWorld();
}

function worldCell(event) {
  return event.target.closest(".cell");
}

function rowsToPixels(rowList) {
  return rowList.join("").split("").map((value) => {
    const parsed = parseInt(value, 16);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}

function rowsToPlayerPresetPixels(preset) {
  const rowList = preset.rows || [];
  const srcHeight = rowList.length;
  const srcWidth = Math.max(1, ...rowList.map((row) => row.length));
  const scale = Math.max(1, Math.floor(Math.min(PLAYER_SPRITE_WIDTH / srcWidth, PLAYER_SPRITE_HEIGHT / srcHeight)));
  const offsetX = Math.floor((PLAYER_SPRITE_WIDTH - srcWidth * scale) / 2);
  const offsetY = Math.floor((PLAYER_SPRITE_HEIGHT - srcHeight * scale) / 2);
  const sourceMax = (1 << normalizeSpriteBpp(preset.bpp || PLAYER_SPRITE_BPP)) - 1;
  const pixels = Array(PLAYER_SPRITE_WIDTH * PLAYER_SPRITE_HEIGHT).fill(0);
  for (let sy = 0; sy < srcHeight; sy += 1) {
    const row = rowList[sy] || "";
    for (let sx = 0; sx < srcWidth; sx += 1) {
      const raw = parseInt(row[sx] || "0", 16);
      const value = Number.isFinite(raw) ? Math.max(0, Math.min(PLAYER_SPRITE_BPP === 2 ? 3 : raw, Math.round(raw * 3 / sourceMax))) : 0;
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          const x = offsetX + sx * scale + xx;
          const y = offsetY + sy * scale + yy;
          if (x >= 0 && y >= 0 && x < PLAYER_SPRITE_WIDTH && y < PLAYER_SPRITE_HEIGHT) pixels[y * PLAYER_SPRITE_WIDTH + x] = value;
        }
      }
    }
  }
  return pixels;
}

function selectedSpriteBpp() {
  const bpp = Number($("spriteBpp").value);
  return bpp === 1 || bpp === 2 || bpp === 4 ? bpp : 2;
}

function spriteBaseName(value) {
  return cleanId(String(value || "SPRITE").replace(/\.(JS|IMG)$/i, ""));
}

function isPlayerSpriteName(value) {
  return /^PLAYER_SPRITE/i.test(spriteBaseName(value));
}

function spriteRuntimeExt(value) {
  return isPlayerSpriteName(value) ? ".IMG" : ".JS";
}

function refreshSpriteBrush() {
  const brush = $("spriteBrush");
  const current = Number(brush.value) || 0;
  const max = (1 << selectedSpriteBpp()) - 1;
  brush.innerHTML = Array.from({ length: max + 1 }, (_, value) => `<option value="${value}">${value}</option>`).join("");
  brush.value = String(Math.min(current, max));
}

function normalizeSpriteBpp(value) {
  const bpp = Number(value);
  return bpp === 1 || bpp === 2 || bpp === 4 ? bpp : 2;
}

function normalizeSpriteData(input, fallbackName) {
  const raw = input && input.sprite ? input.sprite : input;
  if (!raw || typeof raw !== "object") throw new Error("Sprite data must be an object.");
  const width = Math.max(1, Math.min(64, Number(raw.width) || Number(raw.w) || 12));
  const height = Math.max(1, Math.min(64, Number(raw.height) || Number(raw.h) || 14));
  const bpp = normalizeSpriteBpp(raw.bpp);
  const max = (1 << bpp) - 1;
  let pixels = Array.isArray(raw.pixels) ? raw.pixels.slice() : null;
  if (!pixels && Array.isArray(raw.rows)) pixels = rowsToPixels(raw.rows);
  if (!pixels && typeof raw.rows === "string") pixels = rowsToPixels(raw.rows.split(/\r?\n/).filter(Boolean));
  if (!pixels) throw new Error("Sprite data needs pixels or rows.");
  pixels = pixels.slice(0, width * height).map((value) => Math.max(0, Math.min(max, Number(value) || 0)));
  while (pixels.length < width * height) pixels.push(0);
  return {
    name: cleanId(raw.name || raw.id || fallbackName || "IMPORTED_SPRITE"),
    width,
    height,
    bpp,
    pixels
  };
}

function applySprite(sprite) {
  state.sprite = normalizeSpriteData(sprite, $("spriteName").value || "IMPORTED_SPRITE");
  $("spriteName").value = state.sprite.name;
  $("spriteWidth").value = state.sprite.width;
  $("spriteHeight").value = state.sprite.height;
  $("spriteBpp").value = String(state.sprite.bpp);
  renderSprite();
}

function makeSprite(width = PLAYER_SPRITE_WIDTH, height = PLAYER_SPRITE_HEIGHT, fill = 0) {
  state.sprite = { name: $("spriteName").value || "PLAYER_SPRITEUP", width, height, bpp: selectedSpriteBpp(), pixels: Array(width * height).fill(fill) };
  renderSprite();
}

function renderSprite() {
  const sprite = state.sprite;
  if (!sprite) return;
  const grid = $("spriteGrid");
  const bpp = selectedSpriteBpp();
  grid.className = `sprite-grid bpp${bpp}`;
  grid.style.gridTemplateColumns = `repeat(${sprite.width}, 22px)`;
  grid.innerHTML = sprite.pixels.map((value, index) => {
    const x = index % sprite.width;
    const y = Math.floor(index / sprite.width);
    return `<div class="pixel v${value || 0}" data-x="${x}" data-y="${y}"></div>`;
  }).join("");
  sprite.name = cleanId($("spriteName").value || sprite.name || "PLAYER_SPRITE");
  sprite.bpp = bpp;
  refreshSpriteBrush();
  $("spriteTitle").textContent = sprite.name;
  $("spriteReadout").textContent = `${sprite.width} x ${sprite.height} - ${sprite.bpp} bpp - runtime ${spriteRuntimeExt(sprite.name)}`;
  $("spriteCode").value = spriteOutputText();
  if ($("downloadSprite")) $("downloadSprite").textContent = isPlayerSpriteName(sprite.name) ? "Download IMG" : "Download JS";
  if (isPlayerSpriteName(sprite.name)) $("spriteScope").value = "global";
}

function paintSprite(x, y) {
  const sprite = state.sprite;
  if (!sprite) return;
  sprite.pixels[y * sprite.width + x] = Number($("spriteBrush").value) || 0;
  renderSprite();
}

function packSpritePixelBytes(sprite) {
  const bpp = normalizeSpriteBpp(sprite.bpp);
  const max = (1 << bpp) - 1;
  const bytes = new Uint8Array(Math.ceil(sprite.width * sprite.height * bpp / 8));
  for (let index = 0; index < sprite.width * sprite.height; index += 1) {
    const value = Math.max(0, Math.min(max, Number(sprite.pixels[index]) || 0));
    let remaining = bpp;
    let bit = index * bpp;
    while (remaining > 0) {
      const byteIndex = Math.floor(bit / 8);
      const bitOffset = bit % 8;
      const writable = Math.min(remaining, 8 - bitOffset);
      const shift = 8 - bitOffset - writable;
      bytes[byteIndex] |= ((value >> (remaining - writable)) & ((1 << writable) - 1)) << shift;
      remaining -= writable;
      bit += writable;
    }
  }
  return bytes;
}

function unpackSpritePixelBytes(buffer, width, height, bpp) {
  const input = new Uint8Array(buffer);
  const pixels = [];
  const mask = (1 << bpp) - 1;
  for (let index = 0; index < width * height; index += 1) {
    let remaining = bpp;
    let bit = index * bpp;
    let value = 0;
    while (remaining > 0) {
      const byteIndex = Math.floor(bit / 8);
      const bitOffset = bit % 8;
      const readable = Math.min(remaining, 8 - bitOffset);
      const shift = 8 - bitOffset - readable;
      value = (value << readable) | (((input[byteIndex] || 0) >> shift) & ((1 << readable) - 1));
      remaining -= readable;
      bit += readable;
    }
    pixels.push(value & mask);
  }
  return pixels;
}

function packSpritePixels(sprite) {
  const bytes = packSpritePixelBytes(sprite);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function spriteSnippet() {
  const sprite = state.sprite;
  const name = cleanId($("spriteName").value || sprite.name || "PLAYER_SPRITE");
  const bpp = selectedSpriteBpp();
  return `var ${name}={width:${sprite.width},height:${sprite.height},bpp:${bpp},transparent:0,buffer:atob("${packSpritePixels({ ...sprite, bpp })}")};`;
}

function spriteOutputText() {
  const sprite = state.sprite;
  const name = spriteBaseName($("spriteName").value || sprite && sprite.name || "SPRITE");
  if (!isPlayerSpriteName(name)) return spriteSnippet();
  return [
    `Runtime output: ${name}.IMG`,
    `Upload path: Assets/DATA/${name}.IMG -> HOLO/BIGIRON/DATA/${name}.IMG`,
    "",
    "Player direction sprites use IMG in the current low-memory Big Iron build.",
    "Use Download IMG or Save Runtime Sprite for the Pip-Boy file."
  ].join("\n");
}

function spritePixel(event) {
  return event.target.closest(".pixel");
}

async function importSpriteImg() {
  const file = $("spriteImgImport").files && $("spriteImgImport").files[0];
  const bytes = new Uint8Array(await readBinaryFile(file));
  const width = bytes[0];
  const height = bytes[1];
  const bpp = normalizeSpriteBpp(bytes[2] & 15);
  if (!width || !height || !bpp || bytes.length < 4) throw new Error("Sprite IMG is incomplete.");
  applySprite({
    name: imageName(file),
    width,
    height,
    bpp,
    pixels: unpackSpritePixelBytes(bytes.slice(4), width, height, bpp)
  });
  setStatus(`Imported ${file.name}`);
}

async function convertImageToSprite() {
  const file = $("spriteImageImport").files && $("spriteImageImport").files[0];
  const image = await loadImageFile(file);
  const width = Math.max(1, Math.min(64, Number($("spriteWidth").value) || state.sprite && state.sprite.width || 12));
  const height = Math.max(1, Math.min(64, Number($("spriteHeight").value) || state.sprite && state.sprite.height || 14));
  const bpp = selectedSpriteBpp();
  const max = (1 << bpp) - 1;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rect = imageDrawRect(image, width, height, $("spriteImageMode").value);
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const pixels = [];
  for (let index = 0; index < rgba.length; index += 4) {
    const alpha = rgba[index + 3] / 255;
    const luma = (rgba[index] * 0.299 + rgba[index + 1] * 0.587 + rgba[index + 2] * 0.114) * alpha;
    pixels.push(Math.max(0, Math.min(max, Math.round(luma * max / 255))));
  }
  const currentName = cleanId($("spriteName").value || "");
  const name = currentName && !/^PLAYER_SPRITEUP$/i.test(currentName) ? currentName : `${imageName(file)}_SPRITE`;
  applySprite({ name, width, height, bpp, pixels });
  setStatus(`Converted ${file.name} to sprite`);
}

function download(name, text, type) {
  const blob = new Blob([text], { type: type || "text/plain" });
  downloadBlob(name, blob);
}

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function spriteImageBlob() {
  const sprite = state.sprite;
  const bpp = selectedSpriteBpp();
  const pixelBytes = packSpritePixelBytes({ ...sprite, bpp });
  const bytes = new Uint8Array(pixelBytes.length + 4);
  bytes[0] = sprite.width;
  bytes[1] = sprite.height;
  bytes[2] = 128 | bpp;
  bytes[3] = 0;
  bytes.set(pixelBytes, 4);
  return new Blob([bytes], { type: "application/octet-stream" });
}

function downloadSpriteRuntime() {
  if (!state.sprite) return;
  const name = spriteBaseName($("spriteName").value || state.sprite.name || "SPRITE");
  if (isPlayerSpriteName(name)) {
    downloadBlob(`${name}.IMG`, spriteImageBlob());
    return;
  }
  download(`${name}.JS`, spriteSnippet() + "\n", "application/javascript");
}

async function loadInfo() {
  state.info = await api("/api/info");
  const worldDetails = state.info.worldDetails && state.info.worldDetails.length
    ? state.info.worldDetails
    : state.info.worlds.map((file) => ({ file, id: file.replace(/\.JSON$/i, ""), image: "" }));
  const worldOptions = state.info.worlds.length
    ? state.info.worlds.map((name) => `<option value="${name}">${name}</option>`).join("")
    : '<option value="WORLD_NEW.JSON">WORLD_NEW - new offline world</option>';
  $("worldSelect").innerHTML = worldOptions;
  $("artWorld").innerHTML = state.info.worlds.length
    ? state.info.worlds.map((name) => `<option value="${name}">${name.replace(/\.JSON$/i, "")}</option>`).join("")
    : '<option value="WORLD_NEW.JSON">WORLD_NEW - save world first</option>';
  const linkedArt = new Set(worldDetails.map((world) => artJsonForWorld(world).toUpperCase()));
  const worldArtOptions = worldDetails.map((world) => {
    const label = world.image ? `${world.id} - ${world.image}` : `${world.id} - new art`;
    return `<option value="world:${world.file}">${label}</option>`;
  });
  const looseArtOptions = (state.info.worldArt || [])
    .filter((name) => !linkedArt.has(String(name).toUpperCase()))
    .map((name) => `<option value="art:${name}">${name}</option>`);
  $("artSelect").innerHTML = worldArtOptions.concat(looseArtOptions).join("") || '<option value="world:WORLD_NEW.JSON">WORLD_NEW - save world first</option>';
  $("worldArtPreset").innerHTML = Object.entries(artPresets).map(([key, preset]) => `<option value="${key}">${preset.label}</option>`).join("");
  $("spriteSelect").innerHTML = state.info.sprites.map((name) => `<option value="${name}">${name}</option>`).join("");
  const decorSprites = state.info.sprites.filter((name) => !isPlayerSpriteName(name));
  $("decorSprite").innerHTML = ['<option value="">Auto</option>']
    .concat(decorSprites.map((name) => `<option value="${name.replace(/\.(JS|IMG)$/i, "")}">${name}</option>`))
    .join("");
  const enemyOptions = ['<option value="RANDOM">RANDOM</option>'].concat(state.info.enemies.map((enemy) => `<option value="${enemy.id}">${enemy.name} LV${enemy.level}</option>`));
  $("encEnemy").innerHTML = enemyOptions.join("");
  $("packageNotes").textContent = [
    `Big Iron version: ${state.info.version}`,
    "",
    "Start/menu boot files:",
    "APP.MIN.JS -> HOLO/BIGIRON/APP.JS",
    "IMAGE.BIN -> HOLO/BIGIRON/IMAGE.BIN",
    "MENU.BIN -> HOLO/BIGIRON/MENU.BIN",
    "BIGIRON.IMG -> HOLO/BIGIRON/BIGIRON.IMG",
    "Assets/CODE/SELECTER.IMG -> HOLO/BIGIRON/CODE/SELECTER.IMG",
    "",
    "Runtime code:",
    "Assets/CODE/WORLD.MIN.JS -> HOLO/BIGIRON/CODE/WORLD.JS",
    "Assets/CODE/BATTLE.MIN.JS -> HOLO/BIGIRON/CODE/BATTLE.JS",
    "Assets/CODE/SHOOT.MIN.JS -> HOLO/BIGIRON/CODE/SHOOT.JS",
    "",
    "Battle data:",
    "battle.json -> HOLO/BIGIRON/battle.json",
    "Assets/battle.json -> HOLO/BIGIRON/Assets/battle.json if that folder is mirrored",
    "",
    "World JSON files:",
    "Assets/DATA/WORLD_01.JSON -> HOLO/BIGIRON/DATA/WORLD_01.JSON",
    "Assets/DATA/WORLD_02.JSON -> HOLO/BIGIRON/DATA/WORLD_02.JSON",
    "Assets/DATA/WORLD_03.JSON -> HOLO/BIGIRON/DATA/WORLD_03.JSON",
    "Assets/DATA/WORLD_04.JSON -> HOLO/BIGIRON/DATA/WORLD_04.JSON",
    "Assets/DATA/WORLD_05.JSON -> HOLO/BIGIRON/DATA/WORLD_05.JSON",
    "Assets/DATA/WORLD_06.JSON -> HOLO/BIGIRON/DATA/WORLD_06.JSON",
    "",
    "World art files:",
    "Assets/WORLD/*.IMG -> HOLO/BIGIRON/WORLD/*.IMG",
    "",
    "Player movement sprites:",
    "Assets/DATA/PLAYER_SPRITEUP.IMG -> HOLO/BIGIRON/DATA/PLAYER_SPRITEUP.IMG",
    "Assets/DATA/PLAYER_SPRITEDOWN.IMG -> HOLO/BIGIRON/DATA/PLAYER_SPRITEDOWN.IMG",
    "Assets/DATA/PLAYER_SPRITEL.IMG -> HOLO/BIGIRON/DATA/PLAYER_SPRITEL.IMG",
    "Assets/DATA/PLAYER_SPRITER.IMG -> HOLO/BIGIRON/DATA/PLAYER_SPRITER.IMG",
    "Do not upload the old PLAYER_SPRITE*.JS files for the player.",
    "",
    "NPC/decor sprite snippets:",
    "Assets/DATA/*SPRITE*.JS -> HOLO/BIGIRON/DATA/*SPRITE*.JS",
    "Assets/DATA/WORLD_XX/*SPRITE*.JS -> HOLO/BIGIRON/DATA/WORLD_XX/*SPRITE*.JS",
    "",
    "Local sprite copies saved by the Sprite Creator:",
    state.info.spriteExportRoot || "tools/bird/exports/sprites",
    "",
    "Battle/shoot encounter types emitted by B.I.R.D.:",
    'regular -> { type:"battle", enemy:"..." }',
    'npc encounter -> { type:"battle", npc:true, patrol:"horizontal", dir:"right", range:3 } plus visible NPC decor',
    'miniboss -> { type:"battle", miniboss:true, bullet:"..." }',
    'forge -> { type:"forge" } for the Courier round press',
    'final boss -> { type:"battle", finalBoss:true }',
    'round-locked exit -> { requiresRound:"SCORCHED" }',
    'boss -> { type:"battle", boss:true, enemy:"...", music:"NVTH" }',
    'shoot -> { type:"shoot", target:"RADROACH" }',
    "",
    "Other DATA snippets:",
    "Assets/DATA/EYEBOT.JS and similar visual snippets go in HOLO/BIGIRON/DATA/"
  ].join("\n");
}

async function loadWorld(name) {
  const body = await api(`/api/world?name=${encodeURIComponent(name || $("worldSelect").value || "WORLD_01.JSON")}`);
  state.world = body.world;
  renderWorld();
  ensureOption($("artWorld"), `${state.world.id}.JSON`, state.world.id);
  if (state.world.image) {
    $("artName").value = state.world.image.replace(/\.IMG$/i, "");
  }
  setStatus(`Loaded ${body.name}`);
}

async function saveWorld() {
  state.world.id = cleanId($("worldId").value || state.world.id);
  const body = await api("/api/world", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: state.world.id, world: state.world })
  });
  setStatus(`Saved ${body.name}`);
  await loadInfo();
}

async function loadArtFile(name) {
  const body = await api(`/api/art?name=${encodeURIComponent(name || $("artName").value || "WORLD_ART")}`);
  state.art = { ...body.art, pixels: body.art.pixels.slice() };
  $("artName").value = body.art.name || body.name.replace(/\.JSON$/i, "");
  renderArt();
  return body;
}

async function loadArt(name) {
  const selection = name || $("artSelect").value || $("artName").value || "WORLD_ART";
  if (String(selection).startsWith("world:")) {
    const worldFile = selection.slice(6);
    await loadWorld(worldFile);
    const artFile = artJsonForWorld(state.world);
    ensureOption($("artWorld"), `${state.world.id}.JSON`, state.world.id);
    $("artName").value = artFile.replace(/\.JSON$/i, "");
    if (state.world.image || (state.info.worldArt || []).some((item) => item.toUpperCase() === artFile.toUpperCase())) {
      const body = await loadArtFile(artFile);
      setStatus(`Loaded ${state.world.id} with ${body.name}`);
    } else {
      makeArtForWorld($("artPreset").value || $("worldArtPreset").value);
      setStatus(`Prepared new art for ${state.world.id}`);
    }
    return;
  }
  const artFile = String(selection).startsWith("art:") ? selection.slice(4) : selection;
  const worldFile = worldFileForArt(artFile);
  if (worldFile) {
    await loadWorld(worldFile).catch(() => {});
    ensureOption($("artWorld"), worldFile, worldFile.replace(/\.JSON$/i, ""));
  }
  const body = await loadArtFile(artFile);
  setStatus(`Loaded ${body.name}`);
}

async function saveArt() {
  state.art.name = cleanId($("artName").value || state.art.name || "WORLD_ART");
  state.art.width = Math.max(8, Math.min(255, Number($("artWidth").value) || state.art.width));
  state.art.height = Math.max(8, Math.min(255, Number($("artHeight").value) || state.art.height));
  if (state.world && $("artWorld").value === selectedWorldFile()) {
    await saveWorld();
    ensureOption($("artWorld"), selectedWorldFile(), state.world.id);
  }
  const body = await api("/api/art", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: state.art.name,
      world: $("artWorld").value,
      imageDraw: "patch",
      imgScale: 2,
      art: state.art
    })
  });
  state.art = { ...body.art, pixels: body.art.pixels.slice() };
  renderArt();
  setStatus(`Saved ${body.name} and linked world`);
  await loadInfo();
  await loadWorld($("artWorld").value).catch(() => {});
}

async function loadSprite(name) {
  const body = await api(`/api/sprite?name=${encodeURIComponent(name || $("spriteSelect").value)}`);
  const sprite = body.sprite;
  state.sprite = { ...sprite, pixels: sprite.pixels.slice() };
  $("spriteName").value = sprite.name;
  $("spriteWidth").value = sprite.width;
  $("spriteHeight").value = sprite.height;
  $("spriteBpp").value = String(sprite.bpp);
  renderSprite();
  setStatus(`Loaded ${body.name}`);
}

async function saveSprite() {
  state.sprite.name = cleanId($("spriteName").value || state.sprite.name);
  state.sprite.bpp = selectedSpriteBpp();
  const playerSprite = /^PLAYER_SPRITE/i.test(state.sprite.name);
  const body = await api("/api/sprite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...state.sprite,
      scope: playerSprite ? "global" : $("spriteScope").value,
      world: state.world ? state.world.id : cleanId($("worldId").value || "WORLD_01")
    })
  });
  $("spriteCode").value = body.snippet;
  setStatus(`Saved ${body.name}`);
  await loadInfo();
  if (body.ref && !body.global) $("decorSprite").value = body.ref;
}

async function saveSpriteLocal() {
  state.sprite.name = cleanId($("spriteName").value || state.sprite.name);
  state.sprite.bpp = selectedSpriteBpp();
  const playerSprite = /^PLAYER_SPRITE/i.test(state.sprite.name);
  const body = await api("/api/sprite-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...state.sprite,
      scope: playerSprite ? "global" : $("spriteScope").value,
      world: state.world ? state.world.id : cleanId($("worldId").value || "WORLD_01")
    })
  });
  $("spriteCode").value = body.snippet;
  setStatus(`Saved local copy ${body.name}`);
}

function wireEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  $("quickTools").innerHTML = quickTools.map(([value, label]) => `<button data-tool="${value}">${label}</button>`).join("");
  $("quickTools").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tool]");
    if (button) $("worldTool").value = button.dataset.tool;
  });

  $("worldGrid").addEventListener("pointerdown", (event) => {
    const cell = worldCell(event);
    if (!cell) return;
    state.painting = true;
    $("worldGrid").setPointerCapture(event.pointerId);
    applyWorldTool(Number(cell.dataset.x), Number(cell.dataset.y));
  });
  $("worldGrid").addEventListener("pointerover", (event) => {
    const cell = worldCell(event);
    if (!cell) return;
    if (!state.painting || event.buttons === 0) { state.painting = false; return; }
    applyWorldTool(Number(cell.dataset.x), Number(cell.dataset.y));
  });
  document.addEventListener("pointerup", () => { state.painting = false; }, true);
  window.addEventListener("blur", () => { state.painting = false; });

  $("spriteGrid").addEventListener("pointerdown", (event) => {
    const cell = spritePixel(event);
    if (!cell) return;
    state.spritePainting = true;
    $("spriteGrid").setPointerCapture(event.pointerId);
    paintSprite(Number(cell.dataset.x), Number(cell.dataset.y));
  });
  $("spriteGrid").addEventListener("pointerover", (event) => {
    const cell = spritePixel(event);
    if (!cell) return;
    if (!state.spritePainting || event.buttons === 0) { state.spritePainting = false; return; }
    paintSprite(Number(cell.dataset.x), Number(cell.dataset.y));
  });
  document.addEventListener("pointerup", () => { state.spritePainting = false; }, true);
  window.addEventListener("blur", () => { state.spritePainting = false; state.artPainting = false; state.artStart = null; });

  $("loadWorld").onclick = () => loadWorld();
  $("newWorld").onclick = () => newWorld(cleanId($("worldId").value || "WORLD_NEW"), Number($("worldCols").value) || 42, Number($("worldRows").value) || 24);
  $("newWorldBuild").onclick = () => {
    newWorld(cleanId($("worldId").value || "WORLD_NEW"), Number($("worldCols").value) || 42, Number($("worldRows").value) || 24);
    makeArtForWorld($("worldArtPreset").value);
    ensureOption($("worldSelect"), selectedWorldFile(), state.world.id);
    ensureOption($("artWorld"), selectedWorldFile(), state.world.id);
  };
  $("presetWorldArt").onclick = () => {
    makeArtForWorld($("worldArtPreset").value);
    setStatus(`Prepared art for ${state.world ? state.world.id : cleanId($("worldId").value)}`);
  };
  $("editWorldArt").onclick = async () => {
    if (state.world && state.world.image) {
      await loadArt(state.world.image.replace(/\.IMG$/i, ".JSON")).catch(() => makeArtForWorld($("worldArtPreset").value));
    } else if (!state.art) {
      makeArtForWorld($("worldArtPreset").value);
    }
    ensureOption($("artWorld"), selectedWorldFile(), state.world ? state.world.id : cleanId($("worldId").value));
    showView("art");
  };
  $("saveWorld").onclick = () => saveWorld().catch((error) => setStatus(error.message, true));
  $("downloadWorld").onclick = () => download(`${cleanId($("worldId").value)}.JSON`, JSON.stringify(state.world, null, 2) + "\n", "application/json");
  $("worldId").oninput = () => { if (state.world) { state.world.id = cleanId($("worldId").value); renderWorld(); } };

  $("artCanvas").addEventListener("pointerdown", (event) => {
    if (!state.art) return;
    const point = artPoint(event);
    state.artPainting = true;
    state.artStart = point;
    $("artCanvas").setPointerCapture(event.pointerId);
    if ($("artTool").value === "brush" || $("artTool").value === "fill") paintArtPoint(point, event.shiftKey);
  });
  $("artCanvas").addEventListener("pointermove", (event) => {
    if (!state.artPainting || event.buttons === 0) { state.artPainting = false; return; }
    if ($("artTool").value === "brush") paintArtPoint(artPoint(event), event.shiftKey);
  });
  $("artCanvas").addEventListener("pointerup", (event) => {
    if (!state.artPainting) return;
    const tool = $("artTool").value;
    if (tool === "line" || tool === "rect") paintArtPoint(artPoint(event), event.shiftKey);
    state.artPainting = false;
    state.artStart = null;
  });
  $("artCanvas").addEventListener("pointercancel", () => { state.artPainting = false; state.artStart = null; });
  $("loadArt").onclick = () => loadArt().catch((error) => setStatus(error.message, true));
  $("newArt").onclick = () => makeArt(Number($("artWidth").value) || 240, Number($("artHeight").value) || 148, 0);
  $("clearArt").onclick = () => { if (state.art) { state.art.pixels.fill(0); renderArt(); } };
  $("convertImage").onclick = () => convertImageToArt().catch((error) => setStatus(error.message, true));
  $("imageImport").onchange = () => {
    const file = $("imageImport").files && $("imageImport").files[0];
    const worldId = state.world ? state.world.id : cleanId($("worldId").value || "WORLD");
    const currentName = cleanId($("artName").value || "");
    if (file && (!currentName || currentName === `${worldId}_ART` || currentName === "WORLD_ART")) $("artName").value = `${worldId}_${imageName(file)}`;
  };
  $("saveArt").onclick = () => saveArt().catch((error) => setStatus(error.message, true));
  $("downloadArtJson").onclick = () => download(`${cleanId($("artName").value)}.JSON`, JSON.stringify(state.art, null, 2) + "\n", "application/json");
  $("artPreset").innerHTML = Object.entries(artPresets).map(([key, preset]) => `<option value="${key}">${preset.label}</option>`).join("");
  $("loadArtPreset").onclick = () => {
    const preset = artPresets[$("artPreset").value];
    const width = Math.max(32, Math.min(255, Number($("artWidth").value) || 240));
    const height = Math.max(32, Math.min(255, Number($("artHeight").value) || 148));
    state.art = { name: cleanId($("artName").value || "WORLD_ART"), width, height, bpp: 2, pixels: preset.make(width, height) };
    renderArt();
  };

  $("loadSprite").onclick = () => loadSprite().catch((error) => setStatus(error.message, true));
  $("newSprite").onclick = () => makeSprite(Number($("spriteWidth").value) || 12, Number($("spriteHeight").value) || 14, 0);
  $("importSpriteImg").onclick = () => importSpriteImg().catch((error) => setStatus(error.message, true));
  $("convertSpriteImage").onclick = () => convertImageToSprite().catch((error) => setStatus(error.message, true));
  $("spriteImageImport").onchange = () => {
    const file = $("spriteImageImport").files && $("spriteImageImport").files[0];
    const currentName = cleanId($("spriteName").value || "");
    if (file && (!currentName || /^PLAYER_SPRITEUP$/i.test(currentName))) $("spriteName").value = `${imageName(file)}_SPRITE`;
  };
  $("saveSprite").onclick = () => saveSprite().catch((error) => setStatus(error.message, true));
  $("saveSpriteLocal").onclick = () => saveSpriteLocal().catch((error) => setStatus(error.message, true));
  $("downloadSprite").onclick = downloadSpriteRuntime;
  $("spriteBpp").onchange = () => {
    refreshSpriteBrush();
    if (state.sprite) renderSprite();
  };
  $("mirrorSprite").onclick = () => {
    const sprite = state.sprite;
    const pixels = [];
    for (let y = 0; y < sprite.height; y += 1) for (let x = sprite.width - 1; x >= 0; x -= 1) pixels.push(sprite.pixels[y * sprite.width + x]);
    sprite.pixels = pixels;
    renderSprite();
  };
  $("invertSprite").onclick = () => {
    const max = (1 << selectedSpriteBpp()) - 1;
    state.sprite.pixels = state.sprite.pixels.map((value) => max - value);
    renderSprite();
  };
  $("spritePreset").innerHTML = Object.entries(spritePresets).map(([key, preset]) => `<option value="${key}">${preset.label}</option>`).join("");
  $("loadPreset").onclick = () => {
    const preset = spritePresets[$("spritePreset").value];
    const width = preset.rows ? PLAYER_SPRITE_WIDTH : (preset.width || PLAYER_SPRITE_WIDTH);
    const height = preset.rows ? PLAYER_SPRITE_HEIGHT : (preset.height || PLAYER_SPRITE_HEIGHT);
    const bpp = preset.rows ? PLAYER_SPRITE_BPP : normalizeSpriteBpp(preset.bpp || $("spriteBpp").value);
    const pixels = preset.pixels || (preset.rows ? rowsToPlayerPresetPixels(preset) : Array(width * height).fill(0));
    state.sprite = { name: cleanId($("spriteName").value || "PLAYER_SPRITE"), width, height, bpp, pixels };
    $("spriteWidth").value = state.sprite.width;
    $("spriteHeight").value = state.sprite.height;
    $("spriteBpp").value = String(bpp);
    renderSprite();
  };
  refreshSpriteBrush();
}

async function start() {
  wireEvents();
  await loadInfo();
  try {
    if (state.info.worlds.length) await loadWorld(state.info.worlds[0]);
    else newWorld();
  } catch (error) {
    newWorld();
    setStatus(`World load skipped: ${error.message}`, true);
  }
  try {
    if (state.info.sprites.length) await loadSprite(state.info.sprites[0]);
    else makeSprite();
  } catch (error) {
    makeSprite();
    setStatus(`Sprite load skipped: ${error.message}`, true);
  }
  try {
    if (state.info.worlds.length) await loadArt(`world:${state.info.worlds[0]}`);
    else if (state.info.worldArt && state.info.worldArt.length) await loadArt(`art:${state.info.worldArt[0]}`);
    else makeArt();
  } catch (error) {
    makeArt();
    setStatus(`World art load skipped: ${error.message}`, true);
  }
  setStatus("Ready");
}

start().catch((error) => setStatus(error.message, true));
