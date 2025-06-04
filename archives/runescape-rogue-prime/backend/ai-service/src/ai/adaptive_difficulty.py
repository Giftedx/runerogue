# src/ai/adaptive_difficulty.py

from typing import Dict, Any

class AdaptiveDifficultySystem:
    def __init__(self, gemini_client):
        self.gemini_client = gemini_client
        print("AdaptiveDifficultySystem initialized.")

    async def analyze_player_performance(self, player_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes player performance and suggests difficulty adjustments.
        """
        prompt = f"Analyze the following player stats and suggest a difficulty adjustment (easier, harder, or no change) and a brief reason. Player stats: {player_stats}"
        ai_response = await self.gemini_client.generate_content(prompt)
        print(f"Difficulty analysis AI response: {ai_response}")
        
        # In a real application, parse the AI response to get structured data.
        # For now, return a mock adjustment.
        if "easier" in ai_response.lower():
            return {"adjustment": "easier", "reason": "Player struggling."}
        elif "harder" in ai_response.lower():
            return {"adjustment": "harder", "reason": "Player excelling."}
        else:
            return {"adjustment": "no_change", "reason": "Performance is balanced."}

    async def adjust_game_parameters(self, current_parameters: Dict[str, Any], adjustment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adjusts game parameters based on the suggested difficulty adjustment.
        """
        print(f"Adjusting game parameters: {current_parameters} with adjustment {adjustment}")
        # This would involve modifying enemy stats, spawn rates, resource abundance, etc.
        # For now, return mock adjusted parameters.
        adjusted_parameters = current_parameters.copy()
        if adjustment["adjustment"] == "easier":
            adjusted_parameters["enemy_health_multiplier"] = (adjusted_parameters.get("enemy_health_multiplier", 1.0) * 0.9)
            adjusted_parameters["enemy_damage_multiplier"] = (adjusted_parameters.get("enemy_damage_multiplier", 1.0) * 0.9)
        elif adjustment["adjustment"] == "harder":
            adjusted_parameters["enemy_health_multiplier"] = (adjusted_parameters.get("enemy_health_multiplier", 1.0) * 1.1)
            adjusted_parameters["enemy_damage_multiplier"] = (adjusted_parameters.get("enemy_damage_multiplier", 1.0) * 1.1)
        
        return adjusted_parameters
