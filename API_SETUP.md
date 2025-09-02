# API Setup Guide

## Environment Variables Required

To enable AI-powered code generation, you need to set up the following environment variables in your Vercel deployment:

### 1. Google Gemini API Key (Required)

**Get your API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

**Set in Vercel:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environment:** Production (and Preview if needed)

### 2. Figma API Token (Optional)

**Get your token:**
1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Navigate to Personal access tokens
3. Create a new token
4. Copy the token

**Set in Vercel:**
- **Name:** `FIGMA_API_TOKEN`
- **Value:** Your Figma token
- **Environment:** Production (and Preview if needed)

## Current Status

Based on the health check, your deployment shows:
- ✅ Vercel URL: Configured
- ❌ Gemini API Key: Not configured
- ❌ Figma API Token: Not configured

## Fallback Mode

When `GEMINI_API_KEY` is not configured, the API will:
- Generate fallback React components
- Provide sample code structure
- Work without AI assistance
- Show a note about missing API key

## Testing

After setting up the environment variables:
1. Redeploy your Vercel project
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Try generating code in the prototype lab

## Local Development

For local development, create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIGMA_API_TOKEN=your_figma_token_here
NODE_ENV=development
``` 