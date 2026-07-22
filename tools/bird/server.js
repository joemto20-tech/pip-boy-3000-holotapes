"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const PORT = Number(process.env.BIRD_PORT || 7331);
const HOST = "127.0.0.1";
const appRoot = __dirname;
const publicRoot = path.join(appRoot, "public");

function findBigIronRoot(start) {
  let current = path.resolve(start);
  while (true) {
    const candidates = [
      path.join(current, "holotapes", "BigIron"),
      path.join(current, "BigIron"),
      current
    ];
    for (const candidate of candidates) {
      if (
        fs.existsSync(path.join(candidate, "Assets", "DATA")) ||
        fs.existsSync(path.join(candidate, "battle.json")) ||
        fs.existsSync(path.join(candidate, "metadata.json"))
      ) {
        return candidate;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(start, "..", "..", "holotapes", "BigIron");
}

const repoRoot = path.resolve(appRoot, "..", "..");
const bigIronRoot = findBigIronRoot(appRoot);
const assetsRoot = path.join(bigIronRoot, "Assets");
const dataRoot = path.join(assetsRoot, "DATA");
const itemIconRoot = path.join(assetsRoot, "ITEMS");
const worldArtRoot = path.join(assetsRoot, "WORLD");
const exportRoot = path.join(appRoot, "exports");
const spriteExportRoot = path.join(exportRoot, "sprites");
const metadataPath = path.join(bigIronRoot, "metadata.json");
const battlePath = path.join(bigIronRoot, "battle.json");
const battleAssetPath = path.join(assetsRoot, "battle.json");
const itemsPath = path.join(dataRoot, "ITEMS.JSON");

const WORLD_LIMITS = {
  worldJsonBytes: 2800,
  rows: 32,
  cols: 48,
  interacts: 18,
  decor: 36,
  exits: 8,
  artWidth: 255,
  artHeight: 255,
  playerSpriteBytes: 304,
  spriteBytes: 1536,
  videoBytes: 450000
};

const WORLD_DEFINITIONS = [
  { id: "WORLD_01", name: "Sunscar", miniboss: "Solomon Ray", round: "SCORCHED", unlocks: "WORLD_02" },
  { id: "WORLD_02", name: "Dogtown Heights", miniboss: "Danner Cole", round: "HOUND", unlocks: "WORLD_03" },
  { id: "WORLD_03", name: "Crown Junction", miniboss: "Odessa Crown", round: "CROWN", unlocks: "WORLD_04" },
  { id: "WORLD_04", name: "The Broken Arch", miniboss: "Captain Mordecai Flint", round: "RIVER", unlocks: "WORLD_05" },
  { id: "WORLD_05", name: "The Black Loop", miniboss: "Warden Elias Black", round: "BLACK", unlocks: "WORLD_06" },
  { id: "WORLD_06", name: "Vale's World", miniboss: "Harlan Vale", round: "COURIER", unlocks: "" }
];
const BATTLE_UI_DEFAULTS = {
  prompt: "CHOOSE AN ACTION",
  reloadPrompt: "SLASH NOW",
  attack: "",
  stim: "STIMPAK",
  reloadAttack: "SLASH",
  reloadStim: "STIMPAK",
  attackDetail: "DMG {dmg}",
  stimDetail: "HEAL {heal} x{st}",
  enemyReload: "ENEMY RELOADS",
  reloadAttackMsg: "KEEP SLASHING",
  pauseResume: "RESUME",
  pauseSave: "SAVE LOCATION",
  pauseExit: "EXIT GAME",
  pauseNote: "TURN WHEEL / PRESS TO SELECT"
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function send(res, status, body, type) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body || ""));
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Content-Length": payload.length,
    "Cache-Control": "no-store"
  });
  res.end(payload);
}

function json(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), "application/json; charset=utf-8");
}

