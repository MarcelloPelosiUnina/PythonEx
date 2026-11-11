/* =========================================================
   Python guided lab — exercise engine + guided-step layout
   Exercise types: quiz, truefalse, classify, output, bug, fill, order
   ========================================================= */
const Engine = (() => {
  'use strict';
  const { el, rich, hl, renderCode, codeWithTools, consoleBox, store, shuffle } = App;

  const TYPE_LABEL = {
    quiz: 'Multiple choice',
    truefalse: 'True or false',
    classify: 'Classify',
    output: 'What does it print?',
    bug: 'Find the bug',
    fill: 'Complete the code',
    order: 'Put the lines in order'
  };

  const asArray = (v) => (Array.isArray(v) ? v : [v]);
  /* Python answers: spacing and quote style do not matter, letter case does */
  const normCode = (s) => String(s).replace(/\s+/g, '').replace(/'/g, '"');
  const normLine = (s) => String(s).trim().replace(/\s+/g, ' ').replace(/"/g, "'");

  /* ---------- handlers for each exercise type ---------- */
  const handlers = {

    quiz(ex, body) {
      let sel = -1;
      const wrap = el('div', { class: 'options', role: 'radiogroup' });
      const btns = ex.options.map((o, i) => {
        const b = el('button', { class: 'option', type: 'button', role: 'radio', 'aria-checked': 'false' },
          `<span class="letter">${'ABCDEFG'[i]}</span><span>${rich(o)}</span>`);
        b.addEventListener('click', () => {
          sel = i;
          btns.forEach((x, j) => {
            x.classList.toggle('sel', j === i);
            x.setAttribute('aria-checked', j === i ? 'true' : 'false');
            x.classList.remove('is-ok', 'is-bad');
          });
        });
        wrap.appendChild(b);
        return b;
      });
      body.appendChild(wrap);
      return {
        check() {
          if (sel < 0) return { empty: true, msg: 'Pick an answer first.' };
          const ok = sel === ex.answer;
          btns[sel].classList.add(ok ? 'is-ok' : 'is-bad');
          return { ok, msg: !ok && ex.why && ex.why[sel] ? rich(ex.why[sel]) : null };
        },
        reveal() {
          btns.forEach((b, j) => {
            b.classList.remove('sel', 'is-bad');
            b.classList.toggle('is-ok', j === ex.answer);
          });
        },
        lock() { btns.forEach((b) => { b.disabled = true; }); }
      };
    },

    truefalse(ex, body) {
      return handlers.classify({ ...ex, buckets: ['True', 'False'], items: ex.items.map((it) => ({ ...it, bucket: it.answer ? 0 : 1 })) }, body);
    },

    classify(ex, body) {
      const wide = ex.buckets.length > 3 || ex.buckets.some((b) => b.length > 16);
      const rows = el('div', { class: 'rows' + (wide ? ' wide' : '') });
      const items = ex.items.map((it) => {
        const row = el('div', { class: 'row' });
        row.innerHTML = `<div class="row-text">${rich(it.text)}</div>
          <div class="seg" role="group">${ex.buckets.map((b, i) => `<button type="button" data-i="${i}">${rich(b)}</button>`).join('')}</div>
          <div class="row-why"></div>`;
        const o = { it, row, val: null, bs: [...row.querySelectorAll('.seg button')] };
        o.bs.forEach((b) => b.addEventListener('click', () => {
          o.val = +b.dataset.i;
          o.bs.forEach((x) => x.classList.toggle('sel', x === b));
          row.classList.remove('is-ok', 'is-bad');
        }));
        rows.appendChild(row);
        return o;
      });
      body.appendChild(rows);
      const right = (o) => asArray(o.it.bucket).includes(o.val);
      return {
        check() {
          const missing = items.filter((o) => o.val === null).length;
          if (missing) return { empty: true, msg: `Answer every row first (${missing} missing).` };
          let good = 0;
          items.forEach((o) => {
            const ok = right(o);
            if (ok) good++;
            o.row.classList.toggle('is-ok', ok);
            o.row.classList.toggle('is-bad', !ok);
          });
          return { ok: good === items.length, msg: `${good} of ${items.length} correct: fix the rows in red.` };
        },
        reveal(fromSuccess) {
          items.forEach((o) => {
            const ans = asArray(o.it.bucket);
            if (!fromSuccess || !right(o)) o.val = ans[0];
            o.bs.forEach((b, i) => {
              b.classList.toggle('sel', i === o.val);
              b.classList.toggle('right-answer', ans.includes(i) && i !== o.val);
            });
            o.row.classList.remove('is-bad');
            o.row.classList.add('is-ok');
            if (o.it.why) o.row.querySelector('.row-why').innerHTML = rich(o.it.why);
          });
        },
        lock() { items.forEach((o) => o.bs.forEach((b) => { b.disabled = true; })); }
      };
    },

    output(ex, body, api) {
      const expected = ex.answer.replace(/\n$/, '');
      const lines = expected.split('\n').length;
      const con = el('div', { class: 'console' });
      con.innerHTML = '<div class="console-head">Program output</div>';
      const ta = el('textarea', {
        rows: Math.max(2, lines + 1), spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
        'aria-label': 'Expected output', placeholder: 'One line per print()… (Ctrl+Enter to check)'
      });
      ta.addEventListener('input', () => con.classList.remove('is-ok', 'is-bad'));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) api.submit(); });
      con.appendChild(ta);
      body.appendChild(con);
      const toLines = (s) => s.replace(/\r/g, '').split('\n').map(normLine).filter((l) => l !== '');
      const want = toLines(expected);
      const accepted = [want, ...(ex.accept || []).map(toLines)];
      return {
        check() {
          const got = toLines(ta.value);
          if (!got.length) return { empty: true, msg: 'Write the output before checking.' };
          const ok = accepted.some((a) => a.length === got.length && a.every((l, i) => l === got[i]));
          con.classList.toggle('is-ok', ok);
          con.classList.toggle('is-bad', !ok);
          if (ok) return { ok };
          if (got.length !== want.length) {
            return { ok, msg: `The program prints ${want.length} ${want.length === 1 ? 'line' : 'lines'}, you wrote ${got.length}.` };
          }
          const k = want.findIndex((l, i) => l !== got[i]);
          return { ok, msg: `Line ${k + 1} of the output is not right.` };
        },
        reveal(fromSuccess) {
          if (!fromSuccess && !ta.value.trim()) ta.value = expected;
          con.classList.remove('is-bad');
          con.classList.add('is-ok');
          if (!fromSuccess && !con.querySelector('.expected')) {
            con.appendChild(el('div', { class: 'expected', text: expected }));
          }
        },
        lock() { ta.readOnly = true; }
      };
    },

    bug(ex, body) {
      const code = renderCode(ex.code, { clickable: true });
      const lines = [...code.querySelectorAll('.code-line')];
      const bugs = new Set(ex.bugs);
      const sel = new Set();
      let locked = false;
      lines.forEach((l) => {
        const n = +l.dataset.line;
        l.tabIndex = 0;
        l.setAttribute('role', 'button');
        l.setAttribute('aria-pressed', 'false');
        const toggle = () => {
          if (locked) return;
          if (sel.has(n)) sel.delete(n); else sel.add(n);
          l.classList.toggle('sel', sel.has(n));
          l.setAttribute('aria-pressed', String(sel.has(n)));
          lines.forEach((x) => x.classList.remove('is-ok', 'is-bad'));
        };
        l.addEventListener('click', toggle);
        l.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      });
      body.appendChild(code);
      return {
        check() {
          if (!sel.size) return { empty: true, msg: 'Click the lines that contain a bug.' };
          let found = 0;
          lines.forEach((l) => {
            const n = +l.dataset.line;
            l.classList.remove('is-ok', 'is-bad');
            if (sel.has(n)) {
              l.classList.add(bugs.has(n) ? 'is-ok' : 'is-bad');
              if (bugs.has(n)) found++;
            }
          });
          const extra = sel.size - found;
          const ok = found === bugs.size && extra === 0;
          let msg = `Buggy lines found: ${found} of ${bugs.size}.`;
          if (extra) msg += ` ${extra === 1 ? 'One selected line is' : extra + ' selected lines are'} actually fine (in red).`;
          return { ok, msg };
        },
        reveal() {
          lines.forEach((l) => {
            const n = +l.dataset.line;
            l.classList.remove('sel', 'is-bad');
            l.classList.toggle('is-ok', bugs.has(n));
            const note = ex.notes && ex.notes[n];
            if (note && !(l.nextElementSibling && l.nextElementSibling.classList.contains('code-note'))) {
              l.after(el('div', { class: 'code-note' }, rich(note)));
            }
          });
        },
        lock() {
          locked = true;
          code.classList.add('locked');
          lines.forEach((l) => { l.tabIndex = -1; l.removeAttribute('role'); });
        }
      };
    },

    fill(ex, body, api) {
      const box = el('div', { class: 'code' });
      const answers = [];
      ex.code.replace(/\n$/, '').split('\n').forEach((line, i) => {
        const row = el('div', { class: 'code-line' });
        row.appendChild(el('span', { class: 'ln', text: String(i + 1) }));
        const parts = line.split(/\{\{(.+?)\}\}/);
        let html = '';
        parts.forEach((p, k) => {
          if (k % 2 === 0) { html += hl(p); return; }
          const alts = p.split('|');
          const w = Math.max(3, ...alts.map((a) => a.length)) + 2;
          html += `<input class="blank" data-k="${answers.length}" style="width:${w}ch" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="Blank ${answers.length + 1}">`;
          answers.push(alts);
        });
        row.appendChild(el('span', { class: 'src' }, html || ' '));
        box.appendChild(row);
      });
      body.appendChild(box);
      const inputs = [...box.querySelectorAll('.blank')];
      inputs.forEach((inp) => {
        inp.addEventListener('input', () => inp.classList.remove('is-ok', 'is-bad'));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') api.submit(); });
      });
      const isRight = (inp) => answers[+inp.dataset.k].some((a) => normCode(a) === normCode(inp.value));
      return {
        check() {
          const missing = inputs.filter((i) => !i.value.trim()).length;
          if (missing) return { empty: true, msg: `Fill every blank first (${missing} missing).` };
          let good = 0;
          inputs.forEach((inp) => {
            const ok = isRight(inp);
            if (ok) good++;
            inp.classList.toggle('is-ok', ok);
            inp.classList.toggle('is-bad', !ok);
          });
          return { ok: good === inputs.length, msg: `${good} of ${inputs.length} blanks correct. Remember: Python is case-sensitive.` };
        },
        reveal(fromSuccess) {
          inputs.forEach((inp) => {
            if (!fromSuccess || !isRight(inp)) inp.value = answers[+inp.dataset.k][0];
            inp.classList.remove('is-bad');
            inp.classList.add('is-ok');
          });
        },
        lock() { inputs.forEach((i) => { i.readOnly = true; }); }
      };
    },

    order(ex, body) {
      const n = ex.lines.length;
      const group = new Array(n).fill(-1);
      (ex.swap || []).forEach((g, gi) => g.forEach((idx) => { group[idx] = gi; }));
      const fits = (pos, idx) => idx === pos || (group[idx] !== -1 && group[idx] === group[pos]);
      const isSolved = (arr) => arr.every((idx, pos) => fits(pos, idx));

      let start = shuffle([...Array(n).keys()]);
      for (let t = 0; t < 20 && isSolved(start); t++) start = shuffle(start);

      const list = el('ol', { class: 'order-list', 'aria-label': 'Lines to reorder' });
      const clearMarks = () => [...list.children].forEach((li) => li.classList.remove('is-ok', 'is-bad'));
      let locked = false;

      start.forEach((idx) => {
        const li = el('li', { class: 'order-item', 'data-idx': idx });
        li.innerHTML = `<span class="handle" title="Drag" aria-hidden="true">≡</span>
          <span class="src">${hl(ex.lines[idx]) || ' '}</span>
          <span class="moves"><button type="button" data-d="-1" aria-label="Move up">↑</button><button type="button" data-d="1" aria-label="Move down">↓</button></span>`;
        li.querySelectorAll('.moves button').forEach((b) => b.addEventListener('click', () => {
          if (locked) return;
          if (b.dataset.d === '-1' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
          if (b.dataset.d === '1' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
          clearMarks();
          b.focus();
        }));

        // drag with mouse, pen or finger (works on interactive whiteboards too)
        const handle = li.querySelector('.handle');
        let startY = 0;
        let dragging = false;
        handle.addEventListener('pointerdown', (e) => {
          if (locked) return;
          e.preventDefault();
          dragging = true;
          startY = e.clientY;
          handle.setPointerCapture(e.pointerId);
          li.classList.add('dragging');
          clearMarks();
        });
        handle.addEventListener('pointermove', (e) => {
          if (!dragging) return;
          const gap = parseFloat(getComputedStyle(list).rowGap) || 6;
          const next = li.nextElementSibling;
          const prev = li.previousElementSibling;
          if (next) {
            const r = next.getBoundingClientRect();
            if (e.clientY > r.top + r.height / 2) { list.insertBefore(next, li); startY += r.height + gap; }
          }
          if (prev) {
            const r = prev.getBoundingClientRect();
            if (e.clientY < r.top + r.height / 2) { list.insertBefore(li, prev); startY -= r.height + gap; }
          }
          li.style.transform = `translateY(${e.clientY - startY}px)`;
        });
        const end = () => { dragging = false; li.style.transform = ''; li.classList.remove('dragging'); };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
        list.appendChild(li);
      });
      body.appendChild(list);

      const current = () => [...list.children].map((li) => +li.dataset.idx);
      return {
        check() {
          const cur = current();
          let good = 0;
          [...list.children].forEach((li, pos) => {
            const ok = fits(pos, cur[pos]);
            if (ok) good++;
            li.classList.toggle('is-ok', ok);
            li.classList.toggle('is-bad', !ok);
          });
          return { ok: good === n, msg: good === 1 ? `Only 1 of ${n} lines is in the right place.` : `${good} of ${n} lines are in the right place.` };
        },
        reveal(fromSuccess) {
          if (!fromSuccess) {
            const byIdx = {};
            [...list.children].forEach((li) => { byIdx[li.dataset.idx] = li; });
            for (let i = 0; i < n; i++) list.appendChild(byIdx[i]);
          }
          [...list.children].forEach((li) => { li.classList.remove('is-bad'); li.classList.add('is-ok'); });
        },
        lock() { locked = true; list.classList.add('locked'); }
      };
    }
  };

  /* ---------- one exercise card ---------- */
  function buildCard(ex, label, s, onChange) {
    const isDone = () => s.status === 'correct' || s.status === 'revealed';
    const card = el('article', { class: 'ex', id: 'ex-' + ex.id });
    card.innerHTML = `
      <header class="ex-head">
        <h3><span class="ex-num">${label}</span> ${rich(ex.title)}</h3>
        <span class="ex-type">${TYPE_LABEL[ex.type]}</span>
      </header>
      <div class="ex-prompt">${rich(ex.prompt)}</div>`;
    const body = el('div', { class: 'ex-body' });
    if (ex.code && ex.type !== 'bug' && ex.type !== 'fill') body.appendChild(renderCode(ex.code, { title: ex.codeTitle }));
    card.appendChild(body);

    const actions = el('div', { class: 'ex-actions' });
    const bCheck = el('button', { class: 'btn btn-primary', type: 'button' }, 'Check');
    const bHint = ex.hint ? el('button', { class: 'btn', type: 'button' }, 'Hint') : null;
    const bReveal = el('button', { class: 'btn btn-ghost', type: 'button', disabled: true, title: 'Available after your first check' }, 'Show solution');
    actions.append(bCheck);
    if (bHint) actions.append(bHint);
    actions.append(el('span', { class: 'spacer' }), bReveal);
    card.appendChild(actions);

    const feedback = el('div', { class: 'ex-feedback', role: 'status', 'aria-live': 'polite' });
    card.appendChild(feedback);
    const hintBox = el('div', { class: 'ex-hint', hidden: true }, rich(ex.hint || ''));
    card.appendChild(hintBox);
    const explain = el('div', { class: 'ex-explain', hidden: true }, rich(ex.explain || ''));
    card.appendChild(explain);

    const api = { submit: () => bCheck.click() };
    const h = handlers[ex.type](ex, body, api);

    const say = (cls, html) => { feedback.className = 'ex-feedback ' + cls; feedback.innerHTML = html; };
    const finish = () => {
      h.lock();
      bCheck.disabled = true;
      bReveal.disabled = true;
      if (bHint) bHint.disabled = true;
      if (ex.explain) explain.hidden = false;
      card.dataset.status = s.status;
    };

    bCheck.addEventListener('click', () => {
      const r = h.check();
      if (r.empty) { say('info', r.msg); return; }
      s.attempts++;
      if (r.ok) {
        s.status = 'correct';
        h.reveal(true);
        say('ok', 'Correct.');
        finish();
      } else {
        s.status = 'tried';
        card.dataset.status = 'tried';
        say('bad', r.msg ? `Not quite. ${r.msg}` : 'Not quite.');
        bReveal.disabled = false;
        bReveal.removeAttribute('title');
      }
      onChange(true);
    });

    if (bHint) {
      bHint.addEventListener('click', () => {
        hintBox.hidden = false;
        bHint.disabled = true;
        s.hint = true;
        onChange(false);
      });
    }

    bReveal.addEventListener('click', () => {
      s.status = 'revealed';
      h.reveal(false);
      say('info', 'Solution shown.');
      finish();
      onChange(true);
    });

    /* restore saved state */
    if (isDone()) {
      h.reveal(false);
      say(s.status === 'correct' ? 'ok' : 'info', s.status === 'correct' ? 'Correct.' : 'Solution shown.');
      finish();
    } else if (s.status === 'tried') {
      card.dataset.status = 'tried';
      bReveal.disabled = false;
      bReveal.removeAttribute('title');
    }
    if (s.hint && bHint) { hintBox.hidden = false; bHint.disabled = true; }
    return card;
  }

  const LOCK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  /* ---------- guided session: steps, checkpoints, final solution ---------- */
  function guide(cfg) {
    const data = cfg.data;
    const KEY = 'py-guide-' + data.key;
    const saved = store.get(KEY, {});
    const state = {
      ex: saved.ex || {},
      open: saved.open || {},   // steps unlocked by hand
      cp: saved.cp || {}        // checkpoints opened by hand
    };
    const save = () => store.set(KEY, state);
    const st = (id) => (state.ex[id] = state.ex[id] || { attempts: 0, status: null });
    const isDone = (s) => s.status === 'correct' || s.status === 'revealed';
    const steps = data.steps;
    const stepDone = (k) => steps[k].exercises.every((ex) => isDone(st(ex.id)));
    const stepCount = (k) => steps[k].exercises.filter((ex) => isDone(st(ex.id))).length;
    const allDone = () => steps.every((_, k) => stepDone(k));
    const isUnlocked = (k) => k === 0 || stepDone(k - 1) || !!state.open[k]
      || steps[k].exercises.some((ex) => st(ex.id).status);

    const ui = [];  // per step: { section, checkpoint }
    let finalUi = null;

    /* stepper */
    const stepper = cfg.stepper;
    stepper.innerHTML = '<div class="stepper-inner"></div><div class="bar"><span></span></div>';
    const pillsBox = stepper.querySelector('.stepper-inner');
    const pills = steps.map((s, k) => {
      const a = el('a', { class: 'pill', href: '#step-' + (k + 1) },
        `<span class="dot">${k + 1}</span><span class="lbl">${s.short}</span> <span class="cnt"></span>`);
      pillsBox.appendChild(a);
      return a;
    });
    const finalPill = el('a', { class: 'pill', href: '#solution' }, '<span class="dot">✓</span><span class="lbl">Full solution</span>');
    pillsBox.appendChild(finalPill);
    const reset = el('button', { class: 'btn btn-sm btn-ghost reset', type: 'button' }, 'Clear answers');
    reset.addEventListener('click', () => {
      if (confirm('Clear all your answers for this exercise?')) { store.del(KEY); location.reload(); }
    });
    pillsBox.appendChild(reset);
    const bar = stepper.querySelector('.bar span');

    /* steps */
    let cumulative = '';
    steps.forEach((step, k) => {
      const section = el('section', { class: 'step', id: 'step-' + (k + 1) });
      section.innerHTML = `
        <header class="step-head">
          <p class="eyebrow">Step ${k + 1} of ${steps.length}</p>
          <h2>${rich(step.title)}</h2>
          <div class="chips">${step.tags.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
        </header>`;

      const lock = el('div', { class: 'step-lock' },
        `${LOCK_ICON}<p>This step unlocks when you finish Step ${k}. Working in order is recommended, because each step uses the variables created in the previous one.</p>`);
      const openBtn = el('button', { class: 'btn btn-sm', type: 'button' }, 'Open anyway');
      openBtn.addEventListener('click', () => { state.open[k] = true; save(); refresh(false); });
      lock.appendChild(openBtn);
      section.appendChild(lock);

      const bodyEl = el('div', { class: 'step-body' });
      bodyEl.appendChild(el('p', { class: 'step-goal' }, rich(step.goal)));

      const tasks = el('details', { class: 'tasks', open: true });
      tasks.innerHTML = `<summary>What you have to do</summary><ol>${step.tasks.map((t) => `<li>${rich(t)}</li>`).join('')}</ol>`;
      bodyEl.appendChild(tasks);

      if (step.tips && step.tips.length) {
        const th = el('details', { class: 'theory' });
        th.innerHTML = `<summary>Tools you need for this step</summary><div class="theory-body"><div class="theory-grid">${
          step.tips.map((t) => `<div class="theory-tip"><strong>${rich(t.title)}</strong>${rich(t.text)}</div>`).join('')}</div></div>`;
        if (step.tipCode) th.querySelector('.theory-body').appendChild(renderCode(step.tipCode, { title: 'Example' }));
        bodyEl.appendChild(th);
      }

      const list = el('div', { class: 'ex-list' });
      step.exercises.forEach((ex, i) => {
        list.appendChild(buildCard(ex, `${k + 1}.${i + 1}`, st(ex.id), (graded) => {
          save();
          refresh(graded);
        }));
      });
      bodyEl.appendChild(list);

      /* checkpoint */
      const cpData = step.checkpoint;
      const fullSoFar = (cumulative ? cumulative + '\n\n' : '') + cpData.code;
      const startLine = cumulative ? cumulative.split('\n').length + 2 : 1;
      const cp = el('div', { class: 'checkpoint is-closed', id: 'checkpoint-' + (k + 1) });
      cp.innerHTML = `
        <div class="checkpoint-head">
          <span class="flag">Checkpoint ${k + 1}</span>
          <h3>Your program after Step ${k + 1}</h3>
          <p>${rich(cpData.intro || 'Compare this with your own code, then run it with the check lines to make sure you get the same output.')}</p>
        </div>`;
      const wait = el('div', { class: 'checkpoint-wait' }, '<p>The checkpoint opens when every exercise of this step is done.</p>');
      const showBtn = el('button', { class: 'btn btn-sm', type: 'button' }, 'Show it now');
      showBtn.addEventListener('click', () => { state.cp[k] = true; save(); refresh(false); });
      wait.appendChild(showBtn);
      cp.appendChild(wait);

      const cpBody = el('div', { class: 'checkpoint-body' });
      cpBody.appendChild(codeWithTools(cpData.code, {
        label: k === 0 ? 'Code for this step' : `New code for Step ${k + 1} (add it below Step ${k})`,
        start: startLine
      }));
      if (k > 0) {
        const soFar = el('details', { class: 'so-far' });
        soFar.innerHTML = '<summary>Show the whole program up to here</summary>';
        soFar.appendChild(codeWithTools(fullSoFar, { label: `Steps 1–${k + 1} together` }));
        cpBody.appendChild(soFar);
      }
      cpBody.appendChild(codeWithTools(cpData.check, { label: 'Temporary check lines: add them at the bottom and run' }));
      const outHead = el('div', { class: 'code-tools' }, '<span class="label">Expected output</span>');
      cpBody.appendChild(outHead);
      cpBody.appendChild(consoleBox(cpData.output, 'python ' + data.file));
      if (cpData.note) cpBody.appendChild(el('p', { class: 'note' }, rich(cpData.note)));
      cp.appendChild(cpBody);
      bodyEl.appendChild(cp);

      section.appendChild(bodyEl);
      cfg.root.appendChild(section);
      ui.push({ section, cp });
      cumulative = fullSoFar;
    });

    /* final solution */
    const fin = el('section', { class: 'final', id: 'solution' });
    fin.innerHTML = `
      <header class="final-head">
        <p class="eyebrow">Wrap-up</p>
        <h2>Full reference solution</h2>
      </header>`;
    const finLock = el('div', { class: 'step-lock' }, `${LOCK_ICON}<p>The complete solution unlocks when all four steps are done.</p>`);
    const finOpen = el('button', { class: 'btn btn-sm', type: 'button' }, 'Open anyway');
    finOpen.addEventListener('click', () => { state.open.final = true; save(); refresh(false); });
    finLock.appendChild(finOpen);
    fin.appendChild(finLock);
    const finBody = el('div', { class: 'step-body' });
    finBody.appendChild(el('p', { class: 'step-goal' }, rich(data.wrapUp)));
    finBody.appendChild(codeWithTools(data.solution, { label: data.file, filename: data.file }));

    const run = el('div', { class: 'card run-box' });
    run.innerHTML = `<h3>Run it on your computer</h3><ol>
      <li>Install the libraries once: <code>pip install numpy pandas</code></li>
      <li>Save the code above as <code>${data.file}</code> (or press <b>Download .py</b>).</li>
      <li>Open a terminal in that folder and run <code>python ${data.file}</code></li>
      <li>The script prints the summary below and creates the files listed underneath in the same folder.</li></ol>`;
    finBody.appendChild(run);
    finBody.appendChild(el('div', { class: 'code-tools' }, '<span class="label">Console output</span>'));
    finBody.appendChild(consoleBox(data.finalOutput, 'python ' + data.file));
    finBody.appendChild(el('div', { class: 'code-tools' }, '<span class="label">Files created by the script</span>'));
    data.files.forEach((f) => {
      const d = el('details', { class: 'reveal-block file' });
      d.innerHTML = `<summary>${App.esc(f.name)}</summary>`;
      const inner = el('div', { class: 'inner' });
      inner.appendChild(consoleBox(f.content, f.name));
      d.appendChild(inner);
      finBody.appendChild(d);
    });
    if (cfg.next) {
      finBody.appendChild(el('div', { class: 'next-link' },
        `<p>${cfg.next.text}</p><a class="btn btn-primary" href="${cfg.next.href}">${cfg.next.label} →</a>`));
    }
    fin.appendChild(finBody);
    cfg.root.appendChild(fin);
    finalUi = fin;

    /* ---------- refresh: locks, checkpoints, stepper ---------- */
    function refresh(justGraded) {
      let current = -1;
      let doneTotal = 0;
      let total = 0;
      steps.forEach((step, k) => {
        const unlocked = isUnlocked(k);
        const done = stepDone(k);
        const n = stepCount(k);
        doneTotal += n;
        total += step.exercises.length;
        ui[k].section.classList.toggle('is-locked', !unlocked);
        ui[k].cp.classList.toggle('is-closed', !(done || state.cp[k]));
        pills[k].classList.toggle('done', done);
        pills[k].classList.toggle('locked', !unlocked);
        pills[k].querySelector('.cnt').textContent = `${n}/${step.exercises.length}`;
        if (current < 0 && !done) current = k;
      });
      pills.forEach((p, k) => p.classList.toggle('current', k === current));
      const finOpenNow = allDone() || !!state.open.final;
      finalUi.classList.toggle('is-locked', !finOpenNow);
      finalPill.classList.toggle('done', allDone());
      finalPill.classList.toggle('locked', !finOpenNow);
      bar.style.width = (total ? (100 * doneTotal / total) : 0) + '%';

      /* a step has just been completed: bring its checkpoint into view */
      if (justGraded) {
        const k = steps.findIndex((_, i) => stepDone(i) && !ui[i].cp.dataset.shown);
        if (k >= 0) {
          ui[k].cp.dataset.shown = '1';
          setTimeout(() => ui[k].cp.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
        }
      }
      steps.forEach((_, i) => { if (stepDone(i)) ui[i].cp.dataset.shown = '1'; });
    }

    refresh(false);
    return { refresh };
  }

  /* progress summary used by the home page */
  function progress(data) {
    const saved = store.get('py-guide-' + data.key, {});
    const ex = saved.ex || {};
    let done = 0, total = 0;
    data.steps.forEach((s) => s.exercises.forEach((e) => {
      total++;
      const x = ex[e.id];
      if (x && (x.status === 'correct' || x.status === 'revealed')) done++;
    }));
    return { done, total };
  }

  return { guide, progress, handlers };
})();
