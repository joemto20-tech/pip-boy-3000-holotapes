(function (global) {
  "use strict";

  var palette = [
    [5, 13, 7, 0],
    [35, 58, 32, 255],
    [91, 126, 70, 255],
    [190, 222, 139, 255]
  ];

  function byId(id) { return document.getElementById(id); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
  function uid(prefix) { return (prefix || "item") + "_" + Math.random().toString(36).slice(2, 8); }
  function slug(value, fallback) {
    var result = String(value || fallback || "ITEM").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return result || fallback || "ITEM";
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }
  function formatBytes(value) {
    var bytes = Number(value) || 0;
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  }
  function toBase64(bytes) {
    var result = "";
    var size = 0x8000;
    for (var offset = 0; offset < bytes.length; offset += size) result += String.fromCharCode.apply(null, bytes.subarray(offset, Math.min(offset + size, bytes.length)));
    return btoa(result);
  }
  function fromBase64(value) {
    var binary = atob(value || "");
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }
  function textBytes(value) { return new TextEncoder().encode(String(value)); }

  async function request(url, options) {
    var response = await fetch(url, options);
    var type = response.headers.get("content-type") || "";
    var body = type.indexOf("application/json") >= 0 ? await response.json() : await response.arrayBuffer();
    if (!response.ok) throw new Error(body && body.error ? body.error : "Request failed: " + response.status);
    return body;
  }
  function post(url, value) {
    return request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  }
  function assetUrl(asset) {
    return "/api/file?source=" + encodeURIComponent(asset.source) + "&path=" + encodeURIComponent(asset.path);
  }
  async function assetBytes(asset) {
    return new Uint8Array(await request(assetUrl(asset)));
  }

  function unpackIndexed(bytes, width, height, bpp, offset) {
    var count = width * height;
    var output = new Uint8Array(count);
    var mask = (1 << bpp) - 1;
    var perByte = 8 / bpp;
    var start = offset || 0;
    for (var index = 0; index < count; index += 1) {
      var shift = 8 - bpp * ((index % perByte) + 1);
      output[index] = (bytes[start + Math.floor(index / perByte)] >> shift) & mask;
    }
    return output;
  }
  function packIndexed(indexed, bpp) {
    var perByte = 8 / bpp;
    var output = new Uint8Array(Math.ceil(indexed.length / perByte));
    var mask = (1 << bpp) - 1;
    for (var index = 0; index < indexed.length; index += 1) {
      var shift = 8 - bpp * ((index % perByte) + 1);
      output[Math.floor(index / perByte)] |= (indexed[index] & mask) << shift;
    }
    return output;
  }
  function unpackCollision(bytes, columns, rows) { return unpackIndexed(bytes, columns, rows, 1, 0); }
  function packCollision(indexed) { return packIndexed(indexed, 1); }

  function imageDataFromIndexed(indexed, width, height, sourceBpp) {
    var data = new Uint8ClampedArray(width * height * 4);
    var max = (1 << (sourceBpp || 2)) - 1;
    for (var index = 0; index < indexed.length; index += 1) {
      var shade = sourceBpp === 2 ? indexed[index] : Math.round(indexed[index] / max * 3);
      var color = palette[clamp(shade, 0, 3)];
      var target = index * 4;
      data[target] = color[0];
      data[target + 1] = color[1];
      data[target + 2] = color[2];
      data[target + 3] = shade === 0 ? 0 : 255;
    }
    return new ImageData(data, width, height);
  }
  function canvasFromIndexed(indexed, width, height, bpp, transparentZero) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var imageData = imageDataFromIndexed(indexed, width, height, bpp || 2);
    if (!transparentZero) {
      for (var index = 3; index < imageData.data.length; index += 4) imageData.data[index] = 255;
    }
    canvas.getContext("2d").putImageData(imageData, 0, 0);
    return canvas;
  }
  function decodeImg(bytes) {
    if (bytes.length < 3) throw new Error("IMG header is incomplete");
    var width = bytes[0];
    var height = bytes[1];
    var flags = bytes[2];
    var bpp = flags & 0x7f;
    var transparent = !!(flags & 0x80);
    var offset = transparent ? 4 : 3;
    if (![1, 2, 4, 8].includes(bpp)) throw new Error("Unsupported IMG depth: " + bpp);
    var needed = Math.ceil(width * height * bpp / 8) + offset;
    if (bytes.length < needed) throw new Error("IMG pixel data is incomplete");
    var indexed = unpackIndexed(bytes, width, height, bpp, offset);
    return { width: width, height: height, bpp: bpp, transparent: transparent, indexed: indexed, canvas: canvasFromIndexed(indexed, width, height, bpp, transparent) };
  }
  function encodeImg(indexed, width, height, transparent) {
    if (width > 255 || height > 255) throw new Error("IMG dimensions must fit in one byte");
    var payload = packIndexed(indexed, 2);
    var header = transparent ? new Uint8Array([width, height, 0x82, 0]) : new Uint8Array([width, height, 2]);
    var output = new Uint8Array(header.length + payload.length);
    output.set(header, 0);
    output.set(payload, header.length);
    return output;
  }

  function decodeWorldPages(bytes) {
    var expected = 25 * 480 * 296 / 4;
    if (bytes.length !== expected) throw new Error("World page BIN must be " + expected + " bytes; this file is " + bytes.length + " bytes");
    var width = 1440;
    var height = 1080;
    var output = new Uint8Array(width * height);
    var cameraX = [0, 240, 480, 720, 960];
    var cameraY = [0, 196, 392, 588, 784];
    var pageBytes = 480 * 296 / 4;
    for (var row = 0; row < 5; row += 1) {
      for (var column = 0; column < 5; column += 1) {
        var page = unpackIndexed(bytes.subarray((row * 5 + column) * pageBytes, (row * 5 + column + 1) * pageBytes), 480, 296, 2, 0);
        var left = cameraX[column];
        var top = cameraY[row];
        for (var y = 0; y < 296 && top + y < height; y += 1) output.set(page.subarray(y * 480, y * 480 + Math.min(480, width - left)), (top + y) * width + left);
      }
    }
    return { width: width, height: height, bpp: 2, indexed: output, canvas: canvasFromIndexed(output, width, height, 2, false) };
  }
  function encodeWorldPages(indexed, width, height) {
    if (width !== 1440 || height !== 1080 || indexed.length !== width * height) throw new Error("World backgrounds must be 1440 x 1080");
    var cameraX = [0, 240, 480, 720, 960];
    var cameraY = [0, 196, 392, 588, 784];
    var pagePixels = 480 * 296;
    var pageBytes = pagePixels / 4;
    var output = new Uint8Array(pageBytes * 25);
    for (var row = 0; row < 5; row += 1) {
      for (var column = 0; column < 5; column += 1) {
        var page = new Uint8Array(pagePixels);
        var left = cameraX[column];
        var top = cameraY[row];
        for (var y = 0; y < 296; y += 1) page.set(indexed.subarray((top + y) * width + left, (top + y) * width + left + 480), y * 480);
        output.set(packIndexed(page, 2), (row * 5 + column) * pageBytes);
      }
    }
    return output;
  }

  async function bitmapCanvas(blob) {
    var bitmap = await createImageBitmap(blob);
    var canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
  }
  async function decodeAsset(asset) {
    var extension = asset.extension.toLowerCase();
    if ([".png", ".bmp", ".jpg", ".jpeg"].includes(extension)) {
      var response = await fetch(assetUrl(asset));
      if (!response.ok) throw new Error("Image could not be loaded");
      var canvas = await bitmapCanvas(await response.blob());
      return { width: canvas.width, height: canvas.height, bpp: 32, canvas: canvas, format: "bitmap" };
    }
    var bytes = await assetBytes(asset);
    if (extension === ".img") return decodeImg(bytes);
    if (extension === ".bin") {
      if (asset.format === "world-pages-2bpp") return decodeWorldPages(bytes);
      if (asset.format === "collision-1bpp") {
        var collision = unpackCollision(bytes, asset.width || 120, asset.height || 90);
        return { width: asset.width || 120, height: asset.height || 90, bpp: 1, indexed: collision, canvas: canvasFromIndexed(collision, asset.width || 120, asset.height || 90, 1, false) };
      }
      if (asset.format === "raw-2bpp" && asset.width && asset.height) {
        var indexed = unpackIndexed(bytes, asset.width, asset.height, 2, 0);
        return { width: asset.width, height: asset.height, bpp: 2, indexed: indexed, canvas: canvasFromIndexed(indexed, asset.width, asset.height, 2, false) };
      }
      throw new Error("Set dimensions and a BIN format before previewing this file");
    }
    throw new Error("This asset has no image preview");
  }

  function fittedCanvas(source, width, height, fit) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.clearRect(0, 0, width, height);
    var scaleX = width / source.width;
    var scaleY = height / source.height;
    var drawWidth = width;
    var drawHeight = height;
    var x = 0;
    var y = 0;
    if (fit !== "stretch") {
      var scale = fit === "cover" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
      drawWidth = Math.max(1, Math.round(source.width * scale));
      drawHeight = Math.max(1, Math.round(source.height * scale));
      x = Math.floor((width - drawWidth) / 2);
      y = Math.floor((height - drawHeight) / 2);
    }
    context.drawImage(source, x, y, drawWidth, drawHeight);
    return canvas;
  }
  function quantizeCanvas(source, width, height, options) {
    options = options || {};
    var canvas = fittedCanvas(source, width, height, options.fit || "stretch");
    var rgba = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    var indexed = new Uint8Array(width * height);
    var low = Number(options.low == null ? 64 : options.low);
    var high = Number(options.high == null ? 152 : options.high);
    var bright = Number(options.bright == null ? 215 : options.bright);
    var opaqueFloor = !!options.opaqueFloor;
    for (var index = 0; index < indexed.length; index += 1) {
      var offset = index * 4;
      var alpha = rgba[offset + 3];
      if (alpha < 40) { indexed[index] = 0; continue; }
      var luma = rgba[offset] * 0.2126 + rgba[offset + 1] * 0.7152 + rgba[offset + 2] * 0.0722;
      var shade = luma < low ? 0 : luma < high ? 1 : luma < bright ? 2 : 3;
      indexed[index] = opaqueFloor ? Math.max(1, shade) : shade;
    }
    return { indexed: indexed, canvas: canvasFromIndexed(indexed, width, height, 2, !!options.transparent) };
  }

  function compactSource(source) {
    return String(source).split(/\r?\n/).map(function (line) { return line.trim(); }).filter(function (line) { return line && !line.startsWith("//"); }).join("\n") + "\n";
  }

  global.BirdCore = {
    byId: byId,
    clamp: clamp,
    deepCopy: deepCopy,
    uid: uid,
    slug: slug,
    escapeHtml: escapeHtml,
    formatBytes: formatBytes,
    toBase64: toBase64,
    fromBase64: fromBase64,
    textBytes: textBytes,
    request: request,
    post: post,
    assetUrl: assetUrl,
    assetBytes: assetBytes,
    unpackIndexed: unpackIndexed,
    packIndexed: packIndexed,
    unpackCollision: unpackCollision,
    packCollision: packCollision,
    decodeImg: decodeImg,
    encodeImg: encodeImg,
    decodeWorldPages: decodeWorldPages,
    encodeWorldPages: encodeWorldPages,
    decodeAsset: decodeAsset,
    fittedCanvas: fittedCanvas,
    quantizeCanvas: quantizeCanvas,
    canvasFromIndexed: canvasFromIndexed,
    compactSource: compactSource,
    palette: palette
  };
})(window);