function fail(res, status, message) {
  json(res, status, { ok: false, error: message });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function bodyJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function cleanBase(value, fallback) {
  return String(value || fallback)
    .replace(/\.[^.]+$/g, "")
    .replace(/[^a-z0-9_]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase() || fallback;
}

function cleanSpriteRef(value, fallback) {
  const parts = String(value || fallback)
    .replace(/\.(JS|IMG)$/i, "")
    .split(/[\\/]+/)
    .map((part) => cleanBase(part, ""))
    .filter(Boolean);
  return (parts.length ? parts : [fallback]).join("/");
}

function worldDisplayName(id) {
  const key = cleanBase(id, "WORLD_01");
  const found = WORLD_DEFINITIONS.find((world) => world.id === key);
  if (found) return found.name;
  return key;
}

function dataPath(name, fallback, ext) {
  const fileName = cleanBase(name, fallback) + ext;
  const target = path.resolve(dataRoot, fileName);
  if (!target.startsWith(path.resolve(dataRoot))) throw new Error("Unsafe file path.");
  return target;
}

function spritePath(name, fallback, forceExt) {
  const ref = cleanSpriteRef(name, fallback);
  const isPlayer = /^PLAYER_SPRITE/i.test(path.basename(ref));
  const baseTarget = path.resolve(dataRoot, ...ref.split("/"));
  const ext = forceExt || (isPlayer || fs.existsSync(baseTarget + ".IMG") ? ".IMG" : ".JS");
  const target = baseTarget + ext;
  if (!target.startsWith(path.resolve(dataRoot))) throw new Error("Unsafe sprite path.");
  return { ref, target, ext };
}

function spriteExportPath(name, fallback) {
  const ref = cleanSpriteRef(name, fallback);
  const target = path.resolve(spriteExportRoot, ...ref.split("/")) + ".JS";
  if (!target.startsWith(path.resolve(spriteExportRoot))) throw new Error("Unsafe sprite export path.");
  return { ref, target };
}

function worldArtPath(name, fallback, ext) {
  const fileName = cleanBase(name, fallback) + ext;
  const target = path.resolve(worldArtRoot, fileName);
  if (!target.startsWith(path.resolve(worldArtRoot))) throw new Error("Unsafe world art path.");
  return target;
}

function listData(ext, pattern) {
  try {
    return fs.readdirSync(dataRoot)
      .filter((name) => name.toUpperCase().endsWith(ext) && (!pattern || pattern.test(name)))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    return [];
  }
}

function listSprites() {
  const found = [];
  function walk(folder) {
    if (!fs.existsSync(folder)) return;
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, item.name);
      if (item.isDirectory()) walk(full);
      else if (/\.(JS|IMG)$/i.test(item.name) && /(SPRITE|PROJECTILE|BULLET|HIT|EFFECT)/i.test(item.name)) {
        found.push(path.relative(dataRoot, full).replace(/\\/g, "/"));
      }
    }
  }
  walk(dataRoot);
  const imgPlayers = new Set(found.filter((name) => /^PLAYER_SPRITE/i.test(path.basename(name)) && /\.IMG$/i.test(name)).map((name) => name.replace(/\.IMG$/i, "").toUpperCase()));
  return found
    .filter((name) => !( /^PLAYER_SPRITE/i.test(path.basename(name)) && /\.JS$/i.test(name) && imgPlayers.has(name.replace(/\.JS$/i, "").toUpperCase()) ))
    .sort((a, b) => a.localeCompare(b));
}

function listWorldArt(ext) {
  try {
    if (!fs.existsSync(worldArtRoot)) fs.mkdirSync(worldArtRoot, { recursive: true });
    return fs.readdirSync(worldArtRoot)
      .filter((name) => name.toUpperCase().endsWith(ext))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    return [];
  }
}

function listWorldDetails() {
  return listData(".JSON", /^WORLD_/i).map((file) => {
    const world = readJson(path.join(dataRoot, file), {});
    const compact = compactRuntimeWorld(normalizeWorld(world));
    return {
      file,
      id: cleanBase(world.id || file, file.replace(/\.JSON$/i, "")),
      name: world.name || worldDisplayName(world.id || file),
      image: world.image || "",
      size: Buffer.byteLength(compact, "utf8"),
      rows: Array.isArray(world.rows) ? world.rows.length : 0,
      cols: world.rows && world.rows[0] ? String(world.rows[0]).length : 0,
      interacts: Array.isArray(world.interacts) ? world.interacts.length : 0,
      decor: Array.isArray(world.decor) ? world.decor.length : 0,
      exits: Array.isArray(world.exits) ? world.exits.length : 0
    };
  });
}

