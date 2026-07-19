# RentIt Backend - Email Configuration Guide

## AWS SES Setup

This backend uses AWS SES (Simple Email Service) for all email delivery.

### Prerequisites

1. AWS Account
2. AWS CLI configured (optional, for testing)

### Step 1: Create IAM User

1. Go to AWS Console → IAM → Users → Create user
   - Username: `rentit-email-service`
   - Access type: Programmatic access

2. Attach policy:
   - Search for `AmazonSESFullAccess`
   - Attach to the user

3. Save credentials:
   - Download CSV or copy Access Key ID and Secret Access Key
   - These will be used in `.env`

### Step 2: Verify SES Identity

1. Go to AWS Console → SES → Verified Identities
2. Click "Create identity"
3. Choose "Email address" or "Domain"
   - For testing: Verify your sender email
   - For production: Verify your entire domain
4. Complete verification via email (for email identity)
5. Use the verified email/domain as `AWS_SES_FROM`

### Step 3: Request Production Access

By default, SES is in sandbox mode. To send emails to any recipient:

1. Go to AWS Console → SES → Sending Statistics
2. Click "Request production access"
3. Fill in the form:
   - Use case description: "Rental platform sending OTP and transactional emails"
   - Expected volume: Estimate based on your user base
   - Confirm compliance with AWS policies
4. Wait for approval (usually within 24 hours)

### Step 4: Configure Environment Variables

Add to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_SES_FROM=verified-email@example.com
```

### Step 5: Deploy

1. Install dependencies:
   ```bash
   npm install @aws-sdk/client-sesv2
   ```

2. Remove old dependency:
   ```bash
   npm uninstall nodemailer
   ```

3. Deploy to your platform (Render/Railway/Heroku):
   - Set all 4 AWS environment variables in dashboard
   - Remove old `EMAIL_USER` and `EMAIL_PASS` variables

### Step 6: Verify

1. Start the server:
   ```bash
   npm start
   ```

2. Look for startup logs:
   ```
   ✓ AWS SES configuration loaded successfully
   ✓ Singleton SESv2Client initialized
   ```

3. Test email endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/auth/send-email-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

### Monitoring

Monitor SES in AWS Console:
- **Sending Statistics**: Track sent/failed/bounced emails
- **CloudWatch Metrics**: Set up alarms for bounces and complaints
- **SES Dashboard**: Monitor sending limits and reputation

### Troubleshooting

**Problem**: "Email delivery failed"  
**Solution**: Check SES sandbox status, verify identity, check IAM permissions

**Problem**: "Invalid client" error  
**Solution**: Verify AWS credentials in `.env`, check region matches

**Problem**: Emails not arriving  
**Solution**: Check spam folder, verify SPF/DKIM records, ensure domain verification

**Problem**: "ThrottlingException"  
**Solution**: Reduce request rate, request quota increase from AWS

### IAM Policy Example

For production, use least-privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:ListEmailIdentities"
      ],
      "Resource": "*"
    }
  ]
}
```

### Cost Estimate

- SES Free Tier: 62,000 outgoing emails/month (free)
- Beyond free tier: $0.10 per 1,000 emails
- No SMTP charges (using HTTPS API)

---

## Additional Documentation

- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [SES Sending Limits](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/limits.html)

---



## Running the Backend

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Configure AWS SES credentials
4. Run: `npm run dev` (development) or `npm start` (production)