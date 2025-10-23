'use client';

import { useState } from 'react';

interface AnticipateResponse {
  predicted_user: string;
  risk_tier: string;
  confidence: number;
  reasoning: string;
  nonce: string;
  challenge?: any;
}

interface VoiceNonceResponse {
  voice_bio: number;
  liveness: number;
  ok: boolean;
  confidence: number;
}

interface VoiceNameResponse {
  detected_name: string;
  name_match: number;
  ok: boolean;
  confidence: number;
}

interface ChallengeAnswerResponse {
  decision: string;
  confidence: number;
  score: number;
  reasoning: string;
}

export function useAuthFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const anticipate = async (tbId: string, relationship: string): Promise<AnticipateResponse> => {
    return apiCall('/anticipate', { tbId, relationship });
  };

  const voiceNonce = async (audioData: string, nonce: string): Promise<VoiceNonceResponse> => {
    return apiCall('/voice/nonce', { audioData, nonce });
  };

  const voiceName = async (audioData: string, expectedName: string): Promise<VoiceNameResponse> => {
    return apiCall('/voice/name', { audioData, expectedName });
  };

  const challengeAnswer = async (
    transcript: string, 
    challengeId: string, 
    expectedTokens: string[]
  ): Promise<ChallengeAnswerResponse> => {
    return apiCall('/challenge/answer', { 
      transcript, 
      challengeId, 
      expectedTokens 
    });
  };

  return {
    anticipate,
    voiceNonce,
    voiceName,
    challengeAnswer,
    loading,
    error
  };
}