function listMedia(folder, rel) {
  const out = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      const name = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory()) walk(full, name);
      else if (/\.(AVI|WAV|IMG|BIN|BMP|PNG|JSON)$/i.test(item.name)) {
        const stat = fs.statSync(full);
        out.push({
          file: name.replace(/\\/g, "/"),
          path: `${rel}/${name}`.replace(/\\/g, "/"),
          size: stat.size,
          kind: path.extname(item.name).replace(".", "").toUpperCase()
        });
      }
    }
  }
  walk(folder, "");
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function cleanScreenText(value, fallback, max = 24) {
  return String(value || fallback || "")
    .replace(/[^a-z0-9 ._!?'-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

function cleanUiText(value, fallback, max = 24) {
  return String(value === undefined || value === null ? fallback || "" : value)
    .replace(/[^a-z0-9 ._!?'\-{}\/]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function readBattle() {
  const rootBattle = readJson(battlePath, {});
  const assetBattle = readJson(battleAssetPath, {});
  const battle = rootBattle && Object.keys(rootBattle).length ? rootBattle : assetBattle;
  if (!battle.enemies && assetBattle.enemies) battle.enemies = assetBattle.enemies;
  return battle && typeof battle === "object" ? battle : {};
}

function writeBattle(battle) {
  const data = JSON.stringify(battle, null, 2) + "\n";
  fs.writeFileSync(battlePath, data, "utf8");
  fs.writeFileSync(battleAssetPath, data, "utf8");
}

function normalizeBattleEnemy(input) {
  if (!input || typeof input !== "object") throw new Error("Enemy config is required.");
  const id = cleanBase(input.id || input.name, "ENEMY");
  const enemy = {
    id,
    name: cleanScreenText(input.name || id, id, 20),
    level: Math.max(1, Math.min(99, Number(input.level) || 1)),
    maxHP: Math.max(1, Math.min(999, Number(input.maxHP) || 75)),
    xp: Math.max(0, Math.min(999, Number(input.xp) || 35))
  };
  const folder = cleanBase(input.folder || "", "");
  if (folder) enemy.folder = folder.charAt(0) + folder.slice(1).toLowerCase();
  if (input.melee) enemy.melee = 1;
  if (input.reload) enemy.reload = 1;
  if (Number(input.meleePower) > 0) enemy.meleePower = Math.max(1, Math.min(99, Number(input.meleePower)));
  if (Number(input.radAmount) > 0) enemy.rad = [Math.max(1, Math.min(25, Number(input.radAmount))), Math.max(1, Math.min(60, Number(input.radSeconds) || 4))];
  if (Number(input.dotAmount) > 0) enemy.dot = [Math.max(1, Math.min(99, Number(input.dotAmount))), Math.max(1, Math.min(60, Number(input.dotSeconds) || 5))];
  const videos = {};
  for (const key of ["idle", "start", "enemyFaint", "playerFaint", "victory", "defeat"]) {
    const value = String(input.videos && input.videos[key] || "").trim();
    if (value) videos[key] = value;
  }
  if (Object.keys(videos).length) enemy.videos = videos;
  const ui = {};
  for (const [key, fallback] of Object.entries(BATTLE_UI_DEFAULTS)) {
    const raw = input.ui && input.ui[key];
    const value = cleanUiText(raw === undefined || raw === null || raw === "" ? fallback : raw, fallback, key === "prompt" || key === "reloadPrompt" || key === "pauseNote" ? 54 : 22);
    if (value !== fallback) ui[key] = value;
  }
  if (Object.keys(ui).length) enemy.ui = ui;
  return enemy;
}

function battleSummary(battle) {
  return (battle.enemies || []).map((enemy) => ({
    id: enemy.id || enemy.name || enemy.folder,
    name: enemy.name || enemy.id || enemy.folder,
    folder: enemy.folder || "",
    level: enemy.level || 1,
    maxHP: enemy.maxHP || 0,
    xp: enemy.xp || 0,
    rad: enemy.rad || null,
    dot: enemy.dot || null,
    reload: !!enemy.reload,
    melee: !!enemy.melee,
    meleePower: enemy.meleePower || 0,
    videos: enemy.videos || {},
    ui: enemy.ui || {}
  }));
}

function itemIconPath(key, fileName) {
  const ext = (path.extname(fileName || "") || ".IMG").toUpperCase();
  const safeExt = [".IMG", ".BMP", ".PNG"].includes(ext) ? ext : ".IMG";
  const target = path.resolve(itemIconRoot, cleanBase(key, "ITEM") + safeExt);
  if (!target.startsWith(path.resolve(itemIconRoot))) throw new Error("Unsafe item icon path.");
  return target;
}

function readItems() {
  const items = readJson(itemsPath, {});
  return items && typeof items === "object" && !Array.isArray(items) ? items : {};
}

function nextItemId(items) {
  const used = new Set();
  Object.keys(items || {}).forEach((key) => {
    const item = items[key];
    const id = item && (item.realId !== undefined ? item.realId : item.formId !== undefined ? item.formId : item.itemId);
    const parsed = Number(id);
    if (Number.isFinite(parsed)) used.add(parsed);
  });
  let id = 900001;
  while (used.has(id)) id += 1;
  return id;
}

function itemCat(kind, effect, cat) {
  const explicit = cleanBase(cat || "", "");
  if (explicit) return explicit;
  const type = String(kind || "").toLowerCase();
  const fx = String(effect || "").toLowerCase();
  if (type === "weapon") return "WEAPONS";
  if (type === "ammo" || fx === "ammo") return "AMMO";
  if (type === "aid" || fx === "heal" || fx === "stimpak") return "AID";
  return "MISC";
}

function normalizeItem(input, currentItems) {
  if (!input || typeof input !== "object") throw new Error("Item needs a name.");
  const name = String(input.name || input.txt || "").trim();
  if (!name) throw new Error("Item name is required.");
  const key = cleanBase(input.key || input.ref || name, "ITEM");
  const kind = String(input.kind || input.type || "misc").toLowerCase();
  const effect = String(input.effect || (kind === "weapon" ? "damage" : "none")).toLowerCase();
  const damage = Math.max(0, Math.floor(Number(input.damage || input.dmg || 0)));
  const count = Math.max(1, Math.floor(Number(input.count || input.cnt || input.min || 1)));
  const chance = Math.max(0, Math.min(1, Number(input.chance === undefined || input.chance === "" ? 1 : input.chance)));
  const realId = input.realId === "" || input.realId === undefined || input.realId === null
    ? nextItemId(currentItems)
    : (Number.isFinite(Number(input.realId)) ? Number(input.realId) : cleanBase(input.realId, key));
  const item = {
    id: cleanBase(input.id || `BIGIRON_${key}`, `BIGIRON_${key}`),
    name,
    kind,
    effect,
    cat: itemCat(kind, effect, input.cat || input.realCat),
    realId,
    cnt: count,
    min: count,
    max: count,
    chance
  };
  if (kind === "weapon" || damage > 0) item.dmg = damage;
  if (input.icon) item.icon = String(input.icon);
  if (input.condition !== undefined && input.condition !== "") item.condition = Number(input.condition) || input.condition;
  return { key, item };
}

function saveItemIcon(key, icon) {
  if (!icon || !icon.data) return "";
  const raw = String(icon.data);
  const match = raw.match(/^data:[^;]+;base64,(.+)$/);
  const payload = match ? match[1] : raw;
  const target = itemIconPath(key, icon.name || `${key}.IMG`);
  fs.mkdirSync(itemIconRoot, { recursive: true });
  fs.writeFileSync(target, Buffer.from(payload, "base64"));
  const fileName = path.basename(target);
  addMetadataStorage(`HOLO/BIGIRON/ITEMS/${fileName}`, `Assets/ITEMS/${fileName}`);
  addInfoFile(`HOLO/BIGIRON/ITEMS/${fileName}`);
  return `ITEMS/${fileName}`;
}

function normalizeWorld(input) {
  if (!input || typeof input !== "object") throw new Error("World must be a JSON object.");
  const rows = Array.isArray(input.rows) ? input.rows : [];
  if (!rows.length) throw new Error("World needs rows.");
  const width = Math.max(1, ...rows.map((row) => String(row || "").length));
  const cleanRows = rows.map((row) =>
    (String(row || "").toUpperCase().replace(/[^GPBHDSXRFS]/g, "G") + "G".repeat(width)).slice(0, width)
  );
  const world = {
    id: cleanBase(input.id, "WORLD_01"),
    tile: Number(input.tile) || 16,
    scale: Number(input.scale) || 24,
    spawn: Array.isArray(input.spawn) ? input.spawn.slice(0, 2).map((n) => Number(n) || 0) : [2, 2],
    rows: cleanRows,
    interacts: Array.isArray(input.interacts) ? input.interacts : [],
    exits: Array.isArray(input.exits) ? input.exits : [],
    decor: Array.isArray(input.decor) ? input.decor : []
  };
  world.name = input.name ? String(input.name) : worldDisplayName(world.id);
  for (const key of ["image", "imageDraw", "drawMode"]) {
    if (input[key]) world[key] = String(input[key]);
  }
  for (const key of ["imgScale", "step", "w", "h", "lightRadius", "lightBand", "npcPace"]) {
    if (input[key] !== undefined) world[key] = Number(input[key]) || input[key];
  }
  for (const key of ["spawnPx", "imageInteracts", "imageExits", "imageDecor", "imageBlocks", "blocks"]) {
    if (input[key] !== undefined) world[key] = input[key];
  }
  return world;
}

function compactRuntimeWorld(world) {
  const copy = JSON.parse(JSON.stringify(world));
  const clean = (item) => {
    if (!item || typeof item !== "object") return item;
    delete item.storyCity;
    delete item.storyType;
    delete item.lockedMsg;
    delete item.bulletName;
    delete item.miniboss;
    delete item.finalBoss;
    delete item.bullet;
    delete item.requiresRound;
    delete item.music;
    if (item.w === 1) delete item.w;
    if (item.h === 1) delete item.h;
    if (item.minRegular === 2) delete item.minRegular;
    return item;
  };
  delete copy.tile;
  delete copy.scale;
  if (Array.isArray(copy.interacts)) copy.interacts.forEach(clean);
  if (Array.isArray(copy.exits)) copy.exits.forEach(clean);
  if (Array.isArray(copy.decor)) copy.decor.forEach(clean);
  return JSON.stringify(copy) + "\n";
}

function normalizeArt(input) {
  if (!input || typeof input !== "object") throw new Error("World art must be a JSON object.");
  const width = Math.max(8, Math.min(255, Number(input.width) || 240));
  const height = Math.max(8, Math.min(255, Number(input.height) || 148));
  const bpp = Number(input.bpp) === 1 ? 1 : 2;
  const max = (1 << bpp) - 1;
  const pixels = Array.isArray(input.pixels) ? input.pixels.slice(0, width * height) : [];
  while (pixels.length < width * height) pixels.push(0);
  return {
    name: cleanBase(input.name, "WORLD_ART"),
    width,
    height,
    bpp,
    pixels: pixels.map((value) => Math.max(0, Math.min(max, Number(value) || 0)))
  };
}

function packPixels(pixels, width, height, bpp) {
  const max = (1 << bpp) - 1;
  const out = Buffer.alloc(Math.ceil(width * height * bpp / 8));
  for (let index = 0; index < width * height; index += 1) {
    const value = Math.max(0, Math.min(max, Number(pixels[index]) || 0));
    let remaining = bpp;
    let bit = index * bpp;
    while (remaining > 0) {
      const byteIndex = Math.floor(bit / 8);
      const bitOffset = bit % 8;
      const writable = Math.min(remaining, 8 - bitOffset);
      const shift = 8 - bitOffset - writable;
      out[byteIndex] |= ((value >> (remaining - writable)) & ((1 << writable) - 1)) << shift;
      remaining -= writable;
      bit += writable;
    }
  }
  return out;
}

function unpackPixels(buffer, width, height, bpp) {
  const input = Buffer.from(buffer);
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
      value = (value << readable) | ((input[byteIndex] >> shift) & ((1 << readable) - 1));
      remaining -= readable;
      bit += readable;
    }
    pixels.push(value & mask);
  }
  return pixels;
}

function parseSprite(source, fallback) {
  const name = (source.match(/var\s+([A-Z0-9_]+)\s*=/i) || [])[1] || cleanBase(fallback, "PLAYER_SPRITE");
  const width = Number((source.match(/width\s*:\s*(\d+)/i) || [])[1]);
  const height = Number((source.match(/height\s*:\s*(\d+)/i) || [])[1]);
  const bpp = Number((source.match(/bpp\s*:\s*(\d+)/i) || [])[1]);
  const base64 = (source.match(/atob\("([^"]+)"\)/i) || [])[1];
  if (!width || !height || !bpp || !base64) throw new Error("Sprite snippet is incomplete.");
  return { name, width, height, bpp, pixels: unpackPixels(Buffer.from(base64, "base64"), width, height, bpp) };
}

function parseSpriteImage(buffer, fallback) {
  const bytes = Buffer.from(buffer);
  const width = bytes[0];
  const height = bytes[1];
  const bpp = bytes[2] & 15;
  if (!width || !height || !bpp) throw new Error("Sprite IMG is incomplete.");
  return {
    name: cleanBase(fallback, "PLAYER_SPRITE"),
    width,
    height,
    bpp,
    pixels: unpackPixels(bytes.slice(4), width, height, bpp)
  };
}

function makeSpriteSnippet(input) {
  const width = Math.max(1, Math.min(64, Number(input.width) || 12));
  const height = Math.max(1, Math.min(64, Number(input.height) || 14));
  const requestedBpp = Number(input.bpp);
  const bpp = requestedBpp === 1 || requestedBpp === 2 || requestedBpp === 4 ? requestedBpp : 2;
  const pixels = Array.isArray(input.pixels) ? input.pixels : [];
  if (pixels.length !== width * height) throw new Error("Sprite pixel count does not match dimensions.");
  const name = cleanBase(input.name, "PLAYER_SPRITE");
  const base64 = packPixels(pixels, width, height, bpp).toString("base64");
  return {
    name,
    fileName: name + ".JS",
    source: `var ${name}={width:${width},height:${height},bpp:${bpp},transparent:0,buffer:atob("${base64}")};\n`
  };
}

function makeSpriteImage(input) {
  const width = Math.max(1, Math.min(64, Number(input.width) || 12));
  const height = Math.max(1, Math.min(64, Number(input.height) || 14));
  const requestedBpp = Number(input.bpp);
  const bpp = requestedBpp === 1 || requestedBpp === 2 || requestedBpp === 4 ? requestedBpp : 2;
  const pixels = Array.isArray(input.pixels) ? input.pixels : [];
  if (pixels.length !== width * height) throw new Error("Sprite pixel count does not match dimensions.");
  const name = cleanBase(input.name, "PLAYER_SPRITE");
  return {
    name,
    fileName: name + ".IMG",
    buffer: Buffer.concat([Buffer.from([width, height, 128 | bpp, 0]), packPixels(pixels, width, height, bpp)])
  };
}

function makeImageBuffer(input) {
  const art = normalizeArt(input);
  return {
    art,
    buffer: Buffer.concat([Buffer.from([art.width, art.height, art.bpp]), packPixels(art.pixels, art.width, art.height, art.bpp)])
  };
}

function addMetadataStorage(name, urlPath) {
  const metadata = readJson(metadataPath, {});
  metadata.storage = Array.isArray(metadata.storage) ? metadata.storage : [];
  if (!metadata.storage.some((item) => item && item.name === name)) {
    metadata.storage.push({ name, url: urlPath });
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + "\n", "utf8");
  }
}

function addInfoFile(name) {
  const info = readJson(path.join(bigIronRoot, "BIGIRON.info"), null);
  if (!info) return;
  const files = String(info.files || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!files.includes(name)) {
    files.push(name);
    info.files = files.join(",");
    fs.writeFileSync(path.join(bigIronRoot, "BIGIRON.info"), JSON.stringify(info, null, 2) + "\n", "utf8");
  }
}

async function api(req, res, url) {
  if (url.pathname === "/api/info") {
    const metadata = readJson(metadataPath, {});
    const battle = readBattle();
    const worldDetails = listWorldDetails();
    json(res, 200, {
      ok: true,
      version: metadata.version || "",
      bigIronRoot,
      dataRoot,
      itemIconRoot,
      worldArtRoot,
      spriteExportRoot,
      limits: WORLD_LIMITS,
      worldDefinitions: WORLD_DEFINITIONS,
      worlds: worldDetails.map((world) => world.file),
      worldDetails,
      worldArt: listWorldArt(".JSON"),
      sprites: listSprites(),
      items: Object.keys(readItems()).sort((a, b) => a.localeCompare(b)),
      itemMap: readItems(),
      enemies: battleSummary(battle),
      media: {
        root: listMedia(bigIronRoot, "HOLO/BIGIRON").filter((item) => !item.path.includes("/Assets/")),
        audio: listMedia(path.join(assetsRoot, "AUDIO"), "HOLO/BIGIRON/AUDIO"),
        video: listMedia(path.join(assetsRoot, "VIDEO"), "HOLO/BIGIRON/VIDEO"),
        images: listMedia(assetsRoot, "HOLO/BIGIRON").filter((item) => /^(IMG|BIN|BMP|PNG)$/i.test(item.kind))
      }
    });
    return;
  }

  if (url.pathname === "/api/battle" && req.method === "GET") {
    const battle = readBattle();
    json(res, 200, { ok: true, battle, enemies: battleSummary(battle), limits: WORLD_LIMITS });
    return;
  }

  if (url.pathname === "/api/battle" && req.method === "POST") {
    const body = await bodyJson(req);
    const battle = readBattle();
    battle.enemies = Array.isArray(battle.enemies) ? battle.enemies : [];
    const enemy = normalizeBattleEnemy(body.enemy || body);
    const index = battle.enemies.findIndex((item) => cleanBase(item.id || item.name, "") === enemy.id);
    if (index >= 0) {
      const merged = { ...battle.enemies[index], ...enemy };
      if (!enemy.ui) delete merged.ui;
      battle.enemies[index] = merged;
    }
    else battle.enemies.push(enemy);
    writeBattle(battle);
    json(res, 200, { ok: true, enemy, battle, enemies: battleSummary(battle) });
    return;
  }

  if (url.pathname === "/api/world" && req.method === "GET") {
    const target = dataPath(url.searchParams.get("name") || "WORLD_01", "WORLD_01", ".JSON");
    json(res, 200, { ok: true, name: path.basename(target), world: JSON.parse(fs.readFileSync(target, "utf8")) });
    return;
  }

  if (url.pathname === "/api/items" && req.method === "GET") {
    json(res, 200, { ok: true, items: readItems() });
    return;
  }

  if (url.pathname === "/api/items" && req.method === "POST") {
    const body = await bodyJson(req);
    const items = readItems();
    const made = normalizeItem(body.item || body, items);
    const icon = saveItemIcon(made.key, body.icon || (body.item && body.item.iconUpload));
    if (icon) made.item.icon = icon;
    items[made.key] = made.item;
    fs.mkdirSync(dataRoot, { recursive: true });
    fs.writeFileSync(itemsPath, JSON.stringify(items, null, 2) + "\n", "utf8");
    addMetadataStorage("HOLO/BIGIRON/DATA/ITEMS.JSON", "Assets/DATA/ITEMS.JSON");
    addInfoFile("HOLO/BIGIRON/DATA/ITEMS.JSON");
    json(res, 200, { ok: true, key: made.key, item: made.item, items });
    return;
  }

  if (url.pathname === "/api/world" && req.method === "POST") {
    const body = await bodyJson(req);
    const world = normalizeWorld(body.world || body);
    const target = dataPath(body.name || world.id, world.id, ".JSON");
    const compact = compactRuntimeWorld(world);
    const size = Buffer.byteLength(compact, "utf8");
    if (size > WORLD_LIMITS.worldJsonBytes) throw new Error(`World JSON is ${size} bytes. Keep it under ${WORLD_LIMITS.worldJsonBytes} bytes for the Pip-Boy build.`);
    if (world.rows.length > WORLD_LIMITS.rows || String(world.rows[0] || "").length > WORLD_LIMITS.cols) {
      throw new Error(`World grid exceeds ${WORLD_LIMITS.cols} x ${WORLD_LIMITS.rows}.`);
    }
    if ((world.interacts || []).length > WORLD_LIMITS.interacts) throw new Error(`Too many encounters. Limit is ${WORLD_LIMITS.interacts}.`);
    if ((world.decor || []).length > WORLD_LIMITS.decor) throw new Error(`Too much decor. Limit is ${WORLD_LIMITS.decor}.`);
    if ((world.exits || []).length > WORLD_LIMITS.exits) throw new Error(`Too many exits. Limit is ${WORLD_LIMITS.exits}.`);
    fs.writeFileSync(target, compact, "utf8");
    json(res, 200, { ok: true, name: path.basename(target), world });
    return;
  }

  if (url.pathname === "/api/art" && req.method === "GET") {
    const name = url.searchParams.get("name") || "WORLD_ART";
    const target = worldArtPath(name, "WORLD_ART", ".JSON");
    if (fs.existsSync(target)) {
      json(res, 200, { ok: true, name: path.basename(target), art: JSON.parse(fs.readFileSync(target, "utf8")) });
      return;
    }
    json(res, 200, { ok: true, name: path.basename(target), art: normalizeArt({ name: cleanBase(name, "WORLD_ART"), width: 240, height: 148, bpp: 2 }) });
    return;
  }

  if (url.pathname === "/api/art" && req.method === "POST") {
    const body = await bodyJson(req);
    const made = makeImageBuffer(body.art || body);
    const jsonTarget = worldArtPath(body.name || made.art.name, made.art.name, ".JSON");
    const imgTarget = worldArtPath(body.name || made.art.name, made.art.name, ".IMG");
    const imageName = path.basename(imgTarget);
    fs.mkdirSync(worldArtRoot, { recursive: true });
    fs.writeFileSync(jsonTarget, JSON.stringify(made.art, null, 2) + "\n", "utf8");
    fs.writeFileSync(imgTarget, made.buffer);
    addMetadataStorage(`HOLO/BIGIRON/WORLD/${imageName}`, `Assets/WORLD/${imageName}`);
    addInfoFile(`HOLO/BIGIRON/WORLD/${imageName}`);
    if (body.world) {
      const worldTarget = dataPath(body.world, body.world, ".JSON");
      const world = normalizeWorld(readJson(worldTarget, null));
      world.image = imageName;
      world.imageDraw = body.imageDraw || "patch";
      world.imgScale = Number(body.imgScale) || 2;
      world.w = made.art.width;
      world.h = made.art.height;
      world.spawnPx = Array.isArray(world.spawnPx) ? world.spawnPx : world.spawn;
      fs.writeFileSync(worldTarget, compactRuntimeWorld(world), "utf8");
    }
    json(res, 200, { ok: true, name: imageName, json: path.basename(jsonTarget), art: made.art });
    return;
  }

  if (url.pathname === "/api/sprite" && req.method === "GET") {
    const found = spritePath(url.searchParams.get("name") || "PLAYER_SPRITEDOWN", "PLAYER_SPRITEDOWN");
    const sprite = found.ext === ".IMG"
      ? parseSpriteImage(fs.readFileSync(found.target), path.basename(found.target))
      : parseSprite(fs.readFileSync(found.target, "utf8"), path.basename(found.target));
    json(res, 200, { ok: true, name: found.ref + found.ext, sprite, runtime: found.ext });
    return;
  }

  if (url.pathname === "/api/sprite" && req.method === "POST") {
    const body = await bodyJson(req);
    const playerSprite = /^PLAYER_SPRITE/i.test(cleanBase(body.name, "PLAYER_SPRITE"));
    const scopeInput = String(body.scope || "").toLowerCase();
    const npcSprite = scopeInput === "npc" || scopeInput === "interior" || String(body.runtime || "").toLowerCase() === "img";
    if (npcSprite && ((Number(body.width) || 0) !== 34 || (Number(body.height) || 0) !== 34)) throw new Error("NPC sprites must be 34x34 IMG.");
    const output = playerSprite || npcSprite ? makeSpriteImage(npcSprite ? { ...body, bpp: 2 } : body) : makeSpriteSnippet(body);
    const scope = playerSprite ? "global" : String(body.scope || "global").toLowerCase();
    const world = cleanBase(body.world || body.worldId || "", "");
    const ref = scope === "world" && world ? `${world}/${output.name}` : output.name;
    const found = spritePath(ref, "PLAYER_SPRITE", playerSprite || npcSprite ? ".IMG" : ".JS");
    fs.mkdirSync(path.dirname(found.target), { recursive: true });
    if (playerSprite || npcSprite) fs.writeFileSync(found.target, output.buffer);
    else fs.writeFileSync(found.target, output.source, "utf8");
    addMetadataStorage(`HOLO/BIGIRON/DATA/${found.ref}${found.ext}`, `Assets/DATA/${found.ref}${found.ext}`);
    addInfoFile(`HOLO/BIGIRON/DATA/${found.ref}${found.ext}`);
    json(res, 200, {
      ok: true,
      name: found.ref + found.ext,
      ref: found.ref,
      global: playerSprite || scope !== "world",
      runtime: found.ext,
      snippet: playerSprite || npcSprite ? `Saved ${found.ref}.IMG for the low-memory Big Iron runtime.` : output.source
    });
    return;
  }

  if (url.pathname === "/api/sprite-local" && req.method === "POST") {
    const body = await bodyJson(req);
    const playerSprite = /^PLAYER_SPRITE/i.test(cleanBase(body.name, "PLAYER_SPRITE"));
    const scopeInput = String(body.scope || "").toLowerCase();
    const npcSprite = scopeInput === "npc" || scopeInput === "interior" || String(body.runtime || "").toLowerCase() === "img";
    if (npcSprite && ((Number(body.width) || 0) !== 34 || (Number(body.height) || 0) !== 34)) throw new Error("NPC sprites must be 34x34 IMG.");
    const output = playerSprite || npcSprite ? makeSpriteImage(npcSprite ? { ...body, bpp: 2 } : body) : makeSpriteSnippet(body);
    const scope = playerSprite ? "global" : String(body.scope || "global").toLowerCase();
    const world = cleanBase(body.world || body.worldId || "", "");
    const ref = scope === "world" && world ? `${world}/${output.name}` : output.name;
    const found = spriteExportPath(ref, "PLAYER_SPRITE");
    const target = playerSprite || npcSprite ? found.target.replace(/\.JS$/i, ".IMG") : found.target;
    const name = found.ref + (playerSprite || npcSprite ? ".IMG" : ".JS");
    fs.mkdirSync(path.dirname(found.target), { recursive: true });
    if (playerSprite || npcSprite) fs.writeFileSync(target, output.buffer);
    else fs.writeFileSync(target, output.source, "utf8");
    json(res, 200, { ok: true, name, ref: found.ref, path: target, snippet: playerSprite || npcSprite ? `Saved ${name} locally.` : output.source });
    return;
  }

  fail(res, 404, "Unknown B.I.R.D. API route.");
}

function serveStatic(res, url) {
  const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const target = path.resolve(publicRoot, "." + requestPath);
  if (!target.startsWith(publicRoot)) return fail(res, 403, "Forbidden.");
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) return fail(res, 404, "Not found.");
  send(res, 200, fs.readFileSync(target), mime[path.extname(target).toLowerCase()] || "application/octet-stream");
}

function makeServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    if (url.pathname.startsWith("/api/")) {
      api(req, res, url).catch((error) => fail(res, 500, error.message));
      return;
    }
    serveStatic(res, url);
  });
}

