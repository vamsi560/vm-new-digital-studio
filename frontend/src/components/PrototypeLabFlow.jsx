import React, { useState, useCallback, useEffect } from 'react';
import LivePreview from './LivePreview';
import FigmaImportModal from './FigmaImportModal';
import GitHubImportModal from './GitHubImportModal';

const PrototypeLabFlow = ({ onNavigate }) => {
    const [currentScreen, setCurrentScreen] = useState(1);
    const [framework, setFramework] = useState('React');
    const [styling, setStyling] = useState('Tailwind CSS');
    const [architecture, setArchitecture] = useState('Component-Based');
    const [uploadedScreens, setUploadedScreens] = useState([]);
    const [screenOrder, setScreenOrder] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showLogicPopup, setShowLogicPopup] = useState(false);
    const [customLogic, setCustomLogic] = useState('');
    const [routing, setRouting] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [generatedProject, setGeneratedProject] = useState(null);
    const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
    const [workflowStatus, setWorkflowStatus] = useState({});
    
    // New state for image expansion and session management
    const [expandedImage, setExpandedImage] = useState(null);
    const [showFigmaModal, setShowFigmaModal] = useState(false);
    const [showGitHubModal, setShowGitHubModal] = useState(false);
    const [sessionData, setSessionData] = useState({
        uploadedScreens: [],
        screenOrder: [],
        framework: 'React',
        styling: 'Tailwind CSS',
        architecture: 'Component-Based',
        customLogic: '',
        routing: '',
        generatedCode: '',
        generatedProject: null
    });

    // New state for GitHub integration and preview mode
    const [isGitHubConnected, setIsGitHubConnected] = useState(false);
    const [githubUser, setGithubUser] = useState(null);
    const [showPreviewOnly, setShowPreviewOnly] = useState(false);
    const [componentAnalysis, setComponentAnalysis] = useState(null);
    const [generatedRepoUrl, setGeneratedRepoUrl] = useState('');

    const handleFileUpload = useCallback((files) => {
        const newScreens = Array.from(files).map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            url: URL.createObjectURL(file),
            file: file
        }));
        setUploadedScreens(prev => [...prev, ...newScreens]);
        // Initialize screen order with empty slots
        setScreenOrder(prev => [...prev, ...new Array(newScreens.length).fill(null)]);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    };

    // Screen order drag and drop functionality
    const handleScreenDragStart = (e, screen) => {
        setDraggedItem(screen);
    };

    const handleScreenDrop = (e, index) => {
        e.preventDefault();
        if (!draggedItem) return;
        
        const newScreenOrder = [...screenOrder];
        newScreenOrder[index] = draggedItem;
        setScreenOrder(newScreenOrder);
        
        // Remove from uploaded screens
        setUploadedScreens(prev => prev.filter(screen => screen.id !== draggedItem.id));
        setDraggedItem(null);
    };

    // Enhanced code generation with component analysis
    const handleGenerateCode = async () => {
        setIsGenerating(true);
        setWorkflowStatus({ text: 'Analyzing screens and generating architecture...', step: 'analyzing' });

        try {
            const formData = new FormData();
            const orderedScreens = screenOrder.filter(Boolean);
            
            formData.append('action', 'generate_pixel_perfect_code');
            
            // Add images if available
            orderedScreens.forEach((screen, index) => {
                formData.append('images', screen.file);
                formData.append('screenOrder', index);
            });
            
            // Enhanced parameters for better code generation
            formData.append('platform', 'web');
            formData.append('framework', framework);
            formData.append('styling', styling);
            formData.append('architecture', architecture);
            formData.append('customLogic', customLogic);
            formData.append('routing', routing);
            formData.append('includeAnalysis', 'true'); // Request component analysis
            formData.append('colorExtraction', 'true'); // Request color extraction
            formData.append('pixelPerfect', 'true'); // Request pixel-perfect generation

            setWorkflowStatus({ text: 'Generating React components and structure...', step: 'generating' });

            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            setWorkflowStatus({ text: 'Finalizing project structure...', step: 'finalizing' });
            
            setGeneratedProject(data);
            setGeneratedCode(data.mainCode || '// Generated code will appear here');
            
            // Set component analysis if available
            if (data.analysis) {
                setComponentAnalysis(data.analysis);
            }
            
            setWorkflowStatus({ text: 'Code generation completed!', step: 'completed' });
            
            // Move to screen 2 after successful generation
            setTimeout(() => {
                setCurrentScreen(2);
            }, 1000);

        } catch (error) {
            console.error('Error generating code:', error);
            setWorkflowStatus({ text: 'Error generating code. Please try again.', step: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    // GitHub OAuth integration
    const handleGitHubConnect = () => {
        // TODO: Replace with your actual GitHub OAuth Client ID
        const clientId = 'Ov23livMWxwbsd6jJw0D'; // Get this from GitHub OAuth App settings
        const redirectUri = encodeURIComponent(window.location.origin + '/prototype');
        const scope = encodeURIComponent('repo user');
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        
        // For now, show a helpful message
        //alert('GitHub OAuth setup required!\n\n1. Create GitHub OAuth App at: https://github.com/settings/developers\n2. Set Homepage URL: https://digital-studio-vm.vercel.app\n3. Set Callback URL: https://digital-studio-vm.vercel.app/prototype\n4. Replace "your_github_client_id" with your actual Client ID');
        
        // Uncomment the line below after setting up OAuth credentials
        window.location.href = githubAuthUrl;
    };

    // Handle GitHub OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            handleGitHubCallback(code);
        }
    }, []);

    const handleGitHubCallback = async (code) => {
        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'github_oauth_callback',
                    code: code
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setIsGitHubConnected(true);
                    setGithubUser(data.user);
                    // Store GitHub token securely
                    localStorage.setItem('github_token', data.access_token);
                }
            }
        } catch (error) {
            console.error('GitHub OAuth error:', error);
        }
    };

    // Push code to GitHub repository
    const handlePushToGitHub = async () => {
        if (!isGitHubConnected) {
            alert('Please connect to GitHub first');
            return;
        }

        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'github_create_repo',
                    projectData: generatedProject,
                    projectName: 'digital-studio-project',
                    framework: framework,
                    platform: 'web',
                    description: `Generated using Digital Studio VM - ${framework} + ${styling} + ${architecture}`,
                    isPrivate: false
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setGeneratedRepoUrl(data.repoUrl);
                    alert(`Repository created successfully!\nURL: ${data.repoUrl}`);
                }
            }
        } catch (error) {
            console.error('GitHub push error:', error);
            alert('Error pushing to GitHub. Please try again.');
        }
    };

    const handleDownload = () => {
        if (!generatedProject) return;
        
        const element = document.createElement('a');
        const file = new Blob([generatedCode], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'prototype-project.js';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Open in VS Code function
    const handleOpenInVSCode = () => {
        if (!generatedCode) return;
        
        // Create a temporary folder structure
        const projectStructure = {
            'package.json': JSON.stringify({
                name: "digital-studio-project",
                version: "1.0.0",
                private: true,
                dependencies: {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0"
                },
                devDependencies: {
                    "@types/react": "^18.2.0",
                    "@types/react-dom": "^18.2.0",
                    "vite": "^4.0.0",
                    "@vitejs/plugin-react": "^4.0.0"
                },
                scripts: {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                }
            }, null, 2),
            'src/App.jsx': generatedCode,
            'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
            'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Digital Studio Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
            'README.md': `# Digital Studio Project

This project was generated using Digital Studio VM.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

Generated on: ${new Date().toISOString()}
`
        };

        // Create a ZIP file
        const zip = new JSZip();
        
        Object.entries(projectStructure).forEach(([path, content]) => {
            zip.file(path, content);
        });
        
        // Generate ZIP and create download link
        zip.generateAsync({ type: "blob" }).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'digital-studio-project.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show instructions for opening in VS Code
            alert('Project downloaded! To open in VS Code:\n\n1. Extract the ZIP file\n2. Open VS Code\n3. Go to File > Open Folder\n4. Select the extracted project folder\n\nOr use the command: code /path/to/extracted/folder');
        });
    };

    const handleAddLogic = (screenIndex) => {
        setSelectedScreenIndex(screenIndex);
        setShowLogicPopup(true);
    };

    const handleSaveLogic = () => {
        // Save logic for the selected screen
        setShowLogicPopup(false);
        setCustomLogic('');
    };

    // Session management functions
    const saveSessionData = () => {
        const sessionDataToSave = {
            uploadedScreens,
            screenOrder,
            framework,
            styling,
            architecture,
            customLogic,
            routing,
            generatedCode,
            generatedProject
        };
        setSessionData(sessionDataToSave);
        localStorage.setItem('prototypeLabSession', JSON.stringify(sessionDataToSave));
    };

    const loadSessionData = () => {
        const savedSession = localStorage.getItem('prototypeLabSession');
        if (savedSession) {
            const parsedSession = JSON.parse(savedSession);
            setSessionData(parsedSession);
            setUploadedScreens(parsedSession.uploadedScreens || []);
            setScreenOrder(parsedSession.screenOrder || []);
            setFramework(parsedSession.framework || 'React');
            setStyling(parsedSession.styling || 'Tailwind CSS');
            setArchitecture(parsedSession.architecture || 'Component-Based');
            setCustomLogic(parsedSession.customLogic || '');
            setRouting(parsedSession.routing || '');
            setGeneratedCode(parsedSession.generatedCode || '');
            setGeneratedProject(parsedSession.generatedProject || null);
        }
    };

    // Image expansion functions
    const handleImageClick = (image) => {
        setExpandedImage(image);
    };

    // Figma import function
    const handleFigmaImport = async (figmaUrl) => {
        setIsGenerating(true);
        setWorkflowStatus({ text: 'Importing from Figma...', step: 'importing' });

        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'import_figma',
                    figmaUrl,
                    platform: 'web',
                    framework,
                    styling,
                    architecture,
                    includeAnalysis: true,
                    colorExtraction: true,
                    pixelPerfect: true
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setGeneratedProject(data);
                setGeneratedCode(data.mainCode || '// Generated code will appear here');
                if (data.analysis) {
                    setComponentAnalysis(data.analysis);
                }
                setWorkflowStatus({ text: 'Figma import completed!', step: 'completed' });
                
                // Move to screen 2 after successful import
                setTimeout(() => {
                    setCurrentScreen(2);
                }, 1000);
            } else {
                throw new Error(data.error || 'Import failed');
            }

        } catch (error) {
            console.error('Error importing from Figma:', error);
            setWorkflowStatus({ text: 'Error importing from Figma. Please try again.', step: 'error' });
            throw error; // Re-throw to be handled by the modal
        } finally {
            setIsGenerating(false);
        }
    };

    // GitHub import function
    const handleGitHubImport = async (githubUrl) => {
        setIsGenerating(true);
        setWorkflowStatus({ text: 'Importing from GitHub...', step: 'importing' });

        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'github_export',
                    projectData: generatedProject || { mainCode: '// Sample code' },
                    projectName: 'digital-studio-project',
                    framework: framework,
                    platform: 'web'
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setGeneratedProject(data);
                setGeneratedCode(data.mainCode || '// Generated code will appear here');
                setWorkflowStatus({ text: 'GitHub import completed!', step: 'completed' });
                
                // Move to screen 2 after successful import
                setTimeout(() => {
                    setCurrentScreen(2);
                }, 1000);
            } else {
                throw new Error(data.error || 'Import failed');
            }

        } catch (error) {
            console.error('Error importing from GitHub:', error);
            setWorkflowStatus({ text: 'Error importing from GitHub. Please try again.', step: 'error' });
            throw error; // Re-throw to be handled by the modal
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCloseExpandedImage = () => {
        setExpandedImage(null);
    };

    // Load session data on component mount
    useEffect(() => {
        loadSessionData();
    }, []);

    // Save session data when important data changes
    useEffect(() => {
        saveSessionData();
    }, [uploadedScreens, screenOrder, framework, styling, architecture, customLogic, routing, generatedCode, generatedProject]);

    // Preview-only mode toggle
    const togglePreviewOnly = () => {
        setShowPreviewOnly(!showPreviewOnly);
    };

    const renderScreen1 = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300 relative overflow-hidden">
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
                }}></div>
            </div>
            {/* Enhanced Top Header with Better Spacing */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 backdrop-blur-sm px-4 py-3 shadow-xl">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => onNavigate('landing')}
                            className="group bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 px-3 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            aria-label="Go back to landing page"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-3 h-3 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="font-medium text-xs">Back</span>
                            </div>
                        </button>
                        <div className="space-y-0">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Digital Studio</h1>
                        </div>
                    </div>
                    
                    {/* Enhanced Configuration Cards with Better Visual Hierarchy */}
                    <div className="flex items-center space-x-3">
                        {/* Framework Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-lg p-3 min-w-[160px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Framework</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['React', 'Angular', 'Vue.js', 'Svelte'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-1.5 rounded-md hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-xs font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="framework"
                                                value={option}
                                                checked={framework === option}
                                                onChange={(e) => setFramework(e.target.value)}
                                                className="w-3 h-3 text-blue-500 bg-gray-700 border-gray-500 focus:ring-blue-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {framework === option && (
                                                <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Styling Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-lg p-3 min-w-[160px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Styling</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Tailwind CSS', 'CSS Modules', 'Styled Components', 'Material-UI'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-1.5 rounded-md hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-xs font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="styling"
                                                value={option}
                                                checked={styling === option}
                                                onChange={(e) => setStyling(e.target.value)}
                                                className="w-3 h-3 text-green-500 bg-gray-700 border-gray-500 focus:ring-green-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {styling === option && (
                                                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Architecture Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-lg p-3 min-w-[160px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Architecture</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Component-Based', 'Atomic Design', 'Feature-Based', 'Domain-Driven'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-1.5 rounded-md hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-xs font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="architecture"
                                                value={option}
                                                checked={architecture === option}
                                                onChange={(e) => setArchitecture(e.target.value)}
                                                className="w-3 h-3 text-purple-500 bg-gray-700 border-gray-500 focus:ring-purple-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {architecture === option && (
                                                <div className="absolute inset-0 w-3 h-3 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Screen Navigation */}
                    <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => setCurrentScreen(1)}
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 1 
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 1"
                            >
                                1
                            </button>
                            <button 
                                onClick={() => setCurrentScreen(2)}
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 2 
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 2"
                            >
                                2
                            </button>
                            <button 
                                onClick={() => setCurrentScreen(3)}
                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 3 
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 3"
                            >
                                3
                            </button>
                        </div>
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-md flex items-center justify-center shadow-lg border border-gray-600/30">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Main Content Area */}
            <div className="flex h-[calc(100vh-72px)] w-full px-4">
                {/* Enhanced Left Sidebar - Uploaded Screens */}
                <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700/50 p-3">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-lg p-4 h-full shadow-2xl backdrop-blur-sm flex flex-col">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                            <h3 className="text-sm font-bold text-gray-200">Uploaded Screens</h3>
                        </div>
                        
                        {/* Upload Area */}
                        <div className="mb-4">
                            <label className={`flex items-center justify-center w-full p-3 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-blue-400/50 ${
                                isDragging
                                    ? 'border-blue-400 bg-blue-400/10'
                                    : 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            >
                                <div className="text-center">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300 ${
                                        isDragging
                                            ? 'bg-blue-500 scale-110'
                                            : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                    }`}>
                                        <svg className={`w-4 h-4 text-white transition-all duration-300 ${isDragging ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                    </div>
                                    <span className="text-gray-200 font-medium text-xs block mb-1">
                                        {isDragging ? 'Drop files here' : 'Upload screens'}
                                    </span>
                                    <span className="text-gray-400 text-xs">Drag & drop or click</span>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Import Buttons */}
                        <div className="space-y-2 mb-4">
                            <button 
                                onClick={() => setShowFigmaModal(true)}
                                className="w-full flex items-center space-x-2 p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                            >
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                                <span className="text-white font-medium text-xs">Import from Figma</span>
                            </button>
                            <button 
                                onClick={() => setShowGitHubModal(true)}
                                className="w-full flex items-center space-x-2 p-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                            >
                                <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                </svg>
                                <span className="text-gray-300 font-medium text-xs">Import from GitHub</span>
                            </button>
                        </div>

                        {/* Uploaded Screens List */}
                        {uploadedScreens.length > 0 && (
                            <div className="flex-1 overflow-y-auto">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Available Screens</h4>
                                <div className="space-y-3">
                                    {uploadedScreens.map((screen, index) => (
                                        <div 
                                            key={screen.id} 
                                            className="group bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-3 border border-gray-600/30 cursor-grab hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                            draggable
                                            onDragStart={(e) => handleScreenDragStart(e, screen)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-600 to-gray-500 flex-shrink-0">
                                                    <img src={screen.url} alt={screen.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-sm font-medium text-gray-200 truncate">Screen {index + 1}</h5>
                                                    <p className="text-xs text-gray-400 truncate">{screen.name}</p>
                                                </div>
                                                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Main Area - Screen Order Display */}
                <div className="flex-1 p-3">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-lg p-4 h-[calc(100vh-160px)] shadow-2xl backdrop-blur-sm relative w-full">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                            <h3 className="text-sm font-bold text-gray-200">Screen Flow Order</h3>
                        </div>
                        {uploadedScreens.length === 0 && screenOrder.filter(Boolean).length === 0 ? (
                            <div className="flex items-center justify-center h-[calc(100%-120px)] border-2 border-dashed border-gray-600/50 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 transition-all duration-300 hover:border-gray-500/50">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-medium mb-1">Upload images to see prototype screen flow</p>
                                    <p className="text-gray-500 text-sm">Drag screens from sidebar to arrange order</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-6 gap-4">
                                {screenOrder.map((screen, index) => (
                                    <div 
                                        key={index}
                                        className={`aspect-[9/16] border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 ${
                                            screen 
                                                ? 'border-gray-500 bg-gradient-to-br from-gray-700 to-gray-600 shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105' 
                                                : 'border-gray-600/50 bg-gradient-to-br from-gray-800 to-gray-700'
                                        }`}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleScreenDrop(e, index)}
                                        onClick={screen ? () => handleImageClick(screen) : undefined}
                                    >
                                        {screen ? (
                                            <div className="relative w-full h-full group">
                                                <img src={screen.url} alt={screen.name} className="w-full h-full object-cover rounded-lg" />
                                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-white text-xs font-medium mb-1">Click to expand</div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddLogic(index);
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Add Logic
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <span className="text-3xl text-gray-500 font-bold">{index + 1}</span>
                                                <p className="text-xs text-gray-400 mt-1">Drop screen here</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                                               {/* GitHub Connection Status */}
                        <div className="absolute bottom-6 left-6">
                            {!isGitHubConnected ? (
                                <button
                                    onClick={handleGitHubConnect}
                                    className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                                >
                                    <svg className="w-3 h-3 group-hover:transform group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                    </svg>
                                    <span className="text-sm">Connect GitHub</span>
                                </button>
                            ) : (
                                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center space-x-2">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                    </svg>
                                    <span className="text-sm">✓ Connected</span>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Submit Button */}
                       <div className="absolute bottom-6 right-6">
                           {isGenerating ? (
                               <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-xl">
                                   <div className="flex items-center space-x-2">
                                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                       <span>{workflowStatus.text || 'Generating...'}</span>
                                   </div>
                               </div>
                           ) : (
                               <button
                                   onClick={handleGenerateCode}
                                   className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                   aria-label="Generate prototype code"
                               >
                                   <div className="flex items-center space-x-2">
                                       <span className="text-sm">Generate Prototype Code</span>
                                       <svg className="w-3 h-3 group-hover:transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                       </svg>
                                   </div>
                               </button>
                           )}
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderScreen2 = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300">
            {/* Top Header with Navigation */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 backdrop-blur-sm px-6 py-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => onNavigate('landing')}
                            className="group bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-600/30"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                <span className="font-medium text-sm">Home</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setCurrentScreen(1)}
                            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-blue-500/30"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="font-medium text-sm">Back to Setup</span>
                            </div>
                        </button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Digital Studio</h2>
                        
                        {/* Screen Navigation */}
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setCurrentScreen(1)}
                                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 transform hover:scale-110 ${
                                    currentScreen === 1 
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                            >
                                1
                            </button>
                            <button 
                                onClick={() => setCurrentScreen(2)}
                                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 transform hover:scale-110 ${
                                    currentScreen === 2 
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20' 
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                            >
                                2
                            </button>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center shadow-lg border border-gray-600/30">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                            </svg>
                        </div>
                    </div>
                    

                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {/* Left Panel - Generated Project Structure */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-gray-200 mb-6">Generated Project Structure</h3>
                        {generatedProject ? (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-600/30">
                                    <h4 className="text-lg font-semibold text-gray-200 mb-3">📁 Project Files</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-blue-400">📄</span>
                                            <span>package.json</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-green-400">📄</span>
                                            <span>src/App.jsx</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-purple-400">📄</span>
                                            <span>src/components/Screen1.jsx</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-purple-400">📄</span>
                                            <span>src/components/Screen2.jsx</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-yellow-400">📄</span>
                                            <span>src/styles/App.css</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <span className="text-orange-400">📄</span>
                                            <span>README.md</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-600/30">
                                    <h4 className="text-lg font-semibold text-gray-200 mb-3">⚙️ Configuration</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Framework:</span>
                                            <span className="text-gray-200">{framework}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Styling:</span>
                                            <span className="text-gray-200">{styling}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Architecture:</span>
                                            <span className="text-gray-200">{architecture}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Screens:</span>
                                            <span className="text-gray-200">{screenOrder.filter(Boolean).length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span>Download Project</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setCurrentScreen(3)}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                            <span>Preview Screens</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>
                                <p className="text-gray-400 mb-4">No project generated yet</p>
                                <button
                                    onClick={() => setCurrentScreen(1)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Go Back to Setup
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Generated Code */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-200">Generated Code</h3>
                            <div className="flex space-x-2">
                                <button className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-300 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300">
                                    App.jsx
                                </button>
                                <button className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-300 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300">
                                    Screen1.jsx
                                </button>
                                <button className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-300 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300">
                                    App.css
                                </button>
                            </div>
                        </div>
                        {generatedCode ? (
                            <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30 shadow-inner overflow-hidden">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-600/30">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-400 text-sm ml-2">App.jsx</span>
                                    </div>
                                </div>
                                <pre className="p-6 text-sm text-gray-200 overflow-auto max-h-96">
                                    <code>{generatedCode}</code>
                                </pre>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center py-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30">
                                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                </svg>
                                <p className="text-lg">Generated code will appear here</p>
                                <p className="text-sm text-gray-500 mt-2">Complete React codebase with components and styling</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Add Logic Button */}
                <div className="mt-8 flex justify-end max-w-7xl mx-auto">
                    <button
                        onClick={() => setShowLogicPopup(true)}
                        className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <div className="flex items-center space-x-2">
                            <span>Add Logic</span>
                            <svg className="w-4 h-4 group-hover:transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderScreen3 = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300">
            {/* Top Header with Navigation */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 backdrop-blur-sm px-6 py-4 shadow-xl">
                <div className="flex items-center justify-between w-full px-6">
                    <div className="flex items-center space-x-6">
                        <button 
                            onClick={() => onNavigate('landing')}
                            className="group bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 px-4 py-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            aria-label="Go back to landing page"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="font-medium text-sm">Home</span>
                            </div>
                        </button>
                        <button 
                            onClick={() => setCurrentScreen(2)}
                            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            aria-label="Go back to results"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="font-medium text-sm">Back to Results</span>
                            </div>
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">Digital Studio</h1>
                        </div>
                    </div>
                    
                    {/* Enhanced Screen Navigation */}
                    <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentScreen(1)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 1
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20'
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 1"
                            >
                                1
                            </button>
                            <button
                                onClick={() => setCurrentScreen(2)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 2
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20'
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 2"
                            >
                                2
                            </button>
                            <button
                                onClick={() => setCurrentScreen(3)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                                    currentScreen === 3
                                        ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-lg shadow-blue-400/20'
                                        : 'border-gray-600 text-gray-600 hover:border-gray-500 hover:text-gray-500'
                                }`}
                                aria-label="Go to screen 3"
                            >
                                3
                            </button>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center shadow-lg border border-gray-600/30">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-6">
                <div className="w-full">
                    {showPreviewOnly ? (
                        // Preview-only mode - full screen preview
                        <div className="w-full h-[calc(100vh-120px)]">
                            <div className="bg-white rounded-xl border border-gray-600/30 shadow-inner overflow-hidden h-full">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-600 text-sm ml-2">Live Preview</span>
                                    </div>
                                    <button
                                        onClick={togglePreviewOnly}
                                        className="text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 h-full bg-white overflow-auto">
                                    <LivePreview code={generatedCode} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Normal mode with panels
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel - Screen List */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-gray-200 mb-4">Generated Screens</h3>
                            <div className="space-y-3">
                                {screenOrder.filter(Boolean).map((screen, index) => (
                                    <div 
                                        key={index}
                                        className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-3 border border-gray-600/30 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                        onClick={() => setSelectedScreenIndex(index)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-600 to-gray-500">
                                                <img src={screen.url} alt={screen.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-gray-200">Screen {index + 1}</h4>
                                                <p className="text-xs text-gray-400">{screen.name}</p>
                                            </div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Center Panel - Live Preview */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-200">Live Preview</h3>
                                <button
                                    onClick={togglePreviewOnly}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                        <span>Full Screen</span>
                                    </div>
                                </button>
                            </div>
                            {generatedCode ? (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-xl border border-gray-600/30 shadow-inner overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-gray-600 text-sm ml-2">Live Preview</span>
                                            </div>
                                        </div>
                                        <div className="p-4 min-h-[400px] bg-white">
                                            <LivePreview code={generatedCode} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-semibold text-gray-200">Live Component Preview</h4>
                                        <p className="text-sm text-gray-400">See how your generated React component looks and behaves</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">No preview available</p>
                                    <p className="text-sm text-gray-500 mt-2">Generate code first to see the live preview</p>
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Logic & Code & Analysis */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-6 shadow-2xl backdrop-blur-sm">
                            <h3 className="text-lg font-bold text-gray-200 mb-4">Logic & Analysis</h3>
                            
                            {/* Component Analysis Section */}
                            {componentAnalysis && (
                                <div className="mb-6">
                                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-lg p-4 border border-blue-600/30">
                                        <h4 className="text-sm font-semibold text-blue-200 mb-3 flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                            </svg>
                                            Component Analysis
                                        </h4>
                                        <div className="text-xs text-blue-100 space-y-2">
                                            <div className="bg-blue-800/30 rounded p-2">
                                                <strong>Structure:</strong> {componentAnalysis.structure || 'Component-based architecture'}
                                            </div>
                                            <div className="bg-blue-800/30 rounded p-2">
                                                <strong>Complexity:</strong> {componentAnalysis.complexity || 'Medium'}
                                            </div>
                                            <div className="bg-blue-800/30 rounded p-2">
                                                <strong>Reusability:</strong> {componentAnalysis.reusability || 'High'}
                                            </div>
                                            {componentAnalysis.recommendations && (
                                                <div className="bg-blue-800/30 rounded p-2">
                                                    <strong>Recommendations:</strong> {componentAnalysis.recommendations}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Logic & Code Section */}
                            {selectedScreenIndex !== null && screenOrder[selectedScreenIndex] ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleAddLogic(selectedScreenIndex)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            <span>Add Logic</span>
                                        </div>
                                    </button>
                                    
                                    <div className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-4 border border-gray-600/30">
                                        <h4 className="text-sm font-semibold text-gray-200 mb-2">Generated Component</h4>
                                        <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                                            <code>{`// Screen${selectedScreenIndex + 1}.jsx
import React from 'react';

const Screen${selectedScreenIndex + 1} = () => {
  return (
    <div className="screen-${selectedScreenIndex + 1}">
      {/* Your screen content */}
    </div>
  );
};

export default Screen${selectedScreenIndex + 1};`}</code>
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">Select a screen to add logic</p>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end space-x-4">
                        {/* GitHub Connect Button */}
                        {!isGitHubConnected ? (
                            <button
                                onClick={handleGitHubConnect}
                                className="group bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4 group-hover:transform group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                </svg>
                                <span>Connect GitHub</span>
                            </button>
                        ) : (
                            <button
                                onClick={handlePushToGitHub}
                                disabled={!generatedCode}
                                className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-xl flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4 group-hover:transform group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                </svg>
                                <span>Push to GitHub</span>
                            </button>
                        )}
                        
                        <button
                            onClick={handleOpenInVSCode}
                            disabled={!generatedCode}
                            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-xl"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-.579-.215l-2.105-.004a1.001 1.001 0 0 0-.988 1.004l.022 2.12a1.001 1.001 0 0 0 .215.579l3.128 4.12-8.63 9.46a1.494 1.494 0 0 0-.29 1.705l2.377 4.94a1.5 1.5 0 0 0 1.705.29l4.94-2.377a1.494 1.494 0 0 0 1.705-.29l9.46-8.63 4.12 3.128a.999.999 0 0 0 .579.215l2.105.004a1.001 1.001 0 0 0 .988-1.004l-.022-2.12a1.001 1.001 0 0 0-.215-.579l-3.128-4.12 8.63-9.46a1.494 1.494 0 0 0 .29-1.705l-2.377-4.94a1.5 1.5 0 0 0-1.705-.29z"/>
                                </svg>
                                <span>Open in VS Code</span>
                            </div>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="group bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span>Download</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Logic Popup Modal
    const renderLogicPopup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 w-full max-w-md shadow-2xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-gray-200 mb-6">Add Logic & Routing</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-200 mb-3 font-medium">Custom Logic</label>
                        <textarea
                            value={customLogic}
                            onChange={(e) => setCustomLogic(e.target.value)}
                            placeholder="Enter any custom logic or changes..."
                            className="w-full p-4 bg-gradient-to-br from-gray-700 to-gray-600 border border-gray-600/30 rounded-xl text-gray-200 resize-none h-24 shadow-inner"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-200 mb-3 font-medium">Routing</label>
                        <textarea
                            value={routing}
                            onChange={(e) => setRouting(e.target.value)}
                            placeholder="Enter routing configuration..."
                            className="w-full p-4 bg-gradient-to-br from-gray-700 to-gray-600 border border-gray-600/30 rounded-xl text-gray-200 resize-none h-24 shadow-inner"
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowLogicPopup(false)}
                            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-gray-200 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                setShowLogicPopup(false);
                                setCurrentScreen(3);
                            }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Expanded Image Modal
    const renderExpandedImageModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="relative max-w-4xl max-h-[90vh] mx-4">
                <button
                    onClick={handleCloseExpandedImage}
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-200">{expandedImage?.name}</h3>
                    </div>
                    <div className="flex justify-center">
                        <img 
                            src={expandedImage?.url} 
                            alt={expandedImage?.name} 
                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {/* Render Current Screen */}
            {currentScreen === 1 && renderScreen1()}
            {currentScreen === 2 && renderScreen2()}
            {currentScreen === 3 && renderScreen3()}

            {/* Logic Popup */}
            {showLogicPopup && renderLogicPopup()}

            {/* Expanded Image Modal */}
            {expandedImage && renderExpandedImageModal()}
            
            {/* Figma Import Modal */}
            <FigmaImportModal
                isOpen={showFigmaModal}
                onClose={() => setShowFigmaModal(false)}
                onImport={handleFigmaImport}
                platform="web"
                framework={framework}
                styling={styling}
                architecture={architecture}
            />
            
            {/* GitHub Import Modal */}
            <GitHubImportModal
                isOpen={showGitHubModal}
                onClose={() => setShowGitHubModal(false)}
                onImport={handleGitHubImport}
                platform="web"
                framework={framework}
                styling={styling}
                architecture={architecture}
            />
        </div>
    );
};

export default PrototypeLabFlow; 