/* eslint-disable no-eval, @typescript-eslint/no-unused-expressions -- Espruino loads factories with eval. */
/* Native Notes extension. The original, device-specific Notes code is kept
 * verbatim in JS/NOTES.STOCK and runs with local DataFile/Pip adapters only.
 * No firmware globals or stock game databases are modified by this screen. */
(function (): HolotapeApp {
  const StockDataFile = DataFile;
  const path = 'DATA/' + (NV ? 'NV' : 'F3') + '/MYNOTES.JSON';
  let notes: NativeNote[] = [];
  let issue = '';
  let native: HolotapeApp | undefined;
  let editor: Pick<HolotapeApp, 'remove'> | undefined;
  let pending = 0;
  let alive = true;

  function validStore(text: string): NativeNote[] {
    if (text.length > 8192) throw new Error('Custom notes exceed 8 KB');
    const store = JSON.parse(text) as NativeNoteStore;
    if (!store || store.version !== 1 || !Array.isArray(store.notes))
      throw new Error('Invalid custom notes file');
    if (store.notes.length > 20) throw new Error('Too many custom notes');
    for (const entry of store.notes) {
      if (
        !entry ||
        typeof entry.title !== 'string' ||
        typeof entry.body !== 'string' ||
        !entry.title.trim() ||
        entry.title.length > 80 ||
        entry.body.length > 1600 ||
        entry.body.split('\n').length > 24
      )
        throw new Error('Invalid custom note');
    }
    return store.notes;
  }

  function readNotes(): void {
    notes = [];
    issue = '';
    // A lost-power save may leave the last good file under its backup name.
    const source = fs.statSync(path)
      ? path
      : fs.statSync(path + '.BAK')
        ? path + '.BAK'
        : '';
    if (!source) return;
    try {
      const size = fs.statSync(source);
      if (!size || size.size > 8192)
        throw new Error('Custom notes exceed 8 KB');
      notes = validStore(fs.readFileSync(source));
    } catch (error) {
      issue =
        'Custom notes could not be read. Restore MYNOTES.JSON from its backup before editing.\n' +
        error;
    }
  }

  class NotesData {
    public constructor(file: string) {
      this.stock = new StockDataFile(file);
      if (this.stock.ids.indexOf(4294967295) >= 0) {
        this.stock.close();
        throw new Error('Reserved note ID already exists');
      }
      this.ids = new Uint32Array(this.stock.ids.length + notes.length + 1);
      this.ids[0] = 4294967295;
      for (let custom = 0; custom < notes.length; custom++) {
        if (this.stock.ids.indexOf(4294901760 + custom) >= 0) {
          this.stock.close();
          throw new Error('Reserved custom note ID already exists');
        }
        this.ids[custom + 1] = 4294901760 + custom;
      }
      this.ids.set(this.stock.ids, notes.length + 1);
    }

    declare private stock: DataFile;
    declare public ids: Uint32Array;

    public getId(id: number): Record<string, PipValue> {
      if (id === 4294967295)
        return {
          txt: notes.length >= 20 ? 'MY NOTES (FULL)' : '+ ADD NOTE',
          t: 1,
          desc:
            issue ||
            'Press to create a note.\n\nYour notes are saved on the SD card and shown here.\n\nHold the knob on one of your notes to edit it.',
        };
      const index = id - 4294901760;
      if (index >= 0 && index < notes.length)
        return {
          txt: notes[index].title,
          t: 1,
          desc: notes[index].body || '(Empty note)',
        };
      return this.stock.getId(id);
    }

    public close(): void {
      this.stock.close();
    }
  }

  function openStock(
    DataFile: NativeNoteReaderConstructor,
    Pip: NativeNoteStockPip,
  ): HolotapeApp {
    // Direct eval intentionally resolves these two local API adapters.
    if (!DataFile || !Pip) throw new Error('Missing Notes API');
    return (eval(fs.readFileSync('JS/NOTES.STOCK')) as () => HolotapeApp)();
  }

  function closeNative(): void {
    if (native) native.remove();
    native = undefined;
    // The original screen does not stop an already-playing holotape on exit.
    Pip.audioStop();
  }

  function finishEditor(): void {
    if (editor) editor.remove();
    editor = undefined;
    if (alive) showNative();
  }

  function queueEditor(index: number): void {
    if (!alive || pending || issue) return;
    if (index < 0 && notes.length >= 20) return;
    // The stock scroller redraws after onClick. Open after that redraw, and
    // remove the stock screen first so its timers cannot paint over the editor.
    pending = setTimeout(function () {
      pending = 0;
      if (!alive) return;
      closeNative();
      try {
        editor = (
          eval(fs.readFileSync('JS/NOTES_EDIT.JS')) as NativeNoteEditorFactory
        )({ path, notes, index, finish: finishEditor });
      } catch (error) {
        showNative();
        Pip.errorBox('Unable to open note editor: ' + error);
      }
    }, 0);
  }

  function createList(options: NativeNoteListOptions): NativeNoteList {
    const click = options.onClick;
    const longClick = options.onLongClick;
    options.onClick = function (index: number): void {
      if (index === 0) queueEditor(-1);
      else if (click) click(index);
    };
    options.onLongClick = function (index: number): void {
      if (index > 0 && index <= notes.length) queueEditor(index - 1);
      else if (longClick) longClick(index);
    };
    return Pip.createScroller(options);
  }

  function showNative(): void {
    readNotes();
    h.setBgColor(0).clearRect(0, 40, 479, 280).setColor(3);
    native = openStock(NotesData, {
      createScroller: createList,
      audioStop: Pip.audioStop.bind(Pip),
      audioStart: Pip.audioStart.bind(Pip),
      audioFileInfo: Pip.audioFileInfo.bind(Pip),
      formatId: Pip.formatId.bind(Pip),
      renderTextOverflow: Pip.renderTextOverflow.bind(Pip),
    });
  }

  function remove(): void {
    alive = false;
    if (pending) clearTimeout(pending);
    pending = 0;
    if (editor) editor.remove();
    editor = undefined;
    closeNative();
  }

  showNative();
  return { id: 'NOTES', remove };
});
