import axios from 'axios';
import { 
  TPromptPack, 
  TArtifact, 
  TPPA, 
  TChallenge 
} from '../../shared-types/src/index';

// API Response Types
interface AnticipateResponse {
  predicted_user: string;
  risk_tier: string;
  confidence: number;
  reasoning: string;
  nonce: string;
  challenge?: TChallenge;
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

interface ChallengePrebakedResponse {
  prompt: string;
  nonce: string;
  ttlMs: number;
}

interface ChallengeAnswerResponse {
  decision: string;
  confidence: number;
  score: number;
  reasoning: string;
}

// Auth SDK Configuration
interface AuthSDKConfig {
  apiBaseUrl: string;
  timeout?: number;
}

class AuthSDK {
  private config: AuthSDKConfig;

  constructor(config: AuthSDKConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await axios.post(
        `${this.config.apiBaseUrl}${endpoint}`,
        data,
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.ok) {
        throw new Error(`API Error: ${response.data.error || 'Unknown error'}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Network Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Predict user and return nonce + challenge
   */
  async anticipate(tbId: string, relationship: string): Promise<AnticipateResponse> {
    return this.makeRequest<AnticipateResponse>('/anticipate', {
      tbId,
      relationship
    });
  }

  /**
   * Process voice nonce verification
   */
  async voiceNonce(audioData: string, nonce: string): Promise<VoiceNonceResponse> {
    return this.makeRequest<VoiceNonceResponse>('/voice/nonce', {
      audioData,
      nonce
    });
  }

  /**
   * Extract and verify name from voice
   */
  async voiceName(audioData: string, expectedName: string): Promise<VoiceNameResponse> {
    return this.makeRequest<VoiceNameResponse>('/voice/name', {
      audioData,
      expectedName
    });
  }

  /**
   * Get pre-baked challenge prompt
   */
  async challengePrebaked(tbId: string, facet: string): Promise<ChallengePrebakedResponse> {
    return this.makeRequest<ChallengePrebakedResponse>('/challenge/prebaked', {
      tbId,
      facet
    });
  }

  /**
   * Validate challenge response
   */
  async challengeAnswer(
    transcript: string, 
    challengeId: string, 
    expectedTokens: string[]
  ): Promise<ChallengeAnswerResponse> {
    return this.makeRequest<ChallengeAnswerResponse>('/challenge/answer', {
      transcript,
      challengeId,
      expectedTokens
    });
  }
}

// Export factory function
export function createAuthSDK(config: AuthSDKConfig): AuthSDK {
  return new AuthSDK(config);
}

// Export default instance
export const authSDK = createAuthSDK({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
});

// Export individual functions for convenience
export const anticipate = (tbId: string, relationship: string) => 
  authSDK.anticipate(tbId, relationship);

export const voiceNonce = (audioData: string, nonce: string) => 
  authSDK.voiceNonce(audioData, nonce);

export const voiceName = (audioData: string, expectedName: string) => 
  authSDK.voiceName(audioData, expectedName);

export const challengePrebaked = (tbId: string, facet: string) => 
  authSDK.challengePrebaked(tbId, facet);

export const challengeAnswer = (
  transcript: string, 
  challengeId: string, 
  expectedTokens: string[]
) => authSDK.challengeAnswer(transcript, challengeId, expectedTokens);

// Export types
export type {
  AnticipateResponse,
  VoiceNonceResponse,
  VoiceNameResponse,
  ChallengePrebakedResponse,
  ChallengeAnswerResponse,
  AuthSDKConfig
};
