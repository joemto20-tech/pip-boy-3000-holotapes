import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import blankSpace from 'ts-blank-space';
import { minify } from 'terser';
import { tokenizeEspruino } from '../.scripts/build/espruino-tokenize.ts';

const directory = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(directory, '../dist/native-notes');
await fs.mkdir(output, { recursive: true });
for (const [source, target] of [
  ['NOTES.ts', 'NOTES.JS'],
  ['EDITOR.ts', 'NOTES_EDIT.JS'],
]) {
  const raw = await fs.readFile(path.join(directory, source), 'utf8');
  const stripped = blankSpace(raw, () => {
    throw new Error('Non-erasable TypeScript in ' + source);
  });
  // Keep names and control flow intact: Espruino has flat let/const scoping.
  const result = await minify(stripped, {
    compress: false,
    mangle: false,
    format: { ascii_only: true, comments: false, semicolons: true },
  });
  if (!result.code) throw new Error('Empty build for ' + source);
  const bytes = tokenizeEspruino(result.code);
  await fs.writeFile(path.join(output, target), bytes);
  console.log(target + ': ' + bytes.length + ' bytes');
}
