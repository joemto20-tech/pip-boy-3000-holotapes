/* eslint-disable @typescript-eslint/no-unused-expressions -- Espruino loads this factory with eval. */
/* Loaded only while editing. The stock Notes screen is closed before entry. */
(function (context: NativeNoteEditorContext): Pick<HolotapeApp, 'remove'> {
  let title = context.index < 0 ? '' : context.notes[context.index].title;
  const lines = (
    context.index < 0 ? '' : context.notes[context.index].body
  ).split('\n');
  let list: NativeNoteList | undefined;
  let keyboard: PipKeyboard | undefined;
  let pending = 0;
  let alive = true;
  let message = '';

  function closeUI(): void {
    if (list) list.remove();
    list = undefined;
    if (keyboard) keyboard.remove();
    keyboard = undefined;
  }

  function remove(): void {
    alive = false;
    if (pending) clearTimeout(pending);
    pending = 0;
    closeUI();
  }

  function later(action: () => void): void {
    if (!alive || pending) return;
    pending = setTimeout(function () {
      pending = 0;
      if (alive) action();
    }, 0);
  }

  function menu(
    heading: string,
    items: NativeNoteItem[],
    click: (index: number) => void,
  ): void {
    closeUI();
    h.setBgColor(0).clearRect(0, 40, 479, 280).setColor(3);
    list = Pip.createScroller({
      width: 410,
      items,
      onClick(index: number): void {
        Pip.playSound('SELECT');
        later(function () {
          click(index);
        });
      },
    });
    h.setFontMonofonto14().setFontAlign(-1, 0).setColor(2);
    h.drawString(heading, 24, 273);
    h.flip();
  }

  function form(): void {
    const items: NativeNoteItem[] = [
      { txt: 'TITLE: ' + (title || '(untitled)') },
      { txt: 'EDIT BODY', rtxt: lines.length + ' lines' },
      { txt: 'SAVE NOTE' },
      { txt: 'CANCEL' },
    ];
    if (context.index >= 0) items.push({ txt: 'DELETE NOTE' });
    menu(
      message || 'MY NOTES / ' + (context.index < 0 ? 'NEW' : 'EDIT'),
      items,
      function (index: number): void {
        if (index === 0) editText(-1);
        else if (index === 1) bodyMenu();
        else if (index === 2) save(false);
        else if (index === 3) context.finish();
        else confirmDelete();
      },
    );
  }

  function editText(index: number): void {
    closeUI();
    // The firmware keyboard is one line wide; edit the body one line at a time
    // to avoid silently truncating a long note to the keyboard's visible width.
    keyboard = Pip.createKeyboard(
      index < 0 ? title : lines[index],
      index < 0 ? 'NOTE TITLE' : 'NOTE LINE ' + (index + 1),
      function (text: string): void {
        if (!alive) return;
        closeUI();
        if (index < 0) {
          title = text.trim();
          form();
        } else {
          lines[index] = text;
          bodyMenu();
        }
      },
    );
  }

  function bodyMenu(): void {
    const items: NativeNoteItem[] = [];
    for (let row = 0; row < lines.length; row++)
      items.push({ txt: row + 1 + ': ' + (lines[row] || '(empty line)') });
    items.push({ txt: '+ ADD LINE' });
    items.push({ txt: 'REMOVE LAST LINE' });
    items.push({ txt: 'BACK' });
    menu(
      'NOTE BODY / ' + lines.join('\n').length + ' of 1600 characters',
      items,
      function (index: number): void {
        if (index < lines.length) editText(index);
        else if (index === lines.length) {
          if (lines.length >= 24) {
            message = 'Maximum 24 lines per note';
            form();
          } else {
            lines.push('');
            editText(lines.length - 1);
          }
        } else if (index === lines.length + 1) {
          if (lines.length > 1) lines.pop();
          else lines[0] = '';
          bodyMenu();
        } else form();
      },
    );
  }

  function confirmDelete(): void {
    menu(
      'DELETE ' + title + '?',
      [{ txt: 'CANCEL' }, { txt: 'DELETE NOTE' }],
      function (index: number): void {
        if (index === 1) save(true);
        else form();
      },
    );
  }

  function save(deleting: boolean): void {
    const body = lines.join('\n');
    if (!deleting && (!title || title.length > 80 || body.length > 1600)) {
      message = !title ? 'Enter a title before saving' : 'Note is too long';
      form();
      return;
    }
    const changed = context.notes.slice();
    if (deleting) changed.splice(context.index, 1);
    else if (context.index < 0) changed.unshift({ title, body });
    else changed[context.index] = { title, body };
    const data = JSON.stringify({ version: 1, notes: changed });
    if (changed.length > 20 || data.length > 8192) {
      message = 'Storage limit: 20 notes / 8 KB';
      form();
      return;
    }
    const temporary = context.path + '.NEW';
    const backup = context.path + '.BAK';
    try {
      if (!fs.writeFileSync(temporary, data)) throw new Error('Write failed');
      if (fs.readFileSync(temporary) !== data)
        throw new Error('Verification failed');
      if (fs.statSync(context.path)) {
        if (fs.statSync(backup) && !fs.unlink(backup))
          throw new Error('Backup is busy');
        if (!fs.rename(context.path, backup)) throw new Error('Backup failed');
      }
      if (!fs.rename(temporary, context.path)) {
        if (!fs.statSync(context.path) && fs.statSync(backup))
          fs.rename(backup, context.path);
        throw new Error('Commit failed; previous notes preserved');
      }
    } catch (error) {
      message = 'Not saved: ' + error;
      form();
      return;
    }
    context.finish();
  }

  form();
  return { remove };
});
