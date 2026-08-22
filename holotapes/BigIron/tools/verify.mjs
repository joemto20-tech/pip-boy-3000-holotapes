import fs from 'fs';
import * as acorn from 'acorn';
import * as escope from 'eslint-scope';

// Parse permissively: prettier formats src/ with trailing commas (ES2017).
// Terser still EMITS ecma:5, so what reaches the device stays ES5.
export function parse(src) {
  return acorn.parse(src, { ecmaVersion: 2020, ranges: true, locations: true });
}
export function scopes(ast) {
  return escope.analyze(ast, {
    ecmaVersion: 2020,
    sourceType: 'script',
    ignoreEval: true,
  });
}
/** every local binding in the file, with its identifier ranges and use count */
export function bindings(src) {
  const ast = parse(src),
    sm = scopes(ast),
    out = [];
  for (const scope of sm.scopes) {
    if (scope.type === 'global') continue;
    for (const v of scope.variables) {
      if (v.name === 'arguments' && v.defs.length === 0) continue;
      const ranges = [];
      for (const d of v.defs) if (d.name) ranges.push(d.name.range);
      for (const r of v.references) ranges.push(r.identifier.range);
      const uniq = [
        ...new Map(ranges.map((r) => [r[0] + ':' + r[1], r])).values(),
      ];
      out.push({
        name: v.name,
        scope: scope.type,
        fn: scopeLabel(scope),
        uses: uniq.length,
        ranges: uniq,
      });
    }
  }
  return out;
}
function scopeLabel(scope) {
  const b = scope.block;
  if (b.type === 'FunctionDeclaration' && b.id) return b.id.name;
  if (b.type === 'FunctionExpression')
    return b.id ? b.id.name : '<anon@' + b.start + '>';
  return scope.type;
}
/** rename local bindings using map {scopeLabel: {old:new}} plus a file-wide fallback map */
export function rename(src, fileMap, scopeMap, fileName) {
  const all = bindings(src);
  const edits = [];
  const unmapped = new Map();
  for (const b of all) {
    const per =
      (scopeMap && (scopeMap[fileName + ':' + b.fn] || scopeMap[b.fn])) || {};
    const to = per[b.name] !== undefined ? per[b.name] : fileMap[b.name];
    if (to === undefined || to === null || to === b.name) {
      if (b.name.length <= 2)
        unmapped.set(
          b.name + ' @' + b.fn,
          (unmapped.get(b.name + ' @' + b.fn) || 0) + b.uses,
        );
      continue;
    }
    for (const r of b.ranges) edits.push([r[0], r[1], to]);
  }
  edits.sort((a, b) => b[0] - a[0]);
  let out = src;
  let last = Infinity;
  for (const [s, e, t] of edits) {
    if (e > last) throw new Error('overlapping edit at ' + s);
    out = out.slice(0, s) + t + out.slice(e);
    last = s;
  }
  return {
    code: out,
    unmapped: [...unmapped.entries()].sort((a, b) => b[1] - a[1]),
  };
}
/** Rigorous alpha-equivalence: identical AST shape and literals, and every identifier
    resolves to a binding that is in bijection with the other file's binding.
    Globals must match by name; locals may be renamed freely. */
export function alphaEqual(a, b) {
  const A = parse(a),
    B = parse(b);
  const ma = nodeToVar(A),
    mb = nodeToVar(B);
  const fwd = new Map(),
    rev = new Map();
  const skip = new Set(['start', 'end', 'range', 'loc', 'raw']);
  function fail(path, why) {
    throw new Error('MISMATCH at ' + path + ': ' + why);
  }
  function walk(x, y, path) {
    if (x === null || y === null) {
      if (x !== y) fail(path, 'null mismatch');
      return;
    }
    if (typeof x !== 'object') {
      if (x !== y)
        fail(path, `literal ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
      return;
    }
    if (Array.isArray(x)) {
      if (!Array.isArray(y) || x.length !== y.length)
        fail(path, 'array length ' + x.length + ' vs ' + (y && y.length));
      x.forEach((v, i) => walk(v, y[i], path + '[' + i + ']'));
      return;
    }
    if (x.type !== y.type) fail(path, `${x.type} vs ${y.type}`);
    if (x.type === 'MemberExpression') {
      walk(x.object, y.object, path + '.object');
      if (x.computed !== y.computed) fail(path, 'computed mismatch');
      if (!x.computed) {
        if (x.property.type !== y.property.type) fail(path, 'property type');
        if (x.property.type === 'Identifier') {
          if (x.property.name !== y.property.name)
            fail(path, `property .${x.property.name} vs .${y.property.name}`);
        } else walk(x.property, y.property, path + '.property');
      } else walk(x.property, y.property, path + '.property');
      return;
    }
    if (x.type === 'Property') {
      if (x.kind !== y.kind || x.computed !== y.computed)
        fail(path, 'property flags');
      if (
        !x.computed &&
        x.key.type === 'Identifier' &&
        y.key.type === 'Identifier'
      ) {
        if (x.key.name !== y.key.name)
          fail(path, `key ${x.key.name} vs ${y.key.name}`);
      } else walk(x.key, y.key, path + '.key');
      walk(x.value, y.value, path + '.value');
      return;
    }
    if (x.type === 'Identifier') {
      const va = ma.get(x.start),
        vb = mb.get(y.start);
      if (!va && !vb) {
        if (x.name !== y.name) fail(path, `global ${x.name} vs ${y.name}`);
        return;
      }
      if (!va || !vb)
        fail(path, `binding ${x.name}/${y.name}: one is global, one is local`);
      const p = fwd.get(va),
        q = rev.get(vb);
      if (p === undefined && q === undefined) {
        fwd.set(va, vb);
        rev.set(vb, va);
        return;
      }
      if (p !== vb || q !== va)
        fail(path, `${x.name}<->${y.name} breaks the binding bijection`);
      return;
    }
    const keys = [...new Set([...Object.keys(x), ...Object.keys(y)])]
      .filter((k) => !skip.has(k))
      .sort();
    for (const k of keys) walk(x[k], y[k], path + '.' + k);
  }
  walk(A, B, '');
  return true;
}
function nodeToVar(ast) {
  const sm = scopes(ast),
    m = new Map();
  for (const scope of sm.scopes) {
    for (const v of scope.variables) {
      for (const d of v.defs) if (d.name) m.set(d.name.start, v);
      for (const r of v.references) m.set(r.identifier.start, v);
    }
  }
  return m;
}
