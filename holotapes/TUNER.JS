(function () {
  try {
    var fs = require("fs");
    var factory = eval(fs.readFileSync("HOLO/TUNER/APP.JS"));
    if (typeof factory !== "function") throw "INVALID APP.JS";
    Pip.CURRENT = factory();
  } catch (e) {
    try {
      h.clear();
      h.setColor(3).setFont("Monofonto23").setFontAlign(0, 0);
      h.drawString("TUNER LOAD ERROR", 240, 140);
      h.setColor(2).setFont("Monofonto14");
      h.drawString((e.message || e).toString().substr(0, 46), 240, 174);
      h.flip();
    } catch (ignore) {}
    try { Pip.log("Tuner launcher error: " + (e.message || e), "errors.txt"); } catch (ignore2) {}
  }
})();
