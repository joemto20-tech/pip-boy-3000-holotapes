"use strict";

const $ = (id) => document.getElementById(id);
const state = {
  info: null,
  world: null,
  painting: false,
  sprite: null,
  spritePainting: false
};

const quickTools = [
  ["G", "Grass"], ["P", "Path"], ["B", "Block"], ["H", "House"], ["D", "Door"], ["S", "Sand"],
  ["spawn", "Spawn"], ["exit", "Exit"], ["regular", "Regular"], ["boss", "Boss"], ["shoot", "Shoot"], ["erase", "Erase"],
  ["tree", "Tree"], ["npc", "NPC"], ["camp", "Camp"], ["sign", "Sign"], ["rocks", "Rocks"]
];

const spritePresets = {
  blank: { label: "Blank 12x14", width: 12, height: 14, pixels: null },
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
  $("worldReadout").textContent = `${width} x ${height} - ${world.interacts.length} encounters`;
  $("worldJson").value = JSON.stringify(world, null, 2);
}

function cleanId(value) {
  return String(value || "WORLD_01").replace(/[^a-z0-9_]+/gi, "_").replace(/^_+|_+$/g, "").toUpperCase() || "WORLD_01";
}

function placeEncounter(tool, x, y) {
  const world = state.world;
  const enemy = $("encEnemy").value || "RANDOM";
  const prompt = $("encPrompt").value || (tool === "boss" ? "BOSS?" : tool === "shoot" ? "TAKE SHOT?" : "ENCOUNTER?");
  const once = $("encOnce").checked;
  world.interacts = (world.interacts || []).filter((item) => !(item.x === x && item.y === y));
  const base = {
    id: `${world.id.toLowerCase()}_${tool}_${x}_${y}`,
    x,
    y,
    prompt,
    once
  };
  if (tool === "shoot") {
    world.interacts.push({ ...base, type: "shoot", target: $("shootTarget").value || "RADROACH", enemy: $("shootTarget").value || "RADROACH" });
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
    world.interacts.push({
      ...base,
      type: "battle",
      enemy,
      music: music === "false" ? false : (music || undefined)
    });
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
    world.exits = (world.exits || []).filter((item) => !(item.x === x && item.y === y));
    world.exits.push({
      id: `${world.id.toLowerCase()}_exit_${x}_${y}`,
      x,
      y,
      to: cleanId($("exitTo").value || "WORLD_02"),
      spawn: [Number($("exitX").value) || 2, Number($("exitY").value) || 2],
      facing: $("exitFacing").value || "down"
    });
  } else if (tool === "regular" || tool === "boss" || tool === "shoot") {
    placeEncounter(tool, x, y);
  } else if (["tree", "npc", "camp", "sign", "rocks"].includes(tool)) {
    world.decor = (world.decor || []).filter((item) => !(item.x === x && item.y === y));
    world.decor.push({ id: `${world.id.toLowerCase()}_${tool}_${x}_${y}`, type: tool, x, y, sprite: `${tool.toUpperCase()}_SPRITE` });
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
  return rowList.join("").split("").map((value) => Number(value) || 0);
}

function makeSprite(width = 12, height = 14, fill = 0) {
  state.sprite = { name: $("spriteName").value || "PLAYER_SPRITEUP", width, height, bpp: Number($("spriteBpp").value) || 2, pixels: Array(width * height).fill(fill) };
  renderSprite();
}

function renderSprite() {
  const sprite = state.sprite;
  if (!sprite) return;
  const grid = $("spriteGrid");
  grid.style.gridTemplateColumns = `repeat(${sprite.width}, 22px)`;
  grid.innerHTML = sprite.pixels.map((value, index) => {
    const x = index % sprite.width;
    const y = Math.floor(index / sprite.width);
    return `<div class="pixel v${value || 0}" data-x="${x}" data-y="${y}"></div>`;
  }).join("");
  sprite.name = cleanId($("spriteName").value || sprite.name || "PLAYER_SPRITE");
  sprite.bpp = Number($("spriteBpp").value) === 1 ? 1 : 2;
  $("spriteTitle").textContent = sprite.name;
  $("spriteReadout").textContent = `${sprite.width} x ${sprite.height} - ${sprite.bpp} bpp`;
  $("spriteCode").value = spriteSnippet();
}

function paintSprite(x, y) {
  const sprite = state.sprite;
  if (!sprite) return;
  sprite.pixels[y * sprite.width + x] = Number($("spriteBrush").value) || 0;
  renderSprite();
}

function packSpritePixels(sprite) {
  const bpp = Number(sprite.bpp) === 1 ? 1 : 2;
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
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function spriteSnippet() {
  const sprite = state.sprite;
  const name = cleanId($("spriteName").value || sprite.name || "PLAYER_SPRITE");
  const bpp = Number($("spriteBpp").value) === 1 ? 1 : 2;
  return `var ${name}={width:${sprite.width},height:${sprite.height},bpp:${bpp},transparent:0,buffer:atob("${packSpritePixels({ ...sprite, bpp })}")};`;
}

function spritePixel(event) {
  return event.target.closest(".pixel");
}

function download(name, text, type) {
  const blob = new Blob([text], { type: type || "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadInfo() {
  state.info = await api("/api/info");
  $("worldSelect").innerHTML = state.info.worlds.map((name) => `<option value="${name}">${name}</option>`).join("");
  $("spriteSelect").innerHTML = state.info.sprites.map((name) => `<option value="${name}">${name}</option>`).join("");
  const enemyOptions = ['<option value="RANDOM">RANDOM</option>'].concat(state.info.enemies.map((enemy) => `<option value="${enemy.id}">${enemy.name} LV${enemy.level}</option>`));
  $("encEnemy").innerHTML = enemyOptions.join("");
  $("packageNotes").textContent = [
    `Big Iron version: ${state.info.version}`,
    "",
    "World JSON files:",
    "Assets/DATA/WORLD_XX.JSON -> HOLO/BIGIRON/DATA/WORLD_XX.JSON",
    "",
    "Runtime code after world-render changes:",
    "Assets/CODE/WORLD.MIN.JS -> HOLO/BIGIRON/CODE/WORLD.JS",
    "",
    "Battle/shoot encounter types emitted by B.I.R.D.:",
    'regular -> { type:"battle", enemy:"..." }',
    'boss -> { type:"battle", boss:true, enemy:"...", music:"NVTH" }',
    'shoot -> { type:"shoot", target:"RADROACH" }',
    "",
    "Sprite snippets:",
    "Assets/DATA/*.JS source snippets for baked player/NPC/scenery sprites"
  ].join("\n");
}

async function loadWorld(name) {
  const body = await api(`/api/world?name=${encodeURIComponent(name || $("worldSelect").value || "WORLD_01.JSON")}`);
  state.world = body.world;
  renderWorld();
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
  state.sprite.bpp = Number($("spriteBpp").value) || 2;
  const body = await api("/api/sprite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.sprite)
  });
  $("spriteCode").value = body.snippet;
  setStatus(`Saved ${body.name}`);
  await loadInfo();
}

function wireEvents() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      const mode = button.dataset.mode;
      $("worldPanel").classList.toggle("hidden", mode !== "world");
      $("worldStage").classList.toggle("hidden", mode !== "world");
      $("spritePanel").classList.toggle("hidden", mode !== "sprite");
      $("spriteStage").classList.toggle("hidden", mode !== "sprite");
      $("packagePanel").classList.toggle("hidden", mode !== "package");
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
  window.addEventListener("blur", () => { state.spritePainting = false; });

  $("loadWorld").onclick = () => loadWorld();
  $("newWorld").onclick = () => newWorld(cleanId($("worldId").value || "WORLD_NEW"));
  $("saveWorld").onclick = () => saveWorld().catch((error) => setStatus(error.message, true));
  $("downloadWorld").onclick = () => download(`${cleanId($("worldId").value)}.JSON`, JSON.stringify(state.world, null, 2) + "\n", "application/json");
  $("worldId").oninput = () => { if (state.world) { state.world.id = cleanId($("worldId").value); renderWorld(); } };

  $("loadSprite").onclick = () => loadSprite().catch((error) => setStatus(error.message, true));
  $("newSprite").onclick = () => makeSprite(Number($("spriteWidth").value) || 12, Number($("spriteHeight").value) || 14, 0);
  $("saveSprite").onclick = () => saveSprite().catch((error) => setStatus(error.message, true));
  $("downloadSprite").onclick = () => download(`${cleanId($("spriteName").value)}.JS`, $("spriteCode").value + "\n", "application/javascript");
  $("mirrorSprite").onclick = () => {
    const sprite = state.sprite;
    const pixels = [];
    for (let y = 0; y < sprite.height; y += 1) for (let x = sprite.width - 1; x >= 0; x -= 1) pixels.push(sprite.pixels[y * sprite.width + x]);
    sprite.pixels = pixels;
    renderSprite();
  };
  $("invertSprite").onclick = () => {
    const max = Number($("spriteBpp").value) === 1 ? 1 : 3;
    state.sprite.pixels = state.sprite.pixels.map((value) => max - value);
    renderSprite();
  };
  $("spritePreset").innerHTML = Object.entries(spritePresets).map(([key, preset]) => `<option value="${key}">${preset.label}</option>`).join("");
  $("loadPreset").onclick = () => {
    const preset = spritePresets[$("spritePreset").value];
    const pixels = preset.pixels || (preset.rows ? rowsToPixels(preset.rows) : Array((preset.width || 12) * (preset.height || 14)).fill(0));
    state.sprite = { name: cleanId($("spriteName").value || "PLAYER_SPRITE"), width: preset.width || 12, height: preset.height || 14, bpp: Number($("spriteBpp").value) || 2, pixels };
    $("spriteWidth").value = state.sprite.width;
    $("spriteHeight").value = state.sprite.height;
    renderSprite();
  };
}

async function start() {
  wireEvents();
  await loadInfo();
  if (state.info.worlds.length) await loadWorld(state.info.worlds[0]);
  else newWorld();
  if (state.info.sprites.length) await loadSprite(state.info.sprites[0]);
  else makeSprite();
  setStatus("Ready");
}

start().catch((error) => setStatus(error.message, true));
