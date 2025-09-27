import { ConnectClient, StartSpeakerSearchTaskCommand, GetSpeakerSearchTaskCommand } from "@aws-sdk/client-connect";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";

// AWS Configuration
const connectClient = new ConnectClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface VoiceVerificationResult {
  isVerified: boolean;
  confidence: number;
  phoneNumber: string;
  extractedContent: string;
  securityLevel: 'high' | 'medium' | 'low';
  fraudRisk: 'low' | 'medium' | 'high';
}

export class AWSVoiceID {
  private connectInstanceId: string;
  private voiceIdDomainId: string;

  constructor(connectInstanceId: string, voiceIdDomainId: string) {
    this.connectInstanceId = connectInstanceId;
    this.voiceIdDomainId = voiceIdDomainId;
  }

  /**
   * Verify voice biometrics using AWS Voice ID
   */
  async verifyVoiceBiometrics(audioBuffer: Buffer, speakerId: string): Promise<{
    isVerified: boolean;
    confidence: number;
    fraudRisk: 'low' | 'medium' | 'high';
  }> {
    try {
      // Start speaker search task
      const searchCommand = new StartSpeakerSearchTaskCommand({
        ConnectInstanceId: this.connectInstanceId,
        VoiceIdDomainId: this.voiceIdDomainId,
        SpeakerSearchTask: {
          SpeakerId: speakerId,
          AudioBuffer: audioBuffer,
        },
      });

      const searchResponse = await connectClient.send(searchCommand);
      const taskId = searchResponse.SpeakerSearchTaskId;

      // Wait for task completion
      let taskStatus = 'IN_PROGRESS';
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (taskStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const getTaskCommand = new GetSpeakerSearchTaskCommand({
          ConnectInstanceId: this.connectInstanceId,
          VoiceIdDomainId: this.voiceIdDomainId,
          SpeakerSearchTaskId: taskId,
        });

        const taskResponse = await connectClient.send(getTaskCommand);
        taskStatus = taskResponse.SpeakerSearchTask?.Status || 'FAILED';
        attempts++;
      }

      if (taskStatus === 'COMPLETED') {
        const task = await connectClient.send(getTaskCommand);
        const results = task.SpeakerSearchTask?.SpeakerSearchResults;
        
        if (results && results.length > 0) {
          const bestMatch = results[0];
          const confidence = bestMatch.Confidence || 0;
          const isVerified = confidence >= 0.8; // High security threshold
          
          // Determine fraud risk based on confidence and other factors
          let fraudRisk: 'low' | 'medium' | 'high' = 'low';
          if (confidence < 0.6) fraudRisk = 'high';
          else if (confidence < 0.8) fraudRisk = 'medium';

          return {
            isVerified,
            confidence,
            fraudRisk,
          };
        }
      }

      return {
        isVerified: false,
        confidence: 0,
        fraudRisk: 'high',
      };

    } catch (error) {
      return {
        isVerified: false,
        confidence: 0,
        fraudRisk: 'high',
      };
    }
  }

  /**
   * Extract phone number from voice using AWS Transcribe
   */
  async extractPhoneNumber(audioBuffer: Buffer): Promise<{
    phoneNumber: string;
    extractedContent: string;
    confidence: number;
  }> {
    try {
      // Start transcription job
      const jobName = `voice-verification-${Date.now()}`;
      const transcriptionCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        Media: {
          MediaFileUri: `s3://your-bucket/voice/${jobName}.webm`, // You'll need to upload to S3 first
        },
        MediaFormat: 'webm',
        LanguageCode: 'en-US',
        Settings: {
          ShowSpeakerLabels: true,
          MaxSpeakerLabels: 1,
        },
      });

      await transcribeClient.send(transcriptionCommand);

      // Wait for transcription completion
      let jobStatus = 'IN_PROGRESS';
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (jobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const getJobCommand = new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName,
        });

        const jobResponse = await transcribeClient.send(getJobCommand);
        jobStatus = jobResponse.TranscriptionJob?.TranscriptionJobStatus || 'FAILED';
        attempts++;
      }

      if (jobStatus === 'COMPLETED') {
        const job = await transcribeClient.send(getJobCommand);
        const transcript = job.TranscriptionJob?.Transcript?.TranscriptFileUri;
        
        if (transcript) {
          // Download and parse transcript
          const response = await fetch(transcript);
          const transcriptData = await response.json();
          const extractedContent = transcriptData.results.transcripts[0].transcript;
          
          // Extract phone number using regex
          const phoneRegex = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
          const phoneMatches = extractedContent.match(phoneRegex);
          const phoneNumber = phoneMatches ? phoneMatches[0].replace(/\D/g, '') : '';
          
          return {
            phoneNumber,
            extractedContent,
            confidence: 0.9, // High confidence for AWS Transcribe
          };
        }
      }

      return {
        phoneNumber: '',
        extractedContent: '',
        confidence: 0,
      };

    } catch (error) {
      return {
        phoneNumber: '',
        extractedContent: '',
        confidence: 0,
      };
    }
  }

  /**
   * Complete voice verification with biometrics and content
   */
  async verifyVoice(audioBuffer: Buffer, speakerId: string, expectedPhone: string): Promise<VoiceVerificationResult> {
    try {
      // Run both verifications in parallel
      const [biometricResult, contentResult] = await Promise.all([
        this.verifyVoiceBiometrics(audioBuffer, speakerId),
        this.extractPhoneNumber(audioBuffer),
      ]);

      // Calculate overall verification score
      const biometricScore = biometricResult.confidence;
      const contentScore = contentResult.phoneNumber === expectedPhone ? 1.0 : 0.0;
      const overallScore = (biometricScore * 0.7) + (contentScore * 0.3);

      // Determine security level
      let securityLevel: 'high' | 'medium' | 'low' = 'low';
      if (overallScore >= 0.9) securityLevel = 'high';
      else if (overallScore >= 0.7) securityLevel = 'medium';

      const isVerified = overallScore >= 0.8 && biometricResult.isVerified && contentScore > 0;

      return {
        isVerified,
        confidence: overallScore,
        phoneNumber: contentResult.phoneNumber,
        extractedContent: contentResult.extractedContent,
        securityLevel,
        fraudRisk: biometricResult.fraudRisk,
      };

    } catch (error) {
      return {
        isVerified: false,
        confidence: 0,
        phoneNumber: '',
        extractedContent: '',
        securityLevel: 'low',
        fraudRisk: 'high',
      };
    }
  }
}

// Export singleton instance
export const awsVoiceID = new AWSVoiceID(
  process.env.AWS_CONNECT_INSTANCE_ID!,
  process.env.AWS_VOICE_ID_DOMAIN_ID!
);
