/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Mock environment variables
(process.env as any).NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ id: 'test', name: 'Test User' })
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          empty: false,
          docs: [{
            id: 'test-id',
            data: () => ({ id: 'test', name: 'Test User' })
          }]
        }))
      }))
    }))
  }))
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-transcribe', () => ({
  TranscribeClient: jest.fn(() => ({
    send: jest.fn(() => Promise.resolve({
      TranscriptionJob: {
        TranscriptionJobStatus: 'COMPLETED',
        Transcript: {
          TranscriptFileUri: 's3://test-bucket/transcript.json'
        }
      }
    }))
  })),
  StartTranscriptionJobCommand: jest.fn(),
  GetTranscriptionJobCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(() => Promise.resolve())
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  }
}));

// Global test utilities
(global as any).testUtils = {
  createMockRequest: (body = {}, headers = {}) => ({
    json: () => Promise.resolve(body),
    headers: {
      get: (name: any) => (headers as any)[name] || null
    }
  }),
  
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  createMockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    data,
    status
  })
};

// Console suppression for tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};









