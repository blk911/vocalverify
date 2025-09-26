// AWS Configuration for Voice Authentication
export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  
  // Transcribe configuration
  transcribe: {
    region: process.env.AWS_TRANSCRIBE_REGION || 'us-east-1',
    languageCode: 'en-US',
    mediaFormat: 'webm',
    sampleRate: 44100
  },
  
  // Voice authentication settings
  voiceAuth: {
    minConfidence: 0.8,
    maxDuration: 30, // seconds
    supportedFormats: ['webm', 'wav', 'mp3'],
    biometricThreshold: 0.75
  }
};

// Validate AWS credentials
export function validateAWSCredentials(): boolean {
  return !!(
    awsConfig.accessKeyId && 
    awsConfig.secretAccessKey && 
    awsConfig.region
  );
}

// Get AWS credentials status
export function getAWSCredentialsStatus(): {
  hasCredentials: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  if (!awsConfig.accessKeyId) missing.push('AWS_ACCESS_KEY_ID');
  if (!awsConfig.secretAccessKey) missing.push('AWS_SECRET_ACCESS_KEY');
  if (!awsConfig.region) missing.push('AWS_REGION');
  
  return {
    hasCredentials: missing.length === 0,
    missing
  };
}