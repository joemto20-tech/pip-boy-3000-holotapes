const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requestedTargets = process.argv.slice(2).map((value) => String(value || "").toUpperCase()).filter(Boolean);
const targets = requestedTargets.length ? requestedTargets : ["WORLD", "BATTLE", "SHOOT", "INTERIOR"];
const allowedTargets = { APP: true, WORLD: true, BATTLE: true, SHOOT: true, INTERIOR: true };

function stripComments(src) {
  let out = "";
  let quote = "";
  let escape = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (quote) {
      out += ch;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++;
      out += " ";
      continue;
    }

    out += ch;
  }
  return out;
}

function compactWhitespace(src) {
  let out = "";
  let quote = "";
  let escape = false;

  function wordChar(ch) {
    return /[A-Za-z0-9_$]/.test(ch || "");
  }

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (quote) {
      out += ch;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === quote) quote = "";
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (wordChar(out[out.length - 1]) && wordChar(src[j])) out += " ";
      i = j - 1;
      continue;
    }

    out += ch;
  }

  return out;
}

function mangleBattleFunctions(src) {
  const keep = { k1: true, k2: true, remove: true };
  const names = [];
  const seen = {};
  src.replace(/\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g, (_, name) => {
    if (name.length > 2 && !keep[name] && !seen[name]) {
      seen[name] = true;
      names.push(name);
    }
    return _;
  });
  const used = {};
  src.replace(/[A-Za-z_$][A-Za-z0-9_$]*/g, (name) => { used[name] = true; return name; });
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const pool = [];
  for (const prefix of ["$", "_"]) for (const ch of chars) pool.push(prefix + ch);
  const map = {};
  let pi = 0;
  for (const name of names) {
    while (pi < pool.length && used[pool[pi]]) pi++;
    if (pi >= pool.length) break;
    map[name] = pool[pi++];
  }

  let out = "";
  let quote = "";
  let escape = false;
  for (let i = 0; i < src.length;) {
    const ch = src[i];
    if (quote) {
      out += ch;
      i++;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let p = out.length - 1;
      let n = j;
      while (p >= 0 && /\s/.test(out[p])) p--;
      while (n < src.length && /\s/.test(src[n])) n++;
      out += map[word] && out[p] !== "." && src[n] !== ":" ? map[word] : word;
      i = j;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

for (const name of targets) {
  if (!allowedTargets[name]) throw new Error(`Unknown BigIron code target: ${name}`);
  const input =
    name === "APP"
      ? path.join(root, "holotapes", "BigIron", "APP.JS")
      : path.join(root, "holotapes", "BigIron", "Assets", "CODE", `${name}.JS`);
  const output =
    name === "APP"
      ? path.join(root, "holotapes", "BigIron", "APP.MIN.JS")
      : path.join(root, "holotapes", "BigIron", "Assets", "CODE", `${name}.MIN.JS`);
  const source = fs.readFileSync(input, "utf8");
  let minified = compactWhitespace(stripComments(source)).trim();
  if (name === "BATTLE") minified = mangleBattleFunctions(minified);
  fs.writeFileSync(output, minified + "\n", "ascii");
  console.log(`${name}: ${source.length} -> ${minified.length}`);
}
