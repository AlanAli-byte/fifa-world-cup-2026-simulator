import pandas as pd
import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf
import pickle
import os
import warnings

warnings.filterwarnings("ignore")

print("--- REBUILDING PRODUCTION ENGINE (8-YEAR DECAY) ---")


# Data Loading

df = pd.read_csv("data/processed/matches.csv")
df["date"] = pd.to_datetime(df["date"], errors="coerce")

df = df.dropna(
    subset=[
        "home_score",
        "away_score",
        "home_team",
        "away_team",
        "date"
    ]
).copy()

team_counts = pd.concat([
    df["home_team"],
    df["away_team"]
]).value_counts()

valid_teams = team_counts[team_counts >= 30].index

df = df[
    df["home_team"].isin(valid_teams) &
    df["away_team"].isin(valid_teams)
].copy()

max_date = df["date"].max()

df["days_old"] = (
    max_date - df["date"]
).dt.days


# Match Data

home_df = df[
    ["days_old", "home_team", "away_team", "home_score"]
].copy()

home_df.columns = [
    "days_old",
    "team",
    "opponent",
    "goals"
]

if "neutral" in df.columns:
    home_df["is_home_advantage"] = np.where(
        df["neutral"],
        0,
        1
    )
else:
    home_df["is_home_advantage"] = 1

away_df = df[
    ["days_old", "away_team", "home_team", "away_score"]
].copy()

away_df.columns = [
    "days_old",
    "team",
    "opponent",
    "goals"
]

away_df["is_home_advantage"] = 0

model_data = pd.concat(
    [home_df, away_df],
    ignore_index=True
)


# Recency Weights

print("Applying 8-year exponential time decay...")

model_data["weight"] = np.clip(
    np.exp(-model_data["days_old"] / (365 * 8)),
    1e-4,
    1.0
)


# Model Training

print("Fitting Poisson GLM... (This may take a moment)")

glm = smf.glm(
    formula="goals ~ team + opponent + is_home_advantage",
    data=model_data,
    family=sm.families.Poisson(),
    freq_weights=np.asarray(model_data["weight"])
).fit()


# Save Model

os.makedirs("models", exist_ok=True)

model_path = "models/production_poisson_engine.pkl"

glm.remove_data()

artifact = {
    "model_params": glm.params,
    "valid_teams": list(valid_teams)
}

with open(model_path, "wb") as f:
    pickle.dump(artifact, f)

print(f"Success! Production model saved to {model_path}")