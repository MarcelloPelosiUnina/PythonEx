/* =========================================================
   Exercise 3 — Weather Station Sensor Telemetry Pipeline
   Code strings are JS template literals: a Python "\n" is written "\\n".
   Run `node tools/verify.mjs` after editing to re-check every answer with Python.
   ========================================================= */
(function () {
  const STARTER = `telemetry = [
    "stn_rome#2026-07-10#TEMP:33.4C#HUM:58%",
    "stn_milan#2026-07-10#TEMP:29.0C#HUM:72%",
    "stn_naples#2026-07-10#TEMP:ERR#HUM:64%",
    "stn_rome#2026-07-11#TEMP:35.8C#HUM:52%",
    "stn_milan#2026-07-11#TEMP:31.2C#HUM:68%",
    "stn_naples#2026-07-11#TEMP:34.0C#HUM:61%",
    "stn_rome#2026-07-12#TEMP:36.5C#HUM:49%",
    "stn_milan#2026-07-12#TEMP:ERR#HUM:75%",
    "stn_naples#2026-07-12#TEMP:33.1C#HUM:66%"
]`;

  const steps = [
    /* ======================= STEP 1 ======================= */
    {
      short: 'Parse',
      title: 'Parsing telemetry strings & handling corrupted readings',
      tags: ['Strings', 'Loops', 'Missing data'],
      goal: "Turn each compact telemetry string into four clean values (station, date, temperature, humidity) and collect them in four parallel lists. A broken sensor sends `ERR` instead of a number: store it as `np.nan`, the standard NumPy marker for missing data.",
      tasks: [
        "Write a loop that splits each telemetry string by `\"#\"` into 4 parts.",
        "Extract the clean station name in uppercase without the `stn_` prefix (e.g. `\"ROME\"`, `\"MILAN\"`, `\"NAPLES\"`).",
        "Extract the date string.",
        "Extract the temperature in Celsius as a `float` by removing `\"TEMP:\"` and `\"C\"`. If the value is `\"ERR\"`, store `np.nan`.",
        "Extract the humidity as a `float` by removing `\"HUM:\"` and `\"%\"`."
      ],
      tips: [
        { title: '`str.split(sep)`', text: 'Cuts a string at every separator and returns a <b>list</b> of pieces. The separator itself disappears.' },
        { title: 'Tuple unpacking', text: '`a, b, c, d = some_list` assigns the 4 items to 4 names. The number of names must match the number of items exactly, otherwise Python raises `ValueError`.' },
        { title: 'Chained `.replace()`', text: '`s.replace(\"TEMP:\", \"\").replace(\"C\", \"\")` removes both pieces. Each call returns a <b>new</b> string; the original is unchanged.' },
        { title: '`np.nan`', text: '"Not a Number": a special `float` that means "missing". `float(\"ERR\")` would crash, so we test the text first.' },
        { title: 'Conditional expression', text: '`x if condition else y` picks a value in one line. It is handy inside `.append(...)`.' }
      ],
      tipCode: `parts = "a#b#c".split("#")        # ['a', 'b', 'c']
first, second, third = parts       # unpacking
value = np.nan if text == "ERR" else float(text)`,
      exercises: [
        {
          id: 'e3s1a', type: 'quiz',
          title: 'What does `split("#")` give back?',
          prompt: 'We take the first telemetry record and split it by `"#"`. Which value does the expression return?',
          code: `"stn_rome#2026-07-10#TEMP:33.4C#HUM:58%".split("#")`,
          options: [
            "`['stn_rome', '2026-07-10', 'TEMP:33.4C', 'HUM:58%']`",
            "`['stn_rome#', '2026-07-10#', 'TEMP:33.4C#', 'HUM:58%']`",
            "`('stn_rome', '2026-07-10', 'TEMP:33.4C', 'HUM:58%')`",
            "`['stn', 'rome', '2026-07-10', 'TEMP', '33.4C', 'HUM', '58%']`"
          ],
          answer: 0,
          why: [
            '',
            'The separator is removed: no piece keeps the `#`.',
            '`split()` always returns a <b>list</b> (square brackets), not a tuple.',
            'Only `#` is a separator here. `_` and `:` stay inside the pieces.'
          ],
          explain: 'Four `#`-separated fields produce a list of <b>4 strings</b>, and none of them contains the separator. Because the length is always 4, we can unpack them directly into `stn_part, date_part, temp_part, hum_part`.'
        },
        {
          id: 'e3s1b', type: 'output',
          title: 'Cleaning the pieces',
          prompt: 'Write exactly what this code prints, one line per `print()`.',
          code: `stn_part = "stn_naples"
print(stn_part.replace("stn_", "").upper())

temp_part = "TEMP:33.4C"
print(temp_part.replace("TEMP:", "").replace("C", ""))

hum_part = "HUM:58%"
print(float(hum_part.replace("HUM:", "").replace("%", "")))`,
          answer: `NAPLES
33.4
58.0`,
          hint: 'The second print shows a <em>string</em>, the third shows a <em>float</em>. How does Python print the float made from `"58"`?',
          explain: '`.replace("stn_", "")` leaves `"naples"` and `.upper()` gives `NAPLES`. The temperature is still a <b>string</b> (`"33.4"`) because we have not called `float()` yet. The humidity goes through `float()`, and a float always prints with a decimal part: `58.0`.'
        },
        {
          id: 'e3s1c', type: 'truefalse',
          title: 'Handling the `ERR` readings',
          prompt: 'Two records contain `TEMP:ERR`. Decide whether each statement is true or false.',
          items: [
            { text: '`float("ERR")` raises a `ValueError`, so the program would stop.', answer: true, why: 'Only text that looks like a number can be converted.' },
            { text: 'After `"TEMP:ERR".replace("TEMP:", "").replace("C", "")` the result is `"ERR"`.', answer: true, why: '`"ERR"` contains no capital C, so the second replace changes nothing.' },
            { text: '`np.nan == np.nan` is `True`, so we can find missing values with `==`.', answer: false, why: 'NaN is never equal to anything, not even to itself. Use `np.isnan()` instead (Step 2).' },
            { text: '`np.nan` is a `float`, so the list `raw_temps` contains only floats.', answer: true, why: '`type(np.nan)` is `float`. That is why NumPy can later build a clean float array.' },
            { text: 'Storing the string `"ERR"` in the list would work just as well.', answer: false, why: 'A mix of numbers and strings cannot become a numeric array: no mean, no vectorized maths.' }
          ],
          explain: 'Missing readings must stay <b>numeric</b> so the whole column can be processed with NumPy. `np.nan` is the conventional placeholder, and NumPy has functions (`np.isnan`, `np.nanmean`) that know how to handle it.'
        },
        {
          id: 'e3s1d', type: 'fill',
          title: 'Write the parsing loop',
          prompt: 'Complete the loop that fills the four lists. Press <kbd>Enter</kbd> in any blank to check.',
          code: `stations, dates, raw_temps, humidities = [], [], [], []

for record in telemetry:
    stn_part, date_part, temp_part, hum_part = record.strip().{{split}}("#")
    stations.append(stn_part.{{replace}}("stn_", "").{{upper}}())
    dates.append({{date_part}})

    temp_str = temp_part.replace("TEMP:", "").replace("C", "")
    raw_temps.append({{np.nan}} if temp_str == {{"ERR"}} else {{float}}(temp_str))

    hum_str = hum_part.replace("HUM:", "").replace("%", "")
    humidities.append(float(hum_str))`,
          hint: 'In the conditional expression the value for the "missing" case comes <em>first</em>: `value_if_true if condition else value_if_false`.',
          explain: 'Each iteration appends exactly one value to each list, so the four lists stay <b>aligned</b>: position 2 in every list describes the same reading (Naples, 10 July). Step 3 relies on this when the lists become the columns of a DataFrame.'
        },
        {
          id: 'e3s1e', type: 'bug',
          title: 'Two bugs in a classmate\'s loop',
          prompt: 'This version crashes. Click the <b>two</b> lines that cause errors.',
          code: `stations, dates, raw_temps, humidities = [], [], [], []

for record in telemetry:
    stn_part, date_part, temp_part, hum_part = record.strip().split(":")
    stations.append(stn_part.replace("stn_", "").upper())
    dates.append(date_part)

    temp_str = temp_part.replace("TEMP:", "").replace("C", "")
    raw_temps.append(float(temp_str))

    hum_str = hum_part.replace("HUM:", "").replace("%", "")
    humidities.append(float(hum_str))`,
          bugs: [4, 9],
          notes: {
            4: 'Wrong separator: splitting on `":"` gives only 3 pieces, so unpacking into 4 names raises `ValueError: not enough values to unpack`. Use `"#"`.',
            9: 'No `ERR` check: `float("ERR")` raises `ValueError`. Use `np.nan if temp_str == "ERR" else float(temp_str)`.'
          },
          hint: 'Run the first record in your head. How many pieces does the split produce? And what happens on the third record?',
          explain: 'Parsing code must match the exact format of the data (the separator) and must survive bad input (the `ERR` value). These are the two most common problems with real sensor logs.'
        }
      ],
      checkpoint: {
        code: `import numpy as np
import pandas as pd

# --- STEP 1: Parse telemetry strings & flag missing values ---
${STARTER}

stations, dates, raw_temps, humidities = [], [], [], []

for record in telemetry:
    stn_part, date_part, temp_part, hum_part = record.strip().split("#")
    stations.append(stn_part.replace("stn_", "").upper())
    dates.append(date_part)

    temp_str = temp_part.replace("TEMP:", "").replace("C", "")
    raw_temps.append(np.nan if temp_str == "ERR" else float(temp_str))

    hum_str = hum_part.replace("HUM:", "").replace("%", "")
    humidities.append(float(hum_str))`,
        check: `print(stations)
print(dates[:3])
print(raw_temps)
print(humidities)`,
        output: `['ROME', 'MILAN', 'NAPLES', 'ROME', 'MILAN', 'NAPLES', 'ROME', 'MILAN', 'NAPLES']
['2026-07-10', '2026-07-10', '2026-07-10']
[33.4, 29.0, nan, 35.8, 31.2, 34.0, 36.5, nan, 33.1]
[58.0, 72.0, 64.0, 52.0, 68.0, 61.0, 49.0, 75.0, 66.0]`,
        note: 'Four lists of length 9, aligned by position. The two `nan` values (Naples on 10 July, Milan on 12 July) are the broken sensors. Step 2 fills them in.'
      }
    },

    /* ======================= STEP 2 ======================= */
    {
      short: 'NumPy',
      title: 'NumPy NaN imputation, unit conversion & vectorized flags',
      tags: ['NumPy arrays', 'np.isnan', 'np.nanmean', 'np.where'],
      goal: 'Move the lists into NumPy arrays and process <b>all readings at once</b>, without loops: replace the missing temperatures with the mean of the valid ones (this is called <em>imputation</em>), convert to Fahrenheit and label each reading.',
      tasks: [
        'Convert the extracted temperatures and humidities into 1D NumPy float arrays: `temp_raw_arr` and `hum_arr`.',
        'Compute the mean of the valid temperatures with `np.nanmean(temp_raw_arr)`.',
        'Replace every `np.nan` in `temp_raw_arr` with `valid_mean_temp` using `np.where(np.isnan(temp_raw_arr), valid_mean_temp, temp_raw_arr)` and store the result in `temp_c`.',
        'Convert `temp_c` to Fahrenheit with vectorized arithmetic: `temp_f = np.round(temp_c * 9.0 / 5.0 + 32.0, 2)`.',
        'Use `np.where()` to create an array of alert labels: `"HEATWAVE"` if `temp_c >= 33.5`, otherwise `"NORMAL"`.'
      ],
      tips: [
        { title: 'Vectorized maths', text: '`arr * 9 / 5 + 32` is applied to <b>every</b> element at once and returns a new array. No `for` loop needed.' },
        { title: 'Boolean mask', text: '`np.isnan(arr)` returns an array of `True`/`False`, one per element. `mask.sum()` counts the `True` values.' },
        { title: '`np.mean` vs `np.nanmean`', text: 'A single `nan` "poisons" `np.mean`, which returns `nan`. `np.nanmean` skips the `nan` values.' },
        { title: '`np.where(cond, a, b)`', text: 'Element by element: takes `a` where `cond` is `True` and `b` where it is `False`. `a` and `b` can be arrays or single values.' }
      ],
      tipCode: `arr = np.array([30.0, np.nan, 34.0])
mask = np.isnan(arr)                   # [False  True False]
filled = np.where(mask, 32.0, arr)     # [30. 32. 34.]
labels = np.where(filled >= 33, "HOT", "OK")`,
      exercises: [
        {
          id: 'e3s2a', type: 'quiz',
          title: 'Why `nanmean`?',
          prompt: '`temp_raw_arr` holds 7 valid readings and 2 `nan`. What does the plain `np.mean(temp_raw_arr)` return?',
          options: ['`nan`', '`33.29` (the mean of the 7 valid values)', '`25.89` (the `nan` values count as 0)', 'It raises an error'],
          answer: 0,
          why: [
            '',
            'That is what `np.nanmean` returns, not `np.mean`.',
            'NumPy never treats `nan` as 0. Any arithmetic with `nan` gives `nan`.',
            'No error: NumPy silently returns `nan`, which is why this bug is easy to miss.'
          ],
          explain: 'Any arithmetic involving `nan` returns `nan`, so the sum (and therefore the mean) becomes `nan`. `np.nanmean` ignores the missing values: (33.4 + 29.0 + 35.8 + 31.2 + 34.0 + 36.5 + 33.1) / 7 ≈ <b>33.29</b>.'
        },
        {
          id: 'e3s2b', type: 'output',
          title: 'Masks in action',
          prompt: 'A small array with one missing value. What does this print? (Spacing inside the brackets does not matter.)',
          code: `arr = np.array([33.0, np.nan, 36.0])
mask = np.isnan(arr)
print(mask)
print(mask.sum())
print(np.nanmean(arr))`,
          answer: `[False  True False]
1
34.5`,
          hint: 'In arithmetic, `True` counts as 1 and `False` as 0.',
          explain: '`np.isnan` builds a boolean array with one value per element. Summing it counts the `True` values, which is the number of missing readings. The reference solution uses exactly this for the bulletin line "Imputed Missing Readings: 2".'
        },
        {
          id: 'e3s2c', type: 'fill',
          title: 'Write the NumPy block',
          prompt: 'Complete Step 2. Every line works on whole arrays at once.',
          code: `temp_raw_arr = np.array(raw_temps, dtype={{float}})
hum_arr = np.array(humidities, dtype=float)

was_imputed = np.{{isnan}}(temp_raw_arr)
valid_mean_temp = np.{{nanmean}}(temp_raw_arr)
temp_c = np.round(np.{{where}}(was_imputed, {{valid_mean_temp}}, {{temp_raw_arr}}), 2)
temp_f = np.round(temp_c * 9.0 / 5.0 + {{32.0|32}}, 2)
alerts = np.where(temp_c {{>=}} 33.5, "HEATWAVE", "NORMAL")`,
          hint: 'In `np.where(mask, A, B)`, `A` is used where the mask is `True`, that is, where the reading was missing.',
          explain: 'We keep the mask in `was_imputed` because it is needed twice: here to fill the gaps, and in Step 3 as the `Imputed` column, which records which values were invented by the pipeline.'
        },
        {
          id: 'e3s2d', type: 'classify',
          title: 'HEATWAVE or NORMAL?',
          prompt: 'Using `np.where(temp_c >= 33.5, "HEATWAVE", "NORMAL")`, classify each value of `temp_c`.',
          buckets: ['HEATWAVE', 'NORMAL'],
          items: [
            { text: '`35.8` (Rome, 11 July)', bucket: 0, why: '35.8 ≥ 33.5' },
            { text: '`33.4` (Rome, 10 July)', bucket: 1, why: '33.4 is just below the 33.5 threshold.' },
            { text: '`33.29` (Naples, 10 July, imputed)', bucket: 1, why: 'The imputed mean is below the threshold, so filled values never trigger an alert here.' },
            { text: '`34.0` (Naples, 11 July)', bucket: 0, why: '34.0 ≥ 33.5' },
            { text: '`33.5` (a hypothetical reading)', bucket: 0, why: 'The operator is `>=`, so the threshold itself counts as HEATWAVE.' }
          ],
          explain: 'In the real data exactly <b>3</b> readings are HEATWAVE: Rome on 11 and 12 July and Naples on 11 July. They will appear in the alert section of the bulletin in Step 4.'
        },
        {
          id: 'e3s2e', type: 'quiz',
          title: 'Fahrenheit of an imputed value',
          prompt: 'The imputed temperature is `33.29` °C. What is its value in `temp_f`?',
          options: ['`91.92`', '`59.92`', '`0.72`', '`nan`'],
          answer: 0,
          why: [
            '',
            'That is `33.29 * 9 / 5`: the `+ 32` is missing.',
            'That is the reverse formula (`(F - 32) * 5 / 9`), which converts Fahrenheit to Celsius.',
            'After imputation, `temp_c` contains no `nan`, so `temp_f` has none either.'
          ],
          explain: '33.29 × 9 / 5 + 32 = 91.922, rounded to <b>91.92</b>. The order matters: we imputed first, so the conversion never sees a `nan`.'
        }
      ],
      checkpoint: {
        code: `# --- STEP 2: NumPy imputation & vectorized transformations ---
temp_raw_arr = np.array(raw_temps, dtype=float)
hum_arr = np.array(humidities, dtype=float)

was_imputed = np.isnan(temp_raw_arr)
valid_mean_temp = np.nanmean(temp_raw_arr)
temp_c = np.round(np.where(was_imputed, valid_mean_temp, temp_raw_arr), 2)
temp_f = np.round(temp_c * 9.0 / 5.0 + 32.0, 2)
alerts = np.where(temp_c >= 33.5, "HEATWAVE", "NORMAL")`,
        check: `print(was_imputed)
print(f"Valid mean: {valid_mean_temp:.2f}")
print(temp_c)
print(temp_f)
print(alerts)`,
        output: `[False False  True False False False False  True False]
Valid mean: 33.29
[33.4  29.   33.29 35.8  31.2  34.   36.5  33.29 33.1 ]
[92.12 84.2  91.92 96.44 88.16 93.2  97.7  91.92 91.58]
['NORMAL' 'NORMAL' 'NORMAL' 'HEATWAVE' 'NORMAL' 'HEATWAVE' 'HEATWAVE'
 'NORMAL' 'NORMAL']`,
        note: 'NumPy prints arrays without commas and pads the numbers so they line up (`29.` means `29.0`). Both `nan` values became `33.29`.'
      }
    },

    /* ======================= STEP 3 ======================= */
    {
      short: 'Pandas',
      title: 'Building a Pandas DataFrame & engineering a heat index',
      tags: ['Pandas DataFrame', '.str accessor', 'Vectorized columns', 'Sorting'],
      goal: 'Put all the columns together in one table, a <b>DataFrame</b>, then add a new calculated column (<em>feature engineering</em>) and sort the rows from the most to the least uncomfortable reading.',
      tasks: [
        'Create a DataFrame `df` with the columns `Station`, `Date`, `Temp_C`, `Temp_F`, `Humidity`, `Imputed` (boolean: was the temperature originally NaN?) and `AlertStatus`.',
        'Format the city names: `df["Station"] = df["Station"].str.capitalize()`.',
        'Create the column `HeatIndex_C = (df["Temp_C"] + 0.10 * df["Humidity"]).round(2)`.',
        'Sort the DataFrame by `HeatIndex_C` in descending order.'
      ],
      tips: [
        { title: '`pd.DataFrame({...})`', text: 'A dictionary <b>column name → list/array</b>. All columns must have the same length.' },
        { title: '`.str` accessor', text: 'Applies a string method to every value of a column: `df["col"].str.capitalize()`, `.str.upper()`, `.str.replace(...)`.' },
        { title: 'New column', text: '`df["new"] = expression` creates the column. Arithmetic between columns works row by row, like NumPy.' },
        { title: '`sort_values`', text: '`df.sort_values(by="col", ascending=False)` returns a <b>new</b>, sorted DataFrame. `reset_index(drop=True)` renumbers the rows 0, 1, 2…' }
      ],
      exercises: [
        {
          id: 'e3s3a', type: 'quiz',
          title: 'Shape of the DataFrame',
          prompt: 'We create `df` from a dictionary with <b>7 keys</b>, each holding <b>9 values</b>. What is `df.shape` right after creation (before adding `HeatIndex_C`)?',
          options: ['`(9, 7)`', '`(7, 9)`', '`(9, 8)`', '`(63,)`'],
          answer: 0,
          why: [
            '',
            '`shape` is always (rows, columns). The keys become columns, the values become rows.',
            'That is the shape <em>after</em> adding the `HeatIndex_C` column.',
            'A DataFrame is two-dimensional, not a flat list of 63 values.'
          ],
          explain: '`shape` is <b>(rows, columns)</b>: 9 readings × 7 columns. After `df["HeatIndex_C"] = ...` it becomes `(9, 8)`.'
        },
        {
          id: 'e3s3b', type: 'output',
          title: '`capitalize`, `title` and `lower`',
          prompt: 'What does this print?',
          code: `s = pd.Series(["ROME", "MILAN", "NAPLES"])
print(s.str.capitalize().tolist())
print("ROME".capitalize(), "ROME".lower())`,
          answer: `['Rome', 'Milan', 'Naples']
Rome rome`,
          explain: '`capitalize()` makes the first letter uppercase and <b>all the others lowercase</b>. Through `.str`, Pandas applies it to every value of the column. `tolist()` turns the Series back into a normal Python list.'
        },
        {
          id: 'e3s3c', type: 'fill',
          title: 'Build and enrich the table',
          prompt: 'Complete Step 3.',
          code: `df = pd.{{DataFrame}}({
    "Station": stations,
    "Date": dates,
    "Temp_C": temp_c,
    "Temp_F": temp_f,
    "Humidity": hum_arr,
    "Imputed": {{was_imputed}},
    "AlertStatus": alerts
})

df["Station"] = df["Station"].{{str}}.capitalize()
df["HeatIndex_C"] = (df["Temp_C"] + {{0.10|0.1}} * df["Humidity"]).round(2)
df = df.{{sort_values}}(by="HeatIndex_C", ascending={{False}}).reset_index(drop=True)`,
          hint: 'The `Imputed` column is the boolean mask you saved in Step 2.',
          explain: 'Plain Python lists (`stations`, `dates`) and NumPy arrays (`temp_c`, `hum_arr`, …) can be mixed in the same dictionary. Note the assignment `df = df.sort_values(...)`: without it the sorted table would be thrown away.'
        },
        {
          id: 'e3s3d', type: 'quiz',
          title: 'Compute one heat index',
          prompt: 'Milan on 12 July: `Temp_C = 33.29` (imputed), `Humidity = 75.0`. What is its `HeatIndex_C`?',
          options: ['`40.79`', '`108.29`', '`33.29`', '`41.04`'],
          answer: 0,
          why: [
            '',
            'You added the humidity without multiplying by `0.10`.',
            'That is just the temperature: the humidity term is missing.',
            '`41.04` would need a humidity of 77.5.'
          ],
          explain: '33.29 + 0.10 × 75 = 33.29 + 7.5 = <b>40.79</b>. Because of its high humidity, this imputed reading ends up in <b>3rd place</b> after sorting, ahead of a real HEATWAVE reading (Naples, 34.0 °C).'
        },
        {
          id: 'e3s3e', type: 'truefalse',
          title: 'After sorting',
          prompt: 'Think about `df` after `sort_values(...).reset_index(drop=True)`.',
          items: [
            { text: 'The first row is Rome on 2026-07-12 (heat index 41.40).', answer: true, why: '36.5 + 0.10 × 49 = 41.4, the highest value.' },
            { text: '`df.sort_values(by="HeatIndex_C")` with no assignment changes `df`.', answer: false, why: 'It returns a new DataFrame. You must assign it: `df = df.sort_values(...)`.' },
            { text: '`reset_index(drop=True)` renumbers the rows 0…8 and discards the old numbering.', answer: true, why: 'Without `drop=True` the old index would be kept as an extra column.' },
            { text: 'Without `reset_index`, the first row would still have the index label 6.', answer: true, why: 'Rome on 12 July was the 7th record (position 6) in the original list.' },
            { text: 'The two imputed rows have the same heat index because they have the same `Temp_C`.', answer: false, why: 'Their humidity differs (75 vs 64), so the heat indexes are 40.79 and 39.69.' }
          ],
          explain: 'Sorting changes the <b>order</b> of the rows but keeps their original labels; `reset_index(drop=True)` gives clean labels 0…n-1. That is useful when the table is exported or printed.'
        }
      ],
      checkpoint: {
        code: `# --- STEP 3: Build Pandas DataFrame & engineer heat index ---
df = pd.DataFrame({
    "Station": stations,
    "Date": dates,
    "Temp_C": temp_c,
    "Temp_F": temp_f,
    "Humidity": hum_arr,
    "Imputed": was_imputed,
    "AlertStatus": alerts
})

df["Station"] = df["Station"].str.capitalize()
df["HeatIndex_C"] = (df["Temp_C"] + 0.10 * df["Humidity"]).round(2)
df = df.sort_values(by="HeatIndex_C", ascending=False).reset_index(drop=True)`,
        check: `print(df.shape)
print(df[["Station", "Date", "Temp_C", "Humidity", "Imputed", "HeatIndex_C"]])`,
        output: `(9, 8)
  Station        Date  Temp_C  Humidity  Imputed  HeatIndex_C
0    Rome  2026-07-12   36.50      49.0    False        41.40
1    Rome  2026-07-11   35.80      52.0    False        41.00
2   Milan  2026-07-12   33.29      75.0     True        40.79
3  Naples  2026-07-11   34.00      61.0    False        40.10
4  Naples  2026-07-12   33.10      66.0    False        39.70
5  Naples  2026-07-10   33.29      64.0     True        39.69
6    Rome  2026-07-10   33.40      58.0    False        39.20
7   Milan  2026-07-11   31.20      68.0    False        38.00
8   Milan  2026-07-10   29.00      72.0    False        36.20`,
        note: '`df[["A", "B"]]` (double brackets) selects several columns at once. We use it here only to fit the table on screen.'
      }
    },

    /* ======================= STEP 4 ======================= */
    {
      short: 'Report',
      title: 'Station aggregation & automated weather bulletin',
      tags: ['Pandas GroupBy', 'CSV export', 'File writing', 'f-strings'],
      goal: 'Summarise the readings <b>per station</b>, save the clean table as a CSV file and write a human-readable bulletin that a meteorologist could read in a few seconds.',
      tasks: [
        'Group `df` by `Station` with `.groupby("Station").agg(...)` to compute `Max_Temp_C`, `Mean_Temp_C`, `Mean_Humidity` and `Peak_HeatIndex` for each city.',
        'Export the full clean DataFrame to `"weather_telemetry_clean.csv"` (with `index=False`).',
        'Open `"weather_alert_bulletin.txt"` in write mode and write a report with the number of imputed readings, each station\'s summary metrics and every record where `AlertStatus == "HEATWAVE"`.'
      ],
      tips: [
        { title: 'Named aggregation', text: '`.agg(NewName=("column", "function"))` creates one output column per argument. Functions: `"max"`, `"min"`, `"mean"`, `"sum"`, `"count"`…' },
        { title: '`to_csv(..., index=False)`', text: 'Writes the table to a file. `index=False` skips the 0…n-1 row numbers, which carry no information here.' },
        { title: '`iterrows()`', text: 'Loops over the rows: `for label, row in df.iterrows():`. `row["col"]` reads one value. After a groupby, `label` is the group name (the city).' },
        { title: 'f-string formatting', text: '`{x:.2f}` gives 2 decimals, `{name:<8}` pads to 8 characters aligned left, so the columns line up in the text file.' }
      ],
      tipCode: `summary = df.groupby("Station").agg(
    Max_Temp_C=("Temp_C", "max"),
    Mean_Humidity=("Humidity", "mean")
)
filtered = df[df["AlertStatus"] == "HEATWAVE"]   # boolean filter`,
      exercises: [
        {
          id: 'e3s4a', type: 'quiz',
          title: 'Reading a named aggregation',
          prompt: 'Inside `df.groupby("Station").agg(...)`, what does the argument `Max_Temp_C=("Temp_C", "max")` do?',
          options: [
            'Creates a column `Max_Temp_C` holding the highest `Temp_C` of each station',
            'Keeps only the rows where `Temp_C` is at its maximum',
            'Renames the column `Temp_C` to `Max_Temp_C`',
            'Sorts each station by `Temp_C` in descending order'
          ],
          answer: 0,
          why: ['', 'That would be a filter. `agg` reduces each group to a single row.', 'The original column is not renamed: a new summary column is created.', '`agg` does not sort, it summarises.'],
          explain: 'The result has <b>one row per station</b> (Milan, Naples, Rome, in alphabetical order) and one column per argument: the name on the left, the pair (source column, function) on the right.'
        },
        {
          id: 'e3s4b', type: 'fill',
          title: 'Summary table and CSV export',
          prompt: 'Complete the aggregation and the export.',
          code: `station_summary = df.{{groupby}}("Station").agg(
    Max_Temp_C=("Temp_C", {{"max"}}),
    Mean_Temp_C=("Temp_C", {{"mean"}}),
    Mean_Humidity=({{"Humidity"}}, "mean"),
    Peak_HeatIndex=("HeatIndex_C", "max")
).round(2)

df.to_csv("weather_telemetry_clean.csv", index={{False}})`,
          hint: 'Single or double quotes are both accepted.',
          explain: '`.round(2)` at the end rounds every column of the summary at once. The CSV contains <b>all 9 rows and 8 columns</b> in the sorted order.'
        },
        {
          id: 'e3s4c', type: 'quiz',
          title: 'A suspicious maximum',
          prompt: 'In the summary, Milan has `Max_Temp_C = 33.29`, but no Milan sensor ever sent `33.29`. Why?',
          options: [
            'The imputed value for 12 July (33.29) is higher than Milan\'s two real readings (29.0 and 31.2)',
            '`.round(2)` changed Milan\'s real maximum',
            '`groupby` averages the values before taking the maximum',
            '`np.nanmean` skipped all of Milan\'s readings'
          ],
          answer: 0,
          why: ['', 'Rounding to 2 decimals cannot turn 31.2 into 33.29.', '`"max"` takes the largest value of each group. No averaging happens first.', '`np.nanmean` was computed over <em>all</em> stations, and Milan has two valid readings.'],
          explain: 'Imputation has consequences: the national mean (33.29) is <b>higher</b> than every real Milan reading, so it became Milan\'s maximum. That is why we kept the `Imputed` column and print how many values were filled in. A better approach would impute <em>per station</em>; this is a good topic for discussion.'
        },
        {
          id: 'e3s4d', type: 'order',
          title: 'Assemble the bulletin writer',
          prompt: 'Put the lines in the right order. Indentation is a clue: lines inside the `with` block start with 4 spaces, lines inside a loop with 8.',
          lines: [
            'with open("weather_alert_bulletin.txt", "w", encoding="utf-8") as f:',
            '    f.write("=== NATIONAL WEATHER SENSOR BULLETIN ===\\n")',
            '    f.write(f"Imputed Missing Readings: {int(np.sum(was_imputed))} (Filled with {valid_mean_temp:.2f} C)\\n\\n")',
            '    f.write("--- STATION SUMMARY ---\\n")',
            '    for city, row in station_summary.iterrows():',
            '        f.write(f"{city:<8} | Max: {row[\'Max_Temp_C\']} C | Avg: {row[\'Mean_Temp_C\']} C | Peak HI: {row[\'Peak_HeatIndex\']} C\\n")',
            '    f.write("\\n--- ACTIVE HEATWAVE ALERTS (Temp >= 33.5 C) ---\\n")',
            '    heat_df = df[df["AlertStatus"] == "HEATWAVE"]',
            '    for _, r in heat_df.iterrows():',
            '        f.write(f"* {r[\'Date\']} - {r[\'Station\']}: {r[\'Temp_C\']} C ({r[\'Temp_F\']} F), Humidity {r[\'Humidity\']}%\\n")'
          ],
          swap: [[6, 7]],
          hint: 'Follow the bulletin from top to bottom: title, imputation info, station summary, then the alerts. Each `for` line must come directly before its indented body.',
          explain: 'The order of the `write` calls is the order of the lines in the file. The `heat_df` filter can go before or after the "ACTIVE HEATWAVE ALERTS" header, because it writes nothing; it just has to come before the loop that uses it. Inside the f-strings we use single quotes (`row[\'Max_Temp_C\']`) because the f-string itself is delimited by double quotes.'
        },
        {
          id: 'e3s4e', type: 'output',
          title: 'f-string formatting',
          prompt: 'What does this print? Watch the padding inside the brackets.',
          code: `city = "Rome"
print(f"[{city:<8}]")
print(f"{33.285714:.2f} C")
print(int(np.sum(np.array([False, True, True]))))`,
          answer: `[Rome    ]
33.29 C
2`,
          hint: '`:<8` pads the text with spaces up to 8 characters.',
          explain: '`"Rome"` has 4 characters, so `:<8` adds 4 spaces after it. That is how the city names line up in the bulletin. `:.2f` rounds to 2 decimals. Summing a boolean array counts the `True` values; `int(...)` turns NumPy\'s integer into a plain Python `int`.'
        }
      ],
      checkpoint: {
        intro: 'This is the last piece of the pipeline. After running it you will find two new files next to your script.',
        code: `# --- STEP 4: GroupBy summary & automated bulletin file ---
station_summary = df.groupby("Station").agg(
    Max_Temp_C=("Temp_C", "max"),
    Mean_Temp_C=("Temp_C", "mean"),
    Mean_Humidity=("Humidity", "mean"),
    Peak_HeatIndex=("HeatIndex_C", "max")
).round(2)

df.to_csv("weather_telemetry_clean.csv", index=False)

with open("weather_alert_bulletin.txt", "w", encoding="utf-8") as f:
    f.write("=== NATIONAL WEATHER SENSOR BULLETIN ===\\n")
    f.write(f"Imputed Missing Readings: {int(np.sum(was_imputed))} (Filled with {valid_mean_temp:.2f} C)\\n\\n")
    f.write("--- STATION SUMMARY ---\\n")
    for city, row in station_summary.iterrows():
        f.write(f"{city:<8} | Max: {row['Max_Temp_C']} C | Avg: {row['Mean_Temp_C']} C | Peak HI: {row['Peak_HeatIndex']} C\\n")
    f.write("\\n--- ACTIVE HEATWAVE ALERTS (Temp >= 33.5 C) ---\\n")
    heat_df = df[df["AlertStatus"] == "HEATWAVE"]
    for _, r in heat_df.iterrows():
        f.write(f"* {r['Date']} - {r['Station']}: {r['Temp_C']} C ({r['Temp_F']} F), Humidity {r['Humidity']}%\\n")

print(station_summary)`,
        check: `with open("weather_alert_bulletin.txt", "r", encoding="utf-8") as f:
    print(f.read())`,
        output: `         Max_Temp_C  Mean_Temp_C  Mean_Humidity  Peak_HeatIndex
Station
Milan         33.29        31.16          71.67           40.79
Naples        34.00        33.46          63.67           40.10
Rome          36.50        35.23          53.00           41.40
=== NATIONAL WEATHER SENSOR BULLETIN ===
Imputed Missing Readings: 2 (Filled with 33.29 C)

--- STATION SUMMARY ---
Milan    | Max: 33.29 C | Avg: 31.16 C | Peak HI: 40.79 C
Naples   | Max: 34.0 C | Avg: 33.46 C | Peak HI: 40.1 C
Rome     | Max: 36.5 C | Avg: 35.23 C | Peak HI: 41.4 C

--- ACTIVE HEATWAVE ALERTS (Temp >= 33.5 C) ---
* 2026-07-12 - Rome: 36.5 C (97.7 F), Humidity 49.0%
* 2026-07-11 - Rome: 35.8 C (96.44 F), Humidity 52.0%
* 2026-07-11 - Naples: 34.0 C (93.2 F), Humidity 61.0%`,
        note: 'In the bulletin the numbers are written without a format (`{row[\'Max_Temp_C\']}`), so Python drops trailing zeros: `34.0` instead of `34.00`. Adding `:.2f` would make the columns look even tidier. Try it!'
      }
    }
  ];

  window.EX3 = {
    key: 'ex3',
    file: 'exercise3_weather.py',
    starter: STARTER,
    steps,
    solution: steps.map((s) => s.checkpoint.code).join('\n\n'),
    wrapUp: 'Here are the four pieces together: the complete pipeline from raw telemetry strings to the weather bulletin. It matches the reference solution in the workbook.',
    finalOutput: `         Max_Temp_C  Mean_Temp_C  Mean_Humidity  Peak_HeatIndex
Station
Milan         33.29        31.16          71.67           40.79
Naples        34.00        33.46          63.67           40.10
Rome          36.50        35.23          53.00           41.40`,
    files: [
      {
        name: 'weather_telemetry_clean.csv',
        content: `Station,Date,Temp_C,Temp_F,Humidity,Imputed,AlertStatus,HeatIndex_C
Rome,2026-07-12,36.5,97.7,49.0,False,HEATWAVE,41.4
Rome,2026-07-11,35.8,96.44,52.0,False,HEATWAVE,41.0
Milan,2026-07-12,33.29,91.92,75.0,True,NORMAL,40.79
Naples,2026-07-11,34.0,93.2,61.0,False,HEATWAVE,40.1
Naples,2026-07-12,33.1,91.58,66.0,False,NORMAL,39.7
Naples,2026-07-10,33.29,91.92,64.0,True,NORMAL,39.69
Rome,2026-07-10,33.4,92.12,58.0,False,NORMAL,39.2
Milan,2026-07-11,31.2,88.16,68.0,False,NORMAL,38.0
Milan,2026-07-10,29.0,84.2,72.0,False,NORMAL,36.2`
      },
      {
        name: 'weather_alert_bulletin.txt',
        content: `=== NATIONAL WEATHER SENSOR BULLETIN ===
Imputed Missing Readings: 2 (Filled with 33.29 C)

--- STATION SUMMARY ---
Milan    | Max: 33.29 C | Avg: 31.16 C | Peak HI: 40.79 C
Naples   | Max: 34.0 C | Avg: 33.46 C | Peak HI: 40.1 C
Rome     | Max: 36.5 C | Avg: 35.23 C | Peak HI: 41.4 C

--- ACTIVE HEATWAVE ALERTS (Temp >= 33.5 C) ---
* 2026-07-12 - Rome: 36.5 C (97.7 F), Humidity 49.0%
* 2026-07-11 - Rome: 35.8 C (96.44 F), Humidity 52.0%
* 2026-07-11 - Naples: 34.0 C (93.2 F), Humidity 61.0%`
      }
    ]
  };
})();
