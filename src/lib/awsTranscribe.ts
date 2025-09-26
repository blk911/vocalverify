import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { awsConfig, validateAWSCredentials } from '@/config/aws';

// Initialize Transcribe client
const transcribeClient = new TranscribeClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId!,
    secretAccessKey: awsConfig.secretAccessKey!
  }
});

export interface VoiceTranscriptionResult {
  transcript: string;
  confidence: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

export interface VoiceBiometricData {
  pitch: number;
  tone: number;
  cadence: number;
  volume: number;
  duration: number;
  wordCount: number;
  averageWordLength: number;
}

export class AWSVoiceAuth {
  /**
   * Transcribe audio to text
   */
  async transcribeAudio(audioBuffer: string, jobName: string): Promise<VoiceTranscriptionResult> {
    try {
      console.log(`🎤 Starting transcription job: ${jobName}`);
      
      // Mock transcription for testing (replace with real AWS when credentials are available)
      if (!validateAWSCredentials()) {
        console.log('⚠️ AWS credentials not configured, using mock transcription');
        return {
          transcript: "My name is Spencer Wendt",
          confidence: 0.95,
          words: [
            { word: "My", startTime: 0, endTime: 0.5, confidence: 0.98 },
            { word: "name", startTime: 0.5, endTime: 1.0, confidence: 0.96 },
            { word: "is", startTime: 1.0, endTime: 1.2, confidence: 0.94 },
            { word: "Spencer", startTime: 1.2, endTime: 1.8, confidence: 0.92 },
            { word: "Wendt", startTime: 1.8, endTime: 2.2, confidence: 0.90 }
          ]
        };
      }
      
      // Start transcription job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: awsConfig.transcribe.languageCode,
        MediaFormat: awsConfig.transcribe.mediaFormat,
        Media: {
          MediaFileUri: `data:audio/webm;base64,${audioBuffer}`
        },
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 1
        }
      });
      
      await transcribeClient.send(startCommand);
      
      // Wait for completion and get results
      const result = await this.waitForTranscription(jobName);
      
      return {
        transcript: result.transcript,
        confidence: result.confidence,
        words: result.words || []
      };
      
    } catch (error: any) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
  
  /**
   * Wait for transcription to complete
   */
  private async waitForTranscription(jobName: string, maxWaitTime: number = 30000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const getCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });
      
      const response = await transcribeClient.send(getCommand);
      const job = response.TranscriptionJob;
      
      if (job?.TranscriptionJobStatus === 'COMPLETED') {
        // Parse the transcript from the results
        const transcript = job.Transcript?.TranscriptFileUri;
        if (transcript) {
          // In a real implementation, you'd fetch the transcript file
          // For now, return a mock result
          return {
            transcript: "Mock transcript from AWS Transcribe",
            confidence: 0.95,
            words: []
          };
        }
      } else if (job?.TranscriptionJobStatus === 'FAILED') {
        throw new Error('Transcription job failed');
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Transcription timeout');
  }
  
  /**
   * Analyze voice biometrics
   */
  analyzeVoiceBiometrics(audioBuffer: string, transcript: string): VoiceBiometricData {
    // Mock voice biometric analysis
    // In a real implementation, you'd use audio processing libraries
    const duration = 5.2; // seconds
    const wordCount = transcript.split(' ').length;
    
    return {
      pitch: 150 + Math.random() * 50, // Hz
      tone: 20 + Math.random() * 20,   // dB
      cadence: 1.0 + Math.random() * 0.5, // words per second
      volume: 60 + Math.random() * 20, // dB
      duration,
      wordCount,
      averageWordLength: transcript.length / wordCount
    };
  }
  
  /**
   * Compare voice biometrics
   */
  compareVoiceBiometrics(
    stored: VoiceBiometricData, 
    current: VoiceBiometricData
  ): { match: boolean; confidence: number; details: string } {
    const pitchDiff = Math.abs(stored.pitch - current.pitch) / stored.pitch;
    const toneDiff = Math.abs(stored.tone - current.tone) / stored.tone;
    const cadenceDiff = Math.abs(stored.cadence - current.cadence) / stored.cadence;
    
    const pitchMatch = pitchDiff < 0.15; // 15% tolerance
    const toneMatch = toneDiff < 0.20;   // 20% tolerance
    const cadenceMatch = cadenceDiff < 0.25; // 25% tolerance
    
    const confidence = (
      (pitchMatch ? 0.4 : 0) +
      (toneMatch ? 0.3 : 0) +
      (cadenceMatch ? 0.3 : 0)
    );
    
    const match = confidence >= awsConfig.voiceAuth.biometricThreshold;
    
    return {
      match,
      confidence,
      details: `Pitch: ${pitchMatch ? '✅' : '❌'}, Tone: ${toneMatch ? '✅' : '❌'}, Cadence: ${cadenceMatch ? '✅' : '❌'}`
    };
  }
  
  /**
   * Verify voice authentication
   */
  async verifyVoiceAuth(
    audioBuffer: string, 
    memberCode: string, 
    expectedContent: string
  ): Promise<{
    contentMatch: boolean;
    biometricMatch: boolean;
    overallMatch: boolean;
    confidence: number;
    details: string;
  }> {
    try {
      const jobName = `voice-auth-${memberCode}-${Date.now()}`;
      
      // Transcribe audio
      const transcription = await this.transcribeAudio(audioBuffer, jobName);
      
      // Check content match
      const contentMatch = transcription.transcript.toLowerCase().includes(expectedContent.toLowerCase());
      
      // Analyze voice biometrics
      const currentBiometrics = this.analyzeVoiceBiometrics(audioBuffer, transcription.transcript);
      
      // TODO: Get stored biometrics from database
      const storedBiometrics: VoiceBiometricData = {
        pitch: 150,
        tone: 25,
        cadence: 1.2,
        volume: 70,
        duration: 5.0,
        wordCount: 3,
        averageWordLength: 4.5
      };
      
      // Compare biometrics
      const biometricComparison = this.compareVoiceBiometrics(storedBiometrics, currentBiometrics);
      
      const overallMatch = contentMatch && biometricComparison.match;
      const confidence = (transcription.confidence + biometricComparison.confidence) / 2;
      
      return {
        contentMatch,
        biometricMatch: biometricComparison.match,
        overallMatch,
        confidence,
        details: `Content: ${contentMatch ? '✅' : '❌'}, Voice: ${biometricComparison.details}`
      };
      
    } catch (error: any) {
      console.error('Voice verification error:', error);
      throw new Error(`Voice verification failed: ${error.message}`);
    }
  }
}

// Export singleton
export const awsTranscribeVoiceAuth = new AWSVoiceAuth();