const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".bmp": "image/bmp",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:" + port);
    let file = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
    if (!file || file === ".") file = "index.html";
    const target = path.join(root, file);
    if (!target.startsWith(root)) return send(res, 403, "Forbidden");
    fs.readFile(target, (err, data) => {
      if (err) return send(res, 404, "Not found");
      send(res, 200, data, types[path.extname(target).toLowerCase()] || "application/octet-stream");
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log("Big Iron PC app running at http://127.0.0.1:" + port + "/");
  });
