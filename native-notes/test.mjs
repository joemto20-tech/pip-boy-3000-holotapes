import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';

const mainCode = stripTypeScriptTypes(
  fs.readFileSync(new URL('NOTES.ts', import.meta.url), 'utf8'),
);
const editorCode = stripTypeScriptTypes(
  fs.readFileSync(new URL('EDITOR.ts', import.meta.url), 'utf8'),
);
const dataPath = 'DATA/F3/MYNOTES.JSON';
const document = (notes) => JSON.stringify({ version: 1, notes });

// The stock factory resolves the supplied DataFile/Pip lexically, just as the
// real, tokenized JS/NOTES.STOCK does on the device. The mock firmware scroller
// also deliberately redraws AFTER each click, matching the inspected firmware.
const stock = `(function () {
  const data = new DataFile('DATA/F3/NOTES.DAT');
  const scroller = Pip.createScroller({
    itemCount: data.ids.length,
    getItem: function (index) { return data.getId(data.ids[index]); },
    onClick: function (index) { selectedStock(data.getId(data.ids[index])); }
  });
  return { id: 'NOTES', remove: function () { scroller.remove(); data.close(); } };
})`;

function environment({
  notes,
  nv = false,
  failure = () => false,
  raw,
  backup,
} = {}) {
  const files = new Map([
    ['JS/NOTES.STOCK', stock],
    ['JS/NOTES_EDIT.JS', editorCode],
  ]);
  const path = nv ? 'DATA/NV/MYNOTES.JSON' : dataPath;
  if (notes) files.set(path, document(notes));
  if (raw !== undefined) files.set(path, raw);
  if (backup !== undefined) files.set(path + '.BAK', backup);
  const timers = new Map(),
    listeners = new Map(),
    writes = [];
  let nextTimer = 1,
    ui,
    keyboard,
    handles = 0,
    lastStock,
    error;
  let graphics;
  graphics = new Proxy(
    {},
    {
      get() {
        return () => graphics;
      },
    },
  );
  const disk = {
    statSync(path) {
      return files.has(path)
        ? { size: files.get(path).length, dir: false }
        : undefined;
    },
    readFileSync(path) {
      if (!files.has(path)) throw Error('NO_FILE: ' + path);
      return files.get(path);
    },
    writeFileSync(path, value) {
      writes.push(['write', path]);
      if (failure('write', path)) return false;
      files.set(path, value);
      return true;
    },
    unlink(path) {
      writes.push(['unlink', path]);
      return files.delete(path);
    },
    rename(from, to) {
      writes.push(['rename', from, to]);
      if (failure('rename', from, to)) return false;
      if (!files.has(from) || files.has(to)) return false;
      files.set(to, files.get(from));
      files.delete(from);
      return true;
    },
  };
  class StockDataFile {
    constructor() {
      this.ids = new Uint32Array([100, 200, 300]);
      handles++;
    }
    getId(id) {
      return {
        txt: 'Original ' + id,
        t: id / 100,
        desc: 'Stock content ' + id,
      };
    }
    close() {
      handles--;
    }
  }
  const pip = {
    audioStop() {},
    audioStart() {},
    audioFileInfo() {},
    formatId() {},
    renderTextOverflow() {},
    playSound() {},
    createScroller(options) {
      const scroller = {
        options,
        selectedIndex: 0,
        removed: false,
        render() {
          if (this.removed) ui = { overwrittenByRemovedScroller: true };
        },
        remove() {
          this.removed = true;
        },
      };
      ui = scroller;
      return scroller;
    },
    createKeyboard(initial, description, callback) {
      keyboard = {
        initial,
        description,
        callback,
        removed: false,
        remove() {
          this.removed = true;
          listeners.delete('knob1');
          listeners.delete('knob2');
        },
      };
      listeners.set('knob1', keyboard);
      listeners.set('knob2', keyboard);
      ui = keyboard;
      return keyboard;
    },
    errorBox(text) {
      error = text;
    },
  };
  const context = vm.createContext({
    fs: disk,
    Pip: pip,
    DataFile: StockDataFile,
    h: graphics,
    NV: nv,
    selectedStock(item) {
      lastStock = item;
    },
    setTimeout(fn) {
      const id = nextTimer++;
      timers.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  });
  const app = vm.runInContext(mainCode, context)();
  const flush = () => {
    for (const [id, callback] of [...timers]) {
      timers.delete(id);
      callback();
    }
    assert.equal(error, undefined);
  };
  const click = (index, long = false) => {
    const old = ui;
    (long ? old.options.onLongClick : old.options.onClick)?.(index);
    // Native onLongClick returns immediately; onClick always triggers redraw.
    if (!long) old.render();
    flush();
    assert.notEqual(ui.overwrittenByRemovedScroller, true);
  };
  const enter = (text) => {
    keyboard.callback(text);
  };
  const title = (text) => {
    click(0);
    enter(text);
  };
  const body = (text) => {
    click(1);
    click(0);
    enter(text);
    click(ui.options.items.length - 1);
  };
  const read = () => JSON.parse(files.get(path));
  return {
    app,
    files,
    path,
    timers,
    writes,
    click,
    enter,
    title,
    body,
    flush,
    read,
    get ui() {
      return ui;
    },
    get keyboard() {
      return keyboard;
    },
    get handles() {
      return handles;
    },
    get lastStock() {
      return lastStock;
    },
    get listeners() {
      return listeners;
    },
  };
}

test('native list preserves text/image/audio notes and previews custom notes', () => {
  const env = environment({ notes: [{ title: 'My note', body: 'My text' }] });
  assert.equal(env.ui.options.itemCount, 5);
  assert.equal(env.ui.options.getItem(0).txt, '+ ADD NOTE');
  assert.equal(env.ui.options.getItem(1).rtxt, undefined);
  for (let i = 0; i < 3; i++)
    assert.equal(env.ui.options.getItem(i + 2).t, i + 1);
  env.click(1);
  assert.equal(env.lastStock.desc, 'My text');
  env.app.remove();
  assert.equal(env.handles, 0);
});

test('add title and multiline body, save, reopen and edit via long press', () => {
  const env = environment();
  env.click(0);
  assert.equal(env.handles, 0);
  env.title('Shopping');
  env.click(1);
  env.click(0);
  env.enter('Water');
  env.click(1);
  env.enter('Food');
  env.click(env.ui.options.items.length - 1);
  env.click(2);
  assert.equal(env.read().notes[0].body, 'Water\nFood');
  assert.equal(env.ui.options.getItem(1).txt, 'Shopping');
  env.click(1, true);
  env.title('Supplies');
  env.click(2);
  assert.equal(env.read().notes[0].title, 'Supplies');
  assert.equal(
    JSON.parse(env.files.get(env.path + '.BAK')).notes[0].title,
    'Shopping',
  );
  assert.ok(
    env.writes.every(
      (operation) =>
        !operation.slice(1).some((path) => /NOTES\.(DAT|IMG)$/.test(path)),
    ),
  );
  env.app.remove();
});

test('cancel and navigation away do not save drafts or leak a keyboard', () => {
  const env = environment();
  env.click(0);
  env.title('Draft');
  env.click(3);
  assert.equal(env.files.has(env.path), false);
  env.click(0);
  env.click(0);
  assert.equal(env.listeners.size, 2);
  env.app.remove();
  assert.equal(env.keyboard.removed, true);
  assert.equal(env.listeners.size, 0);
  assert.equal(env.timers.size, 0);
  assert.equal(env.handles, 0);
});

test('queued editor cannot open after screen removal', () => {
  const env = environment();
  env.ui.options.onClick(0);
  assert.equal(env.timers.size, 1);
  env.app.remove();
  env.flush();
  assert.equal(env.handles, 0);
  assert.equal(env.timers.size, 0);
});

test('delete requires confirmation and preserves previous file as backup', () => {
  const note = { title: 'Delete me', body: 'Text' };
  const env = environment({ notes: [note] });
  env.click(1, true);
  env.click(4);
  env.click(0);
  assert.deepEqual(env.read().notes, [note]);
  env.click(4);
  env.click(1);
  assert.deepEqual(env.read().notes, []);
  assert.deepEqual(JSON.parse(env.files.get(env.path + '.BAK')).notes, [note]);
  env.app.remove();
});

test('New Vegas notes use a separate SD-card store', () => {
  const env = environment({ nv: true });
  env.click(0);
  env.title('NV note');
  env.click(2);
  assert.equal(env.files.has(dataPath), false);
  assert.equal(env.files.has('DATA/NV/MYNOTES.JSON'), true);
  env.app.remove();
});

test('missing main file recovers the backup after an interrupted rename', () => {
  const env = environment({
    backup: document([{ title: 'Recovered', body: 'Safe' }]),
  });
  assert.equal(env.ui.options.getItem(1).txt, 'Recovered');
  env.click(1, true);
  env.title('Recovered and saved');
  env.click(2);
  assert.equal(env.read().notes[0].title, 'Recovered and saved');
  assert.equal(
    JSON.parse(env.files.get(env.path + '.BAK')).notes[0].title,
    'Recovered',
  );
  env.app.remove();
});

test('a corrupt file is never overwritten and stock notes still work', () => {
  const env = environment({ raw: '{bad JSON' });
  assert.match(env.ui.options.getItem(0).desc, /could not be read/);
  env.click(0);
  assert.equal(env.files.get(env.path), '{bad JSON');
  assert.equal(env.writes.length, 0);
  env.click(1);
  assert.equal(env.lastStock.txt, 'Original 100');
  env.app.remove();
});

for (const fail of ['write', 'backup', 'commit']) {
  test(
    'failed ' + fail + ' preserves existing notes and the unsaved draft',
    () => {
      const old = [{ title: 'Original custom note', body: 'Safe' }];
      const env = environment({
        notes: old,
        failure: (operation, from, to) =>
          (fail === 'write' && operation === 'write') ||
          (fail === 'backup' &&
            operation === 'rename' &&
            to.endsWith('.BAK')) ||
          (fail === 'commit' &&
            operation === 'rename' &&
            from.endsWith('.NEW')),
      });
      env.click(1, true);
      env.title('Unsaved change');
      env.click(2);
      assert.deepEqual(env.read().notes, old);
      assert.equal(env.ui.options.items[0].txt, 'TITLE: Unsaved change');
      env.app.remove();
    },
  );
}

test('blank titles, note-count and total-size limits cannot corrupt storage', () => {
  const blank = environment();
  blank.click(0);
  blank.click(2);
  assert.equal(blank.files.has(blank.path), false);
  blank.app.remove();
  const full = environment({
    notes: Array.from({ length: 20 }, (_, i) => ({
      title: 'Note ' + i,
      body: '',
    })),
  });
  assert.equal(full.ui.options.getItem(0).txt, 'MY NOTES (FULL)');
  full.click(0);
  assert.equal(full.writes.length, 0);
  full.app.remove();
  const large = environment({
    notes: Array.from({ length: 6 }, (_, i) => ({
      title: 'Note ' + i,
      body: 'x'.repeat(1280),
    })),
  });
  const previous = large.files.get(large.path);
  large.click(0);
  large.title('New');
  large.body('x'.repeat(500));
  large.click(2);
  assert.equal(large.files.get(large.path), previous);
  large.app.remove();
});
