/* =========================================================
   Exercise 4 — E-Commerce Sales & Inventory Intelligence System
   Code strings are JS template literals: a Python "\n" is written "\\n",
   a "$" followed by "{" is written "\${", a line-continuation "\" is written "\\".
   Run `node tools/verify.mjs` after editing to re-check every answer with Python.
   ========================================================= */
(function () {
  const STARTER = `raw_lines = [
    "ORD-101 | sku-elec-401 | Wireless Ergonomic Mouse | qty:4 | price:$29.99 | reg:eu-south",
    "ORD-102 | sku-home-205 | Stainless Espresso Maker | qty:2 | price:$85.00 | reg:eu-west",
    "ORD-103 | CORRUPTED_LINE_MISSING_FIELDS",
    "ORD-104 | sku-elec-890 | Mechanical KeyBoard RGB | qty:8 | price:$110.00 | reg:eu-north",
    "ORD-105 | sku-book-112 | Python Data Science Guide | qty:10 | price:$39.50 | reg:eu-south",
    "ORD-106 | sku-home-310 | Smart LED Desk Lamp | qty:0 | price:$45.00 | reg:eu-west",
    "ORD-107 | sku-elec-401 | wireless ergonomic mouse | qty:6 | price:$29.99 | reg:eu-west",
    "ORD-108 | sku-book-204 | Practical SQL Handbook | qty:3 | price:$34.00 | reg:eu-north"
]`;

  const steps = [
    /* ======================= STEP 1 ======================= */
    {
      short: 'Ingest',
      title: 'Raw transaction file ingestion, SKU parsing & error logging',
      tags: ['File I/O', 'Loops', 'Strings', 'Conditionals'],
      goal: 'Real data is dirty. Write the nightly batch to a file, read it back line by line, and split it in two: <b>valid orders</b> become clean dictionaries, <b>bad lines</b> are quarantined in an error log, with their line number and the reason, so nothing is lost silently.',
      tasks: [
        'Write all strings in `raw_lines` to `"raw_orders.txt"`.',
        'Read `"raw_orders.txt"` line by line while `"order_errors.log"` is open in write mode.',
        'Validate each line: if it does not contain exactly 6 pipe-separated fields, or if the integer quantity is `<= 0`, log the line number, the reason and the raw text to `"order_errors.log"` and skip it.',
        'For valid lines extract: `OrderID`, `SKU` (uppercase), `Category` (middle token of the SKU split by `"-"`, e.g. `"ELEC"`), `Product` (Title Case), `Qty` (`int`), `UnitPrice` (`float`, strip `"price:$"`) and `Region` (uppercase, strip `"reg:"`). Store the dictionaries in `valid_orders`.'
      ],
      tips: [
        { title: 'Two files in one `with`', text: '`with open(a) as f_in, open(b, "w") as f_err:` opens both and closes both automatically. A `\\` at the end of a line continues the statement on the next line.' },
        { title: '`enumerate(f, start=1)`', text: 'Gives `(number, line)` pairs. `start=1` makes the numbers match what a person sees in a text editor (line 1, 2, 3…).' },
        { title: 'List comprehension', text: '`[p.strip() for p in text.split("|")]` splits and cleans every piece in one line.' },
        { title: 'Guard clauses with `continue`', text: 'Check for a problem, log it, then `continue` to jump to the next line. The "happy path" code below needs no extra indentation.' },
        { title: '`str.title()`', text: 'Uppercase first letter of <b>every word</b>, lowercase for the rest of the word: `"KeyBoard RGB"` → `"Keyboard Rgb"`.' }
      ],
      tipCode: `for line_num, line in enumerate(f_in, start=1):
    parts = [p.strip() for p in line.split("|")]
    if len(parts) != 6:
        f_err.write(f"Line {line_num} [MALFORMED_FIELDS]: ...\\n")
        continue          # skip to the next line
    # ...only valid lines reach this point...`,
      exercises: [
        {
          id: 'e4s1a', type: 'classify',
          title: 'Triage the order lines',
          prompt: 'Decide what the validator does with each line: keep it, or log it with which reason?',
          buckets: ['Valid', 'MALFORMED_FIELDS', 'NON_POSITIVE_QTY'],
          items: [
            { text: '`ORD-101 | sku-elec-401 | Wireless Ergonomic Mouse | qty:4 | price:$29.99 | reg:eu-south`', bucket: 0, why: '6 fields and a quantity of 4.' },
            { text: '`ORD-103 | CORRUPTED_LINE_MISSING_FIELDS`', bucket: 1, why: 'Only 2 fields after splitting on `|`.' },
            { text: '`ORD-106 | sku-home-310 | Smart LED Desk Lamp | qty:0 | price:$45.00 | reg:eu-west`', bucket: 2, why: 'The structure is fine, but `0 <= 0`.' },
            { text: '`ORD-107 | sku-elec-401 | wireless ergonomic mouse | qty:6 | price:$29.99 | reg:eu-west`', bucket: 0, why: 'Lowercase text is not an error: `.title()` will fix it.' },
            { text: '`ORD-110 | sku-toys-007 | Yo-Yo Classic | qty:-2 | price:$3.00 | reg:eu-east` (hypothetical)', bucket: 2, why: 'A negative quantity is also `<= 0`. The `-` inside "Yo-Yo" does not matter: we split on `|`.' },
            { text: '`ORD-111 | sku-elec-120 | USB Cable | qty:1 | price:$5.00` (hypothetical)', bucket: 1, why: 'The region is missing: only 5 fields.' }
          ],
          explain: 'The checks run <b>in order</b>: first the structure (6 fields), then the quantity. The order matters: on a malformed line `parts[3]` might not exist, so checking the quantity first could crash the program.'
        },
        {
          id: 'e4s1b', type: 'output',
          title: 'Dissecting one line',
          prompt: 'What does this print?',
          code: `line = "ORD-101 | sku-elec-401 | Wireless Ergonomic Mouse | qty:4 | price:$29.99 | reg:eu-south"
parts = [p.strip() for p in line.split("|")]
print(len(parts))
print(parts[1].upper().split("-")[1])
print(int(parts[3].replace("qty:", "")) + 1)
print(float(parts[4].replace("price:$", "")) * 2)
print(parts[5].replace("reg:", "").upper())`,
          answer: `6
ELEC
5
59.98
EU-SOUTH`,
          hint: 'Index 1 is the SKU. `"SKU-ELEC-401".split("-")` gives three pieces: which one is at index 1?',
          explain: 'After `split("|")` and `strip()` we get 6 clean pieces. Each one needs a different cleaning: remove a prefix (`"qty:"`, `"price:$"`, `"reg:"`), convert the type (`int`, `float`) and normalise the case (`upper`). The `+ 1` and `* 2` show that the values are real numbers now, not text.'
        },
        {
          id: 'e4s1c', type: 'quiz',
          title: 'The `.title()` surprise',
          prompt: 'What is `"Mechanical KeyBoard RGB".title()`?',
          options: ['`"Mechanical Keyboard Rgb"`', '`"Mechanical KeyBoard RGB"` (unchanged)', '`"MECHANICAL KEYBOARD RGB"`', '`"Mechanical keyboard rgb"`'],
          answer: 0,
          why: ['', '`.title()` does change words that are already partly uppercase.', 'That is `.upper()`.', 'That is `.capitalize()`, which affects only the first letter of the whole string.'],
          explain: '`.title()` uppercases the first letter of each word and <b>lowercases all the others</b>, so acronyms get damaged: `RGB` → `Rgb`, `SQL` → `Sql`, `LED` → `Led`. The benefit: ORD-101 and ORD-107 (`"wireless ergonomic mouse"`) now have the same product name. Always check what a "cleaning" function does to your real data!'
        },
        {
          id: 'e4s1d', type: 'fill',
          title: 'Write the validator',
          prompt: 'Complete the ingestion and validation part.',
          code: `with open("raw_orders.txt", "w", encoding="utf-8") as f:
    for line in raw_lines:
        f.write(line + {{"\\n"}})

valid_orders = []
with open("raw_orders.txt", {{"r"}}, encoding="utf-8") as f_in, \\
     open("order_errors.log", {{"w"}}, encoding="utf-8") as f_err:

    for line_num, line in {{enumerate}}(f_in, start={{1}}):
        clean = line.strip()
        if not clean:
            continue
        parts = [p.strip() for p in clean.split("|")]
        if len(parts) != {{6}}:
            f_err.write(f"Line {line_num} [MALFORMED_FIELDS]: {clean}\\n")
            {{continue}}

        ord_id, sku_raw, prod_raw, qty_raw, price_raw, reg_raw = parts
        qty = {{int}}(qty_raw.replace("qty:", ""))
        if qty {{<=}} 0:
            f_err.write(f"Line {line_num} [NON_POSITIVE_QTY]: {clean}\\n")
            continue`,
          hint: '`write()` does not add a line break by itself. Which special character starts a new line?',
          explain: 'The line numbers in the log refer to <b>the file</b>, which is exactly what someone fixing the data needs. The empty-line check (`if not clean`) protects against blank lines at the end of a file, a very common problem.'
        },
        {
          id: 'e4s1e', type: 'fill',
          title: 'Extract the clean fields',
          prompt: 'This code runs only for lines that passed both checks. Complete it.',
          code: `        sku = sku_raw.{{upper}}()
        category = sku.split({{"-"}})[{{1}}]
        product = prod_raw.{{title}}()
        unit_price = {{float}}(price_raw.replace({{"price:$"}}, ""))
        region = reg_raw.replace("reg:", "").upper()

        valid_orders.{{append}}({
            "OrderID": ord_id, "SKU": sku, "Category": category,
            "Product": product, "Qty": qty, "UnitPrice": unit_price, "Region": region
        })`,
          hint: 'Python lists start at index 0: in `["SKU", "ELEC", "401"]` the category is at index 1.',
          explain: 'Each valid order becomes a <b>dictionary</b> with the same 7 keys. A list of identical dictionaries is the ideal input for `pd.DataFrame(...)` in Step 3: the keys become the column names.'
        },
        {
          id: 'e4s1f', type: 'bug',
          title: 'Two silent bugs',
          prompt: 'This loop does not crash, but it gives <b>wrong results</b>. Click the two lines responsible.',
          code: `for line_num, line in enumerate(f_in):
    clean = line.strip()
    parts = [p.strip() for p in clean.split("|")]
    if len(parts) != 6:
        f_err.write(f"Line {line_num} [MALFORMED_FIELDS]: {clean}\\n")
        continue
    ord_id, sku_raw, prod_raw, qty_raw, price_raw, reg_raw = parts
    qty = int(qty_raw.replace("qty:", ""))
    if qty < 0:
        f_err.write(f"Line {line_num} [NON_POSITIVE_QTY]: {clean}\\n")
        continue`,
          bugs: [1, 9],
          notes: {
            1: 'Without `start=1`, numbering starts at 0: the corrupted 3rd line would be logged as "Line 2".',
            9: '`< 0` lets ORD-106 (`qty:0`) through as a valid order. The rule is `<= 0`.'
          },
          hint: 'Compare with the requirements: which line number would ORD-103 get? Would ORD-106 be rejected?',
          explain: 'Silent bugs are worse than crashes, because the program "works". Off-by-one numbering and `<` instead of `<=` are classic examples. Testing with known edge cases (a zero quantity) catches them.'
        }
      ],
      checkpoint: {
        code: `import numpy as np
import pandas as pd

# --- STEP 1: Write raw orders, parse & quarantine errors ---
${STARTER}

with open("raw_orders.txt", "w", encoding="utf-8") as f:
    for line in raw_lines:
        f.write(line + "\\n")

valid_orders = []
with open("raw_orders.txt", "r", encoding="utf-8") as f_in, \\
     open("order_errors.log", "w", encoding="utf-8") as f_err:

    for line_num, line in enumerate(f_in, start=1):
        clean = line.strip()
        if not clean:
            continue
        parts = [p.strip() for p in clean.split("|")]
        if len(parts) != 6:
            f_err.write(f"Line {line_num} [MALFORMED_FIELDS]: {clean}\\n")
            continue

        ord_id, sku_raw, prod_raw, qty_raw, price_raw, reg_raw = parts
        qty = int(qty_raw.replace("qty:", ""))
        if qty <= 0:
            f_err.write(f"Line {line_num} [NON_POSITIVE_QTY]: {clean}\\n")
            continue

        sku = sku_raw.upper()
        category = sku.split("-")[1]
        product = prod_raw.title()
        unit_price = float(price_raw.replace("price:$", ""))
        region = reg_raw.replace("reg:", "").upper()

        valid_orders.append({
            "OrderID": ord_id, "SKU": sku, "Category": category,
            "Product": product, "Qty": qty, "UnitPrice": unit_price, "Region": region
        })`,
        check: `print(len(valid_orders), "valid orders")
print(valid_orders[2])
with open("order_errors.log", "r", encoding="utf-8") as f:
    print(f.read())`,
        output: `6 valid orders
{'OrderID': 'ORD-104', 'SKU': 'SKU-ELEC-890', 'Category': 'ELEC', 'Product': 'Mechanical Keyboard Rgb', 'Qty': 8, 'UnitPrice': 110.0, 'Region': 'EU-NORTH'}
Line 3 [MALFORMED_FIELDS]: ORD-103 | CORRUPTED_LINE_MISSING_FIELDS
Line 6 [NON_POSITIVE_QTY]: ORD-106 | sku-home-310 | Smart LED Desk Lamp | qty:0 | price:$45.00 | reg:eu-west`,
        note: '8 lines in, 6 valid + 2 quarantined out: no line was lost. `valid_orders[2]` is ORD-104 (not ORD-103!) because the rejected lines are not in the list.'
      }
    },

    /* ======================= STEP 2 ======================= */
    {
      short: 'NumPy',
      title: 'NumPy pricing engine: tiered bulk discounts, VAT & percentiles',
      tags: ['NumPy arrays', 'Nested np.where', 'np.percentile'],
      goal: 'Price <b>every order at once</b>: gross revenue, a tiered volume discount, the net revenue and the total with 22% VAT. Then describe how the order values are spread using percentiles.',
      tasks: [
        'Convert the valid quantities and unit prices into NumPy arrays: `qty_arr` and `price_arr`.',
        'Compute the gross revenue per order: `gross_arr = np.round(qty_arr * price_arr, 2)`.',
        'Use nested `np.where()` to assign a tiered discount rate: `0.12` if `qty_arr >= 6`; `0.05` if `qty_arr >= 3` (and < 6); `0.00` otherwise.',
        'Compute the net revenue `gross_arr * (1 - disc_rate_arr)` and the total with 22% VAT `net_arr * 1.22`, both rounded to 2 decimals.',
        'Calculate the 25th, 50th (median) and 75th percentiles of the net revenue with `np.percentile(net_arr, [25, 50, 75])`.'
      ],
      tips: [
        { title: 'From dictionaries to arrays', text: '`np.array([o["Qty"] for o in valid_orders])` collects one field from every dictionary.' },
        { title: 'Nested `np.where`', text: 'Like an `if / elif / else`: `np.where(c1, A, np.where(c2, B, C))`. Put the <b>strictest</b> condition first.' },
        { title: 'Element-wise arithmetic', text: '`qty_arr * price_arr` multiplies position by position: order 1 × order 1, order 2 × order 2…' },
        { title: 'Percentiles', text: 'The p-th percentile is the value below which p% of the data falls. The 50th is the median. With few values, NumPy <b>interpolates</b> between them.' }
      ],
      tipCode: `qty = np.array([2, 4, 8])
rate = np.where(qty >= 6, 0.12, np.where(qty >= 3, 0.05, 0.0))
# rate -> [0.   0.05 0.12]`,
      exercises: [
        {
          id: 'e4s2a', type: 'classify',
          title: 'Which discount tier?',
          prompt: 'Using `np.where(qty_arr >= 6, 0.12, np.where(qty_arr >= 3, 0.05, 0.0))`, choose the rate for each quantity.',
          buckets: ['0.00', '0.05', '0.12'],
          items: [
            { text: '`qty = 2` (ORD-102)', bucket: 0, why: 'Fails both conditions.' },
            { text: '`qty = 3` (ORD-108)', bucket: 1, why: '3 >= 3: the lower limit is included.' },
            { text: '`qty = 4` (ORD-101)', bucket: 1, why: 'Between 3 and 5.' },
            { text: '`qty = 6` (ORD-107)', bucket: 2, why: '6 >= 6: the top tier starts exactly at 6.' },
            { text: '`qty = 10` (ORD-105)', bucket: 2, why: 'Any quantity of 6 or more.' }
          ],
          explain: 'The outer `np.where` decides the top tier; only where it is `False` does the inner `np.where` choose between 0.05 and 0.00. The result for our 6 orders is `[0.05, 0.0, 0.12, 0.12, 0.12, 0.05]`.'
        },
        {
          id: 'e4s2b', type: 'quiz',
          title: 'Order of the conditions',
          prompt: 'A classmate swaps the conditions: `np.where(qty_arr >= 3, 0.05, np.where(qty_arr >= 6, 0.12, 0.0))`. Which rate does an order with `qty = 10` get?',
          options: ['`0.05`', '`0.12`', '`0.0`', 'An error'],
          answer: 0,
          why: ['', 'The inner `np.where` is never reached for 10, because the outer condition `10 >= 3` is already `True`.', '`0.0` is reached only when both conditions are `False`.', 'The code runs without errors. That is what makes this bug dangerous.'],
          explain: 'Just like `if / elif`, the first `True` condition wins. `10 >= 3` matches first, so the big order gets only 5%, and the 12% tier can <b>never</b> be reached. Always test the strictest condition first.'
        },
        {
          id: 'e4s2c', type: 'fill',
          title: 'Write the pricing engine',
          prompt: 'Complete Step 2.',
          code: `qty_arr = np.array([o[{{"Qty"}}] for o in valid_orders])
price_arr = np.array([o["UnitPrice"] for o in valid_orders])

gross_arr = np.round(qty_arr {{*}} price_arr, 2)
disc_rate_arr = np.where(qty_arr >= {{6}}, 0.12, np.{{where}}(qty_arr >= {{3}}, 0.05, 0.0))
net_arr = np.round(gross_arr * ({{1.0|1}} - disc_rate_arr), 2)
total_vat_arr = np.round(net_arr * {{1.22}}, 2)
p25, p50, p75 = np.{{percentile}}(net_arr, [25, 50, 75])`,
          hint: 'Adding 22% VAT means multiplying by 1 + 0.22.',
          explain: 'Six arrays of the same length, aligned by position: index 0 is always ORD-101. Each operation is one line with no loop. With a million orders, the code would be exactly the same.'
        },
        {
          id: 'e4s2d', type: 'output',
          title: 'Price one order by hand',
          prompt: 'ORD-107 is 6 mice at $29.99. What does this print?',
          code: `gross = round(6 * 29.99, 2)
net = round(gross * (1 - 0.12), 2)
print(gross)
print(net)
print(round(net * 1.22, 2))`,
          answer: `179.94
158.35
193.19`,
          hint: '6 × 29.99 = 179.94, and 12% off means keeping 88%.',
          explain: '179.94 × 0.88 = 158.3472 → <b>158.35</b>; 158.35 × 1.22 = 193.187 → <b>193.19</b>. These are exactly the values at index 4 of `gross_arr`, `net_arr` and `total_vat_arr`.'
        },
        {
          id: 'e4s2e', type: 'truefalse',
          title: 'Percentiles of the net revenue',
          prompt: 'Sorted, `net_arr` is `[96.9, 113.96, 158.35, 170.0, 347.6, 774.4]`. True or false?',
          items: [
            { text: 'With 6 values, the median is the average of the 3rd and 4th: (158.35 + 170.0) / 2.', answer: true, why: '= 164.175, printed as 164.18.' },
            { text: '`np.percentile(net_arr, 50)` gives the same value as `np.median(net_arr)`.', answer: true, why: 'The 50th percentile is the definition of the median.' },
            { text: 'The 75th percentile must be one of the six values in the array.', answer: false, why: 'NumPy interpolates between values: the result is 303.20, which is not in the list.' },
            { text: '`p25, p50, p75 = np.percentile(net_arr, [25, 50, 75])` works because the result is an array of 3 values.', answer: true, why: 'Any sequence of length 3 can be unpacked into 3 names.' },
            { text: 'The mean of `net_arr` is close to the median.', answer: false, why: 'The mean is about 276.9. The big ORD-104 order (774.40) pulls the mean up but barely moves the median.' }
          ],
          explain: 'Percentiles describe the <b>spread</b> and are robust to outliers. Half of the orders are below $164.18, even though one order alone is worth $774.40.'
        }
      ],
      checkpoint: {
        code: `# --- STEP 2: NumPy tiered discount & tax vectorization ---
qty_arr = np.array([o["Qty"] for o in valid_orders])
price_arr = np.array([o["UnitPrice"] for o in valid_orders])

gross_arr = np.round(qty_arr * price_arr, 2)
disc_rate_arr = np.where(qty_arr >= 6, 0.12, np.where(qty_arr >= 3, 0.05, 0.0))
net_arr = np.round(gross_arr * (1.0 - disc_rate_arr), 2)
total_vat_arr = np.round(net_arr * 1.22, 2)
p25, p50, p75 = np.percentile(net_arr, [25, 50, 75])`,
        check: `print(gross_arr)
print(disc_rate_arr)
print(net_arr)
print(total_vat_arr)
print(f"Percentiles: {p25:.2f} | {p50:.2f} | {p75:.2f}")`,
        output: `[119.96 170.   880.   395.   179.94 102.  ]
[0.05 0.   0.12 0.12 0.12 0.05]
[113.96 170.   774.4  347.6  158.35  96.9 ]
[139.03 207.4  944.77 424.07 193.19 118.22]
Percentiles: 125.06 | 164.18 | 303.20`,
        note: 'Read the arrays column by column: position 2 is ORD-104 (8 keyboards × $110 = $880, 12% off = $774.40, with VAT = $944.77).'
      }
    },

    /* ======================= STEP 3 ======================= */
    {
      short: 'Pandas',
      title: 'Pandas multi-dimensional analytics & pivot tables',
      tags: ['Pandas DataFrame', '.str accessor', 'GroupBy', 'Pivot tables'],
      goal: 'Combine the parsed orders and the NumPy results in one DataFrame, then look at the business from two angles: a <b>KPI table per category</b> and a <b>category × region</b> pivot table.',
      tasks: [
        'Build `orders_df` from `valid_orders` and attach the NumPy columns `GrossRevenue`, `DiscountRate`, `NetRevenue` and `TotalWithVAT`.',
        'Use `orders_df["Region"].str.replace("EU-", "", regex=False)` to create a clean column `RegionZone` (`"SOUTH"`, `"WEST"`, `"NORTH"`).',
        'Group by `Category` with `.groupby("Category").agg(...)` to compute the number of orders, units sold, total net revenue and average discount rate.',
        'Create a pivot table of net revenue with `Category` as rows and `RegionZone` as columns: `orders_df.pivot_table(..., aggfunc="sum", fill_value=0.0)`.'
      ],
      tips: [
        { title: 'DataFrame from dictionaries', text: '`pd.DataFrame(list_of_dicts)`: each dictionary becomes a row, each key a column.' },
        { title: 'Attaching arrays', text: '`df["New"] = some_array` works when the array has one value per row, in the same order.' },
        { title: '`regex=False`', text: 'Treat the pattern as plain text. With `regex=True`, characters like `.` `*` `+` have special meanings.' },
        { title: '`pivot_table`', text: '`index` → rows, `columns` → columns, `values` → what to put in the cells, `aggfunc` → how to combine several values, `fill_value` → what to write in empty cells.' }
      ],
      tipCode: `pivot = df.pivot_table(index="Category", columns="RegionZone",
                       values="NetRevenue", aggfunc="sum", fill_value=0.0)`,
      exercises: [
        {
          id: 'e4s3a', type: 'output',
          title: 'Why `regex=False`?',
          prompt: 'What does this print?',
          code: `s = pd.Series(["EU-SOUTH", "EU-WEST"])
print(s.str.replace("EU-", "", regex=False).tolist())

v = pd.Series(["v1.0", "v2.5"])
print(v.str.replace(".", "_", regex=False).tolist())
print(v.str.replace(".", "_", regex=True).tolist())`,
          answer: `['SOUTH', 'WEST']
['v1_0', 'v2_5']
['____', '____']`,
          hint: 'In a regular expression, `.` means "any character".',
          explain: '`"EU-"` contains no special characters, so the result would be the same with or without regex. But `regex=False` states clearly that we mean <b>literal text</b>, and it protects us from surprises like the last line, where every character was replaced.'
        },
        {
          id: 'e4s3b', type: 'fill',
          title: 'Build the DataFrame and the KPI table',
          prompt: 'Complete the first part of Step 3.',
          code: `orders_df = pd.DataFrame({{valid_orders}})
orders_df["GrossRevenue"] = gross_arr
orders_df["DiscountRate"] = disc_rate_arr
orders_df["NetRevenue"] = {{net_arr}}
orders_df["TotalWithVAT"] = total_vat_arr
orders_df["RegionZone"] = orders_df["Region"].{{str}}.replace("EU-", "", regex=False)

cat_kpis = orders_df.groupby({{"Category"}}).agg(
    Orders=("OrderID", {{"count"}}),
    UnitsSold=("Qty", {{"sum"}}),
    NetRevenue=("NetRevenue", "sum"),
    AvgDiscount=("DiscountRate", {{"mean"}})
).round(2)`,
          hint: 'To count the orders, count the values of a column that is never empty, like `OrderID`.',
          explain: 'Adding the arrays as columns works because `valid_orders` and the NumPy arrays have the <b>same length and the same order</b>, a consequence of building both from the same list.'
        },
        {
          id: 'e4s3c', type: 'quiz',
          title: 'A strange rounding',
          prompt: 'BOOK has two orders with discounts `0.12` and `0.05`. The average is 0.085, yet `cat_kpis` shows `AvgDiscount = 0.08`. Why?',
          options: [
            'Floating-point numbers cannot store 0.085 exactly: it is saved as 0.08499999…, which rounds down',
            'Pandas always truncates decimals instead of rounding',
            'BOOK actually has three orders',
            '`.round(2)` rounds every value down'
          ],
          answer: 0,
          why: ['', 'Pandas rounds normally: ELEC\'s 0.0967 becomes 0.10, which is rounding up.', 'BOOK has 2 valid orders: ORD-105 and ORD-108.', 'ELEC goes from 0.0967 up to 0.10.'],
          explain: 'Computers store decimals in binary, so `(0.12 + 0.05) / 2` is actually `0.08499999999999999`, and that rounds to <b>0.08</b>. It does not matter for a report, but it is why money is often stored in cents (integers) in real systems.'
        },
        {
          id: 'e4s3d', type: 'fill',
          title: 'Build the pivot table',
          prompt: 'Rows = categories, columns = region zones, cells = total net revenue.',
          code: `pivot_rev = orders_df.{{pivot_table}}(
    index={{"Category"}}, columns={{"RegionZone"}}, values="NetRevenue", aggfunc={{"sum"}}, fill_value={{0.0|0}}
).round(2)`,
          explain: 'A pivot table is a <b>two-way groupby</b>: it groups by category and by region at the same time and puts one dimension on the rows, the other on the columns.'
        },
        {
          id: 'e4s3e', type: 'quiz',
          title: 'Reading the pivot table',
          prompt: 'What is the value of `pivot_rev` in row `HOME`, column `NORTH`?',
          options: ['`0.0`', '`NaN`', '`170.0`', 'There is no `HOME` row'],
          answer: 0,
          why: ['', 'It would be `NaN` <em>without</em> `fill_value=0.0`.', '$170.00 is HOME\'s only order, but it was shipped to the WEST zone.', 'HOME has one valid order (ORD-102), so the row exists. ORD-106 was rejected.'],
          explain: 'No HOME order went to the NORTH zone, so the cell has nothing to sum. `fill_value=0.0` writes 0 instead of `NaN`, which is the right meaning here: <b>zero revenue</b>, not "unknown".'
        }
      ],
      checkpoint: {
        code: `# --- STEP 3: Pandas analytics & pivot tables ---
orders_df = pd.DataFrame(valid_orders)
orders_df["GrossRevenue"] = gross_arr
orders_df["DiscountRate"] = disc_rate_arr
orders_df["NetRevenue"] = net_arr
orders_df["TotalWithVAT"] = total_vat_arr
orders_df["RegionZone"] = orders_df["Region"].str.replace("EU-", "", regex=False)

cat_kpis = orders_df.groupby("Category").agg(
    Orders=("OrderID", "count"),
    UnitsSold=("Qty", "sum"),
    NetRevenue=("NetRevenue", "sum"),
    AvgDiscount=("DiscountRate", "mean")
).round(2)

pivot_rev = orders_df.pivot_table(
    index="Category", columns="RegionZone", values="NetRevenue", aggfunc="sum", fill_value=0.0
).round(2)`,
        check: `print(orders_df[["OrderID", "Category", "Qty", "NetRevenue", "RegionZone"]])
print(cat_kpis)
print(pivot_rev)`,
        output: `   OrderID Category  Qty  NetRevenue RegionZone
0  ORD-101     ELEC    4      113.96      SOUTH
1  ORD-102     HOME    2      170.00       WEST
2  ORD-104     ELEC    8      774.40      NORTH
3  ORD-105     BOOK   10      347.60      SOUTH
4  ORD-107     ELEC    6      158.35       WEST
5  ORD-108     BOOK    3       96.90      NORTH
          Orders  UnitsSold  NetRevenue  AvgDiscount
Category
BOOK           2         13      444.50         0.08
ELEC           3         18     1046.71         0.10
HOME           1          2      170.00         0.00
RegionZone  NORTH   SOUTH    WEST
Category
BOOK         96.9  347.60    0.00
ELEC        774.4  113.96  158.35
HOME          0.0    0.00  170.00`,
        note: 'Check: the row totals of the pivot table equal the `NetRevenue` column of `cat_kpis` (e.g. ELEC: 774.40 + 113.96 + 158.35 = 1046.71). Two views of the same numbers must always agree.'
      }
    },

    /* ======================= STEP 4 ======================= */
    {
      short: 'Report',
      title: 'Exporting clean datasets & automated executive report',
      tags: ['CSV export', 'File reading', 'File writing', 'Formatting'],
      goal: 'Deliver the results: two CSV files for analysts and a one-page text report for managers, with the pipeline health (how many lines were rejected) at the top.',
      tasks: [
        'Export `orders_df` to `"ecommerce_orders_clean.csv"` (`index=False`) and the category KPI table to `"category_kpis.csv"`.',
        'Read `"order_errors.log"` to count how many corrupted or invalid lines were quarantined.',
        'Write `"executive_sales_report.txt"` with: pipeline health counts, total net and VAT-inclusive revenue, the NumPy revenue percentiles, the category KPI table and the category × region zone pivot table.'
      ],
      tips: [
        { title: '`index=False` or not?', text: 'Drop the index when it is just 0…n-1. Keep it when it carries information, like the category names of a groupby result.' },
        { title: '`readlines()`', text: 'Returns a list with one string per line. Its `len()` is the number of lines.' },
        { title: '`DataFrame.to_string()`', text: 'The same nicely aligned text you see with `print(df)`, as a string you can `write()` to a file.' },
        { title: 'Money in f-strings', text: '`f"\${value:.2f}"`: the `$` is plain text, `{value:.2f}` is the number with 2 decimals.' }
      ],
      exercises: [
        {
          id: 'e4s4a', type: 'quiz',
          title: 'Two different `to_csv` calls',
          prompt: 'The solution writes `orders_df.to_csv(..., index=False)` but `cat_kpis.to_csv(...)` <b>without</b> `index=False`. Why?',
          options: [
            'In `cat_kpis` the index holds the category names (BOOK, ELEC, HOME), which we need to keep',
            '`index=False` only works on DataFrames with more than 5 rows',
            'It is a mistake: both should use `index=False`',
            'Without `index=False` the file is written faster'
          ],
          answer: 0,
          why: ['', 'There is no such rule.', 'With `index=False`, `category_kpis.csv` would lose the category column and the numbers would be meaningless.', 'Speed has nothing to do with it.'],
          explain: 'After a `groupby` the group keys become the <b>index</b>. In `orders_df` the index is just 0…5, already represented by `OrderID`. So the first line of `category_kpis.csv` is `Category,Orders,UnitsSold,NetRevenue,AvgDiscount`.'
        },
        {
          id: 'e4s4b', type: 'fill',
          title: 'Export and count the errors',
          prompt: 'Complete the export and the error count.',
          code: `orders_df.to_csv("ecommerce_orders_clean.csv", index={{False}})
cat_kpis.{{to_csv}}("category_kpis.csv")

with open("order_errors.log", {{"r"}}, encoding="utf-8") as f_err:
    error_lines = f_err.{{readlines}}()`,
          explain: 'We count the errors by <b>reading the log back</b> instead of trusting a counter in memory. The report shows what was actually written to disk.'
        },
        {
          id: 'e4s4c', type: 'output', context: 'previous',
          title: 'What is in the error log?',
          prompt: 'This runs <b>after Steps 1–3</b>, so `order_errors.log` already exists. What does it print?',
          code: `with open("order_errors.log", "r", encoding="utf-8") as f_err:
    error_lines = f_err.readlines()
print(len(error_lines))
print(error_lines[1].split("]")[0] + "]")
print(len(orders_df) + len(error_lines))`,
          answer: `2
Line 6 [NON_POSITIVE_QTY]
8`,
          hint: '`error_lines[1]` is the <em>second</em> line of the log.',
          explain: '6 valid + 2 quarantined = <b>8</b>, the number of raw lines. This balance check (records in = records out) is the simplest way to prove that a pipeline lost nothing.'
        },
        {
          id: 'e4s4d', type: 'order',
          title: 'Assemble the executive report',
          prompt: 'Put the report writer in order, following the requirements: health counts, revenue totals, percentiles, KPI table, pivot table.',
          lines: [
            'with open("executive_sales_report.txt", "w", encoding="utf-8") as f_rep:',
            '    f_rep.write("=== E-COMMERCE EXECUTIVE INTELLIGENCE REPORT ===\\n")',
            '    f_rep.write(f"Valid Orders Processed: {len(orders_df)} | Quarantined Errors: {len(error_lines)}\\n")',
            '    f_rep.write(f"Total Net Revenue: ${np.sum(net_arr):.2f} | Total Incl. VAT: ${np.sum(total_vat_arr):.2f}\\n")',
            '    f_rep.write(f"Order Net Revenue Percentiles -> 25th: ${p25:.2f} | Median: ${p50:.2f} | 75th: ${p75:.2f}\\n\\n")',
            '    f_rep.write("--- CATEGORY PERFORMANCE ---\\n")',
            '    f_rep.write(cat_kpis.to_string() + "\\n\\n")',
            '    f_rep.write("--- NET REVENUE PIVOT (CATEGORY x REGION ZONE) ---\\n")',
            '    f_rep.write(pivot_rev.to_string() + "\\n")'
          ],
          hint: 'Each section header comes directly before its table.',
          explain: 'An executive report goes from the most general to the most detailed: is the data trustworthy (health), how much did we sell (totals), how are the orders spread (percentiles), and then the breakdowns.'
        },
        {
          id: 'e4s4e', type: 'output',
          title: 'Formatting money and percentages',
          prompt: 'What does this print?',
          code: `total = 1661.2099999999998
print(f"Total: \${total:.2f}")
print(f"[{'ELEC':<6}]")
print(f"{0.12:.0%}")`,
          answer: `Total: $1661.21
[ELEC  ]
12%`,
          hint: 'The `%` format multiplies by 100 and adds a percent sign.',
          explain: 'Sums of floats often end in long tails like `…99999998`. Always format money with `:.2f`. `:.0%` is a handy way to show a rate like 0.12 as <b>12%</b>; you could use it for `AvgDiscount` in the report.'
        }
      ],
      checkpoint: {
        intro: 'The last piece. After running the whole program you will find five files next to your script (including the raw input and the error log).',
        code: `# --- STEP 4: Export CSVs & executive management report ---
orders_df.to_csv("ecommerce_orders_clean.csv", index=False)
cat_kpis.to_csv("category_kpis.csv")

with open("order_errors.log", "r", encoding="utf-8") as f_err:
    error_lines = f_err.readlines()

with open("executive_sales_report.txt", "w", encoding="utf-8") as f_rep:
    f_rep.write("=== E-COMMERCE EXECUTIVE INTELLIGENCE REPORT ===\\n")
    f_rep.write(f"Valid Orders Processed: {len(orders_df)} | Quarantined Errors: {len(error_lines)}\\n")
    f_rep.write(f"Total Net Revenue: \${np.sum(net_arr):.2f} | Total Incl. VAT: \${np.sum(total_vat_arr):.2f}\\n")
    f_rep.write(f"Order Net Revenue Percentiles -> 25th: \${p25:.2f} | Median: \${p50:.2f} | 75th: \${p75:.2f}\\n\\n")
    f_rep.write("--- CATEGORY PERFORMANCE ---\\n")
    f_rep.write(cat_kpis.to_string() + "\\n\\n")
    f_rep.write("--- NET REVENUE PIVOT (CATEGORY x REGION ZONE) ---\\n")
    f_rep.write(pivot_rev.to_string() + "\\n")

print(cat_kpis)
print("\\nPivot Table:")
print(pivot_rev)`,
        check: `with open("executive_sales_report.txt", "r", encoding="utf-8") as f:
    print(f.read())`,
        output: `          Orders  UnitsSold  NetRevenue  AvgDiscount
Category
BOOK           2         13      444.50         0.08
ELEC           3         18     1046.71         0.10
HOME           1          2      170.00         0.00

Pivot Table:
RegionZone  NORTH   SOUTH    WEST
Category
BOOK         96.9  347.60    0.00
ELEC        774.4  113.96  158.35
HOME          0.0    0.00  170.00
=== E-COMMERCE EXECUTIVE INTELLIGENCE REPORT ===
Valid Orders Processed: 6 | Quarantined Errors: 2
Total Net Revenue: $1661.21 | Total Incl. VAT: $2026.68
Order Net Revenue Percentiles -> 25th: $125.06 | Median: $164.18 | 75th: $303.20

--- CATEGORY PERFORMANCE ---
          Orders  UnitsSold  NetRevenue  AvgDiscount
Category
BOOK           2         13      444.50         0.08
ELEC           3         18     1046.71         0.10
HOME           1          2      170.00         0.00

--- NET REVENUE PIVOT (CATEGORY x REGION ZONE) ---
RegionZone  NORTH   SOUTH    WEST
Category
BOOK         96.9  347.60    0.00
ELEC        774.4  113.96  158.35
HOME          0.0    0.00  170.00`,
        note: 'The report is built from the same objects you printed at each checkpoint. Writing `to_string()` into a file is a quick way to get readable tables without extra libraries.'
      }
    }
  ];

  window.EX4 = {
    key: 'ex4',
    file: 'exercise4_ecommerce.py',
    starter: STARTER,
    steps,
    solution: steps.map((s) => s.checkpoint.code).join('\n\n'),
    wrapUp: 'Here is the whole system in one script: ingestion with error quarantine, the NumPy pricing engine, the Pandas analytics and the automated report. It matches the reference solution in the workbook, so this is the capstone of the course.',
    finalOutput: `          Orders  UnitsSold  NetRevenue  AvgDiscount
Category
BOOK           2         13      444.50         0.08
ELEC           3         18     1046.71         0.10
HOME           1          2      170.00         0.00

Pivot Table:
RegionZone  NORTH   SOUTH    WEST
Category
BOOK         96.9  347.60    0.00
ELEC        774.4  113.96  158.35
HOME          0.0    0.00  170.00`,
    files: [
      {
        name: 'order_errors.log',
        content: `Line 3 [MALFORMED_FIELDS]: ORD-103 | CORRUPTED_LINE_MISSING_FIELDS
Line 6 [NON_POSITIVE_QTY]: ORD-106 | sku-home-310 | Smart LED Desk Lamp | qty:0 | price:$45.00 | reg:eu-west`
      },
      {
        name: 'ecommerce_orders_clean.csv',
        content: `OrderID,SKU,Category,Product,Qty,UnitPrice,Region,GrossRevenue,DiscountRate,NetRevenue,TotalWithVAT,RegionZone
ORD-101,SKU-ELEC-401,ELEC,Wireless Ergonomic Mouse,4,29.99,EU-SOUTH,119.96,0.05,113.96,139.03,SOUTH
ORD-102,SKU-HOME-205,HOME,Stainless Espresso Maker,2,85.0,EU-WEST,170.0,0.0,170.0,207.4,WEST
ORD-104,SKU-ELEC-890,ELEC,Mechanical Keyboard Rgb,8,110.0,EU-NORTH,880.0,0.12,774.4,944.77,NORTH
ORD-105,SKU-BOOK-112,BOOK,Python Data Science Guide,10,39.5,EU-SOUTH,395.0,0.12,347.6,424.07,SOUTH
ORD-107,SKU-ELEC-401,ELEC,Wireless Ergonomic Mouse,6,29.99,EU-WEST,179.94,0.12,158.35,193.19,WEST
ORD-108,SKU-BOOK-204,BOOK,Practical Sql Handbook,3,34.0,EU-NORTH,102.0,0.05,96.9,118.22,NORTH`
      },
      {
        name: 'category_kpis.csv',
        content: `Category,Orders,UnitsSold,NetRevenue,AvgDiscount
BOOK,2,13,444.5,0.08
ELEC,3,18,1046.71,0.1
HOME,1,2,170.0,0.0`
      },
      {
        name: 'executive_sales_report.txt',
        content: `=== E-COMMERCE EXECUTIVE INTELLIGENCE REPORT ===
Valid Orders Processed: 6 | Quarantined Errors: 2
Total Net Revenue: $1661.21 | Total Incl. VAT: $2026.68
Order Net Revenue Percentiles -> 25th: $125.06 | Median: $164.18 | 75th: $303.20

--- CATEGORY PERFORMANCE ---
          Orders  UnitsSold  NetRevenue  AvgDiscount
Category
BOOK           2         13      444.50         0.08
ELEC           3         18     1046.71         0.10
HOME           1          2      170.00         0.00

--- NET REVENUE PIVOT (CATEGORY x REGION ZONE) ---
RegionZone  NORTH   SOUTH    WEST
Category
BOOK         96.9  347.60    0.00
ELEC        774.4  113.96  158.35
HOME          0.0    0.00  170.00`
      }
    ]
  };
})();
