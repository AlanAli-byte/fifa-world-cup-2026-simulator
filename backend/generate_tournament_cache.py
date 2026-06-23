import json

from src.phase3_simulation.monte_carlo import (
    run_tournament_forecast_loop
)

print("Running 5000 tournament simulations...")

stats = run_tournament_forecast_loop(5000)

with open(
    "cache/tournament_stats.json",
    "w",
    encoding="utf-8"
) as f:
    json.dump(
        stats,
        f,
        indent=2
    )

print("Cache generated.")