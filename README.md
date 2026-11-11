# Python guided lab: Exercises 3 and 4

Step-by-step guided solutions for Exercise 3 (weather sensor pipeline) and Exercise 4 (e-commerce capstone) of the workbook. Built like the `EserciziOttobre` site: plain HTML, CSS and JavaScript, no libraries, works offline. Open `index.html` in a browser.

| Page | Content |
|---|---|
| `index.html` | Index with saved progress |
| `exercise3.html` | Weather telemetry: 4 steps, 20 exercises |
| `exercise4.html` | E-commerce system: 4 steps, 21 exercises |

Each step has: the goal, the tasks from the workbook, theory reminders, interactive exercises (multiple choice, true/false, classify, what does it print, find the bug, complete the code, reorder lines), then a **checkpoint** with the code so far, temporary check lines and the expected output. The next step unlocks when the current one is done ("Open anyway" skips the lock). At the end: the full solution (Copy / Download .py), its console output and the files it creates.

Answers are saved in the browser (`localStorage`). Use **Clear answers** to reset them, and **A− / A+** to change the text size on an interactive whiteboard.

## Files

```
css/base.css, css/exercises.css   style of the original site
css/guide.css                     steps, stepper, checkpoints
js/core.js                        Python highlighter, storage, top bar, copy/download
js/engine.js                      exercise types + guided-step layout
js/data-ex3.js, js/data-ex4.js    all texts, code and expected outputs
solutions/*.py                    the complete reference scripts
tools/verify.mjs                  checks every answer with real Python
```

## Editing exercises

Exercises are objects in `js/data-ex*.js` (same fields as the original site). In `fill` exercises the blanks are written as `{{answer|alternative}}`; the original `[[...]]` syntax clashes with pandas `df[["col"]]`. Answers are compared ignoring spaces and quote style, but letter case matters.

Code is stored in JS template literals, so a Python `\n` is written `\\n` and `${` is written `\${`.

After any change, run:

```
node tools/verify.mjs           # every checkpoint, output answer, fill and order checked with Python
node tools/verify.mjs --write   # also regenerate solutions/*.py
```

It needs Python 3 with numpy and pandas (`PYTHON=...` selects the interpreter).
