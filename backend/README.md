# Digital Studio Backend - Enhanced API System

## 🚀 Overview

The Digital Studio Backend is a comprehensive API system designed to generate pixel-perfect code from UI designs. It integrates multiple AI models, MCP (Model Context Protocol) servers, and evaluation agents to ensure high-quality, production-ready code generation.

## ✨ Key Features

### 1. **Pixel-Perfect Code Generation**
- **Multi-Platform Support**: Web (React, Vue, Angular), Android (Kotlin), iOS (Swift)
- **AI-Powered**: Uses OpenAI GPT-4 and Google Gemini for code generation
- **MCP Integration**: Model Context Protocol for enhanced AI interactions
- **Quality Assurance**: Multiple evaluation layers for code quality

### 2. **Enhanced Figma Integration**
- **Direct API Connection**: Seamless Figma file import
- **Component Extraction**: Automatic component and frame detection
- **Image Processing**: High-quality image extraction and processing
- **Design Analysis**: Comprehensive design analysis and documentation

### 3. **Evaluator Agents**
- **Code Quality Assessment**: Automated code quality evaluation
- **Performance Analysis**: Performance and optimization recommendations
- **Accessibility Compliance**: WCAG compliance checking
- **Security Scanning**: Security vulnerability detection

### 4. **Component Analysis**
- **Automatic Documentation**: Generate comprehensive component documentation
- **Markdown Reports**: Detailed analysis in markdown format
- **Best Practices**: Framework-specific best practices recommendations
- **Project Structure**: Complete project structure generation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Enhanced API  │    │   MCP Server    │
│   (React)       │◄──►│   (Express)     │◄──►│   (AI Models)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Evaluator Agents│
                       │ (Code Quality)  │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Figma Integration│
                       │ (Design Import) │
                       └─────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for OpenAI and Google Gemini

### Setup

1. **Clone and Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Configuration**
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. **Configure API Keys**
Edit `.env` file with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
FIGMA_API_TOKEN=your_figma_api_token_here
```

4. **Start the Server**
```bash
npm run dev
```

## 🔧 API Endpoints

### Health Check
```http
GET /api/health
```

### Pixel-Perfect Code Generation
```http
POST /api/generate-pixel-perfect-code
Content-Type: multipart/form-data

Body:
- images: File[] (max 10 files, 10MB each)
- platform: string (web|android|ios)
- framework: string (React|Vue|Angular|Kotlin|Swift)
- styling: string (Tailwind CSS|Styled Components|SCSS)
- architecture: string (MVC|Modular|Component Based|Atomic)
- customLogic: string (optional)
- routing: string (optional)
```

### Enhanced Figma Integration
```http
POST /api/import-figma-enhanced
Content-Type: application/json

Body:
{
  "figmaUrl": "https://www.figma.com/file/...",
  "platform": "web",
  "framework": "React",
  "styling": "Tailwind CSS",
  "architecture": "Component Based",
  "customLogic": "",
  "routing": ""
}
```

### Code Evaluation
```http
POST /api/evaluate-code
Content-Type: application/json

Body:
{
  "code": "// Your code here",
  "framework": "React",
  "platform": "web"
}
```

### Component Analysis
```http
POST /api/generate-component-analysis
Content-Type: application/json

Body:
{
  "code": "// Your code here",
  "framework": "React",
  "platform": "web",
  "figmaData": {} // optional
}
```

### Project Management
```http
GET /api/projects                    # List all projects
GET /api/project/:projectId          # Get project metadata
GET /api/download-project/:projectId # Download project as ZIP
```

## 🎯 Usage Examples

### 1. Generate Web Code from Images
```javascript
const formData = new FormData();
formData.append('images', imageFile1);
formData.append('images', imageFile2);
formData.append('platform', 'web');
formData.append('framework', 'React');
formData.append('styling', 'Tailwind CSS');
formData.append('architecture', 'Component Based');

const response = await fetch('/api/generate-pixel-perfect-code', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.code); // Generated React code
```

### 2. Import from Figma
```javascript
const response = await fetch('/api/import-figma-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    figmaUrl: 'https://www.figma.com/file/abc123/Design',
    platform: 'web',
    framework: 'React',
    styling: 'Tailwind CSS'
  })
});

const result = await response.json();
console.log(result.projectPath); // Path to generated project
```

### 3. Evaluate Code Quality
```javascript
const response = await fetch('/api/evaluate-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'function MyComponent() { return <div>Hello</div>; }',
    framework: 'React',
    platform: 'web'
  })
});

const result = await response.json();
console.log(result.evaluation.overallScore); // Quality score
```

## 🔍 Code Quality Metrics

The system evaluates code across multiple dimensions:

### Code Quality (25%)
- **Readability**: Code structure and organization
- **Maintainability**: Code maintainability and modularity
- **Documentation**: Comments and documentation quality
- **Naming**: Variable and function naming conventions

### Performance (20%)
- **Efficiency**: Code optimization and efficiency
- **Memory**: Memory usage and management
- **Speed**: Execution speed and responsiveness

### Accessibility (25%)
- **WCAG Compliance**: Web Content Accessibility Guidelines
- **Usability**: User experience and interface design
- **Responsive**: Responsive design implementation

### Security (30%)
- **Vulnerabilities**: Security vulnerability detection
- **Data Protection**: Data protection and privacy measures
- **Input Validation**: Input validation and sanitization

## 📁 Project Structure

```
backend/
├── api/
│   ├── enhanced-api.js           # Main API server
│   ├── enhanced-code-generator.js # Code generation engine
│   ├── evaluator-agents.js       # Code quality evaluators
│   ├── enhanced-figma-integration.js # Figma integration
│   ├── mcp-server.js            # MCP server implementation
│   └── index.js                 # Entry point
├── projects/                    # Generated projects
├── evaluations/                 # Code evaluation reports
├── logs/                       # Application logs
├── package.json
└── README.md
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3001
# VERCEL_URL is automatically provided by Vercel
```

## 🔧 Configuration

### MCP Server Configuration
The MCP server can be configured via environment variables:
```env
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=3002
```

### File Upload Limits
```env
MAX_FILE_SIZE=10485760  # 10MB
MAX_FILES=10           # Maximum 10 files
```

### Logging Configuration
```env
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔄 Updates

The system is continuously updated with:
- New AI model integrations
- Enhanced code generation algorithms
- Improved evaluation metrics
- Additional platform support 