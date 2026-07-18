(function () {
  "use strict";

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;
  var FOOT = 260;
  var SAVE_KEY = "bigiron-pc-save-v1";

  var DATA = {
    worlds: {
      WORLD_01: {
        id: "WORLD_01",
        name: "Sunscar",
        spawn: [20, 9],
        rows: [
          "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          "BGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGGGGHHHHHHHHHGGGGGGGGGGGGGGGGB",
          "BGGGGXGGGGGGGGGGHHHHHHHHHGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGGGGHHHHHHHHHGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGGGGHHHHHHHHHGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGGGGHHHHDHHHHGGGGGGGGGGGGGGGGB",
          "BGGHHHHHHHGGGGGGGGGXPGGGGGGGGGGGHHHHHHHHGB",
          "BGGHHHHHHHGGGGGGGGGXPGGGGGGGGGGGHHHHHHHHGB",
          "BGGHHHHHHHBBBBBBBBBXPGGGGGGGGGGGHHHHHHHHGB",
          "BGGHHHHHHDPPPPPPPPPPPPPPPPPPPPPPDHHHHHHHGB",
          "BGGHHHHHHHGGGGGGGGGGPGGGGGGGGGGGHHHHHHHHGB",
          "BGGGGGGGGGGGGGGGGGGGPPPPPPPPPPPPPPPPGGGGGB",
          "BGGGGGGGGGGGGGGGGGGGPGGGGGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGHHHHHGGPGGGGGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGHHHHHGGPGGGGGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGHHDHHGGPGGGGGGGGGGGGGHHHHHHGB",
          "BGGGHHHHHHHGGGGGGGGGPGGGGGGGGGGGGGHHHHHHGB",
          "BGGGHHHHHHHGGGGGGGGGPPPPPPPPPPPPPPDHHHHHGB",
          "BGGGHHHHHHDPPPPPPPPPPGGGGGGGGGGGGGHHHHHHGB",
          "BGGGHHHHHHHGGGGGGGGGPGGGGGGGXGGGGGHHHHHHGB",
          "BGGGHHHHHHHGGGGGGGGGPGGGGGGGGGGGGGGGGGGGGB",
          "BGGGGGGGGGGGGGGGGGGGPGGGGGGGGGGGGGGGGGGGGB",
          "BBBBBBBBBBBBBBBBBBBBPBBBBBBBBBBBBBBBBBBBBB",
        ],
        interacts: [
          { id: "b0", type: "battle", x: 20, y: 6, prompt: "SUN KING?", enemy: "SOLOMON_RAY", once: true },
          { id: "b1", type: "battle", x: 9, y: 10, prompt: "RAIDER AMBUSH?", enemy: "RAIDER", once: true },
          { id: "b2", type: "battle", x: 10, y: 19, prompt: "BUNKER?", enemy: "RANDOM", once: true },
          { id: "b3", type: "battle", x: 34, y: 18, prompt: "STATION?", enemy: "RANDOM", once: true },
          { id: "v", type: "shop", x: 22, y: 12, prompt: "TRADE?", vendor: "SUNSCAR TRADER" },
        ],
        exits: [{ x: 20, y: 23, to: "WORLD_02", spawn: [2, 2], facing: "down" }],
        decor: [{ type: "shop", x: 22, y: 12 }],
      },
    },
    enemies: [
      { id: "GRANNY", name: "GRANNY", level: 6, maxHP: 75, xp: 35 },
      { id: "RADROACH", name: "RADROACH", level: 4, maxHP: 55, xp: 24 },
      { id: "RAIDER", name: "RAIDER", level: 5, maxHP: 70, xp: 32, dot: [3, 5], melee: true, reload: true, meleePower: 12 },
      { id: "FIEND_SCOUT", name: "FIEND SCOUT", level: 8, maxHP: 80, xp: 38 },
      { id: "RADSCORPION", name: "RADSCORPION", level: 10, maxHP: 100, xp: 45 },
      { id: "SOLOMON_RAY", name: "SOLOMON RAY", level: 7, maxHP: 95, xp: 55, bullet: "SCORCHED" },
    ],
    shopStock: [
      { cat: "AID", id: 86377, name: "STIMPAK", price: 35 },
      { cat: "WEAPONS", id: 17231, name: "10MM PISTOL", price: 55, damage: 13 },
      { cat: "WEAPONS", id: 586262, name: ".357 MAGNUM", price: 120, damage: 20 },
    ],
  };

  var palette = {
    bg: "#0a0e08",
    black: "#050704",
    dark: "#172012",
    mid: "#4f6845",
    light: "#a9c18b",
    white: "#edf6d9",
  };

  var game = {
    mode: "title",
    menu: 0,
    worldId: "WORLD_01",
    x: 20,
    y: 9,
    facing: "up",
    cameraX: 0,
    cameraY: 0,
    msg: "Find a door",
    state: loadSave(),
    battle: null,
    shop: null,
    result: null,
    messageAction: null,
    lastTick: performance.now(),
  };

  function freshSave() {
    return {
      map: "WORLD_01",
      x: 20,
      y: 9,
      facing: "up",
      cleared: {},
      story: { rounds: {}, encounters: 0, deadLead: 0 },
      player: {
        name: "GUNSLNGR",
        level: 1,
        hp: 100,
        maxHP: 100,
        caps: 125,
        stimpaks: 3,
        weapon: { name: ".357 MAGNUM", damage: 18 },
        inventory: { "86377": 3 },
      },
    };
  }

  function loadSave() {
    try {
      var saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "");
      if (saved && saved.player && saved.story) return saved;
    } catch (e) {}
    return freshSave();
  }

  function save() {
    game.state.map = game.worldId;
    game.state.x = game.x;
    game.state.y = game.y;
    game.state.facing = game.facing;
    localStorage.setItem(SAVE_KEY, JSON.stringify(game.state));
  }

  function newGame() {
    game.state = freshSave();
    game.worldId = "WORLD_01";
    game.x = 20;
    game.y = 9;
    game.facing = "up";
    game.mode = "world";
    game.msg = "Big Iron dormant";
    save();
  }

  function loadGame() {
    var s = game.state;
    game.worldId = s.map || "WORLD_01";
    game.x = s.x || 20;
    game.y = s.y || 9;
    game.facing = s.facing || "up";
    game.mode = "world";
    game.msg = "Loaded " + mapName(game.worldId);
  }

  function world() {
    return DATA.worlds[game.worldId] || DATA.worlds.WORLD_01;
  }

  function player() {
    return game.state.player;
  }

  function story() {
    return game.state.story;
  }

  function mapName(id) {
    var w = DATA.worlds[id];
    if (w && w.name) return w.name.toUpperCase();
    if (id === "WORLD_02") return "DOGTOWN HEIGHTS";
    return id;
  }

  function roundCount() {
    var rounds = story().rounds;
    var n = 0;
    Object.keys(rounds).forEach(function (key) {
      if (rounds[key]) n += 1;
    });
    return n;
  }

  function regularCount() {
    var w = world();
    var n = 0;
    w.interacts.forEach(function (it) {
      if (it.type === "battle" && it.enemy !== "SOLOMON_RAY" && game.state.cleared[it.id]) n += 1;
    });
    return n;
  }

  function clear() {
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);
  }

  function font(size) {
    ctx.font = size + "px Consolas, 'Courier New', monospace";
    ctx.textBaseline = "top";
  }

  function text(s, x, y, color, size, align) {
    font(size || 12);
    ctx.textAlign = align || "left";
    ctx.fillStyle = color || palette.white;
    ctx.fillText(String(s), x, y);
  }

  function box(x, y, w, h, selected) {
    ctx.strokeStyle = palette.light;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = palette.mid;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    if (selected) {
      ctx.fillStyle = palette.light;
      ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
    }
  }

  function bar(x, y, w, value, max) {
    var p = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    ctx.strokeStyle = palette.white;
    ctx.strokeRect(x, y, w, 9);
    ctx.fillStyle = palette.mid;
    ctx.fillRect(x + 2, y + 2, w - 4, 5);
    ctx.fillStyle = palette.white;
    ctx.fillRect(x + 2, y + 2, Math.floor((w - 4) * p), 5);
  }

  function drawTitle() {
    clear();
    box(34, 24, 412, 270, false);
    text("BIG IRON", W / 2, 62, palette.white, 42, "center");
    text("PB3000RPG - PC PLAYABLE", W / 2, 112, palette.light, 14, "center");
    var opts = ["START NEW", "LOAD GAME"];
    opts.forEach(function (opt, i) {
      var y = 166 + i * 48;
      box(142, y, 196, 32, game.menu === i);
      text(opt, W / 2, y + 8, game.menu === i ? palette.black : palette.white, 16, "center");
    });
    text("ARROWS/WASD MOVE  ENTER SELECT  ESC BACK", W / 2, 286, palette.mid, 12, "center");
  }

  function tileAt(x, y) {
    var r = world().rows[y];
    if (!r || x < 0 || x >= r.length) return "B";
    return r.charAt(x);
  }

  function blocked(x, y) {
    var t = tileAt(x, y);
    return t === "B" || t === "H" || t === "D" || t === "R" || t === "F" || t === "S" || t === "X";
  }

  function updateCamera() {
    var w = world();
    var scale = 24;
    var cols = Math.ceil(W / scale);
    var rows = Math.floor(FOOT / scale);
    var maxX = Math.max(0, w.rows[0].length - cols);
    var maxY = Math.max(0, w.rows.length - rows);
    game.cameraX = Math.max(0, Math.min(maxX, game.x - Math.floor(cols / 2)));
    game.cameraY = Math.max(0, Math.min(maxY, game.y - Math.floor(rows / 2)));
  }

  function drawTile(t, px, py, s) {
    ctx.fillStyle = palette.dark;
    ctx.fillRect(px, py, s, s);
    if (t === "P") {
      ctx.fillStyle = "#2e3f29";
      ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = palette.mid;
      ctx.strokeRect(px, py, s, s);
    } else if (t === "G") {
      ctx.fillStyle = "#172510";
      ctx.fillRect(px, py, s, s);
      ctx.fillStyle = palette.mid;
      ctx.fillRect(px + 5, py + 7, 3, 3);
      ctx.fillRect(px + 15, py + 14, 2, 2);
    } else if (t === "H" || t === "D") {
      ctx.fillStyle = "#1f261b";
      ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = palette.light;
      ctx.strokeRect(px + 3, py + 3, s - 6, s - 6);
      if (t === "D") {
        ctx.fillStyle = palette.black;
        ctx.fillRect(px + 7, py + 7, s - 14, s - 6);
      }
    } else if (t === "B") {
      ctx.fillStyle = "#090b08";
      ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = "#26331f";
      ctx.beginPath();
      ctx.moveTo(px, py + s - 2);
      ctx.lineTo(px + s, py + 2);
      ctx.stroke();
    } else if (t === "X") {
      ctx.fillStyle = "#202817";
      ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = palette.white;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 5);
      ctx.lineTo(px + 17, py + 17);
      ctx.moveTo(px + 17, py + 5);
      ctx.lineTo(px + 6, py + 17);
      ctx.stroke();
    }
  }

  function decorAt(x, y) {
    var found = null;
    world().decor.forEach(function (d) {
      if (d.x === x && d.y === y) found = d;
    });
    return found;
  }

  function drawDecor(d, px, py, s) {
    if (!d) return;
    if (d.type === "shop") {
      ctx.fillStyle = palette.mid;
      ctx.fillRect(px + 5, py + 9, s - 10, s - 5);
      ctx.strokeStyle = palette.white;
      ctx.beginPath();
      ctx.moveTo(px + 3, py + 9);
      ctx.lineTo(px + s / 2, py + 3);
      ctx.lineTo(px + s - 3, py + 9);
      ctx.stroke();
      ctx.fillStyle = palette.black;
      ctx.fillRect(px + 10, py + 15, 5, 8);
    }
  }

  function drawPlayer(px, py) {
    ctx.fillStyle = palette.white;
    ctx.fillRect(px + 8, py + 5, 8, 8);
    ctx.fillStyle = palette.light;
    ctx.fillRect(px + 5, py + 12, 14, 10);
    ctx.fillStyle = palette.black;
    if (game.facing === "up") ctx.fillRect(px + 9, py + 3, 6, 3);
    if (game.facing === "down") ctx.fillRect(px + 9, py + 13, 6, 3);
    if (game.facing === "left") ctx.fillRect(px + 5, py + 10, 3, 6);
    if (game.facing === "right") ctx.fillRect(px + 16, py + 10, 3, 6);
  }

  function frontPoint() {
    var x = game.x;
    var y = game.y;
    if (game.facing === "left") x -= 1;
    if (game.facing === "right") x += 1;
    if (game.facing === "up") y -= 1;
    if (game.facing === "down") y += 1;
    return { x: x, y: y };
  }

  function zone(x, y, it) {
    return x >= it.x && y >= it.y && x < it.x + (it.w || 1) && y < it.y + (it.h || 1);
  }

  function activeInteract() {
    var p = frontPoint();
    var found = null;
    world().interacts.forEach(function (it) {
      if (found) return;
      if (it.once && game.state.cleared[it.id]) return;
      if (zone(p.x, p.y, it) || zone(game.x, game.y, it)) found = it;
    });
    return found;
  }

  function drawWorld() {
    clear();
    updateCamera();
    var scale = 24;
    var cols = Math.ceil(W / scale);
    var rows = Math.floor(FOOT / scale);
    var x, y, px, py;
    for (y = 0; y <= rows; y += 1) {
      for (x = 0; x <= cols; x += 1) {
        px = x * scale;
        py = y * scale;
        drawTile(tileAt(game.cameraX + x, game.cameraY + y), px, py, scale);
        drawDecor(decorAt(game.cameraX + x, game.cameraY + y), px, py, scale);
      }
    }
    drawPlayer((game.x - game.cameraX) * scale, (game.y - game.cameraY) * scale);
    drawFooter();
  }

  function drawFooter() {
    var active = activeInteract();
    ctx.fillStyle = palette.black;
    ctx.fillRect(0, FOOT, W, H - FOOT);
    ctx.strokeStyle = palette.mid;
    ctx.beginPath();
    ctx.moveTo(0, FOOT);
    ctx.lineTo(W, FOOT);
    ctx.stroke();
    text("BIG IRON " + roundCount() + "/6", 12, 270, palette.white, 14);
    text("LEAD " + story().deadLead + "/20", 148, 270, palette.light, 14);
    text("HP " + player().hp + "/" + player().maxHP, 268, 270, palette.light, 14);
    text(active ? active.prompt : game.msg, W / 2, 294, active ? palette.white : palette.mid, 14, "center");
  }

  function move(dx, dy) {
    if (dx < 0) game.facing = "left";
    if (dx > 0) game.facing = "right";
    if (dy < 0) game.facing = "up";
    if (dy > 0) game.facing = "down";
    var nx = game.x + dx;
    var ny = game.y + dy;
    var exit = findExit(nx, ny);
    if (exit) {
      game.msg = roundCount() > 0 ? "Next world not built in PC folder yet" : "Scorched round required";
      return;
    }
    if (!blocked(nx, ny)) {
      game.x = nx;
      game.y = ny;
      game.msg = "";
      save();
    }
  }

  function findExit(x, y) {
    var out = null;
    world().exits.forEach(function (e) {
      if (zone(x, y, e)) out = e;
    });
    return out;
  }

  function activate() {
    var it = activeInteract();
    if (!it) {
      game.msg = "Nothing here";
      return;
    }
    if (it.type === "shop") {
      startShop(it);
      return;
    }
    if (it.enemy === "SOLOMON_RAY" && regularCount() < 2) {
      game.msg = "Complete 2 encounters";
      return;
    }
    startBattle(it);
  }

  function enemyById(id) {
    if (id === "RANDOM") {
      var pool = DATA.enemies.filter(function (e) {
        return e.id !== "SOLOMON_RAY";
      });
      return clone(pool[Math.floor(Math.random() * pool.length)]);
    }
    return clone(DATA.enemies.find(function (e) { return e.id === id; }) || DATA.enemies[0]);
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function startBattle(it) {
    var e = enemyById(it.enemy);
    game.mode = "battle";
    game.battle = {
      source: it,
      enemy: e,
      enemyHp: e.maxHP,
      selected: 0,
      phase: "menu",
      message: "A wild " + e.name + " appeared",
      bleedClock: 0,
    };
  }

  function battleOptions() {
    var b = game.battle;
    if (b.enemy.reload && b.phase === "reload") return ["STIMPAK", "SLASH"];
    return ["ATTACK", "STIMPAK", "RUN"];
  }

  function drawBattle() {
    var b = game.battle;
    clear();
    box(22, 18, 220, 70, false);
    text(b.enemy.name, 38, 32, palette.white, 20);
    text(":L" + b.enemy.level, 178, 34, palette.light, 18);
    text("HP:", 38, 62, palette.white, 16);
    bar(78, 66, 132, b.enemyHp, b.enemy.maxHP);
    drawEnemy(312, 58, b.enemy.id);
    drawCourier(80, 142);
    box(242, 150, 218, 78, false);
    text(player().name, 260, 164, palette.white, 18);
    text(":L" + player().level, 398, 166, palette.light, 16);
    text("HP:", 260, 194, palette.white, 14);
    bar(298, 198, 130, player().hp, player().maxHP);
    text(player().hp + "/" + player().maxHP, 356, 212, palette.light, 16);
    box(272, 234, 188, 70, false);
    battleOptions().forEach(function (opt, i) {
      var x = 292 + (i % 2) * 88;
      var y = 246 + Math.floor(i / 2) * 24;
      text((b.selected === i ? "> " : "  ") + opt, x, y, b.selected === i ? palette.white : palette.light, 16);
    });
    box(12, 234, 250, 70, false);
    text(b.message, 30, 262, palette.white, 18);
  }

  function drawEnemy(x, y, id) {
    ctx.fillStyle = palette.light;
    if (id === "RAIDER") {
      ctx.fillRect(x + 40, y + 30, 48, 44);
      ctx.fillRect(x + 52, y + 10, 24, 22);
      ctx.fillStyle = palette.white;
      ctx.fillRect(x + 72, y + 44, 34, 6);
      return;
    }
    if (id === "SOLOMON_RAY") {
      ctx.beginPath();
      ctx.arc(x + 58, y + 45, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.white;
      for (var i = 0; i < 12; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 58, y + 45);
        ctx.lineTo(x + 58 + Math.cos(i) * 56, y + 45 + Math.sin(i) * 56);
        ctx.stroke();
      }
      return;
    }
    ctx.beginPath();
    ctx.arc(x + 64, y + 46, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.white;
    ctx.fillRect(x + 26, y + 42, 26, 8);
    ctx.fillRect(x + 78, y + 42, 26, 8);
  }

  function drawCourier(x, y) {
    ctx.fillStyle = palette.light;
    ctx.fillRect(x + 34, y + 40, 44, 58);
    ctx.fillStyle = palette.white;
    ctx.fillRect(x + 24, y + 26, 70, 12);
    ctx.fillRect(x + 42, y + 12, 34, 18);
    ctx.fillStyle = palette.mid;
    ctx.fillRect(x + 82, y + 54, 42, 8);
    ctx.fillStyle = palette.black;
    ctx.fillRect(x + 50, y + 38, 12, 8);
  }

  function battleSelect() {
    var b = game.battle;
    var opt = battleOptions()[b.selected];
    if (opt === "RUN") {
      finishBattle(false, "Ran from " + b.enemy.name, false);
      return;
    }
    if (opt === "STIMPAK") {
      if (player().stimpaks <= 0) {
        b.message = "No stimpaks";
        return;
      }
      player().stimpaks -= 1;
      player().inventory["86377"] = Math.max(0, (player().inventory["86377"] || 0) - 1);
      player().hp = Math.min(player().maxHP, player().hp + 35);
      b.message = "Stimpack restored HP";
      if (b.phase === "reload") {
        b.phase = "menu";
        save();
        return;
      }
      enemyTurn();
      save();
      return;
    }
    var dmg = b.enemy.reload ? b.enemy.meleePower : player().weapon.damage;
    b.enemyHp = Math.max(0, b.enemyHp - dmg);
    b.message = "Hit for " + dmg;
    if (b.enemyHp <= 0) {
      finishBattle(true, "Victory", true);
      return;
    }
    if (b.enemy.reload) {
      b.phase = "reload";
      b.selected = 0;
      b.message = "Enemy reloads";
    } else {
      enemyTurn();
    }
  }

  function enemyTurn() {
    var b = game.battle;
    var dmg = Math.max(4, 8 + b.enemy.level - 2);
    player().hp = Math.max(0, player().hp - dmg);
    b.message = player().name + " took " + dmg;
    if (player().hp <= 0) finishBattle(false, "Defeat", true);
  }

  function finishBattle(won, message, clearEncounter) {
    var b = game.battle;
    if (won && clearEncounter && b.source.once && !game.state.cleared[b.source.id]) {
      game.state.cleared[b.source.id] = true;
      story().encounters += 1;
      story().deadLead = story().encounters;
      if (b.enemy.bullet) story().rounds[b.enemy.bullet] = true;
    }
    if (!won && player().hp <= 0) player().hp = 40;
    game.result = {
      title: won ? "VICTORY" : message === "Defeat" ? "DEFEAT" : "BATTLE ENDED",
      detail: won ? rewardText(b.enemy) : message,
    };
    game.mode = "message";
    game.messageAction = function () {
      game.mode = "world";
      game.battle = null;
      game.msg = won ? rewardText(b.enemy) : message;
      save();
    };
  }

  function rewardText(enemy) {
    if (enemy.bullet) return enemy.bullet + " ROUND LOADED";
    return "DEAD MAN'S LEAD +1";
  }

  function drawMessage() {
    clear();
    box(36, 44, 408, 230, false);
    var r = game.result || { title: "BIG IRON", detail: game.msg };
    text(r.title, W / 2, 86, palette.white, 32, "center");
    text(r.detail, W / 2, 148, palette.light, 18, "center");
    text("PRESS ENTER", W / 2, 214, palette.mid, 14, "center");
  }

  function startShop(it) {
    game.mode = "shop";
    game.shop = { vendor: it.vendor || "TRADER", mode: "main", selected: 0, msg: "WHAT DO YOU NEED?" };
  }

  function shopOptions() {
    if (game.shop.mode === "main") return ["BUY", "SELL", "LEAVE"];
    return ["BACK"].concat(DATA.shopStock.map(function (i) { return i.name + " " + i.price; }));
  }

  function drawShop() {
    clear();
    box(18, 16, 444, 106, false);
    text(game.shop.vendor, W / 2, 42, palette.white, 26, "center");
    text("CAPS " + player().caps, W / 2, 82, palette.light, 16, "center");
    drawCourier(54, 104);
    box(248, 138, 200, 126, false);
    shopOptions().forEach(function (opt, i) {
      text((game.shop.selected === i ? "> " : "  ") + opt, 266, 154 + i * 23, game.shop.selected === i ? palette.white : palette.light, 15);
    });
    box(18, 268, 444, 38, false);
    text(game.shop.msg, W / 2, 280, palette.white, 16, "center");
  }

  function shopSelect() {
    var sh = game.shop;
    if (sh.mode === "main") {
      if (sh.selected === 0) sh.mode = "buy";
      else if (sh.selected === 1) sh.mode = "sell";
      else {
        game.mode = "world";
        game.msg = "Trade closed";
      }
      sh.selected = 0;
      return;
    }
    if (sh.selected === 0) {
      sh.mode = "main";
      sh.selected = sh.mode === "sell" ? 1 : 0;
      sh.msg = "WHAT DO YOU NEED?";
      return;
    }
    var item = DATA.shopStock[sh.selected - 1];
    if (sh.mode === "buy") buyItem(item);
    else sellItem(item);
  }

  function buyItem(item) {
    var p = player();
    if (p.caps < item.price) {
      game.shop.msg = "NEED " + item.price + " CAPS";
      return;
    }
    p.caps -= item.price;
    if (item.cat === "AID") {
      p.stimpaks += 1;
      p.inventory[item.id] = (p.inventory[item.id] || 0) + 1;
    } else {
      p.weapon = { name: item.name, damage: item.damage || 10 };
    }
    game.shop.msg = "BOUGHT " + item.name;
    save();
  }

  function sellItem(item) {
    var p = player();
    if (item.cat === "AID") {
      if (p.stimpaks < 1) {
        game.shop.msg = "NONE TO SELL";
        return;
      }
      p.stimpaks -= 1;
      p.inventory[item.id] = Math.max(0, (p.inventory[item.id] || 0) - 1);
    } else if (p.weapon.name !== item.name) {
      game.shop.msg = "NOT EQUIPPED";
      return;
    } else {
      p.weapon = { name: "FISTS", damage: 6 };
    }
    p.caps += Math.max(1, Math.floor(item.price / 2));
    game.shop.msg = "SOLD " + item.name;
    save();
  }

  function drawPause() {
    clear();
    box(34, 24, 412, 270, false);
    text("PAUSED", W / 2, 54, palette.white, 32, "center");
    var opts = ["RESUME", "SAVE", "PROGRESS", "FIELD PACK", "EXIT TO TITLE"];
    opts.forEach(function (opt, i) {
      var y = 104 + i * 34;
      box(56, y, 176, 26, game.menu === i);
      text((game.menu === i ? "> " : "") + opt, 144, y + 6, game.menu === i ? palette.black : palette.white, 14, "center");
    });
    box(250, 104, 166, 128, false);
    text("BIG IRON " + roundCount() + "/6", 264, 122, palette.white, 14);
    text("JUDGMENTS " + story().encounters + "/20", 264, 144, palette.light, 13);
    text("DEAD LEAD " + story().deadLead + "/20", 264, 164, palette.light, 13);
    text("CAPS " + player().caps, 264, 186, palette.light, 13);
    text("STIMS " + player().stimpaks, 264, 206, palette.light, 13);
    text(player().weapon.name, W / 2, 266, palette.mid, 13, "center");
  }

  function pauseSelect() {
    if (game.menu === 0) game.mode = "world";
    else if (game.menu === 1) {
      save();
      game.msg = "Game saved";
      game.mode = "world";
    } else if (game.menu === 2) {
      game.msg = "Big Iron " + roundCount() + "/6";
    } else if (game.menu === 3) {
      game.msg = "Stimpaks " + player().stimpaks + " / " + player().weapon.name;
      game.mode = "world";
    } else {
      game.mode = "title";
      game.menu = 0;
    }
  }

  function tick(now) {
    var dt = (now - game.lastTick) / 1000;
    game.lastTick = now;
    if (game.mode === "battle" && game.battle && game.battle.enemy.dot && game.battle.enemyHp > 0) {
      game.battle.bleedClock += dt;
      if (game.battle.bleedClock >= game.battle.enemy.dot[1]) {
        game.battle.bleedClock = 0;
        player().hp = Math.max(0, player().hp - game.battle.enemy.dot[0]);
        game.battle.message = "Bleeding -" + game.battle.enemy.dot[0] + " HP";
        if (player().hp <= 0) finishBattle(false, "Defeat", true);
      }
    }
    render();
    requestAnimationFrame(tick);
  }

  function render() {
    if (game.mode === "title") drawTitle();
    else if (game.mode === "world") drawWorld();
    else if (game.mode === "battle") drawBattle();
    else if (game.mode === "shop") drawShop();
    else if (game.mode === "pause") drawPause();
    else if (game.mode === "message") drawMessage();
  }

  function choose(delta, max) {
    game.menu = (game.menu + delta + max) % max;
  }

  function handleKey(key) {
    if (key === "w") key = "ArrowUp";
    if (key === "a") key = "ArrowLeft";
    if (key === "s") key = "ArrowDown";
    if (key === "d") key = "ArrowRight";
    if (key === " ") key = "Enter";

    if (game.mode === "title") {
      if (key === "ArrowUp" || key === "ArrowDown") choose(1, 2);
      else if (key === "Enter") game.menu === 0 ? newGame() : loadGame();
      return;
    }

    if (game.mode === "world") {
      if (key === "ArrowUp") move(0, -1);
      else if (key === "ArrowDown") move(0, 1);
      else if (key === "ArrowLeft") move(-1, 0);
      else if (key === "ArrowRight") move(1, 0);
      else if (key === "Enter") activate();
      else if (key === "Escape" || key === "p") {
        game.mode = "pause";
        game.menu = 0;
      }
      return;
    }

    if (game.mode === "battle") {
      var opts = battleOptions();
      if (key === "ArrowUp" || key === "ArrowLeft") game.battle.selected = (game.battle.selected - 1 + opts.length) % opts.length;
      else if (key === "ArrowDown" || key === "ArrowRight") game.battle.selected = (game.battle.selected + 1) % opts.length;
      else if (key === "Enter") battleSelect();
      else if (key === "Escape" && !game.battle.enemy.dot) finishBattle(false, "Ran from " + game.battle.enemy.name, false);
      return;
    }

    if (game.mode === "shop") {
      var shopMax = shopOptions().length;
      if (key === "ArrowUp") game.shop.selected = (game.shop.selected - 1 + shopMax) % shopMax;
      else if (key === "ArrowDown") game.shop.selected = (game.shop.selected + 1) % shopMax;
      else if (key === "Enter") shopSelect();
      else if (key === "Escape" || key === "Backspace") {
        if (game.shop.mode === "main") {
          game.mode = "world";
          game.msg = "Trade closed";
        } else {
          game.shop.mode = "main";
          game.shop.selected = 0;
        }
      }
      return;
    }

    if (game.mode === "pause") {
      if (key === "ArrowUp") choose(-1, 5);
      else if (key === "ArrowDown") choose(1, 5);
      else if (key === "Enter") pauseSelect();
      else if (key === "Escape" || key === "Backspace") game.mode = "world";
      return;
    }

    if (game.mode === "message" && (key === "Enter" || key === "Escape")) {
      if (game.messageAction) game.messageAction();
    }
  }

  window.addEventListener("keydown", function (event) {
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter", "Escape", "Backspace"].indexOf(event.key) >= 0) {
      event.preventDefault();
    }
    handleKey(key);
  });

  document.querySelectorAll("button[data-key]").forEach(function (button) {
    button.addEventListener("click", function () {
      handleKey(button.getAttribute("data-key"));
      canvas.focus();
    });
  });

  canvas.setAttribute("tabindex", "0");
  requestAnimationFrame(tick);
})();
