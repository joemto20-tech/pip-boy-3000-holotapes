const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const targets = ["WORLD", "BATTLE", "SHOOT"];

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

for (const name of targets) {
  const input = path.join(root, "holotapes", "BigIron", "Assets", "CODE", `${name}.JS`);
  const output = path.join(root, "holotapes", "BigIron", "Assets", "CODE", `${name}.MIN.JS`);
  const source = fs.readFileSync(input, "utf8");
  const minified = compactWhitespace(stripComments(source)).trim();
  fs.writeFileSync(output, minified + "\n", "ascii");
  console.log(`${name}: ${source.length} -> ${minified.length}`);
}
