import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { awsConfig } from "@/config/aws";

// AWS Clients
const transcribeClient = new TranscribeClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId!,
    secretAccessKey: awsConfig.secretAccessKey!,
  },
});

const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId!,
    secretAccessKey: awsConfig.secretAccessKey!,
  },
});

// Voice verification result interface
export interface VoiceVerificationResult {
  isVerified: boolean;
  confidence: number;
  transcribedText: string;
  securityLevel: 'low' | 'medium' | 'high';
  error?: string;
  processingTime: number;
}

// AWS Transcribe Voice Authentication class
export class AWSTranscribeVoiceAuth {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'amihuman-voice-files';
  }

  /**
   * Upload audio file to S3
   */
  private async uploadToS3(audioBuffer: string, fileName: string): Promise<string> {
    try {
      const buffer = Buffer.from(audioBuffer, 'base64');
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: `voice-auth/${fileName}`,
        Body: buffer,
        ContentType: 'audio/webm',
        ACL: 'private',
      });

      await s3Client.send(command);
      return `s3://${this.bucketName}/voice-auth/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error}`);
    }
  }

  /**
   * Start transcription job
   */
  private async startTranscriptionJob(audioUri: string, jobName: string): Promise<void> {
    try {
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: awsConfig.transcribe.languageCode,
        MediaFormat: awsConfig.transcribe.mediaFormat,
        Media: {
          MediaFileUri: audioUri,
        },
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 1,
        },
      });

      await transcribeClient.send(command);
    } catch (error) {
      throw new Error(`Failed to start transcription: ${error}`);
    }
  }

  /**
   * Get transcription result
   */
  private async getTranscriptionResult(jobName: string): Promise<string> {
    try {
      const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      });

      let result = await transcribeClient.send(command);
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (result.TranscriptionJob?.TranscriptionJobStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        result = await transcribeClient.send(command);
        attempts++;
      }

      if (result.TranscriptionJob?.TranscriptionJobStatus === 'COMPLETED') {
        // Fetch the transcription result from S3
        const transcriptUri = result.TranscriptionJob.Transcript?.TranscriptFileUri;
        if (transcriptUri) {
          // Parse S3 URI to get bucket and key
          const url = new URL(transcriptUri);
          const bucket = url.hostname.split('.')[0];
          const key = url.pathname.substring(1);
          
          const getObjectCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          });
          
          const transcriptResponse = await s3Client.send(getObjectCommand);
          const transcriptData = await transcriptResponse.Body?.transformToString();
          
          if (transcriptData) {
            const transcript = JSON.parse(transcriptData);
            return transcript.results.transcripts[0]?.transcript || '';
          }
        }
      }

      throw new Error('Transcription failed or timed out');
    } catch (error) {
      throw new Error(`Failed to get transcription result: ${error}`);
    }
  }

  /**
   * Analyze voice for anti-spoofing
   */
  private analyzeVoiceSecurity(audioBuffer: string, transcribedText: string): {
    confidence: number;
    securityLevel: 'low' | 'medium' | 'high';
  } {
    // Mock voice analysis - in production, this would use AWS Voice ID or similar
    const audioLength = audioBuffer.length;
    const textLength = transcribedText.length;
    
    // Basic security checks
    let confidence = 0.5;
    let securityLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Audio length check (minimum 2 seconds)
    if (audioLength > 10000) confidence += 0.2;
    
    // Text length check (minimum 3 words)
    const wordCount = transcribedText.split(' ').length;
    if (wordCount >= 3) confidence += 0.2;
    
    // Text quality check (no repeated characters)
    const hasRepeatedChars = /(.)\1{3,}/.test(transcribedText);
    if (!hasRepeatedChars) confidence += 0.1;
    
    // Determine security level
    if (confidence >= 0.8) {
      securityLevel = 'high';
    } else if (confidence >= 0.6) {
      securityLevel = 'medium';
    }
    
    return { confidence, securityLevel };
  }

  /**
   * Verify voice authentication
   */
  async verifyVoiceAuth(
    audioBuffer: string,
    memberCode: string,
    expectedPhone?: string
  ): Promise<VoiceVerificationResult> {
    const startTime = Date.now();
    
    try {
      // Generate unique job name
      const jobName = `voice-auth-${memberCode}-${Date.now()}`;
      const fileName = `${jobName}.webm`;
      
      // Upload audio to S3
      const audioUri = await this.uploadToS3(audioBuffer, fileName);
      
      // Start transcription
      await this.startTranscriptionJob(audioUri, jobName);
      
      // Get transcription result
      const transcribedText = await this.getTranscriptionResult(jobName);
      
      // Analyze voice security
      const { confidence, securityLevel } = this.analyzeVoiceSecurity(audioBuffer, transcribedText);
      
      // Check if transcription matches expected content
      let isVerified = false;
      
      if (expectedPhone) {
        // Check if transcribed text contains phone digits
        const phoneDigits = expectedPhone.replace(/\D/g, '');
        const transcribedDigits = transcribedText.replace(/\D/g, '');
        isVerified = transcribedDigits.includes(phoneDigits) && confidence >= awsConfig.voiceAuth.minConfidence;
      } else {
        // Basic verification based on confidence
        isVerified = confidence >= awsConfig.voiceAuth.minConfidence;
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        isVerified,
        confidence,
        transcribedText,
        securityLevel,
        processingTime,
      };
      
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      
      return {
        isVerified: false,
        confidence: 0,
        transcribedText: '',
        securityLevel: 'low',
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Test AWS Transcribe connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test S3 connection
      const testCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection.txt',
        Body: 'test',
        ContentType: 'text/plain',
      });
      
      await s3Client.send(testCommand);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const awsTranscribeVoiceAuth = new AWSTranscribeVoiceAuth();










