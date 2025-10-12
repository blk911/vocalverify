# Environment Setup Guide

## Overview
This guide will help you set up the required environment variables for the AmIHuman application.

## Prerequisites
- Node.js 20.10.0 or higher
- Firebase account with Firestore enabled
- AWS account with S3 and Transcribe access

## Step 1: Create Environment File

1. Copy the template file:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` in your editor

## Step 2: Firebase Configuration

### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Navigate to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file

### Add to .env.local

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes around the private key and preserve the `\n` characters.

## Step 3: AWS Configuration

### Get AWS Credentials

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user or use existing
3. Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonTranscribeFullAccess`
4. Create access keys
5. Copy the Access Key ID and Secret Access Key

### Create S3 Bucket

1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Create a new bucket (e.g., `amihuman-voice-files`)
3. Note the bucket name

### Add to .env.local

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=amihuman-voice-files
AWS_TRANSCRIBE_REGION=us-east-1
```

## Step 4: Application Configuration

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Voice Authentication Settings

```env
VOICE_AUTH_MIN_CONFIDENCE=0.8
VOICE_AUTH_MAX_DURATION=30
VOICE_AUTH_BIOMETRIC_THRESHOLD=0.75
```

## Step 6: Development Settings (Optional)

### Using Firebase Emulator

```env
USE_FIREBASE_EMULATOR=true
FIREBASE_EMULATOR_HOST=localhost:8080
```

To start the emulator:
```bash
firebase emulators:start
```

### Debug Logging

```env
DEBUG=true
LOG_LEVEL=debug
```

## Verification

### Test Firebase Connection

```bash
curl http://localhost:3000/api/test-firebase
```

### Test AWS Connection

```bash
curl http://localhost:3000/api/voice/test-transcribe
```

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - It's already in `.gitignore`

2. **Rotate credentials regularly**
   - Firebase: Generate new service account keys
   - AWS: Rotate access keys

3. **Use least privilege principle**
   - Only grant necessary permissions
   - Use separate credentials for dev/prod

4. **Secure storage**
   - Use environment variable managers in production
   - Consider AWS Secrets Manager or similar

## Troubleshooting

### Firebase Connection Issues

**Error:** "Missing env FIREBASE_PROJECT_ID"
- Ensure all Firebase variables are set in `.env.local`
- Restart the dev server after changes

**Error:** "Invalid private key"
- Check that the private key includes `\n` characters
- Ensure quotes are around the entire key

### AWS Connection Issues

**Error:** "Access Denied"
- Verify IAM permissions
- Check bucket policies
- Ensure region matches

**Error:** "Bucket not found"
- Verify bucket name is correct
- Check bucket region

### General Issues

**Changes not taking effect**
```bash
# Restart the dev server
npm run dev
```

**Clear Next.js cache**
```bash
rm -rf .next
npm run dev
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIREBASE_PROJECT_ID` | Yes | - | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Yes | - | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | - | Service account private key |
| `AWS_ACCESS_KEY_ID` | Yes | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | - | AWS secret key |
| `AWS_REGION` | Yes | `us-east-1` | AWS region |
| `AWS_S3_BUCKET_NAME` | Yes | - | S3 bucket for voice files |
| `NODE_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Application URL |
| `USE_FIREBASE_EMULATOR` | No | `false` | Use local emulator |
| `DEBUG` | No | `false` | Enable debug logging |

## Next Steps

After setting up your environment:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Check the application:
   ```
   http://localhost:3000
   ```

## Support

For issues or questions:
- Check the main README.md
- Review Firebase/AWS documentation
- Check application logs









