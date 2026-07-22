"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FILES = [
  "server.js",
  "public/core.js",
  "public/runtime-templates.js",
  "public/app.js"
];

function compact(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"))
    .join("\n") + "\n";
}

for (const relative of FILES) {
  const source = path.join(ROOT, relative);
  const extension = path.extname(source);
  const output = source.slice(0, -extension.length) + ".min" + extension;
  fs.writeFileSync(output, compact(fs.readFileSync(source, "utf8")));
  console.log(path.relative(ROOT, output), fs.statSync(output).size + " bytes");
}
