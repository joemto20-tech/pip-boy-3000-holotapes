"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const PORT = Number(process.env.BIRD_PORT || 7331);
const HOST = "127.0.0.1";
const appRoot = __dirname;
const publicRoot = path.join(appRoot, "public");
const repoRoot = path.resolve(appRoot, "..", "..");
const bigIronRoot = path.join(repoRoot, "holotapes", "BigIron");
const assetsRoot = path.join(bigIronRoot, "Assets");
const dataRoot = path.join(assetsRoot, "DATA");
const metadataPath = path.join(bigIronRoot, "metadata.json");
const battlePath = path.join(bigIronRoot, "battle.json");

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

function dataPath(name, fallback, ext) {
  const fileName = cleanBase(name, fallback) + ext;
  const target = path.resolve(dataRoot, fileName);
  if (!target.startsWith(path.resolve(dataRoot))) throw new Error("Unsafe file path.");
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

function normalizeWorld(input) {
  if (!input || typeof input !== "object") throw new Error("World must be a JSON object.");
  const rows = Array.isArray(input.rows) ? input.rows : [];
  if (!rows.length) throw new Error("World needs rows.");
  const width = Math.max(1, ...rows.map((row) => String(row || "").length));
  const cleanRows = rows.map((row) =>
    (String(row || "").toUpperCase().replace(/[^GPBHDSXRFS]/g, "G") + "G".repeat(width)).slice(0, width)
  );
  return {
    id: cleanBase(input.id, "WORLD_01"),
    tile: Number(input.tile) || 16,
    scale: Number(input.scale) || 24,
    spawn: Array.isArray(input.spawn) ? input.spawn.slice(0, 2).map((n) => Number(n) || 0) : [2, 2],
    rows: cleanRows,
    interacts: Array.isArray(input.interacts) ? input.interacts : [],
    exits: Array.isArray(input.exits) ? input.exits : [],
    decor: Array.isArray(input.decor) ? input.decor : []
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

function makeSpriteSnippet(input) {
  const width = Math.max(1, Math.min(64, Number(input.width) || 12));
  const height = Math.max(1, Math.min(64, Number(input.height) || 14));
  const bpp = Number(input.bpp) === 1 ? 1 : 2;
  const pixels = Array.isArray(input.pixels) ? input.pixels : [];
  if (pixels.length !== width * height) throw new Error("Sprite pixel count does not match dimensions.");
  const name = cleanBase(input.name, "PLAYER_SPRITE");
  const base64 = packPixels(pixels, width, height, bpp).toString("base64");
  return {
    fileName: name + ".JS",
    source: `var ${name}={width:${width},height:${height},bpp:${bpp},transparent:0,buffer:atob("${base64}")};\n`
  };
}

async function api(req, res, url) {
  if (url.pathname === "/api/info") {
    const metadata = readJson(metadataPath, {});
    const battle = readJson(battlePath, {});
    json(res, 200, {
      ok: true,
      version: metadata.version || "",
      bigIronRoot,
      dataRoot,
      worlds: listData(".JSON", /^WORLD_/i),
      sprites: listData(".JS", /SPRITE/i),
      enemies: (battle.enemies || []).map((enemy) => ({
        id: enemy.id || enemy.name || enemy.folder,
        name: enemy.name || enemy.id || enemy.folder,
        folder: enemy.folder || "",
        level: enemy.level || 1
      }))
    });
    return;
  }

  if (url.pathname === "/api/world" && req.method === "GET") {
    const target = dataPath(url.searchParams.get("name") || "WORLD_01", "WORLD_01", ".JSON");
    json(res, 200, { ok: true, name: path.basename(target), world: JSON.parse(fs.readFileSync(target, "utf8")) });
    return;
  }

  if (url.pathname === "/api/world" && req.method === "POST") {
    const body = await bodyJson(req);
    const world = normalizeWorld(body.world || body);
    const target = dataPath(body.name || world.id, world.id, ".JSON");
    fs.writeFileSync(target, JSON.stringify(world, null, 2) + "\n", "utf8");
    json(res, 200, { ok: true, name: path.basename(target), world });
    return;
  }

  if (url.pathname === "/api/sprite" && req.method === "GET") {
    const target = dataPath(url.searchParams.get("name") || "PLAYER_SPRITEDOWN", "PLAYER_SPRITEDOWN", ".JS");
    json(res, 200, { ok: true, name: path.basename(target), sprite: parseSprite(fs.readFileSync(target, "utf8"), path.basename(target)) });
    return;
  }

  if (url.pathname === "/api/sprite" && req.method === "POST") {
    const snippet = makeSpriteSnippet(await bodyJson(req));
    const target = dataPath(snippet.fileName, "PLAYER_SPRITE", ".JS");
    fs.writeFileSync(target, snippet.source, "utf8");
    json(res, 200, { ok: true, name: path.basename(target), snippet: snippet.source });
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

function openBrowser(url) {
  if (process.argv.includes("--no-open") || process.argv.includes("--check")) return;
  if (process.platform === "win32") childProcess.exec(`start "" "${url}"`);
  else if (process.platform === "darwin") childProcess.exec(`open "${url}"`);
  else childProcess.exec(`xdg-open "${url}"`);
}

if (process.argv.includes("--check")) {
  for (const item of [publicRoot, bigIronRoot, assetsRoot, dataRoot, metadataPath, battlePath]) {
    if (!fs.existsSync(item)) throw new Error(`Missing required path: ${item}`);
  }
  console.log("B.I.R.D. paths ok");
} else {
  makeServer().listen(PORT, HOST, () => {
    const url = `http://${HOST}:${PORT}/`;
    console.log(`B.I.R.D. running at ${url}`);
    openBrowser(url);
  });
}
