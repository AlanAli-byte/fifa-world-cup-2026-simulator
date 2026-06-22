# src/phase3_simulation/tournament_engine.py

import pandas as pd
import numpy as np
from src.phase3_simulation.match_simulator import MatchSimulator
from src.phase3_simulation.knockout_engine import KnockoutEngine
from src.phase3_simulation.group_stage_engine import GroupStageEngine


class TournamentEngine:
    def __init__(self):
        self.simulator = MatchSimulator()
        self.group_engine = GroupStageEngine(self.simulator)
        self.knockout_engine = KnockoutEngine(self.simulator)

        self.groups_definition = {
            'A': ['Spain', 'Mexico', 'Japan', 'Egypt'],
            'B': ['Argentina', 'Poland', 'Canada', 'Scotland'],
            'C': ['France', 'Morocco', 'Australia', 'Qatar'],
            'D': ['England', 'United States', 'Iran', 'Wales'],
            'E': ['Brazil', 'Serbia', 'Switzerland', 'Cameroon'],
            'F': ['Belgium', 'Croatia', 'Ecuador', 'Senegal'],
            'G': ['Netherlands', 'Denmark', 'Tunisia', 'Peru'],
            'H': ['Germany', 'Uruguay', 'South Korea', 'Ghana'],
            'I': ['Portugal', 'Colombia', 'Sweden', 'Jamaica'],
            'J': ['Italy', 'Nigeria', 'Chile', 'Saudi Arabia'],
            'K': ['Ukraine', 'Austria', 'Algeria', 'Costa Rica'],
            'L': ['Turkey', 'Mali', 'Honduras', 'New Zealand']
        }

    def run_full_tournament(self, verbose=False):
        advancing_top_two = []
        third_place_pool = []

        # Group Stage
        for g_label, teams in self.groups_definition.items():
            sorted_table = self.group_engine.simulate_single_group(
                g_label,
                teams
            )

            advancing_top_two.append(
                sorted_table[0]['team_name']
            )

            advancing_top_two.append(
                sorted_table[1]['team_name']
            )

            third_place_pool.append(
                sorted_table[2]
            )

        # Wildcards
        sorted_wildcards = sorted(
            third_place_pool,
            key=lambda x: (
                x['points'],
                x['gd'],
                x['gs'],
                np.random.rand()
            ),
            reverse=True
        )

        advancing_wildcards = [
            team['team_name']
            for team in sorted_wildcards[:8]
        ]

        knockout_field = (
            advancing_top_two +
            advancing_wildcards
        )

        if verbose:
            print(
                f"Group Stage Resolved. "
                f"Total Knockout Qualifiers Isolated: "
                f"{len(knockout_field)} teams."
            )

            print(
                f"Advancing Wildcards: "
                f"{', '.join(advancing_wildcards)}"
            )

        # Round of 32
        r32_winners = []

        for i in range(0, 32, 2):
            match_res = (
                self.knockout_engine
                .simulate_knockout_match(
                    knockout_field[i],
                    knockout_field[i + 1]
                )
            )

            r32_winners.append(
                match_res['winner']
            )

        # Round of 16
        r16_winners = []

        for i in range(0, 16, 2):
            match_res = (
                self.knockout_engine
                .simulate_knockout_match(
                    r32_winners[i],
                    r32_winners[i + 1]
                )
            )

            r16_winners.append(
                match_res['winner']
            )

        # Quarterfinals
        qf_winners = []

        for i in range(0, 8, 2):
            match_res = (
                self.knockout_engine
                .simulate_knockout_match(
                    r16_winners[i],
                    r16_winners[i + 1]
                )
            )

            qf_winners.append(
                match_res['winner']
            )

        # Semifinals
        sf_winners = []

        for i in range(0, 4, 2):
            match_res = (
                self.knockout_engine
                .simulate_knockout_match(
                    qf_winners[i],
                    qf_winners[i + 1]
                )
            )

            sf_winners.append(
                match_res['winner']
            )

        # Final
        final_match = (
            self.knockout_engine
            .simulate_knockout_match(
                sf_winners[0],
                sf_winners[1]
            )
        )

        return {
            "champion": final_match['winner'],
            "runner_up": final_match['loser'],
            "final_resolution": final_match['resolved_via'],
            "score_90": final_match['score_90'],
            "score_120": final_match['score_120'],
            "shootout": final_match['shootout']
        }


if __name__ == "__main__":
    print(
        "Initializing Comprehensive 48-Team Tournament Engine..."
    )

    engine = TournamentEngine()

    print(
        "Executing standalone World Cup tournament trial..."
    )

    universe_result = engine.run_full_tournament(
        verbose=True
    )

    print("\n=========================================================")
    print("         WORLD CUP 2026 SIMULATED FINALS REPORT")
    print("=========================================================")

    print(
        f"WORLD CHAMPION : "
        f"\033[1;32m{universe_result['champion']}\033[0m"
    )

    print(
        f"Runner-Up      : "
        f"{universe_result['runner_up']}"
    )

    print(
        f"Match Resolution: "
        f"Via {universe_result['final_resolution']}"
    )

    print(
        f"Scoreline (90m) : "
        f"{universe_result['score_90'][0]} - "
        f"{universe_result['score_90'][1]}"
    )

    if universe_result['score_120']:
        print(
            f"Scoreline (120m): "
            f"{universe_result['score_120'][0]} - "
            f"{universe_result['score_120'][1]}"
        )

    if universe_result['shootout']:
        print(
            f"Shootout Score  : "
            f"{universe_result['shootout'][0]} - "
            f"{universe_result['shootout'][1]}"
        )

    print("=========================================================\n")