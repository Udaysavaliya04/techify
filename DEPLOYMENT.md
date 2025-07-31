# Techify Deployment Guide for Render

## Prerequisites
1. GitHub repository with your code
2. Render account (free tier available)
3. MongoDB Atlas account (or any MongoDB instance)
4. Google Gemini API key
5. JDoodle API credentials (optional, for code execution)

## Step 1: Prepare Environment Variables

You'll need to set these environment variables in Render dashboard:

### Backend Service Environment Variables:
- `MONGO_URI` - Your MongoDB connection string
- `GEMINI_API_KEY` - Your Google Gemini API key  
- `JDOODLE_CLIENT_ID` - Your JDoodle client ID (optional)
- `JDOODLE_CLIENT_SECRET` - Your JDoodle client secret (optional)
- `JWT_SECRET` - A secure random string for JWT tokens

## Step 2: Deploy to Render

### Option 1: Using render.yaml (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Render will automatically detect the `render.yaml` file
4. Set the environment variables in the Render dashboard
5. Deploy!

### Option 2: Manual Setup
1. Create a new Web Service for the backend:
   - Connect your GitHub repo
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Set environment variables

2. Create a new Static Site for the frontend:
   - Connect your GitHub repo
   - Build Command: `cd frontend && npm install && REACT_APP_API_URL=https://your-backend-url.onrender.com npm run build`
   - Publish Directory: `frontend/build`

## Step 3: Configure Database

If using MongoDB Atlas:
1. Create a cluster
2. Create a database user
3. Whitelist Render's IP addresses (or use 0.0.0.0/0 for all IPs)
4. Get your connection string and set it as `MONGO_URI`

## Step 4: Test Deployment

1. Visit your frontend URL
2. Test user registration/login
3. Test creating and joining rooms
4. Test code execution (if JDoodle is configured)

## Troubleshooting

- Check Render logs for both services
- Ensure all environment variables are set correctly
- Make sure MongoDB is accessible from Render
- Verify API URLs are correctly configured

## Notes

- Free tier has some limitations (500 build hours/month, services sleep after 15 minutes of inactivity)
- Consider upgrading to paid plans for production use
- Enable auto-deploy for automatic updates when you push to GitHub
