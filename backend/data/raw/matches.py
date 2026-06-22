import pandas as pd

df = pd.read_csv(
    "data/processed/pre_world_cup_matches.csv"
)

print(df["date"].max())