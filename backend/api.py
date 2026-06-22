from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.phase3_simulation.match_simulator import MatchSimulator
from src.phase3_simulation.monte_carlo import run_tournament_forecast_loop
import anyio


app = FastAPI(title="World Cup 2026 Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Booting up Phase 3 Poisson Engine...")
simulator = MatchSimulator()

# Simulation Lock
simulation_lock = anyio.Lock()


@app.get("/api/teams")
def get_teams():
    return {"teams": sorted(list(simulator.valid_teams))}


@app.get("/api/simulate")
def simulate_match(home: str, away: str, neutral: str = "true"):
    if home not in simulator.valid_teams or away not in simulator.valid_teams:
        raise HTTPException(status_code=400, detail="Invalid team selection")

    is_neutral = neutral.lower() == "true"

    result = simulator.compute_match_analytics(
        home,
        away,
        neutral=is_neutral
    )

    return {
        "home_team": home,
        "away_team": away,
        "home_lambda": result['home_lambda'],
        "away_lambda": result['away_lambda'],
        "p_home": result['p_home'],
        "p_draw": result['p_draw'],
        "p_away": result['p_away'],
        "is_neutral": is_neutral,
        "most_likely_scores": [
            {"score": s[0], "prob": s[1]}
            for s in result['most_likely_scores']
        ]
    }


# Tournament Simulation
@app.get("/api/tournament-stats")
async def get_tournament_probabilities():
    if simulation_lock.locked():
        print("[API WARNING] Blocked a concurrent simulation request attempt.")

        raise HTTPException(
            status_code=429,
            detail=(
                "A simulation is already actively running. "
                "Please wait for it to complete."
            )
        )

    async with simulation_lock:
        print("\n[API] Triggering on-demand 5000 World Cup simulations...")

        stats = await anyio.to_thread.run_sync(
            run_tournament_forecast_loop,
            5000
        )

        print("[API] Simulation run complete. Dispatching results to frontend.")
        return stats


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )