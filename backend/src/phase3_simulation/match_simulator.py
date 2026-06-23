# src/phase3_simulation/match_simulator.py
import numpy as np
from scipy.stats import poisson
import os
import pickle
from datetime import datetime


class MatchSimulator:
    def __init__(
        self,
        matches_path='data/processed/matches.csv',
        model_cache_path='models/production_poisson_engine.pkl',
        min_matches=20
    ):
        self.matches_path = matches_path
        self.model_cache_path = model_cache_path
        self.min_matches = min_matches

        self.params = None
        self.intercept = 0.0
        self.home_adv_coeff = 0.0
        self.valid_teams = set()

        self._initialize_engine()

    def _initialize_engine(self):
        if os.path.exists(self.model_cache_path):
            print(f"Loading cached production engine artifact from {self.model_cache_path}...")

            with open(self.model_cache_path, 'rb') as f:
                print("Loading model artifact...")
                cache_data = pickle.load(f)
                print("Model artifact loaded successfully.")
                self.params = cache_data['model_params']
                self.valid_teams = set(cache_data['valid_teams'])

                EXCLUDED_TEAMS = {
                    "Abkhazia",
                    "Northern Cyprus",
                    "Western Sahara",
                    "Padania",
                    "Tibet"
                }

                self.valid_teams = {
                    team for team in self.valid_teams
                    if team not in EXCLUDED_TEAMS
                }

            self._unpack_parameters()

        else:
            print("No cached engine detected. Initiating full scale production training pipeline...")
            self._train_and_cache_engine()

    def _train_and_cache_engine(self):
        import statsmodels.api as sm
        import statsmodels.formula.api as smf
        import pandas as pd

        if not os.path.exists(self.matches_path):
            raise FileNotFoundError(f"Master dataset missing at {self.matches_path}")

        df = pd.read_csv(self.matches_path, parse_dates=['date'])
        train_df = df[df['date'] >= '2000-01-01'].copy()

        team_counts = pd.concat([
            train_df['home_team'],
            train_df['away_team']
        ]).value_counts()

        self.valid_teams = set(
            team_counts[team_counts >= self.min_matches].index
        )

        filtered_df = train_df[
            train_df['home_team'].isin(self.valid_teams) &
            train_df['away_team'].isin(self.valid_teams)
        ].copy()

        filtered_df['is_neutral'] = filtered_df['neutral']

        # Recency Weights
        ref_date = datetime(2026, 6, 21)
        filtered_df['days_old'] = (
            ref_date - filtered_df['date']
        ).dt.days

        filtered_df['weight'] = np.exp(
            -filtered_df['days_old'] / (365 * 8)
        )

        home_rows = pd.DataFrame({
            'match_id': filtered_df.index,
            'team': filtered_df['home_team'],
            'opponent': filtered_df['away_team'],
            'goals': filtered_df['home_score'],
            'is_home_advantage': np.where(
                filtered_df['is_neutral'],
                0,
                1
            ),
            'weight': filtered_df['weight']
        })

        away_rows = pd.DataFrame({
            'match_id': filtered_df.index,
            'team': filtered_df['away_team'],
            'opponent': filtered_df['home_team'],
            'goals': filtered_df['away_score'],
            'is_home_advantage': 0,
            'weight': filtered_df['weight']
        })

        poisson_train = (
            pd.concat([home_rows, away_rows])
            .sort_values(['match_id'])
            .reset_index(drop=True)
        )

        print(
            "Optimizing Bivariate Poisson GLM parameters up to 2026 "
            "with Recency Weights..."
        )

        formula = "goals ~ is_home_advantage + team + opponent"

        glm = smf.glm(
            formula=formula,
            data=poisson_train,
            family=sm.families.Poisson(),
            var_weights=poisson_train['weight']
        ).fit()

        self.params = glm.params

        os.makedirs(
            os.path.dirname(self.model_cache_path),
            exist_ok=True
        )

        with open(self.model_cache_path, 'wb') as f:
            pickle.dump(
                {
                    'model_params': self.params,
                    'valid_teams': list(self.valid_teams)
                },
                f
            )

        print(
            f"Production model successfully serialized and cached to "
            f"{self.model_cache_path}"
        )

        self._unpack_parameters()

    def _unpack_parameters(self):
        self.intercept = float(
            self.params['Intercept']
        )

        self.home_adv_coeff = float(
            self.params['is_home_advantage']
        )

    def _get_parameter_coefficient(self, prefix, nation_name):
        param_key = f"{prefix}[T.{nation_name}]"
        return float(
            self.params.get(param_key, 0.0)
        )

    def compute_match_analytics(
        self,
        home_team,
        away_team,
        neutral=True,
        max_goals=10
    ):
        h_adv = 0.0 if neutral else self.home_adv_coeff

        h_att = self._get_parameter_coefficient(
            'team',
            home_team
        )

        h_def = self._get_parameter_coefficient(
            'opponent',
            home_team
        )

        a_att = self._get_parameter_coefficient(
            'team',
            away_team
        )

        a_def = self._get_parameter_coefficient(
            'opponent',
            away_team
        )

        h_lam = np.exp(
            self.intercept +
            h_adv +
            h_att +
            a_def
        )

        a_lam = np.exp(
            self.intercept +
            a_att +
            h_def
        )

        home_pmf = poisson.pmf(
            range(max_goals + 1),
            h_lam
        )

        away_pmf = poisson.pmf(
            range(max_goals + 1),
            a_lam
        )

        prob_matrix = np.outer(
            home_pmf,
            away_pmf
        )

        prob_matrix /= np.sum(prob_matrix)

        p_away = float(
            np.sum(np.triu(prob_matrix, 1))
        )

        p_draw = float(
            np.sum(np.diag(prob_matrix))
        )

        p_home = float(
            np.sum(np.tril(prob_matrix, -1))
        )

        # Scorelines
        scoreline_list = []

        for h_g in range(max_goals + 1):
            for a_g in range(max_goals + 1):
                prob = float(prob_matrix[h_g, a_g])

                scoreline_list.append(
                    (f"{h_g}-{a_g}", round(prob, 4))
                )

        sorted_scorelines = sorted(
            scoreline_list,
            key=lambda x: x[1],
            reverse=True
        )

        return {
            "home_lambda": round(h_lam, 4),
            "away_lambda": round(a_lam, 4),
            "p_home": round(p_home, 4),
            "p_draw": round(p_draw, 4),
            "p_away": round(p_away, 4),
            "prob_matrix": prob_matrix,
            "most_likely_scores": sorted_scorelines[:3]
        }

    def simulate_group_match(
        self,
        home_team,
        away_team
    ):
        analytics = self.compute_match_analytics(
            home_team,
            away_team,
            neutral=True
        )

        h_score = np.random.poisson(
            analytics['home_lambda']
        )

        a_score = np.random.poisson(
            analytics['away_lambda']
        )

        return int(h_score), int(a_score)


if __name__ == "__main__":
    sim = MatchSimulator()