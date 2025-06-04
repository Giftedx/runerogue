// src/ai-client/aiClient.ts

import axios from 'axios';

interface PlayerStats {
  health: number;
  level: number;
  experience: number;
  kills: number;
  deaths: number;
  time_played: number;
}

interface DifficultyAdjustment {
  adjustment: 'easier' | 'harder' | 'no_change';
  reason: string;
}

export class AiServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  public async analyzeDifficulty(playerStats: PlayerStats): Promise<DifficultyAdjustment> {
    try {
      const response = await axios.post<DifficultyAdjustment>(`${this.baseUrl}/analyze-difficulty`, playerStats);
      return response.data;
    } catch (error) {
      console.error('Error analyzing difficulty:', error);
      throw error;
    }
  }

  public async adjustParameters(currentParams: any, adjustment: DifficultyAdjustment): Promise<any> {
    try {
      const response = await axios.post(`${this.baseUrl}/adjust-parameters`, { current_params: currentParams, adjustment });
      return response.data;
    } catch (error) {
      console.error('Error adjusting parameters:', error);
      throw error;
    }
  }
}
