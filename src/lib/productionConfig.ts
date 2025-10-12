/**
 * Production Configuration
 * Centralized production settings and environment validation
 */

import { logger } from './logger';

// Production environment validation
export interface ProductionConfig {
  firebase: {
    projectId: string;
    clientEmail: string;
    hasPrivateKey: boolean;
  };
  aws: {
    region: string;
    hasCredentials: boolean;
    s3Bucket?: string;
  };
  app: {
    environment: string;
    isProduction: boolean;
    isDevelopment: boolean;
  };
}

/**
 * Validate production configuration
 */
export function validateProductionConfig(): ProductionConfig {
  const config: ProductionConfig = {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      s3Bucket: process.env.AWS_S3_BUCKET_NAME
    },
    app: {
      environment: process.env.NODE_ENV || 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development'
    }
  };

  // Log configuration status
  logger.info('Production configuration validated', 'Config', {
    firebase: {
      projectId: config.firebase.projectId,
      hasCredentials: config.firebase.hasPrivateKey
    },
    aws: {
      hasCredentials: config.aws.hasCredentials,
      region: config.aws.region
    },
    environment: config.app.environment
  });

  return config;
}

/**
 * Get production-ready database settings
 */
export function getProductionDbSettings() {
  return {
    // No emulator settings - direct production connection
    // Firebase Admin SDK handles connection automatically
    projectId: process.env.FIREBASE_PROJECT_ID,
    environment: process.env.NODE_ENV || 'production'
  };
}

/**
 * Production security settings
 */
export function getProductionSecuritySettings() {
  return {
    // CORS settings for production
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
      credentials: true
    },
    
    // Rate limiting for production
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Security headers
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
  };
}

/**
 * Production logging configuration
 */
export function getProductionLoggingConfig() {
  return {
    level: process.env.LOG_LEVEL || 'info',
    enableDebug: process.env.DEBUG === 'true',
    enableConsole: process.env.NODE_ENV === 'development',
    enableFile: process.env.NODE_ENV === 'production'
  };
}

/**
 * Validate all required environment variables
 */
export function validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL', 
    'FIREBASE_PRIVATE_KEY'
  ];

  const missing: string[] = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  const valid = missing.length === 0;
  
  if (!valid) {
    logger.error('Missing required environment variables', undefined, 'Config', { missing });
  } else {
    logger.info('All required environment variables present', 'Config');
  }

  return { valid, missing };
}

/**
 * Initialize production configuration
 */
export function initializeProductionConfig(): boolean {
  try {
    // Validate environment variables
    const envValidation = validateRequiredEnvVars();
    if (!envValidation.valid) {
      logger.error('Environment validation failed', undefined, 'Config', {
        missing: envValidation.missing
      });
      return false;
    }

    // Validate production config
    const config = validateProductionConfig();
    
    // Log production readiness
    logger.info('Production configuration initialized successfully', 'Config', {
      environment: config.app.environment,
      firebaseProject: config.firebase.projectId,
      awsRegion: config.aws.region
    });

    return true;
  } catch (error) {
    logger.error('Failed to initialize production configuration', error as Error, 'Config');
    return false;
  }
}
