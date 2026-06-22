# src/phase3_simulation/group_stage_engine.py

import pandas as pd
import numpy as np
from src.phase3_simulation.match_simulator import MatchSimulator


class GroupStageEngine:
    def __init__(self, simulator=None):
        self.simulator = simulator if simulator else MatchSimulator()

    def simulate_single_group(self, group_name, teams):
        standings = {
            team: {"team_name": team, "points": 0, "gd": 0, "gs": 0, "group": group_name}
            for team in teams
        }

        # Fixtures
        fixtures = [
            (teams[0], teams[1]), (teams[2], teams[3]),
            (teams[0], teams[2]), (teams[1], teams[3]),
            (teams[0], teams[3]), (teams[1], teams[2])
        ]

        # Group Matches
        for home, away in fixtures:
            h_goals, a_goals = self.simulator.simulate_group_match(home, away)

            standings[home]["gs"] += h_goals
            standings[away]["gs"] += a_goals

            standings[home]["gd"] += (h_goals - a_goals)
            standings[away]["gd"] += (a_goals - h_goals)

            if h_goals > a_goals:
                standings[home]["points"] += 3
            elif h_goals < a_goals:
                standings[away]["points"] += 3
            else:
                standings[home]["points"] += 1
                standings[away]["points"] += 1

        # Group Ranking
        sorted_table = sorted(
            standings.values(),
            key=lambda x: (x["points"], x["gd"], x["gs"], np.random.rand()),
            reverse=True
        )

        return sorted_table

    def print_standings_report(self, group_name, sorted_table):
        print(f"\n=========================================================")
        print(f"         GROUP {group_name} FINAL SIMULATED STANDINGS")
        print(f"=========================================================")
        print(f"{'Pos':<4} | {'Team Name':<15} | {'Points':<6} | {'GD':<4} | {'GS':<4}")
        print("-" * 57)

        for pos, team in enumerate(sorted_table):
            print(
                f"{pos+1:<4} | {team['team_name']:<15} | "
                f"{team['points']:<6} | {team['gd']:+3} | {team['gs']:<4}"
            )

        print("=========================================================\n")


if __name__ == "__main__":
    print("Testing Standalone Group Stage Engine...")

    engine = GroupStageEngine()

    test_group_name = "A"
    test_teams = ["Spain", "Mexico", "Japan", "Egypt"]

    table = engine.simulate_single_group(test_group_name, test_teams)
    engine.print_standings_report(test_group_name, table)