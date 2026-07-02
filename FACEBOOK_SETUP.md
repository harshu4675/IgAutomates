# Facebook App Setup for Instagram Integration

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Select use case: "Other"
4. App type: "Business"
5. Fill in:
   - App Name: InstaFlow
   - App Contact Email: your email
6. Click "Create App"

## Step 2: Add Instagram Product

1. In your app dashboard, find "Add Products"
2. Add these products:
   - Instagram (Instagram Graph API)
   - Facebook Login
   - Webhooks

## Step 3: Configure Facebook Login

1. Go to Facebook Login > Settings
2. Add Valid OAuth Redirect URIs:
   - http://localhost:5000/api/instagram/callback (development)
   - https://your-app.onrender.com/api/instagram/callback (production)
3. Save changes

## Step 4: Get App Credentials

1. Go to Settings > Basic
2. Copy:
   - App ID → paste in .env as FB_APP_ID
   - App Secret → paste in .env as FB_APP_SECRET

## Step 5: Configure Webhooks (for later parts)

1. Go to Webhooks
2. Subscribe to Instagram
3. Callback URL: https://your-app.onrender.com/api/webhook
4. Verify Token: instaflow_webhook_verify_token_2024 (same as IG_VERIFY_TOKEN in .env)
5. Subscribe to: comments, messages

## Step 6: App Review (for production)

For development, add yourself as a tester:

1. App Roles > Roles
2. Add People > add your Facebook account as Admin
3. Your Instagram Business account owner should be added too

For public use, submit for App Review with these permissions:

- instagram_basic
- instagram_manage_messages
- instagram_manage_comments
- pages_show_list
- pages_manage_metadata
- pages_read_engagement

## Step 7: Instagram Business Account Setup

Your test Instagram account MUST be:

1. Business or Creator account (not personal)
2. Linked to a Facebook Page you admin

To convert:

1. Open Instagram app
2. Settings > Account > Switch to Professional Account
3. Choose Business
4. Follow prompts to link Facebook Page

## Development Testing Note

While in Development mode, only:

- App admins/developers/testers can use the app
- Their Instagram accounts must be added as Instagram Testers

To add Instagram Testers:

1. Roles > Instagram Testers
2. Add Instagram username
3. That user must accept invitation at:
   https://www.instagram.com/accounts/manage_access/
