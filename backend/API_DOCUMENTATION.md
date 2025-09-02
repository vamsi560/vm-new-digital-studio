# Digital Studio Backend API Documentation

## 🚀 Vercel Serverless Functions

This backend is optimized for Vercel deployment with **3 main serverless functions** that stay within the 12-function limit:

### **Function 1: `/api/generate-code`** - Main Code Generation
### **Function 2: `/api/projects`** - Project Management  
### **Function 3: `/api/health`** - Health Check

---

## 📋 API Endpoints

### **1. Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "services": {
    "openai": true,
    "gemini": true,
    "figma": true,
    "cors": true
  },
  "version": "1.0.0"
}
```

---

### **2. Code Generation & Figma Integration**
```http
POST /api/generate-code
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
// For image upload
const formData = new FormData();
formData.append('action', 'generate_pixel_perfect_code');
formData.append('images', file1);
formData.append('images', file2);
formData.append('platform', 'web'); // web|android|ios
formData.append('framework', 'React'); // React|Vue|Angular|Kotlin|Swift
formData.append('styling', 'Tailwind CSS');
formData.append('architecture', 'Component Based');
formData.append('customLogic', 'optional custom logic');
formData.append('routing', 'optional routing config');
```

**OR for Figma import:**
```javascript
// For Figma import
const response = await fetch('/api/generate-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'import_figma',
    figmaUrl: 'https://www.figma.com/file/...',
    platform: 'web',
    framework: 'React',
    styling: 'Tailwind CSS',
    architecture: 'Component Based',
    customLogic: '',
    routing: ''
  })
});
```

**Response:**
```json
{
  "success": true,
  "code": "// Generated React code...",
  "qualityScore": {
    "codeQuality": { "score": 8.5, "issues": [], "recommendations": [] },
    "performance": { "score": 7.8, "issues": [], "recommendations": [] },
    "accessibility": { "score": 9.2, "issues": [], "recommendations": [] },
    "security": { "score": 8.9, "issues": [], "recommendations": [] },
    "overallScore": 8.6
  },
  "analysis": "# Component Analysis\n\n## Overview\n...",
  "projectId": "project-1705312200000",
  "metadata": {
    "platform": "web",
    "framework": "React",
    "qualityScore": 8.6,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### **3. Code Evaluation**
```http
POST /api/generate-code
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "evaluate_code",
  "code": "function MyComponent() { return <div>Hello</div>; }",
  "framework": "React",
  "platform": "web"
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "codeQuality": { "score": 7.5, "issues": [], "recommendations": [] },
    "performance": { "score": 8.0, "issues": [], "recommendations": [] },
    "accessibility": { "score": 6.5, "issues": [], "recommendations": [] },
    "security": { "score": 9.0, "issues": [], "recommendations": [] },
    "overallScore": 7.75
  }
}
```

---

### **4. Component Analysis**
```http
POST /api/generate-code
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "generate_analysis",
  "code": "// Your code here",
  "framework": "React",
  "platform": "web",
  "figmaData": {} // optional
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "# Component Analysis\n\n## Structure\n...\n## Dependencies\n...\n## Best Practices\n..."
}
```

---

### **5. Project Management**

#### **List Projects**
```http
GET /api/projects?action=list
```

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "project-1705312200000",
      "platform": "web",
      "framework": "React",
      "qualityScore": 8.6,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "fileCount": 15,
      "totalSize": 1024000
    }
  ],
  "count": 1
}
```

#### **Get Project Metadata**
```http
GET /api/projects?action=metadata&projectId=project-1705312200000
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "id": "project-1705312200000",
    "platform": "web",
    "framework": "React",
    "qualityScore": 8.6,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "fileCount": 15,
    "totalSize": 1024000,
    "lastModified": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Download Project**
```http
GET /api/projects?action=download&projectId=project-1705312200000
```

**Response:** ZIP file download

#### **Delete Project**
```http
DELETE /api/projects?action=delete&projectId=project-1705312200000
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "projectId": "project-1705312200000"
}
```

---

## 🎯 Frontend Integration Examples

### **1. Generate Code from Images**
```javascript
const generateCodeFromImages = async (images, options) => {
  const formData = new FormData();
  formData.append('action', 'generate_pixel_perfect_code');
  
  images.forEach(image => {
    formData.append('images', image);
  });
  
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch('/api/generate-code', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// Usage
const result = await generateCodeFromImages(imageFiles, {
  platform: 'web',
  framework: 'React',
  styling: 'Tailwind CSS',
  architecture: 'Component Based'
});
```

### **2. Import from Figma**
```javascript
const importFromFigma = async (figmaUrl, options) => {
  const response = await fetch('/api/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'import_figma',
      figmaUrl,
      ...options
    })
  });

  return response.json();
};

// Usage
const result = await importFromFigma('https://www.figma.com/file/...', {
  platform: 'web',
  framework: 'React',
  styling: 'Tailwind CSS'
});
```

### **3. Evaluate Code Quality**
```javascript
const evaluateCode = async (code, framework, platform) => {
  const response = await fetch('/api/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'evaluate_code',
      code,
      framework,
      platform
    })
  });

  return response.json();
};
```

### **4. Project Management**
```javascript
// List projects
const listProjects = async () => {
  const response = await fetch('/api/projects?action=list');
  return response.json();
};

// Download project
const downloadProject = async (projectId) => {
  const response = await fetch(`/api/projects?action=download&projectId=${projectId}`);
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `project-${projectId}.zip`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

---

## 🔧 Environment Variables

Set these in your Vercel project:

```env
GEMINI_API_KEY=your_gemini_api_key
FIGMA_API_TOKEN=your_figma_token
NODE_ENV=production
```

**Note**: `VERCEL_URL` is automatically provided by Vercel and used for CORS configuration.

---

## 📊 Function Limits & Optimization

### **Vercel Limits:**
- **12 serverless functions** (we use 3)
- **10-second timeout** for hobby plan
- **50MB payload** limit
- **100MB** function size limit

### **Our Optimization:**
- **Consolidated functions** to stay within limits
- **Efficient file handling** with streaming
- **Optimized dependencies** (removed heavy packages)
- **Smart caching** for repeated requests

### **Function Timeouts:**
- `/api/generate-code`: 60 seconds (AI processing)
- `/api/projects`: 30 seconds (file operations)
- `/api/health`: 10 seconds (quick check)

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common Error Codes:**
- `400`: Bad Request (missing parameters)
- `404`: Not Found (project doesn't exist)
- `413`: Payload Too Large (file too big)
- `500`: Internal Server Error
- `503`: Service Unavailable (AI services down)

---

## 🔄 Migration from Old API

If you're migrating from the old API structure:

**Old:** `/api/generate-pixel-perfect-code`
**New:** `/api/generate-code` with `action: 'generate_pixel_perfect_code'`

**Old:** `/api/import-figma-enhanced`
**New:** `/api/generate-code` with `action: 'import_figma'`

**Old:** `/api/evaluate-code`
**New:** `/api/generate-code` with `action: 'evaluate_code'`

---

## 📈 Performance Tips

1. **Batch operations** when possible
2. **Use appropriate image formats** (PNG for UI, JPEG for photos)
3. **Limit file sizes** to under 10MB each
4. **Cache project metadata** on frontend
5. **Implement retry logic** for AI service failures

---

## 🆘 Support

For issues:
1. Check the health endpoint first
2. Verify environment variables
3. Check Vercel function logs
4. Ensure proper CORS configuration 