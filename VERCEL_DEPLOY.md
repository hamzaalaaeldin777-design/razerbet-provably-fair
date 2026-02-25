# RazerBet Vercel Deployment Guide

## Prerequisites
1. A Vercel account (https://vercel.com)
2. A MongoDB Atlas account (https://mongodb.com/atlas) - FREE tier available
3. Git installed on your computer

---

## Step 1: Set Up MongoDB Atlas (Free)

1. Go to https://mongodb.com/atlas and sign up/login
2. Click "Build a Database" → Select "FREE" tier
3. Choose a cloud provider and region close to you
4. Click "Create Cluster" (takes 1-3 minutes)
5. Set up Database Access:
   - Click "Database Access" in sidebar
   - Add New Database User
   - Username: `razerbet`
   - Password: Generate a secure password (SAVE THIS!)
   - Click "Add User"
6. Set up Network Access:
   - Click "Network Access" in sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel serverless)
   - Click "Confirm"
7. Get your connection string:
   - Click "Database" in sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://razerbet:<password>@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your actual password

---

## Step 2: Prepare Your Code

1. Clone your GitHub repository locally
2. Open terminal/command prompt in the project folder

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from the project root folder)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? razerbet (or your choice)
# - Directory? ./
# - Override settings? No
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository (push code to GitHub first)
4. Configure the project (Vercel auto-detects settings)
5. Click "Deploy"

---

## Step 4: Set Environment Variables

After deployment, go to your Vercel project settings:

1. Click on your project in Vercel dashboard
2. Go to "Settings" → "Environment Variables"
3. Add these variables:

| Name | Value |
|------|-------|
| `MONGO_URL` | `mongodb+srv://razerbet:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/razerbet?retryWrites=true&w=majority` |
| `DB_NAME` | `razerbet` |
| `BOT_API_KEY` | `rzrbt_a81bc6b34dc15aae0a8ca9e2a9d517064deecaca727675c1` |
| `REACT_APP_BACKEND_URL` | Leave empty (Vercel sets this automatically) |

4. Click "Save"
5. Go to "Deployments" tab and click "Redeploy" on the latest deployment

---

## Step 5: Update Your Frontend

The frontend needs to know the API URL. In your `frontend/src/App.js`, the API URL is already set up to work:

```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;
```

For Vercel, since frontend and API are on the same domain, you can leave `REACT_APP_BACKEND_URL` empty and it will use relative URLs.

---

## Step 6: Connect Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add `razerbet.xyz`
4. Follow Vercel's instructions to update your DNS records

---

## Your Deployed URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-project.vercel.app`
- **API**: `https://your-project.vercel.app/api`

---

## API Endpoints (Same as Before)

```
POST /api/verify          - Verify a game
GET  /api/history         - Get game history  
GET  /api/user/{id}/stats - Get user stats
POST /api/bot/game        - Record game (requires API key)
```

---

## Updating Your Discord Bot

Update your bot's API URL to your Vercel domain:

```javascript
const API_URL = 'https://your-project.vercel.app/api';
const API_KEY = 'rzrbt_a81bc6b34dc15aae0a8ca9e2a9d517064deecaca727675c1';
```

---

## Troubleshooting

**API not working?**
- Check Environment Variables are set correctly
- Make sure MongoDB Atlas allows connections from anywhere
- Check Vercel Function Logs in dashboard

**Frontend not loading?**
- Clear browser cache
- Check browser console for errors

**MongoDB connection issues?**
- Verify your connection string is correct
- Check that your IP is whitelisted in Atlas
- Ensure password doesn't contain special characters that need encoding

---

## Cost Summary

- **Vercel**: FREE (Hobby plan includes serverless functions)
- **MongoDB Atlas**: FREE (M0 tier - 512MB storage)
- **Custom Domain**: ~$10-15/year (optional)

Total: **$0/month** for basic usage!
