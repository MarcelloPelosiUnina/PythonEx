import numpy as np
import pandas as pd

# --- STEP 1: Write raw orders, parse & quarantine errors ---
raw_lines = [
    "ORD-101 | sku-elec-401 | Wireless Ergonomic Mouse | qty:4 | price:$29.99 | reg:eu-south",
    "ORD-102 | sku-home-205 | Stainless Espresso Maker | qty:2 | price:$85.00 | reg:eu-west",
    "ORD-103 | CORRUPTED_LINE_MISSING_FIELDS",
    "ORD-104 | sku-elec-890 | Mechanical KeyBoard RGB | qty:8 | price:$110.00 | reg:eu-north",
    "ORD-105 | sku-book-112 | Python Data Science Guide | qty:10 | price:$39.50 | reg:eu-south",
    "ORD-106 | sku-home-310 | Smart LED Desk Lamp | qty:0 | price:$45.00 | reg:eu-west",
    "ORD-107 | sku-elec-401 | wireless ergonomic mouse | qty:6 | price:$29.99 | reg:eu-west",
    "ORD-108 | sku-book-204 | Practical SQL Handbook | qty:3 | price:$34.00 | reg:eu-north"
]

with open("raw_orders.txt", "w", encoding="utf-8") as f:
    for line in raw_lines:
        f.write(line + "\n")

valid_orders = []
with open("raw_orders.txt", "r", encoding="utf-8") as f_in, \
     open("order_errors.log", "w", encoding="utf-8") as f_err:

    for line_num, line in enumerate(f_in, start=1):
        clean = line.strip()
        if not clean:
            continue
        parts = [p.strip() for p in clean.split("|")]
        if len(parts) != 6:
            f_err.write(f"Line {line_num} [MALFORMED_FIELDS]: {clean}\n")
            continue

        ord_id, sku_raw, prod_raw, qty_raw, price_raw, reg_raw = parts
        qty = int(qty_raw.replace("qty:", ""))
        if qty <= 0:
            f_err.write(f"Line {line_num} [NON_POSITIVE_QTY]: {clean}\n")
            continue

        sku = sku_raw.upper()
        category = sku.split("-")[1]
        product = prod_raw.title()
        unit_price = float(price_raw.replace("price:$", ""))
        region = reg_raw.replace("reg:", "").upper()

        valid_orders.append({
            "OrderID": ord_id, "SKU": sku, "Category": category,
            "Product": product, "Qty": qty, "UnitPrice": unit_price, "Region": region
        })

# --- STEP 2: NumPy tiered discount & tax vectorization ---
qty_arr = np.array([o["Qty"] for o in valid_orders])
price_arr = np.array([o["UnitPrice"] for o in valid_orders])

gross_arr = np.round(qty_arr * price_arr, 2)
disc_rate_arr = np.where(qty_arr >= 6, 0.12, np.where(qty_arr >= 3, 0.05, 0.0))
net_arr = np.round(gross_arr * (1.0 - disc_rate_arr), 2)
total_vat_arr = np.round(net_arr * 1.22, 2)
p25, p50, p75 = np.percentile(net_arr, [25, 50, 75])

# --- STEP 3: Pandas analytics & pivot tables ---
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
).round(2)

# --- STEP 4: Export CSVs & executive management report ---
orders_df.to_csv("ecommerce_orders_clean.csv", index=False)
cat_kpis.to_csv("category_kpis.csv")

with open("order_errors.log", "r", encoding="utf-8") as f_err:
    error_lines = f_err.readlines()

with open("executive_sales_report.txt", "w", encoding="utf-8") as f_rep:
    f_rep.write("=== E-COMMERCE EXECUTIVE INTELLIGENCE REPORT ===\n")
    f_rep.write(f"Valid Orders Processed: {len(orders_df)} | Quarantined Errors: {len(error_lines)}\n")
    f_rep.write(f"Total Net Revenue: ${np.sum(net_arr):.2f} | Total Incl. VAT: ${np.sum(total_vat_arr):.2f}\n")
    f_rep.write(f"Order Net Revenue Percentiles -> 25th: ${p25:.2f} | Median: ${p50:.2f} | 75th: ${p75:.2f}\n\n")
    f_rep.write("--- CATEGORY PERFORMANCE ---\n")
    f_rep.write(cat_kpis.to_string() + "\n\n")
    f_rep.write("--- NET REVENUE PIVOT (CATEGORY x REGION ZONE) ---\n")
    f_rep.write(pivot_rev.to_string() + "\n")

print(cat_kpis)
print("\nPivot Table:")
print(pivot_rev)
