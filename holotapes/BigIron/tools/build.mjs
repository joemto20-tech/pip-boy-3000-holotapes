/* Big Iron build: src/*.JS  ->  BIGIRON/*.JS
 *
 *   cd TOOLS && npm install acorn eslint-scope terser && node build.mjs
 *
 * Mangles and strips only. No compression passes: agents.md 3.3 warns that Espruino does
 * not block-scope let/const, so structural rewrites are not worth the risk. Every output is
 * checked to be an alpha-rename of its source, which is holotape review rule R08.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import { alphaEqual, parse, scopes, bindings } from './verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'src');
// repo layout uses scripts/, the standalone zip uses BIGIRON/
const OUT = fs.existsSync(path.join(HERE, '..', 'scripts'))
  ? path.join(HERE, '..', 'scripts')
  : path.join(HERE, '..', 'BIGIRON');
const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.JS'))
  .sort();

/* APP.JS eval()s the other modules. Terser will not mangle a scope containing direct eval
   unless told to, so prove first that no module can see an APP.JS local. */
const appLocals = new Set(
  bindings(fs.readFileSync(path.join(SRC, 'APP.JS'), 'utf8')).map(
    (b) => b.name,
  ),
);
const clash = [];
for (const f of files) {
  if (f === 'APP.JS') continue;
  const sm = scopes(parse(fs.readFileSync(path.join(SRC, f), 'utf8')));
  for (const r of sm.globalScope.through)
    if (appLocals.has(r.identifier.name))
      clash.push(f + ':' + r.identifier.name);
}
if (clash.length) {
  console.error(
    'eval safety failed — modules reference APP.JS locals:',
    [...new Set(clash)].join(' '),
  );
  process.exit(1);
}
console.log('eval safety: no module references an APP.JS local.\n');

let bad = 0,
  before = 0,
  after = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(SRC, f), 'utf8');
  const res = await minify(src, {
    ecma: 5,
    compress: false,
    mangle: { toplevel: false, eval: true },
    format: { comments: false, beautify: false },
  });
  if (res.error) {
    console.error('  !!', f, res.error);
    bad++;
    continue;
  }
  const header = (src.match(/^\/\/[^\n]*\n/) || [''])[0];
  const out = header + res.code + '\n';
  try {
    alphaEqual(src, out);
  } catch (e) {
    console.error('  !!', f, 'not an alpha-rename of its source —', e.message);
    bad++;
    continue;
  }
  fs.writeFileSync(path.join(OUT, f), out);
  before += src.length;
  after += out.length;
  console.log(
    `  OK  ${f.padEnd(15)} ${String(src.length).padStart(6)} -> ${String(out.length).padStart(6)}`,
  );
}
console.log(
  bad
    ? `\n${bad} failure(s)`
    : `\nAll ${files.length} modules verified. ${before} -> ${after} bytes on device.`,
);
process.exit(bad ? 1 : 0);
