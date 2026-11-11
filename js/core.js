/* =========================================================
   Python guided lab — shared helpers for every page
   (local storage, Python highlighter, top bar, theme, copy)
   ========================================================= */
const App = (() => {
  'use strict';

  /* ---------- local storage (survives if storage is blocked) ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    raw(key, value) {
      try {
        if (value === undefined) return localStorage.getItem(key);
        localStorage.setItem(key, value);
      } catch (e) { return null; }
    },
    del(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
  };

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* ---------- Python syntax highlighter ---------- */
  const KW = new Set(['import', 'from', 'as', 'for', 'in', 'if', 'elif', 'else', 'with', 'def',
    'return', 'continue', 'break', 'not', 'and', 'or', 'is', 'while', 'lambda', 'pass', 'class',
    'try', 'except', 'finally', 'raise', 'del', 'global', 'yield']);
  const BUILTINS = new Set(['print', 'len', 'float', 'int', 'str', 'bool', 'open', 'enumerate',
    'range', 'round', 'sum', 'min', 'max', 'list', 'dict', 'tuple', 'set', 'type', 'sorted', 'zip']);
  const LITS = new Set(['True', 'False', 'None']);
  const MODULES = new Set(['np', 'pd', 'numpy', 'pandas']);
  const TOKEN = /(#.*$)|((?:\b[fFrRbB]{1,2})?"(?:\\.|[^"\\])*"|(?:\b[fFrRbB]{1,2})?'(?:\\.|[^'\\])*')|(\b\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?\b|\.\d+\b)|([A-Za-z_][\w]*)/gm;

  function hl(src) {
    let out = '';
    let last = 0;
    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      const t = m[0];
      let cls = null;
      if (m[1]) cls = 'com';
      else if (m[2]) cls = 'str';
      else if (m[3]) cls = 'num';
      else if (m[4]) {
        if (KW.has(t)) cls = 'kw';
        else if (LITS.has(t)) cls = 'lit';
        else if (BUILTINS.has(t)) cls = 'type';
        else if (MODULES.has(t)) cls = 'cls';
        else if (/^\s*\(/.test(src.slice(TOKEN.lastIndex))) cls = 'fn';
      }
      out += cls ? `<span class="tok-${cls}">${esc(t)}</span>` : esc(t);
      last = TOKEN.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  /* Text with `inline code` between backticks → highlighted <code> */
  const rich = (s) => String(s || '').replace(/`([^`]+)`/g, (_, c) => `<code>${hl(c)}</code>`);

  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  /* Code block with line numbers */
  function renderCode(code, opts = {}) {
    const box = el('div', { class: 'code' + (opts.clickable ? ' clickable' : '') });
    if (opts.title) box.appendChild(el('div', { class: 'code-title', text: opts.title }));
    const start = opts.start || 1;
    code.replace(/\n$/, '').split('\n').forEach((line, i) => {
      const row = el('div', { class: 'code-line', 'data-line': i + 1 });
      row.appendChild(el('span', { class: 'ln', text: opts.noNumbers ? '' : String(i + start) }));
      row.appendChild(el('span', { class: 'src' }, line ? hl(line) : ' '));
      box.appendChild(row);
    });
    return box;
  }

  /* ---------- copy to clipboard and download ---------- */
  function copyText(text, btn) {
    const done = () => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = old; }, 1400);
    };
    const fallback = () => {
      const ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0', 'aria-hidden': 'true' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* Toolbar + code block: label on the left, Copy (and optional Download) on the right */
  function codeWithTools(code, opts = {}) {
    const frag = document.createDocumentFragment();
    const tools = el('div', { class: 'code-tools' });
    if (opts.label) tools.appendChild(el('span', { class: 'label' }, opts.label));
    const copy = el('button', { class: 'btn btn-sm', type: 'button' }, 'Copy');
    copy.addEventListener('click', () => copyText(code, copy));
    tools.appendChild(copy);
    if (opts.filename) {
      const dl = el('button', { class: 'btn btn-sm', type: 'button' }, 'Download .py');
      dl.addEventListener('click', () => download(opts.filename, code.replace(/\n?$/, '\n')));
      tools.appendChild(dl);
    }
    frag.appendChild(tools);
    frag.appendChild(renderCode(code, { title: opts.title, start: opts.start }));
    return frag;
  }

  /* Read-only console showing program output */
  function consoleBox(text, head) {
    const con = el('div', { class: 'console' });
    con.appendChild(el('div', { class: 'console-head', text: head || 'Output' }));
    con.appendChild(el('pre', { class: 'out', text: text.replace(/\n+$/, '') }));
    return con;
  }

  /* ---------- theme and text size ---------- */
  const root = document.documentElement;
  const SCALES = [0.9, 1, 1.15, 1.3, 1.5];

  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.raw('py-theme', next);
  }
  function stepScale(dir) {
    const cur = parseFloat(getComputedStyle(root).getPropertyValue('--scale')) || 1;
    let idx = SCALES.findIndex((s) => Math.abs(s - cur) < 0.01);
    if (idx < 0) idx = 1;
    idx = Math.max(0, Math.min(SCALES.length - 1, idx + dir));
    root.style.setProperty('--scale', SCALES[idx]);
    store.raw('py-scale', String(SCALES[idx]));
    syncTopbarHeight();
  }

  /* ---------- top bar (same on every page) ---------- */
  const PAGES = [
    { id: 'home', href: 'index.html', label: 'Index' },
    { id: 'ex3', href: 'exercise3.html', label: 'Ex 3 · Weather pipeline' },
    { id: 'ex4', href: 'exercise4.html', label: 'Ex 4 · E-commerce system' }
  ];

  function syncTopbarHeight() {
    const header = document.querySelector('header.topbar');
    if (header) root.style.setProperty('--topbar-h', header.offsetHeight + 'px');
  }

  function chrome() {
    const header = document.querySelector('header.topbar');
    if (!header) return;
    const current = header.dataset.page;
    header.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html">Python guided lab</a>
        <nav class="nav" aria-label="Sections">
          ${PAGES.map((p) => `<a href="${p.href}"${p.id === current ? ' aria-current="page"' : ''}>${p.label}</a>`).join('')}
        </nav>
        <div class="tools"></div>
      </div>`;
    const tools = header.querySelector('.tools');
    const mk = (label, title, fn) => {
      const b = el('button', { class: 'icon-btn', type: 'button', title, 'aria-label': title }, label);
      b.addEventListener('click', fn);
      tools.appendChild(b);
    };
    mk('A−', 'Smaller text', () => stepScale(-1));
    mk('A+', 'Larger text', () => stepScale(1));
    mk('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
      'Light/dark theme', toggleTheme);
    syncTopbarHeight();
    window.addEventListener('resize', syncTopbarHeight);
  }

  /* <pre data-py> written in the HTML → highlighted blocks */
  function upgradeCode() {
    document.querySelectorAll('pre[data-py]').forEach((pre) => {
      const code = pre.textContent.replace(/^\n/, '');
      if (pre.hasAttribute('data-copy')) {
        const wrap = el('div');
        wrap.appendChild(codeWithTools(code, { label: pre.dataset.title || '' }));
        pre.replaceWith(wrap);
      } else {
        pre.replaceWith(renderCode(code, { title: pre.dataset.title }));
      }
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  document.addEventListener('DOMContentLoaded', () => { chrome(); upgradeCode(); });

  return { store, esc, hl, rich, el, renderCode, codeWithTools, consoleBox, copyText, download, shuffle };
})();
