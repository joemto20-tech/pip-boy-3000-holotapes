/** A custom text note stored on the SD card. */
interface NativeNote {
  /** Note title, entered with the firmware keyboard. */
  title: string;
  /** Note body; newline characters separate editable lines. */
  body: string;
}

/** Versioned custom-notes document. */
interface NativeNoteStore {
  /** Storage schema version. */
  version: number;
  /** User-created notes in display order. */
  notes: NativeNote[];
}

/** Firmware list item, including optional text preview. */
interface NativeNoteItem {
  /** Visible row label. */
  txt: string;
  /** Optional right-aligned row label. */
  rtxt?: string;
  /** Native note type: 1 text, 2 image, 3 audio. */
  t?: number;
  /** Text preview. */
  desc?: string;
}

/** Firmware scroller options, verified on the connected device. */
interface NativeNoteListOptions {
  /** Width of the list column. */
  width?: number;
  /** Row count for a lazy data source. */
  itemCount?: number;
  /** Lazily obtains a row. */
  getItem?: (index: number) => Record<string, PipValue>;
  /** Eager row data for short editor menus. */
  items?: NativeNoteItem[];
  /** Called after a short knob press. */
  onClick?: (index: number) => void;
  /** Called after a long knob press. */
  onLongClick?: (index: number) => void;
  /** Native active-item markers. */
  hasEquipStates?: boolean;
  /** Renders the selected row's preview. */
  render?: (item: Record<string, PipValue>) => void;
}

/** Live firmware list and its cleanup. */
interface NativeNoteList {
  /** Selected row. */
  selectedIndex: number;
  /** Redraws the list. */
  render(): void;
  /** Detaches the input listener and pending preview timer. */
  remove(): void;
}

/** Concrete overload for the firmware scroller inspected over serial. */
interface PipController {
  /** Creates a native scrolling list. */
  createScroller(options: NativeNoteListOptions): NativeNoteList;
}

/** Minimal DataFile contract required by the original Notes screen. */
interface NativeNoteReader {
  /** Stock and custom note IDs, in display order. */
  ids: Uint32Array;
  /** Resolves a note record. */
  getId(id: number): Record<string, PipValue>;
  /** Closes the stock database file. */
  close(): void;
}

/** Constructor supplied lexically to the unchanged native Notes factory. */
/** Opens the requested native database. */
type NativeNoteReaderConstructor = new (path: string) => NativeNoteReader;

/** Bound firmware methods used by the connected device's stock Notes code. */
interface NativeNoteStockPip extends Pick<
  PipController,
  | 'audioStop'
  | 'audioStart'
  | 'audioFileInfo'
  | 'formatId'
  | 'renderTextOverflow'
> {
  /** Adds custom-note actions to the otherwise unchanged native scroller. */
  createScroller(options: NativeNoteListOptions): NativeNoteList;
}

/** Context passed to the lazily loaded on-device editor. */
interface NativeNoteEditorContext {
  /** SD-card JSON path for the current game profile. */
  path: string;
  /** Saved custom notes. The editor only changes a separate draft. */
  notes: NativeNote[];
  /** Index to edit, or -1 for a new note. */
  index: number;
  /** Returns to the native Notes list. */
  finish(): void;
}

/** On-device editor factory. */
type NativeNoteEditorFactory = (
  context: NativeNoteEditorContext,
) => Pick<HolotapeApp, 'remove'>;
