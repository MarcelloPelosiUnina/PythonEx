import numpy as np
import pandas as pd

# --- STEP 1: Parse telemetry strings & flag missing values ---
telemetry = [
    "stn_rome#2026-07-10#TEMP:33.4C#HUM:58%",
    "stn_milan#2026-07-10#TEMP:29.0C#HUM:72%",
    "stn_naples#2026-07-10#TEMP:ERR#HUM:64%",
    "stn_rome#2026-07-11#TEMP:35.8C#HUM:52%",
    "stn_milan#2026-07-11#TEMP:31.2C#HUM:68%",
    "stn_naples#2026-07-11#TEMP:34.0C#HUM:61%",
    "stn_rome#2026-07-12#TEMP:36.5C#HUM:49%",
    "stn_milan#2026-07-12#TEMP:ERR#HUM:75%",
    "stn_naples#2026-07-12#TEMP:33.1C#HUM:66%"
]

stations, dates, raw_temps, humidities = [], [], [], []

for record in telemetry:
    stn_part, date_part, temp_part, hum_part = record.strip().split("#")
    stations.append(stn_part.replace("stn_", "").upper())
    dates.append(date_part)

    temp_str = temp_part.replace("TEMP:", "").replace("C", "")
    raw_temps.append(np.nan if temp_str == "ERR" else float(temp_str))

    hum_str = hum_part.replace("HUM:", "").replace("%", "")
    humidities.append(float(hum_str))

# --- STEP 2: NumPy imputation & vectorized transformations ---
temp_raw_arr = np.array(raw_temps, dtype=float)
hum_arr = np.array(humidities, dtype=float)

was_imputed = np.isnan(temp_raw_arr)
valid_mean_temp = np.nanmean(temp_raw_arr)
temp_c = np.round(np.where(was_imputed, valid_mean_temp, temp_raw_arr), 2)
temp_f = np.round(temp_c * 9.0 / 5.0 + 32.0, 2)
alerts = np.where(temp_c >= 33.5, "HEATWAVE", "NORMAL")

# --- STEP 3: Build Pandas DataFrame & engineer heat index ---
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
df = df.sort_values(by="HeatIndex_C", ascending=False).reset_index(drop=True)

# --- STEP 4: GroupBy summary & automated bulletin file ---
station_summary = df.groupby("Station").agg(
    Max_Temp_C=("Temp_C", "max"),
    Mean_Temp_C=("Temp_C", "mean"),
    Mean_Humidity=("Humidity", "mean"),
    Peak_HeatIndex=("HeatIndex_C", "max")
).round(2)

df.to_csv("weather_telemetry_clean.csv", index=False)

with open("weather_alert_bulletin.txt", "w", encoding="utf-8") as f:
    f.write("=== NATIONAL WEATHER SENSOR BULLETIN ===\n")
    f.write(f"Imputed Missing Readings: {int(np.sum(was_imputed))} (Filled with {valid_mean_temp:.2f} C)\n\n")
    f.write("--- STATION SUMMARY ---\n")
    for city, row in station_summary.iterrows():
        f.write(f"{city:<8} | Max: {row['Max_Temp_C']} C | Avg: {row['Mean_Temp_C']} C | Peak HI: {row['Peak_HeatIndex']} C\n")
    f.write("\n--- ACTIVE HEATWAVE ALERTS (Temp >= 33.5 C) ---\n")
    heat_df = df[df["AlertStatus"] == "HEATWAVE"]
    for _, r in heat_df.iterrows():
        f.write(f"* {r['Date']} - {r['Station']}: {r['Temp_C']} C ({r['Temp_F']} F), Humidity {r['Humidity']}%\n")

print(station_summary)
