import React, { useState } from 'react';
import FigmaImportModal from './FigmaImportModal';
import GitHubImportModal from './GitHubImportModal';

const IOSLabFlow = ({ onNavigate }) => {
    const [currentScreen, setCurrentScreen] = useState(1);
    const [language, setLanguage] = useState('Swift');
    const [architecture, setArchitecture] = useState('MVVM');
    const [uiFramework, setUiFramework] = useState('SwiftUI');
    const [uploadedScreens, setUploadedScreens] = useState([]);
    const [generatedCode, setGeneratedCode] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showLogicPopup, setShowLogicPopup] = useState(false);
    const [customLogic, setCustomLogic] = useState('');
    const [routing, setRouting] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showFigmaModal, setShowFigmaModal] = useState(false);
    const [showGitHubModal, setShowGitHubModal] = useState(false);
    
    // GitHub integration state
    const [isGitHubConnected, setIsGitHubConnected] = useState(false);
    const [githubUser, setGithubUser] = useState(null);
    const [generatedRepoUrl, setGeneratedRepoUrl] = useState('');

    const handleFileUpload = (files) => {
        const newScreens = Array.from(files).map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            url: URL.createObjectURL(file),
            file: file
        }));
        setUploadedScreens(prev => [...prev, ...newScreens]);
    };

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

    // Figma import function
    const handleFigmaImport = async (figmaUrl) => {
        setIsGenerating(true);
        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'import_figma',
                    figmaUrl,
                    platform: 'ios',
                    framework: language,
                    styling: 'SwiftUI',
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
                setGeneratedCode(data.mainCode || '// Generated code will appear here');
                setCurrentScreen(2);
            } else {
                throw new Error(data.error || 'Import failed');
            }

        } catch (error) {
            console.error('Error importing from Figma:', error);
            throw error; // Re-throw to be handled by the modal
        } finally {
            setIsGenerating(false);
        }
    };

    // GitHub import function
    const handleGitHubImport = async (githubUrl) => {
        setIsGenerating(true);
        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'github_export',
                    githubUrl,
                    platform: 'ios',
                    framework: language,
                    styling: 'SwiftUI',
                    architecture
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setGeneratedCode(data.mainCode || '// Generated code will appear here');
                setCurrentScreen(2);
            } else {
                throw new Error(data.error || 'Import failed');
            }

        } catch (error) {
            console.error('Error importing from GitHub:', error);
            throw error; // Re-throw to be handled by the modal
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateCode = async () => {
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('action', 'generate_pixel_perfect_code');
            uploadedScreens.forEach(screen => {
                formData.append('images', screen.file);
            });
            formData.append('platform', 'ios');
            formData.append('framework', language);
            formData.append('architecture', architecture);
            formData.append('uiFramework', uiFramework);
            formData.append('customLogic', customLogic);
            formData.append('routing', routing);

            const response = await fetch('https://digital-studio-vm.vercel.app/api/generate-code', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                setGeneratedCode(result.code);
                setCurrentScreen(2);
            }
        } catch (error) {
            console.error('Code generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([generatedCode], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'ios-app.zip';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // GitHub connection functions
    const handleGitHubConnect = () => {
        // TODO: Replace with your actual GitHub OAuth Client ID
        const clientId = 'your_github_client_id'; // Get this from GitHub OAuth App settings
        const redirectUri = encodeURIComponent(window.location.origin + '/prototype');
        const scope = 'repo';
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        
        // For now, show a helpful message
        alert('GitHub OAuth setup required!\n\n1. Create GitHub OAuth App at: https://github.com/settings/developers\n2. Set Homepage URL: https://digital-studio-vm.vercel.app\n3. Set Callback URL: https://digital-studio-vm.vercel.app/prototype\n4. Replace "your_github_client_id" with your actual Client ID');
        
        // Uncomment the line below after setting up OAuth credentials
        // window.location.href = githubAuthUrl;
    };

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

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setIsGitHubConnected(true);
                setGithubUser(data.user);
            } else {
                throw new Error(data.error || 'GitHub connection failed');
            }
        } catch (error) {
            console.error('Error connecting to GitHub:', error);
        }
    };

    const handlePushToGitHub = async () => {
        if (!isGitHubConnected || !generatedCode) return;

        try {
            const response = await fetch('https://digital-studio-vm.vercel.app/api/unified-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'github_create_repo',
                    projectData: { mainCode: generatedCode },
                    projectName: 'ios-project',
                    framework: language,
                    platform: 'ios'
                }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setGeneratedRepoUrl(data.repoUrl);
                alert(`Project successfully pushed to GitHub: ${data.repoUrl}`);
            } else {
                throw new Error(data.error || 'Failed to push to GitHub');
            }
        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            alert('Error pushing to GitHub. Please try again.');
        }
    };

    const renderScreen1 = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300">
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
                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">iOS Studio</h1>
                        </div>
                    </div>
                    
                    {/* Enhanced Configuration Cards with Better Visual Hierarchy */}
                    <div className="flex items-center space-x-4">
                        {/* Language Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-4 min-w-[200px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Language</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['Swift', 'Objective-C'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-sm font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="language"
                                                value={option}
                                                checked={language === option}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-500 focus:ring-blue-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {language === option && (
                                                <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Architecture Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-4 min-w-[200px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Architecture</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['MVVM', 'MVP', 'MVC', 'Clean'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-sm font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="architecture"
                                                value={option}
                                                checked={architecture === option}
                                                onChange={(e) => setArchitecture(e.target.value)}
                                                className="w-4 h-4 text-green-500 bg-gray-700 border-gray-500 focus:ring-green-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {architecture === option && (
                                                <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* UI Framework Selection */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-4 min-w-[200px] shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">UI Framework</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['SwiftUI', 'UIKit', 'Flutter', 'React Native'].map((option) => (
                                    <label key={option} className="flex items-center justify-between cursor-pointer group p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200 focus-within:bg-gray-700/50">
                                        <span className="text-gray-300 text-sm font-medium group-hover:text-gray-200 transition-colors">{option}</span>
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name="uiFramework"
                                                value={option}
                                                checked={uiFramework === option}
                                                onChange={(e) => setUiFramework(e.target.value)}
                                                className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-500 focus:ring-purple-400 focus:ring-2 rounded-full cursor-pointer"
                                            />
                                            {uiFramework === option && (
                                                <div className="absolute inset-0 w-4 h-4 bg-purple-500 rounded-full animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
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
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center shadow-lg border border-gray-600/30">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Main Content Area */}
            <div className="flex h-[calc(100vh-88px)] w-full px-6">
                {/* Enhanced Left Sidebar - Import/Upload Section */}
                <div className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700/50 p-4">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-6 h-full shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-bold text-gray-200">Import / Upload Screens</h3>
                        </div>
                        <div className="space-y-4">
                            <button 
                                onClick={() => setShowFigmaModal(true)}
                                className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                                <span className="text-white font-medium text-sm">Import from Figma</span>
                            </button>
                            
                            <button 
                                onClick={() => setShowGitHubModal(true)}
                                className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                            >
                                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                </svg>
                                <span className="text-gray-300 font-medium text-sm">Import from GitHub</span>
                            </button>
                            
                            <div className="mt-6">
                                <label className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-blue-400/50 ${
                                    isDragging 
                                        ? 'border-blue-400 bg-blue-400/10' 
                                        : 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 transition-all duration-300 ${
                                            isDragging 
                                                ? 'bg-blue-500 scale-110' 
                                                : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                        }`}>
                                            <svg className={`w-6 h-6 text-white transition-all duration-300 ${isDragging ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                            </svg>
                                        </div>
                                        <span className="text-gray-200 font-medium text-sm block mb-1">
                                            {isDragging ? 'Drop files here' : 'Upload your screens'}
                                        </span>
                                        <span className="text-gray-400 text-xs">Drag & drop or click to browse</span>
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
                        </div>
                    </div>
                </div>

                {/* Enhanced Main Area - Screen Order Display */}
                <div className="flex-1 p-4">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-xl p-6 h-[calc(100vh-200px)] shadow-2xl backdrop-blur-sm relative max-w-4xl mx-auto">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <h3 className="text-lg font-bold text-gray-200">iOS Screen Flow Preview</h3>
                        </div>
                        {uploadedScreens.length === 0 ? (
                            <div className="flex items-center justify-center h-[calc(100%-120px)] border-2 border-dashed border-gray-600/50 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 transition-all duration-300 hover:border-gray-500/50">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-medium mb-1">Upload images to see iOS screen flow</p>
                                    <p className="text-gray-500 text-sm">Drag and drop your screens here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    {uploadedScreens.map((screen, index) => (
                                        <div key={screen.id} className="group aspect-square border-2 border-dotted border-gray-600/50 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                            <img src={screen.url} alt={screen.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                {index + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Enhanced Submit Button */}
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

                        <div className="absolute bottom-6 right-6">
                            <button
                                onClick={() => setCurrentScreen(2)}
                                disabled={uploadedScreens.length === 0}
                                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                aria-label="Generate iOS code"
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Generate iOS Code</span>
                                    <svg className="w-4 h-4 group-hover:transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderScreen2 = () => (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300">
            {/* Top Header with Navigation */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 backdrop-blur-sm px-8 py-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <button 
                            onClick={() => onNavigate('landing')}
                            className="group bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-600/30"
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                                <span className="font-semibold">Back</span>
                            </div>
                        </button>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">iOS Studio</h2>
                        </div>
                    </div>
                    
                    {/* Screen Navigation */}
                    <div className="flex items-center space-x-4">
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
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {/* Left Panel - Code Generation */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-gray-200 mb-6">iOS Code Generation Progress</h3>
                        {isGenerating && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
                                    <span className="text-gray-200 font-medium">Generating ${language} code...</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
                                    <span className="text-gray-200 font-medium">Implementing ${architecture} architecture...</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg"></div>
                                    <span className="text-gray-200 font-medium">Setting up ${uiFramework} UI...</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30 opacity-50">
                                    <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
                                    <span className="text-gray-400">Finalizing project structure...</span>
                                </div>
                            </div>
                        )}
                        {!isGenerating && (
                            <button
                                onClick={handleGenerateCode}
                                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Generate iOS Code</span>
                                    <svg className="w-5 h-5 group-hover:transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-gray-200 mb-6">iOS Code Preview</h3>
                        {generatedCode ? (
                            <pre className="bg-gradient-to-br from-gray-700 to-gray-600 p-6 rounded-xl text-sm text-gray-200 overflow-auto max-h-96 border border-gray-600/30 shadow-inner">
                                <code>{generatedCode}</code>
                            </pre>
                        ) : (
                            <div className="text-gray-400 text-center py-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl border border-gray-600/30">
                                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                                </svg>
                                <p className="text-lg">Generated iOS code will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                                    <div className="mt-8 flex justify-end space-x-4 w-full">
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
                    <button
                        onClick={handleDownload}
                        disabled={!generatedCode}
                        className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-xl"
                    >
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 group-hover:transform group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>Download iOS Project</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderLogicPopup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600/50 rounded-2xl p-8 w-full max-w-md shadow-2xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-gray-200 mb-6">Add iOS Logic & Navigation</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-200 mb-3 font-medium">Custom Logic</label>
                        <textarea
                            value={customLogic}
                            onChange={(e) => setCustomLogic(e.target.value)}
                            placeholder="Enter any custom iOS logic or business rules..."
                            className="w-full p-4 bg-gradient-to-br from-gray-700 to-gray-600 border border-gray-600/30 rounded-xl text-gray-200 resize-none h-24 shadow-inner"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-200 mb-3 font-medium">Navigation</label>
                        <textarea
                            value={routing}
                            onChange={(e) => setRouting(e.target.value)}
                            placeholder="Enter iOS navigation configuration..."
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
                                handleGenerateCode();
                            }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Apply & Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative">
            {currentScreen === 1 && renderScreen1()}
            {currentScreen === 2 && renderScreen2()}
            {showLogicPopup && renderLogicPopup()}
            
            {/* Figma Import Modal */}
            <FigmaImportModal
                isOpen={showFigmaModal}
                onClose={() => setShowFigmaModal(false)}
                onImport={handleFigmaImport}
                platform="ios"
                framework={language}
                styling="SwiftUI"
                architecture={architecture}
            />
            
            {/* GitHub Import Modal */}
            <GitHubImportModal
                isOpen={showGitHubModal}
                onClose={() => setShowGitHubModal(false)}
                onImport={handleGitHubImport}
                platform="ios"
                framework={language}
                styling="SwiftUI"
                architecture={architecture}
            />
        </div>
    );
};

export default IOSLabFlow; 