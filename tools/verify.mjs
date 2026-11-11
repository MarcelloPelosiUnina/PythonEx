// Checks every answer in js/data-ex*.js against real Python.
//
//   node tools/verify.mjs                  run all checks
//   node tools/verify.mjs --print          also show the actual output of each run
//   node tools/verify.mjs --write          also (re)write solutions/*.py from the data files
//
// Needs Python 3 with numpy and pandas (set PYTHON=... to choose the interpreter).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PY = process.env.PYTHON || 'python';
const PRINT = process.argv.includes('--print');
const WRITE = process.argv.includes('--write');
const PRELUDE = 'import numpy as np\nimport pandas as pd\n';

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter((n) => /^data-.*\.js$/.test(n)).sort()) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), sandbox, { filename: f });
}

let failures = 0;
let checks = 0;
const ok = (msg) => { checks++; console.log('  ok    ' + msg); };
const bad = (msg, detail) => { checks++; failures++; console.log('  FAIL  ' + msg); if (detail) console.log(detail.replace(/^/gm, '        ')); };

const tidy = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
const normCode = (s) => String(s).replace(/\s+/g, '').replace(/'/g, '"');
const normOut = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.trim().replace(/\s+/g, ' ').replace(/"/g, "'")).filter(Boolean).join('\n');

function runPython(code, dir) {
  const file = path.join(dir, 'snippet.py');
  fs.writeFileSync(file, code, 'utf8');
  const r = spawnSync(PY, ['-I', file], { cwd: dir, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (r.error) throw r.error;
  return { out: r.stdout || '', err: r.stderr || '', code: r.status };
}

function diff(want, got) {
  const a = want.split('\n'), b = got.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return `first difference at line ${i + 1}\n  expected: ${JSON.stringify(a[i])}\n  actual:   ${JSON.stringify(b[i])}`;
  }
  return '';
}

for (const [name, data] of Object.entries(sandbox.window)) {
  console.log(`\n=== ${name} (${data.file}) ===`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pyguide-'));
  const ids = new Set();
  let cumulative = '';

  data.steps.forEach((step, k) => {
    console.log(`Step ${k + 1}: ${step.title}`);
    const before = cumulative;
    cumulative = (cumulative ? cumulative + '\n\n' : '') + step.checkpoint.code;
    const cumN = normCode(cumulative);

    // checkpoint: steps 1..k + check lines
    const r = runPython(cumulative + '\n\n' + step.checkpoint.check + '\n', dir);
    if (r.code !== 0) bad(`checkpoint ${k + 1} crashed`, r.err);
    else {
      const got = tidy(r.out), want = tidy(step.checkpoint.output);
      if (PRINT) console.log(got.replace(/^/gm, '        | '));
      if (got === want) ok(`checkpoint ${k + 1} output`);
      else bad(`checkpoint ${k + 1} output differs`, diff(want, got));
    }

    step.exercises.forEach((ex) => {
      const label = `${ex.id} (${ex.type})`;
      if (ids.has(ex.id)) bad(`${label}: duplicate id`);
      ids.add(ex.id);

      if (ex.type === 'output') {
        const setup = ex.context === 'previous' ? before + '\n\n' : PRELUDE;
        const r2 = runPython(setup + ex.code + '\n', dir);
        if (r2.code !== 0) { bad(`${label} crashed`, r2.err); return; }
        if (PRINT) console.log(tidy(r2.out).replace(/^/gm, '        | '));
        if (normOut(r2.out) === normOut(ex.answer)) ok(`${label} answer`);
        else bad(`${label} answer differs`, diff(normOut(ex.answer), normOut(r2.out)));
      }

      if (ex.type === 'fill') {
        const filled = ex.code.replace(/\{\{(.+?)\}\}/g, (_, alts) => alts.split('|')[0]);
        if (cumN.includes(normCode(filled))) ok(`${label} first answers match the step code`);
        else bad(`${label} filled code not found in the step code`, filled);
        // every blank must also compile once filled
        const c = runPython(`import ast, textwrap\nast.parse(textwrap.dedent(${JSON.stringify(filled)}))\n`, dir);
        if (c.code !== 0) bad(`${label} filled code is not valid Python`, c.err);
      }

      if (ex.type === 'order') {
        const joined = ex.lines.join('\n');
        if (cumN.includes(normCode(joined))) ok(`${label} correct order matches the step code`);
        else bad(`${label} correct order not found in the step code`, joined);
      }

      if (ex.type === 'quiz' && !(ex.answer >= 0 && ex.answer < ex.options.length)) bad(`${label}: answer index out of range`);
      if (ex.type === 'bug') {
        const n = ex.code.split('\n').length;
        if (ex.bugs.some((b) => b < 1 || b > n)) bad(`${label}: bug line out of range`);
      }
    });
  });

  // full solution
  if (data.solution !== cumulative) bad('solution is not the concatenation of the step codes');
  for (const f of data.files) { try { fs.unlinkSync(path.join(dir, f.name)); } catch (e) { /* not there */ } }
  const r = runPython(data.solution + '\n', dir);
  if (r.code !== 0) bad('full solution crashed', r.err);
  else {
    if (tidy(r.out) === tidy(data.finalOutput)) ok('full solution console output');
    else bad('full solution console output differs', diff(tidy(data.finalOutput), tidy(r.out)));
    for (const f of data.files) {
      const p = path.join(dir, f.name);
      if (!fs.existsSync(p)) { bad(`file ${f.name} was not created`); continue; }
      const got = tidy(fs.readFileSync(p, 'utf8'));
      if (got === tidy(f.content)) ok(`file ${f.name}`);
      else bad(`file ${f.name} differs`, diff(tidy(f.content), got));
    }
  }

  if (WRITE) {
    const outDir = path.join(ROOT, 'solutions');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, data.file), data.solution + '\n', 'utf8');
    console.log(`  wrote solutions/${data.file}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
