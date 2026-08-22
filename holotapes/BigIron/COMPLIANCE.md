# agents.md compliance

Audited against `agents.md` §5.1 hard checks and §6 anti-patterns at v0.58.1.
Checks are run against `src/`; `scripts/` is a proved alpha-rename of it, so
both agree.

## §5.1 Hard checks

| #   | Check                               | Result                                                  |
| --- | ----------------------------------- | ------------------------------------------------------- |
| R01 | IIFE wrapping, no trailing `()`     | pass — all 14 modules                                   |
| R02 | Return object has `id` and `remove` | pass — `APP.JS` returns `{id:"BIGIRON", …, remove}`     |
| R03 | Listeners cleared in `remove()`     | pass — `knob1`/`knob2` registered once, both removed    |
| R04 | Timers cleared in `remove()`        | pass — every handle cleared in the teardown path        |
| R05 | `setWatch` cleared                  | n/a — no `setWatch` anywhere                            |
| R06 | Type is `app` or `game`             | pass — `game`                                           |
| R07 | Valid semver                        | pass — `0.58.1`                                         |
| R08 | Minified twin matches source        | pass — see below                                        |
| R09 | ChangeLog                           | pass                                                    |
| R10 | README with controls                | pass                                                    |
| R11 | No unsupported ES6+                 | pass — no `async`/`await`, template literals or modules |
| R12 | `Math.randInt`, not `Math.random`   | pass — zero matches; 10 call sites converted in 0.58.1  |
| R13 | No OS globals overwritten           | **see below — five writes, reasons given**              |
| R14 | Storage names `HOLO/<ID>/`          | pass — 124 entries, all `HOLO/BIGIRON/`                 |
| R15 | Input via `Pip.on`/`onExclusive`    | pass — `onExclusive` with an `on` fallback              |

### R08 in detail

This tape has 14 modules rather than one `app.js`, so the `app.js` /
`app.min.js` pair becomes `src/` and `scripts/`. `tools/build.mjs` does not just
minify — it proves each output is an **alpha-rename** of its input: same AST
shape, same literals, and every identifier in a strict bijection with its
resolved binding. Member properties and object keys are compared by name, so a
property called `story` is never confused with a variable of the same name. The
build refuses to write if the proof fails. That is a stronger guarantee than the
"spot-check key identifiers are mangled but structure matches" the rule asks
for.

Terser runs with `compress: false`. §3.3 notes Espruino does not block-scope
`let`/`const`, so structural rewrites are not worth the risk for a few hundred
bytes. Mangle and strip only.

`APP.JS` calls `eval()` on the other modules, so terser needs `mangle.eval`. The
build asserts first that no module references an `APP.JS` local — they reach
only for `h`, `Pip`, `E`, `fs`, `player`, `NV` and built-ins — which is what
makes that safe.

## R13 — the five `Pip.*` writes

Two are documented. Three are not, and are listed here so a reviewer can weigh
them rather than find them.

**Documented, no concern:**

- `Pip.CURRENT.fullscreen = true` on entry, `false` on exit. §1 lists
  `fullscreen` as a field handled by `Pip.CURRENT`. The game owns all 320 rows,
  including the strip the OS clock uses.
- `Pip.lastFlip = getTime()` after each `h.flip()`. This is the documented flip
  pattern — it tells the OS the frame was presented so its own flip timer does
  not blit over the game.

**Undocumented — reasons, and the risk:**

- `Pip.radioClipPlaying = 1` while a track plays, `0` when it stops and on
  teardown. Without it the OS radio resumes over the game's own `.wav`. It is a
  set-and-restore of an existing field, not a delete, and the value is returned
  to `0` on every exit path.
- `Pip.timers.timeHeader = 0` and `Pip.timers.flip = 0`, after `clearInterval`
  on those two OS timers. Nulling the handles stops `Pip.startTimers()` from
  leaking a second interval when the game hands control back. This is the
  closest thing in the tape to the "reassigning OS globals" anti-pattern, and it
  is the one worth arguing about. It exists because a fullscreen map needs the
  OS to stop repainting the header; `Pip.CURRENT.fullscreen` alone did not stop
  it on the firmware this was built against.
- `Pip.MODE` is read on entry and `Pip.emit('mode', homeMode, true)` is fired on
  exit, so leaving the game returns to whichever menu launched it rather than
  the default. Neither appears in `agents.md`. `Pip.changeMenu()` — which is
  documented — is already the fallback if the emit throws.

If any of these should go, the safe order is: drop the `Pip.MODE` emit first and
rely on the `Pip.changeMenu()` fallback, then try removing the `Pip.timers.*`
writes and confirm the OS clock does not draw over the map. Both need a device
to verify; neither was changed blind.

## §6 anti-patterns

All clear except one, deliberate:

**Functions stored in an object** — `APP.JS` builds an `API` object of ~20
functions and hands it to each `eval()`ed module. That is the module boundary:
it is how a world module reaches battle, shop, pause and the native inventory
helpers without every module re-implementing them or reaching for globals. The
alternative — inlining the router into all 14 modules — costs far more memory
than the object does. The object is built once and released in `remove()`.

`var` was eliminated in 0.58.1: 122 declarations became `const`, 170 became
`let`, none remain. The conversion was done with a scope-aware tool that first
proved no name is declared twice in a function scope and no binding is read
before its declarator in the same scope. One deferred reference exists — `API`
is read inside `loadModule()`, which only ever runs from a `setTimeout` after
the file has finished executing. That is the §3.11 carve-out for callback
bodies.

## Known gap

The ChangeLog has no PR link on its second line yet, because no PR is open. Add
it when one is.
