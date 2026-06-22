# src/phase3_simulation/knockout_engine.py

import numpy as np
from src.phase3_simulation.match_simulator import MatchSimulator


class KnockoutEngine:
    def __init__(self, simulator=None):
        self.simulator = simulator if simulator else MatchSimulator()

    def simulate_penalty_shootout(self):
        p_success = 0.75

        h_score, a_score = 0, 0

        # Penalty Shootout
        for kick in range(5):
            if np.random.rand() < p_success:
                h_score += 1
            if np.random.rand() < p_success:
                a_score += 1

        while h_score == a_score:
            h_kick = 1 if np.random.rand() < p_success else 0
            a_kick = 1 if np.random.rand() < p_success else 0

            h_score += h_kick
            a_score += a_kick

        return h_score, a_score

    def simulate_knockout_match(self, home_team, away_team):
        analytics = self.simulator.compute_match_analytics(
            home_team,
            away_team,
            neutral=True
        )

        # Regular Time
        h_90 = np.random.poisson(analytics['home_lambda'])
        a_90 = np.random.poisson(analytics['away_lambda'])

        score_90 = (h_90, a_90)

        if h_90 > a_90:
            return {
                "winner": home_team,
                "loser": away_team,
                "score_90": score_90,
                "score_120": None,
                "shootout": None,
                "resolved_via": "90 Mins"
            }
        elif h_90 < a_90:
            return {
                "winner": away_team,
                "loser": home_team,
                "score_90": score_90,
                "score_120": None,
                "shootout": None,
                "resolved_via": "90 Mins"
            }

        # Extra Time
        h_et = np.random.poisson(analytics['home_lambda'] / 3.0)
        a_et = np.random.poisson(analytics['away_lambda'] / 3.0)

        h_120 = h_90 + h_et
        a_120 = a_90 + a_et

        score_120 = (h_120, a_120)

        if h_120 > a_120:
            return {
                "winner": home_team,
                "loser": away_team,
                "score_90": score_90,
                "score_120": score_120,
                "shootout": None,
                "resolved_via": "Extra Time"
            }
        elif h_120 < a_120:
            return {
                "winner": away_team,
                "loser": home_team,
                "score_90": score_90,
                "score_120": score_120,
                "shootout": None,
                "resolved_via": "Extra Time"
            }

        # Penalties
        h_pk, a_pk = self.simulate_penalty_shootout()
        shootout_score = (h_pk, a_pk)

        winner = home_team if h_pk > a_pk else away_team
        loser = away_team if winner == home_team else home_team

        return {
            "winner": winner,
            "loser": loser,
            "score_90": score_90,
            "score_120": score_120,
            "shootout": shootout_score,
            "resolved_via": "Penalties"
        }


if __name__ == "__main__":
    print("Testing Standalone Knockout Simulation Framework...")

    engine = KnockoutEngine()

    home, away = "France", "Argentina"

    print(f"\nSimulating 5 alternative universe iterations for {home} vs {away} (Knockout Node):")

    for i in range(5):
        res = engine.simulate_knockout_match(home, away)

        print(f"\n -> Universe Realization #{i+1} (Resolved via {res['resolved_via']})")
        print(f"    Regular Time (90m) : {home} {res['score_90'][0]} - {res['score_90'][1]} {away}")

        if res['score_120']:
            print(f"    Extra Time (120m)  : {home} {res['score_120'][0]} - {res['score_120'][1]} {away}")

        if res['shootout']:
            print(
                f"    Penalty Shootout   : "
                f"{home} {res['shootout'][0]} - {res['shootout'][1]} {away} "
                f"(Winner: {res['winner']})"
            )

    print()