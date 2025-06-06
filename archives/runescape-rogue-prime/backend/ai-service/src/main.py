from fastapi import FastAPI
from pydantic import BaseModel
from .ai.gemini import GeminiClient
from .ai.adaptive_difficulty import AdaptiveDifficultySystem

app = FastAPI()

# Initialize AI components
gemini_client = GeminiClient()
adaptive_difficulty_system = AdaptiveDifficultySystem(gemini_client)

class PlayerStats(BaseModel):
    health: int
    level: int
    experience: int
    kills: int
    deaths: int
    time_played: int

@app.get("/health")
async def health_check():
    return {"status": "AI Service is healthy"}

@app.post("/analyze-difficulty")
async def analyze_difficulty(stats: PlayerStats):
    analysis = await adaptive_difficulty_system.analyze_player_performance(stats.dict())
    return analysis

@app.post("/adjust-parameters")
async def adjust_parameters(current_params: dict, adjustment: dict):
    adjusted_params = await adaptive_difficulty_system.adjust_game_parameters(current_params, adjustment)
    return adjusted_params

@app.post("/predict")
async def predict(data: dict):
    # This is a placeholder for AI model inference
    # In a real scenario, this would interact with Gemini via Genkit
    print(f"Received data for prediction: {data}")
    return {"prediction": "mock_prediction", "input_data": data}
