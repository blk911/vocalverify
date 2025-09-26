# AWS Voice ID Setup Guide

## Step 1: AWS Console Configuration

### 1.1 Create Amazon Connect Instance
1. Go to AWS Console → Search "Amazon Connect"
2. Click "Create instance"
3. Choose "Create a new instance"
4. Fill in:
   - **Instance alias**: `voice-auth-connect`
   - **Access URL**: `voice-auth-connect` (or your choice)
   - **Data storage**: Choose your region
4. Click "Create instance"

### 1.2 Enable Voice ID
1. In your Connect instance, go to **Contact Flows**
2. Look for **"Voice ID"** in the left sidebar
3. Click **"Enable Voice ID"**
4. Configure settings:
   - **Speaker verification**: ✅ Enable
   - **Fraud detection**: ✅ Enable
   - **Anti-spoofing**: ✅ Enable
   - **Confidence threshold**: `0.8` (high security)

### 1.3 Get Your IDs
1. **Connect Instance ID**: Found in Connect console URL
2. **Voice ID Domain ID**: Found in Voice ID settings

## Step 2: AWS IAM Configuration

### 2.1 Create IAM User
1. Go to **IAM** → **Users** → **Create user**
2. Username: `voice-auth-service`
3. Attach policies:
   - `AmazonConnectFullAccess`
   - `AmazonTranscribeFullAccess`
   - `AmazonS3FullAccess` (for audio storage)

### 2.2 Create Access Keys
1. Go to your user → **Security credentials**
2. Click **"Create access key"**
3. Choose **"Application running outside AWS"**
4. Save the **Access Key ID** and **Secret Access Key**

## Step 3: Environment Variables

Add these to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_CONNECT_INSTANCE_ID=your_connect_instance_id_here
AWS_VOICE_ID_DOMAIN_ID=your_voice_id_domain_id_here
```

## Step 4: Test the Integration

### 4.1 Test Voice Verification
```bash
curl -X POST http://localhost:3000/api/voice/aws-verify \
  -H "Content-Type: application/json" \
  -d '{
    "memberCode": "1234",
    "audioBuffer": "base64_encoded_audio_data",
    "phoneDigits": "5551234567"
  }'
```

### 4.2 Expected Response
```json
{
  "ok": true,
  "memberCode": "1234",
  "verificationResult": {
    "isVerified": true,
    "confidence": 0.95,
    "phoneNumber": "5551234567",
    "extractedContent": "My phone number is 555-123-4567",
    "securityLevel": "high",
    "fraudRisk": "low"
  },
  "message": "Voice verification successful"
}
```

## Step 5: Production Deployment

### 5.1 Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings
2. Go to **Environment Variables**
3. Add all AWS variables from Step 3

### 5.2 AWS S3 Bucket (for audio storage)
1. Create S3 bucket: `your-app-voice-storage`
2. Update the S3 bucket name in the code
3. Set appropriate permissions

## Security Features

✅ **Voice Biometric Matching** - AWS Voice ID
✅ **Content Verification** - AWS Transcribe
✅ **Fraud Detection** - Built-in AWS protection
✅ **Anti-Spoofing** - AWS Voice ID protection
✅ **Multi-factor Scoring** - Custom algorithm
✅ **Audit Logging** - Complete verification trails

## Cost Estimation

For 10,000 users/month:
- **Voice ID**: ~$50/month
- **Transcribe**: ~$25/month
- **S3 Storage**: ~$5/month
- **Total**: ~$80/month

## Next Steps

1. Complete AWS Console setup
2. Add environment variables
3. Test with real voice samples
4. Deploy to production
5. Monitor verification logs

## Troubleshooting

### Common Issues:
1. **"Access Denied"** → Check IAM permissions
2. **"Instance not found"** → Verify Connect Instance ID
3. **"Domain not found"** → Verify Voice ID Domain ID
4. **"Audio format error"** → Ensure WebM format

### Debug Commands:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Connect access
aws connect list-instances

# Test Voice ID access
aws connect describe-voice-id-domain --voice-id-domain-id YOUR_DOMAIN_ID
```
