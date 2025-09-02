# GitHub OAuth Setup Guide for Digital Studio VM

## 🔧 **Required Setup for GitHub Integration**

The GitHub OAuth integration requires proper configuration to work. Currently, the app shows a 404 error because the OAuth credentials are not set up.

## 📋 **Step-by-Step Setup Instructions**

### **Step 1: Create GitHub OAuth Application**

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers
   - Click on **"OAuth Apps"** in the left sidebar
   - Click **"New OAuth App"**

2. **Fill in the Application Details**
   ```
   Application name: Digital Studio VM
   Homepage URL: https://digital-studio-vm.vercel.app
   Application description: AI-powered code generation from UI designs
   Authorization callback URL: https://digital-studio-vm.vercel.app/prototype
   ```

3. **Register the Application**
   - Click **"Register application"**
   - You'll be redirected to your new OAuth app page

### **Step 2: Get OAuth Credentials**

After creating the app, you'll see:
- **Client ID** (public identifier)
- **Client Secret** (keep this private!)

**⚠️ Important:** Copy the **Client ID** - you'll need it for the next step.

### **Step 3: Update Frontend Code**

1. **Open the PrototypeLabFlow.jsx file**
   - File: `frontend/src/components/PrototypeLabFlow.jsx`
   - Find line ~162: `const clientId = 'your_github_client_id';`

2. **Replace the placeholder**
   ```jsx
   // Before:
   const clientId = 'your_github_client_id';
   
   // After (replace with your actual Client ID):
   const clientId = 'abc123def456ghi789'; // Your actual Client ID from GitHub
   ```

3. **Uncomment the redirect line**
   ```jsx
   // Find this line and uncomment it:
   // window.location.href = githubAuthUrl;
   
   // Change to:
   window.location.href = githubAuthUrl;
   ```

4. **Remove the alert message**
   ```jsx
   // Remove or comment out this alert:
   // alert('GitHub OAuth setup required!...');
   ```

### **Step 4: Update Other Lab Flows (Optional)**

If you want GitHub integration in Android and iOS labs too:

1. **AndroidLabFlow.jsx** - Same changes as above
2. **IOSLabFlow.jsx** - Same changes as above

### **Step 5: Deploy the Changes**

1. **Commit and push your changes**
   ```bash
   git add .
   git commit -m "Add GitHub OAuth Client ID"
   git push
   ```

2. **Vercel will automatically redeploy**
   - Your changes will be live in a few minutes

## 🔐 **Backend Configuration (Already Done)**

The backend API already includes the GitHub OAuth handlers:
- `github_oauth_callback` - Exchanges code for access token
- `github_create_repo` - Creates repository and pushes code

## 🧪 **Testing the Integration**

1. **Go to your Digital Studio VM app**
2. **Navigate to Prototype Lab**
3. **Click "Connect GitHub"**
4. **You should be redirected to GitHub's authorization page**
5. **Authorize the application**
6. **You'll be redirected back with "✓ Connected" status**

## 🔒 **Security Notes**

- **Client Secret**: Never expose this in frontend code
- **Access Tokens**: Stored securely in localStorage (for demo purposes)
- **Scopes**: Only requesting `repo` and `user` permissions
- **HTTPS**: Required for OAuth to work (Vercel provides this)

## 🚨 **Troubleshooting**

### **404 Error**
- Check that the Client ID is correct
- Verify the callback URL matches exactly
- Ensure the OAuth app is properly registered

### **Redirect URI Mismatch**
- Make sure the callback URL in GitHub matches your app URL
- Check for trailing slashes or protocol mismatches

### **Authorization Failed**
- Check that the OAuth app is not in development mode
- Verify the scopes are correctly set

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Verify all URLs and credentials
3. Test with a simple OAuth flow first

## 🎯 **Next Steps**

Once OAuth is working:
1. Users can connect their GitHub accounts
2. Generated code can be pushed to new repositories
3. Full GitHub integration workflow is available

---

**Note:** This setup is required for the GitHub integration to work. The app will show helpful error messages until the OAuth credentials are properly configured. 