function assertPaths() {
  if (!fs.existsSync(assetsRoot)) fs.mkdirSync(assetsRoot, { recursive: true });
  if (!fs.existsSync(dataRoot)) fs.mkdirSync(dataRoot, { recursive: true });
  if (!fs.existsSync(itemIconRoot)) fs.mkdirSync(itemIconRoot, { recursive: true });
  if (!fs.existsSync(worldArtRoot)) fs.mkdirSync(worldArtRoot, { recursive: true });
  if (!fs.existsSync(spriteExportRoot)) fs.mkdirSync(spriteExportRoot, { recursive: true });
  for (const item of [publicRoot, bigIronRoot, assetsRoot, dataRoot, itemIconRoot, worldArtRoot, spriteExportRoot]) {
    if (!fs.existsSync(item)) throw new Error(`Missing required path: ${item}`);
  }
}

function selfTest() {
  assertPaths();
  const worlds = listData(".JSON", /^WORLD_/i);
  const sprites = listSprites();
  readItems();
  if (worlds.length) normalizeWorld(readJson(path.join(dataRoot, worlds[0]), null));
  if (sprites.length) {
    const first = path.join(dataRoot, ...sprites[0].split("/"));
    const sprite = /\.IMG$/i.test(sprites[0])
      ? parseSpriteImage(fs.readFileSync(first), sprites[0])
      : parseSprite(fs.readFileSync(first, "utf8"), sprites[0]);
    if (/^PLAYER_SPRITE/i.test(sprite.name)) makeSpriteImage(sprite);
    else makeSpriteSnippet(sprite);
  }
  console.log(`B.I.R.D. self-test ok: ${worlds.length} worlds, ${sprites.length} sprites, root ${bigIronRoot}`);
}

function openBrowser(url) {
  if (process.argv.includes("--no-open") || process.argv.includes("--check")) return;
  if (process.platform === "win32") childProcess.exec(`start "" "${url}"`);
  else if (process.platform === "darwin") childProcess.exec(`open "${url}"`);
  else childProcess.exec(`xdg-open "${url}"`);
}

if (process.argv.includes("--check")) {
  assertPaths();
  selfTest();
} else {
  const server = makeServer();
  server.on("error", (error) => {
    console.error(`B.I.R.D. failed to start on ${HOST}:${PORT}: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}/`;
    console.log(`B.I.R.D. running at ${url}`);
    openBrowser(url);
  });
}
