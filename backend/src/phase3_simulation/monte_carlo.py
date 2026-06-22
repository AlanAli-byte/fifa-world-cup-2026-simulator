# src/phase3_simulation/monte_carlo.py

import numpy as np
import pandas as pd
from collections import Counter
import time
from src.phase3_simulation.match_simulator import MatchSimulator
from src.phase3_simulation.tournament_engine import TournamentEngine


def run_match_calibration_probe(simulator, samples=10000):
    print("=========================================================")
    print("        STAGE 1: PRNG MATCH SAMPLING CALIBRATION TEST")
    print("=========================================================")

    home, away = "Argentina", "France"

    print(f"Simulating [{home} vs {away}] across {samples:,} independent trials...")

    analytics = simulator.compute_match_analytics(
        home,
        away,
        neutral=True
    )

    empirical_counts = {
        "home_win": 0,
        "draw": 0,
        "away_win": 0
    }

    # Calibration Simulation
    for _ in range(samples):
        h_g = np.random.poisson(analytics['home_lambda'])
        a_g = np.random.poisson(analytics['away_lambda'])

        if h_g > a_g:
            empirical_counts["home_win"] += 1
        elif h_g < a_g:
            empirical_counts["away_win"] += 1
        else:
            empirical_counts["draw"] += 1

    f_home = empirical_counts["home_win"] / samples
    f_draw = empirical_counts["draw"] / samples
    f_away = empirical_counts["away_win"] / samples

    print("\n--- ERROR VARIANCE SEPARATION MATRIX ---")
    print(f"{'Outcome Type':<15} | {'Analytical Prob':<16} | {'Empirical Freq':<16} | {'Absolute Error':<14}")
    print("-" * 71)
    print(f"{'Home Win (Arg)':<15} | {analytics['p_home']:<16.4f} | {f_home:<16.4f} | {abs(analytics['p_home'] - f_home):.4f}")
    print(f"{'Draw':<15} | {analytics['p_draw']:<16.4f} | {f_draw:<16.4f} | {abs(analytics['p_draw'] - f_draw):.4f}")
    print(f"{'Away Win (Fra)':<15} | {analytics['p_away']:<16.4f} | {f_away:<16.4f} | {abs(analytics['p_away'] - f_away):.4f}")
    print("-" * 71)

    max_error = max(
        abs(analytics['p_home'] - f_home),
        abs(analytics['p_draw'] - f_draw),
        abs(analytics['p_away'] - f_away)
    )

    if max_error <= 0.015:
        print(" -> STAGE 1 RESULT: PASSED  (Sampling frequency converges with model math)\n")
        return True
    else:
        print(" -> STAGE 1 RESULT: FAILED  (Unacceptable sampling distortion detected)\n")
        return False


def run_tournament_forecast_loop(tournaments=10000):
    print("=========================================================")
    print("        STAGE 2: SCALE MONTE CARLO TOURNAMENT FORECAST")
    print("=========================================================")

    print("Initializing 48-team tournament environments...")

    start_time = time.time()
    engine = TournamentEngine()

    champion_counter = Counter()
    runner_up_counter = Counter()
    resolution_counter = Counter()

    print(f"Simulating {tournaments:,} complete tournament universes...")
    print("Processing running (logging updates every 20% complete)...")

    checkpoint = tournaments // 5 if tournaments >= 5 else 1

    # Tournament Simulation
    for sim_id in range(1, tournaments + 1):
        res = engine.run_full_tournament(verbose=False)

        champion_counter[res['champion']] += 1
        runner_up_counter[res['runner_up']] += 1
        resolution_counter[res['final_resolution']] += 1

        if sim_id % checkpoint == 0:
            print(
                f" -> Progress Checkpoint: "
                f"{sim_id}/{tournaments} Universes Simulated "
                f"({(sim_id/tournaments)*100:.0f}%)"
            )

    elapsed = time.time() - start_time

    # Results
    leaderboard = []

    all_finalists = set(
        list(champion_counter.keys()) +
        list(runner_up_counter.keys())
    )

    for team in all_finalists:
        champs = champion_counter.get(team, 0)
        runners = runner_up_counter.get(team, 0)

        champ_prob = (champs / tournaments) * 100
        final_prob = ((champs + runners) / tournaments) * 100

        leaderboard.append({
            "Team": team,
            "Championships": champs,
            "Win Pct": champ_prob,
            "Reach Final Pct": final_prob
        })

    sorted_leaderboard = sorted(
        leaderboard,
        key=lambda x: x['Win Pct'],
        reverse=True
    )

    print("\n=========================================================================")
    print("         WORLD CUP 2026 DEFINITIVE FORECASTING LEADERBOARD")
    print("=========================================================================")
    print(f"{'Rank':<5} | {'Nation Identity':<16} | {'Trophies':<10} | {'Win Trophy %':<14} | {'Reach Final %':<12}")
    print("-" * 72)

    for rank, item in enumerate(sorted_leaderboard[:15]):
        print(
            f"{rank+1:<5} | "
            f"{item['Team']:<16} | "
            f"{item['Championships']:<10} | "
            f"{item['Win Pct']:>11.2f}% | "
            f"{item['Reach Final Pct']:>11.2f}%"
        )

    print("=========================================================================")

    print("\n--- HISTORICAL FINAL MATCH PATH RESOLUTIONS ---")

    for res_type, count in resolution_counter.items():
        print(
            f" -> Finals Resolved via {res_type:<12} : "
            f"{count:<5} matches "
            f"({(count/tournaments)*100:.2f}%)"
        )

    print(
        f"\nExecution complete in {elapsed:.2f} seconds. "
        f"Rate: {tournaments/elapsed:.1f} tournaments/sec.\n"
    )

    formatted_champions = [
        {
            "team": item["Team"],
            "probability": item["Win Pct"] / 100.0
        }
        for item in sorted_leaderboard
    ]

    formatted_finalists = [
        {
            "team": item["Team"],
            "probability": item["Reach Final Pct"] / 100.0
        }
        for item in sorted_leaderboard
    ]

    return {
        "champions": formatted_champions,
        "finalists": formatted_finalists,
        "metrics": {
            "normal_time": resolution_counter.get("90 Mins", 0),
            "extra_time": resolution_counter.get("Extra Time", 0),
            "penalties": resolution_counter.get("Penalties", 0)
        }
    }


if __name__ == "__main__":
    sim_instance = MatchSimulator()

    if run_match_calibration_probe(sim_instance, samples=10000):
        run_tournament_forecast_loop(tournaments=10000)