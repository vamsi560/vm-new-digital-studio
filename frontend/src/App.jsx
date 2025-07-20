import React, { useState, useEffect, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import Cookies from 'js-cookie';

// --- Reusable UI Components ---

const TrafficLights = () => (
    <div className="absolute left-4 top-3.5 flex gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#febc2e]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#28c840]"></div>
    </div>
);

const ServiceCard = ({ title, svgPath, onClick, disabled = false }) => (
    <div onClick={!disabled ? onClick : undefined} className={`bg-[#1F2937] border border-[#374151] rounded-lg p-4 md:p-6 flex flex-col items-center justify-center h-full transition-all duration-300 ease-in-out ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-200 hover:-translate-y-1'}`}>
        <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={svgPath}></path>
        </svg>
        <h3 className="font-semibold text-white text-base md:text-lg">{title}</h3>
        {disabled && <span className="text-xs text-yellow-400 mt-2">Coming Soon</span>}
    </div>
);


const WorkflowStatus = ({ status, error }) => {
    const agents = [
        { id: 'architect', name: 'Architect', description: 'Analyzing project structure...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 20h4v-4"/><path d="M18 4h4v4"/><path d="M12 4v16"/><path d="M2 12h20"/></svg> },
        { id: 'builder', name: 'Component Builder', description: 'Creating reusable components...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="8" rx="2"/><rect x="6" y="14" width="12" height="8" rx="2"/></svg> },
        { id: 'composer', name: 'Page Composer', description: 'Assembling pages...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
        { id: 'finisher', name: 'Finisher & QA', description: 'Finalizing app and checking quality...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> }
    ];

    if (error) {
        return (
            <div className="bg-red-800/50 backdrop-blur-sm p-6 rounded-lg border border-red-700 text-center">
                <h3 className="text-lg font-bold text-white mb-2">An Error Occurred</h3>
                <p className="text-red-300">{error}</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Generation Progress</h3>
            <div className="space-y-4">
                {agents.map(agent => {
                    const currentStatus = status[agent.id] || 'pending'; // pending, running, completed
                    const isCompleted = currentStatus === 'completed';
                    const isRunning = currentStatus === 'running';
                    return (
                        <div key={agent.id} className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${isRunning ? 'bg-green-500/20' : ''} ${isCompleted ? 'bg-green-500/30' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-green-500' : isRunning ? 'bg-green-500/50 animate-pulse' : 'bg-gray-600'}`}>
                                {isCompleted ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg> : agent.icon}
                            </div>
                            <div>
                                <p className={`font-semibold ${isCompleted || isRunning ? 'text-white' : 'text-gray-400'}`}>{agent.name}</p>
                                <p className="text-sm text-gray-400">{isRunning ? status.text : isCompleted ? 'Completed' : 'Pending'}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
};

const ErrorDisplay = ({ message }) => {
    if (!message) return null;
    return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 mt-4">
            {message}
        </div>
    );
};


// --- Main Application Views ---

const InitialView = ({ onNavigate }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-black">
        <header className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black text-white whitespace-nowrap">
                VM Digital Studio does
                <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg ml-4">that.</span>
            </h1>
        </header>
        <p className="text-lg md:text-xl italic text-gray-400 max-w-3xl mx-auto">
            "You've got to start with the user experience and work back toward the technology - not the other way around."
            <span className="block mt-2 not-italic">- Steve Jobs</span>
        </p>
        <div onClick={() => onNavigate('landing')} className="cursor-pointer absolute bottom-10 left-1/2 -translate-x-1/2 animate-pulse">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
    </div>
);

const LandingView = ({ onNavigate }) => (
    <div className="h-full w-full flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-8xl h-[700px] bg-[#121212] rounded-xl shadow-2xl flex flex-col border border-gray-700/50 mx-auto pt-12">
            <div className="flex-shrink-0 h-11 flex items-center justify-center relative border-b border-gray-700/50">
                <TrafficLights />
                <p className="text-sm text-gray-400">VM Digital Studio</p>
            </div>
            <div className="flex-grow p-9 flex items-center justify-center overflow-y-auto">
                 <div className="w-full max-w-4xl mx-auto text-center">
                    <header className="mb-12 md:mb-16">
                        <div className="inline-flex items-center space-x-3 mb-2">
                            <div className="border border-gray-600 p-2 rounded-lg"><span className="font-bold text-3xl text-white">VM</span></div>
                            <span className="text-3xl font-bold text-white">Digital Studio</span>
                        </div>
                    </header>
                    <main>
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-12 md:mb-16">
                            <span className="text-white">Introducing </span>
                            <span className="bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text">Digital Studio</span>
                        </h1>
                        <section>
                            <h2 className="text-xl text-gray-400 mb-8">We do ui/ux design for</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <ServiceCard title="Prototype Lab" svgPath="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" onClick={() => onNavigate('prototype')} />
                                <ServiceCard title="App Lab" svgPath="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" onClick={() => onNavigate('app-lab-landing')} />
                                <ServiceCard title="Integration Lab" svgPath="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" onClick={() => onNavigate('integration-lab')} />
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
);

const PrototypeView = ({ onNavigate }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [flowOrder, setFlowOrder] = useState([]);
    const [generatedFiles, setGeneratedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [projectName, setProjectName] = useState('react-project');
    const [draggedItem, setDraggedItem] = useState(null);
    const [stylesheetContent, setStylesheetContent] = useState('');
    const [designTokens, setDesignTokens] = useState({});
    const [imagePreview, setImagePreview] = useState(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [accuracyResult, setAccuracyResult] = useState(null);
    const [analysis, setAnalysis] = useState(null); // NEW
    const [qa, setQa] = useState(null); // NEW
    const [figmaUrl, setFigmaUrl] = useState('');
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null); // NEW
    const [activeTab, setActiveTab] = useState('code'); // NEW: 'code' or 'preview'
    const [history, setHistory] = useState(() => {
      // Load from localStorage if available
      try {
        const saved = localStorage.getItem('ds_codegen_history');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });
    const [showHistory, setShowHistory] = useState(false); // Show/hide history panel
    const [githubExportStatus, setGithubExportStatus] = useState(null); // { loading, error, url }
    const [showExportModal, setShowExportModal] = useState(false);
    const [repoNameInput, setRepoNameInput] = useState('my-digital-studio-export');
    const [isGithubAuthenticated, setIsGithubAuthenticated] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState(null);
    const [reviewResult, setReviewResult] = useState(null);


    const handleFileUpload = useCallback(async (files) => {
        const newFiles = [];
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = await window.JSZip.loadAsync(file);
                for (const filename in zip.files) {
                    if (/\.(jpe?g|png)$/i.test(filename) && !zip.files[filename].dir) {
                        const imageFile = await zip.files[filename].async('blob');
                        const properFile = new File([imageFile], filename, { type: imageFile.type });
                        newFiles.push(properFile);
                    }
                }
            } else if (file.type.startsWith('image/')) {
                newFiles.push(file);
            }
        }
        const combinedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(combinedFiles);
        setFlowOrder(new Array(combinedFiles.length).fill(null));
    }, [uploadedFiles]);

    const handleDragStart = (e, file) => setDraggedItem(file);
    const handleDrop = (e, index) => {
        e.preventDefault();
        if (!draggedItem) return;
        const newFlowOrder = [...flowOrder];
        newFlowOrder[index] = draggedItem;
        setFlowOrder(newFlowOrder);
        setUploadedFiles(uploadedFiles.filter(f => f.name !== draggedItem.name));
        setDraggedItem(null);
    };
    
    const handleFigmaImport = async () => {
        if (!figmaUrl) return;
        setIsLoading(true);
        setError('');
        setWorkflowStatus({ text: 'Importing from Figma...', architect: 'running' });
        try {
            const response = await fetch('/api/import-figma', { // UPDATED
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ figmaUrl }),
            });
            if (!response.ok) {
                 const err = await response.json();
                 throw new Error(`Figma API error: ${err.error || response.statusText}`);
            }
            const images = await response.json();
            // Convert base64 to File objects
            const imageFiles = images.map(img => {
                const byteString = atob(img.data);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: img.mimeType });
                return new File([blob], img.fileName, { type: img.mimeType });
            });
            handleFileUpload(imageFiles);
        } catch (error) {
            console.error('Figma import failed:', error);
            setError(`Figma import failed: ${error.message}`);
        } finally {
            setIsLoading(false);
            setWorkflowStatus({});
        }
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setError('');
        setGeneratedFiles({});
        setAccuracyResult(null);
        setAnalysis(null); // NEW
        setQa(null); // NEW

        const formData = new FormData();
        const orderedFiles = flowOrder.filter(Boolean);
        orderedFiles.forEach(file => formData.append('screens', file));
        formData.append('orderedFileNames', JSON.stringify(orderedFiles.map(f => f.name)));
        if (stylesheetContent) formData.append('stylesheet', stylesheetContent);
        if (Object.keys(designTokens).length > 0) formData.append('designTokens', JSON.stringify(designTokens));
        formData.append('projectName', projectName);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing project structure...', architect: 'running' });
            const response = await fetch('/api/generate-code', { // UPDATED
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            setWorkflowStatus(prev => ({ ...prev, text: 'Component Builder: Creating reusable components...', architect: 'completed', builder: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setWorkflowStatus(prev => ({ ...prev, text: 'Page Composer: Assembling pages...', builder: 'completed', composer: 'running' }));
            await new Promise(res => setTimeout(res, 800));
            
            const data = await response.json();

            setWorkflowStatus(prev => ({ ...prev, text: 'Finisher & QA: Finalizing and checking quality...', composer: 'completed', finisher: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setGeneratedFiles(data.generatedFiles);
            setAccuracyResult(data.accuracyResult); // legacy, for compatibility
            setAnalysis(data.analysis || null); // NEW
            setQa(data.qa || null); // NEW
            setWorkflowStatus({ text: 'Done!', architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'completed' });
            // --- VERSIONING: Save to history ---
            setHistory(prev => [
              {
                timestamp: Date.now(),
                projectName,
                generatedFiles: data.generatedFiles,
                analysis: data.analysis || null,
                qa: data.qa || null,
                accuracyResult: data.accuracyResult || null
              },
              ...prev
            ]);

        } catch (error) {
            console.error('Error generating code:', error);
            setError(error.message);
            setWorkflowStatus({ text: `Error: ${error.message}`, architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'error' });
        } finally {
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    const handleDownload = async () => {
        const zip = window.JSZip();
        for (const path in generatedFiles) {
            zip.file(path, generatedFiles[path]);
        }
        const zipBlob = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${projectName || 'react-project'}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const handlePreview = async () => {
        setIsPreviewing(true);

        if (!window.WebContainer) {
            setError("Error: WebContainer API is not available. Preview cannot be started.");
            setIsPreviewing(false);
            return;
        }

        setLoadingText('Booting WebContainer...');
        
        try {
            const webcontainerInstance = await window.WebContainer.boot();
            
            const projectFiles = {};
            for(const path in generatedFiles) {
                projectFiles[path] = { file: { contents: generatedFiles[path] } };
            }
            
            await webcontainerInstance.mount(projectFiles);

            webcontainerInstance.on('server-ready', (port, url) => {
                setPreviewUrl(url);
                setLoadingText('');
            });

            const installProcess = await webcontainerInstance.spawn('npm', ['install']);
            setLoadingText('Installing dependencies...');
            await installProcess.exit;

            const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
            setLoadingText('Starting dev server...');
        } catch (error) {
            console.error("Failed to boot WebContainer:", error);
            setError("Failed to start the preview environment. See console for details.");
            setIsPreviewing(false);
        }
    };

    // Helper: get file list
    const fileList = Object.keys(generatedFiles);
    // Helper: get code for selected file
    const selectedFileCode = selectedFile && generatedFiles[selectedFile] ? generatedFiles[selectedFile] : (fileList.length > 0 ? generatedFiles[fileList[0]] : '');
    // Helper: get language from file extension
    const getLanguage = (filename) => {
      if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'jsx';
      if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'tsx';
      if (filename.endsWith('.json')) return 'json';
      if (filename.endsWith('.css')) return 'css';
      if (filename.endsWith('.md')) return 'markdown';
      if (filename.endsWith('.html')) return 'html';
      return 'text';
    };
    // Helper: is renderable React component
    const isRenderableComponent = (filename) => {
      if (!filename) return false;
      const isComponent = (filename.startsWith('src/components/') || filename.startsWith('src/pages/')) && (filename.endsWith('.jsx') || filename.endsWith('.js'));
      return isComponent;
    };
    // Copy to clipboard
    const handleCopy = () => {
      if (selectedFileCode) {
        navigator.clipboard.writeText(selectedFileCode);
      }
    };
    // Download single file
    const handleDownloadFile = () => {
      if (selectedFile && selectedFileCode) {
        const blob = new Blob([selectedFileCode], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = selectedFile;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    };
    // Clickable analysis links
    const handleAnalysisClick = (name) => {
      // Try to find a file that matches the screen/component name
      const match = fileList.find(f => f.toLowerCase().includes(name.toLowerCase()));
      if (match) setSelectedFile(match);
    };

    // Restore a version from history
    const handleRestoreVersion = (version) => {
      setGeneratedFiles(version.generatedFiles);
      setAnalysis(version.analysis);
      setQa(version.qa);
      setAccuracyResult(version.accuracyResult);
      setProjectName(version.projectName || 'react-project');
      setShowHistory(false);
      setSelectedFile(null);
      setActiveTab('code');
    };
    // Delete a version from history
    const handleDeleteVersion = (timestamp) => {
      setHistory(prev => prev.filter(v => v.timestamp !== timestamp));
    };
    // Format timestamp
    const formatTime = (ts) => new Date(ts).toLocaleString();

    // Save history to localStorage whenever it changes
    useEffect(() => {
      localStorage.setItem('ds_codegen_history', JSON.stringify(history));
    }, [history]);

    // Check GitHub authentication by checking for cookie (client-side only)
    useEffect(() => {
      if (typeof window !== 'undefined') {
        setIsGithubAuthenticated(!!Cookies.get('github_token'));
      }
    }, []);

    // Export to GitHub logic
    const handleExportToGithub = async () => {
      setGithubExportStatus({ loading: true });
      setShowExportModal(false);
      try {
        const res = await fetch('/api/github-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoName: repoNameInput,
            files: generatedFiles
          })
        });
        if (res.status === 401) {
          setIsGithubAuthenticated(false);
          setGithubExportStatus({ error: 'Not authenticated with GitHub. Please connect your account.' });
          return;
        }
        if (!res.ok) {
          const err = await res.json();
          setGithubExportStatus({ error: err.error || 'Export failed.' });
          return;
        }
        const data = await res.json();
        setGithubExportStatus({ url: data.url });
      } catch (err) {
        setGithubExportStatus({ error: err.message });
      }
    };

    // AI Code Review logic
    const handleAICodeReview = async (scope = 'file') => {
      setShowReviewModal(true);
      setReviewLoading(true);
      setReviewError(null);
      setReviewResult(null);
      try {
        let body;
        if (scope === 'file' && selectedFile) {
          body = { code: generatedFiles[selectedFile], filename: selectedFile };
        } else {
          body = { files: generatedFiles };
        }
        const res = await fetch('/api/ai-code-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          setReviewError(err.error || 'Review failed.');
          setReviewLoading(false);
          return;
        }
        const data = await res.json();
        setReviewResult(data.review);
        setReviewLoading(false);
      } catch (err) {
        setReviewError(err.message);
        setReviewLoading(false);
      }
    };

    return (
        <div className="content-wrapper min-h-screen flex flex-col p-8 bg-[#0D0F18]">
            <button onClick={() => onNavigate('landing')} className="absolute top-5 left-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            <button onClick={() => setShowHistory(true)} className="absolute top-5 right-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">History</button>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto mt-12">
                <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl p-4 flex flex-col gap-4 bg-[#1f2937] border border-gray-700/50">
                    <div className="flex justify-end mb-4">
                        <a href="/api/github-login" title="Connect to GitHub" className="bg-gray-700 hover:bg-green-700 text-white p-2 rounded-full flex items-center justify-center">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
                        </a>
                    </div>
                </aside>
                <main className="flex-grow flex flex-col gap-6 min-w-0">
                    <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50 flex-grow">
                        <h3 className="text-xl font-bold text-white mb-4">Screen Flow</h3>
                        <div className="flex flex-wrap gap-4 p-4 justify-start items-center min-h-[200px]">
                            {flowOrder.length === 0 ? <p className="text-gray-500 w-full text-left">Drag images from the tray to order your screens here.</p> : flowOrder.map((file, index) => (
                                <div key={index} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, index)} className={`w-36 h-36 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center ${file ? 'has-image' : ''}`}>
                                    {file ? <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded-lg cursor-zoom-in" onClick={() => setImagePreview(URL.createObjectURL(file))}/> : <span className="text-4xl text-gray-500">{index + 1}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    {isLoading ? <WorkflowStatus status={workflowStatus} error={error} /> : (
                        <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleGenerateCode} disabled={isLoading || flowOrder.some(f => f === null)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Generate Code</button>
                                <button onClick={handlePreview} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Preview</button>
                                <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Codebase</button>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                            </div>
                             <ErrorDisplay message={error} />
                        </div>
                    )}
                    {Object.keys(generatedFiles).length > 0 && !isLoading && (
                      <div className="w-full bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 relative mt-6 flex" style={{minHeight:'400px'}}>
                        {/* File List Sidebar */}
                        <div className="w-56 border-r border-gray-700 bg-gray-950 rounded-l-lg flex flex-col overflow-y-auto">
                          <div className="p-3 font-bold text-green-400 border-b border-gray-700">Files</div>
                          {fileList.length === 0 ? (
                            <div className="p-4 text-gray-500">No files</div>
                          ) : (
                            fileList.map((file) => (
                              <button
                                key={file}
                                className={`w-full text-left px-4 py-2 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedFile === file ? 'bg-gray-800 text-green-400 font-bold' : 'text-gray-200'}`}
                                onClick={() => setSelectedFile(file)}
                              >
                                {file}
                              </button>
                            ))
                          )}
                        </div>
                        {/* Main Preview Area */}
                        <div className="flex-1 flex flex-col">
                          <div className="p-4 border-b border-gray-700 flex items-center gap-4">
                            <h2 className="font-bold text-lg flex-1">{selectedFile || fileList[0]}</h2>
                            <div className="flex gap-2">
                              <button onClick={() => setActiveTab('code')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'code' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>Code</button>
                              <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'preview' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>Preview</button>
                            </div>
                            <button onClick={handleCopy} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Copy</button>
                            <button onClick={handleDownloadFile} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Download</button>
                          </div>
                          {/* --- ANALYSIS SECTION --- */}
                          {analysis && (
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="font-bold text-lg mb-2 text-green-400">Screen & Component Analysis</h3>
                              <div className="mb-2">
                                <strong>Screens:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {analysis.screens && analysis.screens.map((s, i) => (
                                    <li key={i}>
                                      <button className="text-green-300 hover:underline font-semibold" onClick={() => handleAnalysisClick(s.name)}>{s.name}</button>: {s.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mb-2">
                                <strong>Components:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {analysis.components && analysis.components.map((c, i) => (
                                    <li key={i}>
                                      <button className="text-blue-300 hover:underline font-semibold" onClick={() => handleAnalysisClick(c.name)}>{c.name}</button>: {c.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {analysis.summary && <div className="mt-2 text-gray-300"><strong>Summary:</strong> {analysis.summary}</div>}
                            </div>
                          )}
                          {/* --- QA SECTION --- */}
                          {qa && (
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="font-bold text-lg mb-2">Estimated Accuracy</h3>
                              <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold text-green-400">{qa.score}/10</div>
                                <p className="text-gray-400">{qa.justification}</p>
                              </div>
                            </div>
                          )}
                          {/* --- LEGACY ACCURACY RESULT (for compatibility) --- */}
                          {accuracyResult && !qa && (
                              <div className="p-4 border-b border-gray-700">
                                  <h3 className="font-bold text-lg mb-2">Estimated Accuracy</h3>
                                  <div className="flex items-center gap-4">
                                      <div className="text-4xl font-bold text-green-400">{accuracyResult.score}%</div>
                                      <p className="text-gray-400">{accuracyResult.justification}</p>
                                  </div>
                              </div>
                          )}
                          {/* --- CODE/PREVIEW TABS --- */}
                          <div className="flex-1 overflow-auto p-4 bg-gray-800 rounded-b-lg">
                            {activeTab === 'code' && (
                              <SyntaxHighlighter language={getLanguage(selectedFile || fileList[0])} style={oneDark} customStyle={{background:'transparent', fontSize:'1em', margin:0}} showLineNumbers>
                                {selectedFileCode}
                              </SyntaxHighlighter>
                            )}
                            {activeTab === 'preview' && (
                              isRenderableComponent(selectedFile || fileList[0]) ? (
                                <LiveProvider code={selectedFileCode} noInline={true} scope={{ React }}>
                                  <div className="p-4 bg-gray-900 rounded mb-2">
                                    <LivePreview />
                                  </div>
                                  <LiveError className="text-red-400 text-xs p-2" />
                                </LiveProvider>
                              ) : (
                                <div className="text-gray-400 italic">This file is not a renderable React component.</div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* --- GITHUB EXPORT UI --- */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                      {!isGithubAuthenticated ? (
                        <a href="/api/github-login" className="bg-gray-700 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-xs">Connect to GitHub</a>
                      ) : (
                        <button onClick={() => setShowExportModal(true)} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-bold text-xs">Export to GitHub</button>
                      )}
                      {githubExportStatus && githubExportStatus.loading && (
                        <div className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">Exporting...</div>
                      )}
                      {githubExportStatus && githubExportStatus.error && (
                        <div className="text-xs text-red-400 bg-gray-800 px-2 py-1 rounded">{githubExportStatus.error}</div>
                      )}
                      {githubExportStatus && githubExportStatus.url && (
                        <a href={githubExportStatus.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 underline bg-gray-800 px-2 py-1 rounded">View Repo</a>
                      )}
                      <button onClick={() => handleAICodeReview('file')} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold text-xs mt-2">AI Code Review (File)</button>
                      <button onClick={() => handleAICodeReview('project')} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold text-xs">AI Code Review (Project)</button>
                    </div>
                    {/* --- EXPORT MODAL --- */}
                    {showExportModal && (
                      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                          <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                          <h2 className="text-xl font-bold text-green-400 mb-4">Export to GitHub</h2>
                          <label className="block mb-2 text-gray-300 font-semibold">Repository Name</label>
                          <input type="text" value={repoNameInput} onChange={e => setRepoNameInput(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4" />
                          <button onClick={handleExportToGithub} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded">Export</button>
                        </div>
                      </div>
                    )}
                    {/* --- AI REVIEW MODAL --- */}
                    {showReviewModal && (
                      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
                          <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                          <h2 className="text-2xl font-bold text-blue-400 mb-4">AI Code Review</h2>
                          {reviewLoading && <div className="text-gray-300">Reviewing code...</div>}
                          {reviewError && <div className="text-red-400">{reviewError}</div>}
                          {reviewResult && (
                            <pre className="bg-gray-800 p-4 rounded text-gray-200 whitespace-pre-wrap text-sm max-h-[50vh] overflow-y-auto">{reviewResult}</pre>
                          )}
                        </div>
                      </div>
                    )}
                </main>
            </div>
            {imagePreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center modal" onClick={() => setImagePreview(null)}>
                    <div className="relative w-11/12 max-w-4xl h-5/6 bg-gray-800 rounded-lg shadow-xl flex flex-col p-4">
                        <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                        <img src={imagePreview} className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
             {isPreviewing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center modal">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPreviewing(false)}></div>
                    <div className="relative w-11/12 h-5/6 bg-gray-800 rounded-lg shadow-xl flex flex-col">
                        <div className="p-2 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
                            <p className="text-sm text-gray-400">{loadingText || 'Live Preview'}</p>
                            <button onClick={() => setIsPreviewing(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                        </div>
                        <iframe src={previewUrl || 'about:blank'} className="flex-grow w-full h-full border-0 bg-white rounded-b-lg"></iframe>
                    </div>
                </div>
            )}
            {/* --- HISTORY PANEL --- */}
            {showHistory && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                  <h2 className="text-2xl font-bold text-green-400 mb-4">Generation History</h2>
                  {history.length === 0 ? (
                    <div className="text-gray-400">No previous generations found.</div>
                  ) : (
                    <ul className="divide-y divide-gray-700">
                      {history.map((v, i) => (
                        <li key={v.timestamp} className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                          <div className="flex-1">
                            <div className="font-bold text-white">{v.projectName || 'Unnamed Project'}</div>
                            <div className="text-xs text-gray-400">{formatTime(v.timestamp)}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRestoreVersion(v)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Restore</button>
                            <button onClick={() => handleDeleteVersion(v.timestamp)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
        </div>
    );
};

const AppLabLandingView = ({ onNavigate }) => (
    <div className="h-full w-full flex items-center justify-center p-4 bg-black">
        <div className="w-full max-w-7xl h-[700px] bg-[#121212] rounded-xl shadow-2xl flex flex-col border border-gray-700/50 mx-auto pt-8">
            <div className="flex-shrink-0 h-11 flex items-center justify-center relative border-b border-gray-700/50">
                <TrafficLights />
                <p className="text-sm text-gray-400">App Lab</p>
                <button onClick={() => onNavigate('landing')} className="absolute top-2.5 right-4 text-gray-400 hover:text-white">&larr; Back</button>
            </div>
            <div className="flex-grow p-8 flex items-center justify-center overflow-y-auto">
                 <div className="w-full max-w-4xl mx-auto text-center">
                    <main>
                        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-12 md:mb-16">
                            <span className="text-white">Choose Your Platform</span>
                        </h1>
                        <section>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <ServiceCard title="Android" svgPath="M4.33 2.86a2 2 0 012.02 0l8.29 4.28a2 2 0 011.36 1.86v7.14a2 2 0 01-1.36 1.86l-8.29 4.28a2 2 0 01-2.02 0l-8.29-4.28a2 2 0 01-1.36-1.86V8.86a2 2 0 011.36-1.86l8.29-4.28zM9 12a3 3 0 100-6 3 3 0 000 6z" onClick={() => onNavigate('app-lab-generate', 'android')} />
                                <ServiceCard title="iOS" svgPath="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" onClick={() => onNavigate('app-lab-generate', 'ios')} />
                                <ServiceCard title="Progressive Web App" svgPath="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9m-9 9a9 9 0 00-9-9" onClick={() => onNavigate('app-lab-generate', 'pwa')} />
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
);


const AppLabGenerateView = ({ onNavigate, initialPlatform }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [flowOrder, setFlowOrder] = useState([]);
    const [generatedFiles, setGeneratedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [projectName, setProjectName] = useState('MyMobileApp');
    const [draggedItem, setDraggedItem] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [accuracyResult, setAccuracyResult] = useState(null);
    const [platform, setPlatform] = useState(initialPlatform);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState(null); // NEW
    const [manifest, setManifest] = useState(null); // NEW
    const [qa, setQa] = useState(null); // NEW
    const [selectedFile, setSelectedFile] = useState(null); // NEW
    const [activeTab, setActiveTab] = useState('code'); // NEW: 'code' or 'preview'
    const [history, setHistory] = useState(() => {
      // Load from localStorage if available
      try {
        const saved = localStorage.getItem('ds_codegen_history');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });
    const [showHistory, setShowHistory] = useState(false); // Show/hide history panel
    const [githubExportStatus, setGithubExportStatus] = useState(null); // { loading, error, url }
    const [showExportModal, setShowExportModal] = useState(false);
    const [repoNameInput, setRepoNameInput] = useState('my-digital-studio-export');
    const [isGithubAuthenticated, setIsGithubAuthenticated] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState(null);
    const [reviewResult, setReviewResult] = useState(null);
    const [figmaUrl, setFigmaUrl] = useState('');


    const handleFileUpload = useCallback(async (files) => {
        const newFiles = [];
        for (const file of files) {
            if (file.name.toLowerCase().endsWith('.zip')) {
                const zip = await window.JSZip.loadAsync(file);
                for (const filename in zip.files) {
                    if (/\.(jpe?g|png)$/i.test(filename) && !zip.files[filename].dir) {
                        const imageFile = await zip.files[filename].async('blob');
                        const properFile = new File([imageFile], filename, { type: imageFile.type });
                        newFiles.push(properFile);
                    }
                }
            } else if (file.type.startsWith('image/')) {
                newFiles.push(file);
            }
        }
        const combinedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(combinedFiles);
        setFlowOrder(new Array(combinedFiles.length).fill(null));
    }, [uploadedFiles]);

    const handleDragStart = (e, file) => setDraggedItem(file);
    const handleDrop = (e, index) => {
        e.preventDefault();
        if (!draggedItem) return;
        const newFlowOrder = [...flowOrder];
        newFlowOrder[index] = draggedItem;
        setFlowOrder(newFlowOrder);
        setUploadedFiles(uploadedFiles.filter(f => f.name !== draggedItem.name));
        setDraggedItem(null);
    };
    
    const handleFigmaImport = async () => {
        if (!figmaUrl) return;
        setIsLoading(true);
        setError('');
        setWorkflowStatus({ text: 'Importing from Figma...', architect: 'running' });
        try {
            const response = await fetch('/api/import-figma', { // UPDATED
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ figmaUrl }),
            });
            if (!response.ok) {
                 const err = await response.json();
                 throw new Error(`Figma API error: ${err.error || response.statusText}`);
            }
            const images = await response.json();
            // Convert base64 to File objects
            const imageFiles = images.map(img => {
                const byteString = atob(img.data);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: img.mimeType });
                return new File([blob], img.fileName, { type: img.mimeType });
            });
            handleFileUpload(imageFiles);
        } catch (error) {
            console.error('Figma import failed:', error);
            setError(`Figma import failed: ${error.message}`);
        } finally {
            setIsLoading(false);
            setWorkflowStatus({});
        }
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setError('');
        setGeneratedFiles({});
        setAccuracyResult(null);
        setAnalysis(null); // NEW
        setManifest(null); // NEW
        setQa(null); // NEW

        const formData = new FormData();
        const orderedFiles = flowOrder.filter(Boolean);
        orderedFiles.forEach(file => formData.append('screens', file));
        formData.append('orderedFileNames', JSON.stringify(orderedFiles.map(f => f.name)));
        if (stylesheetContent) formData.append('stylesheet', stylesheetContent);
        if (Object.keys(designTokens).length > 0) formData.append('designTokens', JSON.stringify(designTokens));
        formData.append('projectName', projectName);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing project structure...', architect: 'running' });
            const response = await fetch('/api/generate-code', { // UPDATED
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            setWorkflowStatus(prev => ({ ...prev, text: 'Component Builder: Creating reusable components...', architect: 'completed', builder: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setWorkflowStatus(prev => ({ ...prev, text: 'Page Composer: Assembling pages...', builder: 'completed', composer: 'running' }));
            await new Promise(res => setTimeout(res, 800));
            
            const data = await response.json();

            setWorkflowStatus(prev => ({ ...prev, text: 'Finisher & QA: Finalizing and checking quality...', composer: 'completed', finisher: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setGeneratedFiles(data.generatedFiles);
            setAccuracyResult(data.accuracyResult); // legacy, for compatibility
            setAnalysis(data.analysis || null); // NEW
            setManifest(data.manifest || null); // NEW
            setQa(data.qa || null); // NEW
            setWorkflowStatus({ text: 'Done!', architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'completed' });
            // --- VERSIONING: Save to history ---
            setHistory(prev => [
              {
                timestamp: Date.now(),
                projectName,
                generatedFiles: data.generatedFiles,
                analysis: data.analysis || null,
                qa: data.qa || null,
                accuracyResult: data.accuracyResult || null
              },
              ...prev
            ]);

        } catch (error) {
            console.error('Error generating code:', error);
            setError(error.message);
            setWorkflowStatus({ text: `Error: ${error.message}`, architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'error' });
        } finally {
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    const handleDownload = async () => {
        const zip = window.JSZip();
        for (const path in generatedFiles) {
            zip.file(path, generatedFiles[path]);
        }
        const zipBlob = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${projectName || 'react-project'}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const handlePreview = async () => {
        setIsPreviewing(true);

        if (!window.WebContainer) {
            setError("Error: WebContainer API is not available. Preview cannot be started.");
            setIsPreviewing(false);
            return;
        }

        setLoadingText('Booting WebContainer...');
        
        try {
            const webcontainerInstance = await window.WebContainer.boot();
            
            const projectFiles = {};
            for(const path in generatedFiles) {
                projectFiles[path] = { file: { contents: generatedFiles[path] } };
            }
            
            await webcontainerInstance.mount(projectFiles);

            webcontainerInstance.on('server-ready', (port, url) => {
                setPreviewUrl(url);
                setLoadingText('');
            });

            const installProcess = await webcontainerInstance.spawn('npm', ['install']);
            setLoadingText('Installing dependencies...');
            await installProcess.exit;

            const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
            setLoadingText('Starting dev server...');
        } catch (error) {
            console.error("Failed to boot WebContainer:", error);
            setError("Failed to start the preview environment. See console for details.");
            setIsPreviewing(false);
        }
    };

    // Helper: get file list
    const fileList = Object.keys(generatedFiles);
    // Helper: get code for selected file
    const selectedFileCode = selectedFile && generatedFiles[selectedFile] ? generatedFiles[selectedFile] : (fileList.length > 0 ? generatedFiles[fileList[0]] : '');
    // Helper: get language from file extension
    const getLanguage = (filename) => {
      if (!filename) return 'text';
      if (filename.endsWith('.kt')) return 'kotlin';
      if (filename.endsWith('.xml')) return 'xml';
      if (filename.endsWith('.json')) return 'json';
      if (filename.endsWith('.md')) return 'markdown';
      if (filename.endsWith('.gradle')) return 'groovy';
      return 'text';
    };
    // Helper: is renderable React component
    const isRenderableComponent = (filename) => {
      if (!filename) return false;
      const isComponent = (filename.startsWith('src/components/') || filename.startsWith('src/pages/')) && (filename.endsWith('.jsx') || filename.endsWith('.js'));
      return isComponent;
    };
    // Copy to clipboard
    const handleCopy = () => {
      if (selectedFileCode) {
        navigator.clipboard.writeText(selectedFileCode);
      }
    };
    // Download single file
    const handleDownloadFile = () => {
      if (selectedFile && selectedFileCode) {
        const blob = new Blob([selectedFileCode], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = selectedFile;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    };
    // Clickable analysis links
    const handleAnalysisClick = (name) => {
      // Try to find a file that matches the screen/component name
      const match = fileList.find(f => f.toLowerCase().includes(name.toLowerCase()));
      if (match) setSelectedFile(match);
    };

    // Restore a version from history
    const handleRestoreVersion = (version) => {
      setGeneratedFiles(version.generatedFiles);
      setAnalysis(version.analysis);
      setQa(version.qa);
      setAccuracyResult(version.accuracyResult);
      setProjectName(version.projectName || 'react-project');
      setShowHistory(false);
      setSelectedFile(null);
      setActiveTab('code');
    };
    // Delete a version from history
    const handleDeleteVersion = (timestamp) => {
      setHistory(prev => prev.filter(v => v.timestamp !== timestamp));
    };
    // Format timestamp
    const formatTime = (ts) => new Date(ts).toLocaleString();

    // Save history to localStorage whenever it changes
    useEffect(() => {
      localStorage.setItem('ds_codegen_history', JSON.stringify(history));
    }, [history]);

    // Check GitHub authentication by checking for cookie (client-side only)
    useEffect(() => {
      if (typeof window !== 'undefined') {
        setIsGithubAuthenticated(!!Cookies.get('github_token'));
      }
    }, []);

    // Export to GitHub logic
    const handleExportToGithub = async () => {
      setGithubExportStatus({ loading: true });
      setShowExportModal(false);
      try {
        const res = await fetch('/api/github-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoName: repoNameInput,
            files: generatedFiles
          })
        });
        if (res.status === 401) {
          setIsGithubAuthenticated(false);
          setGithubExportStatus({ error: 'Not authenticated with GitHub. Please connect your account.' });
          return;
        }
        if (!res.ok) {
          const err = await res.json();
          setGithubExportStatus({ error: err.error || 'Export failed.' });
          return;
        }
        const data = await res.json();
        setGithubExportStatus({ url: data.url });
      } catch (err) {
        setGithubExportStatus({ error: err.message });
      }
    };

    // AI Code Review logic
    const handleAICodeReview = async (scope = 'file') => {
      setShowReviewModal(true);
      setReviewLoading(true);
      setReviewError(null);
      setReviewResult(null);
      try {
        let body;
        if (scope === 'file' && selectedFile) {
          body = { code: generatedFiles[selectedFile], filename: selectedFile };
        } else {
          body = { files: generatedFiles };
        }
        const res = await fetch('/api/ai-code-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json();
          setReviewError(err.error || 'Review failed.');
          setReviewLoading(false);
          return;
        }
        const data = await res.json();
        setReviewResult(data.review);
        setReviewLoading(false);
      } catch (err) {
        setReviewError(err.message);
        setReviewLoading(false);
      }
    };

    return (
        <div className="content-wrapper min-h-screen flex flex-col p-8 bg-[#0D0F18]">
            <button onClick={() => onNavigate('landing')} className="absolute top-5 left-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            <button onClick={() => setShowHistory(true)} className="absolute top-5 right-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">History</button>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto mt-12">
                <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl p-4 flex flex-col gap-4 bg-[#1f2937] border border-gray-700/50">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">IMPORT</h3>
                         <div className="space-y-3">
                            <div className="relative">
                                <input type="text" value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} placeholder="Paste Figma URL..." className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                                <button onClick={handleFigmaImport} className="absolute inset-y-0 right-0 px-3 flex items-center bg-green-600 hover:bg-green-700 rounded-r-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 12h14"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <hr className="border-gray-600" />
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">STYLESHEET</h3>
                        <div className="space-y-3">
                            <label htmlFor="stylesheet-upload" className="flex flex-col items-center justify-center w-full p-3 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 gap-2 text-center">
                                <svg className="w-8 h-8 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                <span id="stylesheet-upload-text" className="text-sm text-gray-400">Upload .css file</span>
                                <input id="stylesheet-upload" type="file" className="hidden" accept=".css" onChange={(e) => setStylesheetContent(e.target.files[0])} />
                            </label>
                            <div className="relative">
                                <button onClick={() => setIsTooltipVisible(!isTooltipVisible)} className="w-full flex flex-col items-center justify-center p-3 border-2 border-gray-600 border-dashed rounded-lg bg-gray-700 hover:bg-gray-600 gap-2 text-center">
                                    <svg className="w-8 h-8 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    <span className="text-sm text-gray-400">Add Manual Styles</span>
                                </button>
                                {isTooltipVisible && (
                                    <div className="absolute z-10 w-64 p-4 mt-2 space-y-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg">
                                        <h3 className="font-bold">Style Tokens</h3>
                                        <div><label className="block mb-1 text-xs font-medium">Primary Color</label><input type="color" id="primary-color" defaultValue="#4A90E2" className="w-full h-8 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"/></div>
                                        <div><label className="block mb-1 text-xs font-medium">Font Family</label><input type="text" id="font-family" placeholder="e.g., 'Inter', sans-serif" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/></div>
                                        <div><label className="block mb-1 text-xs font-medium">Border Radius (px)</label><input type="number" id="border-radius" placeholder="e.g., 8" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"/></div>
                                        <button onClick={() => { setDesignTokens({
                                            '--primary-color': document.getElementById('primary-color').value,
                                            '--font-family': `'${document.getElementById('font-family').value}'`,
                                            '--border-radius': `${document.getElementById('border-radius').value}px`
                                        }); setIsTooltipVisible(false); }} className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Apply</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <hr className="border-gray-600" />
                    <div className="flex flex-col gap-4 flex-grow min-h-0">
                        <h3 className="text-lg font-bold text-white">IMAGE TRAY</h3>
                        <div>
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 gap-2 text-center">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                   <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Upload Screens</span></p>
                                   <p className="text-xs text-gray-500">PNG, JPG, or ZIP</p>
                                </div>
                                <input id="file-upload" type="file" className="hidden" multiple onChange={(e) => handleFileUpload(Array.from(e.target.files))} />
                            </label>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 bg-gray-900/50 rounded-lg flex flex-row lg:flex-col flex-wrap gap-3">
                            {uploadedFiles.length > 0 ? uploadedFiles.map((file, index) => (
                                <div key={index} draggable onDragStart={(e) => handleDragStart(e, file)} className="w-24 h-24 border-2 border-gray-600 rounded-md cursor-grab">
                                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover"/>
                                </div>
                            )) : <p className="text-gray-500 self-center mx-auto text-center">Uploaded images will appear here.</p>}
                        </div>
                    </div>
                </aside>
                <main className="flex-grow flex flex-col gap-6 min-w-0">
                    <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50 flex-grow">
                        <h3 className="text-xl font-bold text-white mb-4">Screen Flow</h3>
                        <div className="flex flex-wrap gap-4 p-4 justify-start items-center min-h-[200px]">
                            {flowOrder.length === 0 ? <p className="text-gray-500 w-full text-left">Drag images from the tray to order your screens here.</p> : flowOrder.map((file, index) => (
                                <div key={index} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, index)} className={`w-36 h-36 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center ${file ? 'has-image' : ''}`}>
                                    {file ? <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded-lg cursor-zoom-in" onClick={() => setImagePreview(URL.createObjectURL(file))}/> : <span className="text-4xl text-gray-500">{index + 1}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    {isLoading ? <WorkflowStatus status={workflowStatus} error={error} /> : (
                        <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleGenerateCode} disabled={isLoading || flowOrder.some(f => f === null)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Generate Code</button>
                                <button onClick={handlePreview} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Preview</button>
                                <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Codebase</button>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                            </div>
                             <ErrorDisplay message={error} />
                        </div>
                    )}
                    {Object.keys(generatedFiles).length > 0 && !isLoading && (
                      <div className="w-full bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 relative mt-6 flex" style={{minHeight:'400px'}}>
                        {/* File List Sidebar */}
                        <div className="w-56 border-r border-gray-700 bg-gray-950 rounded-l-lg flex flex-col overflow-y-auto">
                          <div className="p-3 font-bold text-green-400 border-b border-gray-700">Files</div>
                          {fileList.length === 0 ? (
                            <div className="p-4 text-gray-500">No files</div>
                          ) : (
                            fileList.map((file) => (
                              <button
                                key={file}
                                className={`w-full text-left px-4 py-2 border-b border-gray-800 hover:bg-gray-800 transition-colors ${selectedFile === file ? 'bg-gray-800 text-green-400 font-bold' : 'text-gray-200'}`}
                                onClick={() => setSelectedFile(file)}
                              >
                                {file}
                              </button>
                            ))
                          )}
                        </div>
                        {/* Main Preview Area */}
                        <div className="flex-1 flex flex-col">
                          <div className="p-4 border-b border-gray-700 flex items-center gap-4">
                            <h2 className="font-bold text-lg flex-1">{selectedFile || fileList[0]}</h2>
                            <div className="flex gap-2">
                              <button onClick={() => setActiveTab('code')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'code' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>Code</button>
                              <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'preview' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>Preview</button>
                            </div>
                            <button onClick={handleCopy} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Copy</button>
                            <button onClick={handleDownloadFile} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">Download</button>
                          </div>
                          {/* --- MANIFEST SECTION --- */}
                          {manifest && (
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="font-bold text-lg mb-2 text-yellow-400">Manifest</h3>
                              <pre className="bg-gray-800 p-2 rounded text-gray-200 whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">{JSON.stringify(manifest, null, 2)}</pre>
                            </div>
                          )}
                          {/* --- ANALYSIS SECTION --- */}
                          {analysis && (
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="font-bold text-lg mb-2 text-green-400">Screen & Component Analysis</h3>
                              <div className="mb-2">
                                <strong>Screens:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {analysis.screens && analysis.screens.map((s, i) => (
                                    <li key={i}>
                                      <button className="text-green-300 hover:underline font-semibold" onClick={() => handleAnalysisClick(s.name)}>{s.name}</button>: {s.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mb-2">
                                <strong>Components:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {analysis.components && analysis.components.map((c, i) => (
                                    <li key={i}>
                                      <button className="text-blue-300 hover:underline font-semibold" onClick={() => handleAnalysisClick(c.name)}>{c.name}</button>: {c.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {analysis.navigation && <div className="mt-2 text-gray-300"><strong>Navigation:</strong> {analysis.navigation}</div>}
                              {analysis.summary && <div className="mt-2 text-gray-300"><strong>Summary:</strong> {analysis.summary}</div>}
                            </div>
                          )}
                          {/* --- QA SECTION --- */}
                          {qa && (
                            <div className="p-4 border-b border-gray-700">
                              <h3 className="font-bold text-lg mb-2">Estimated Accuracy</h3>
                              <div className="flex items-center gap-4">
                                <div className="text-4xl font-bold text-green-400">{qa.score}/10</div>
                                <p className="text-gray-400">{qa.justification}</p>
                              </div>
                            </div>
                          )}
                          {/* --- LEGACY ACCURACY RESULT (for compatibility) --- */}
                          {accuracyResult && !qa && (
                              <div className="p-4 border-b border-gray-700">
                                  <h3 className="font-bold text-lg mb-2">Estimated Accuracy</h3>
                                  <div className="flex items-center gap-4">
                                      <div className="text-4xl font-bold text-green-400">{accuracyResult.score}%</div>
                                      <p className="text-gray-400">{accuracyResult.justification}</p>
                                  </div>
                              </div>
                          )}
                          {/* --- CODE/PREVIEW TABS --- */}
                          <div className="flex-1 overflow-auto p-4 bg-gray-800 rounded-b-lg">
                            <SyntaxHighlighter language={getLanguage(selectedFile || fileList[0])} style={oneDark} customStyle={{background:'transparent', fontSize:'1em', margin:0}} showLineNumbers>
                              {selectedFileCode}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* --- GITHUB EXPORT UI --- */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                      {!isGithubAuthenticated ? (
                        <a href="/api/github-login" className="bg-gray-700 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-xs">Connect to GitHub</a>
                      ) : (
                        <button onClick={() => setShowExportModal(true)} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-bold text-xs">Export to GitHub</button>
                      )}
                      {githubExportStatus && githubExportStatus.loading && (
                        <div className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">Exporting...</div>
                      )}
                      {githubExportStatus && githubExportStatus.error && (
                        <div className="text-xs text-red-400 bg-gray-800 px-2 py-1 rounded">{githubExportStatus.error}</div>
                      )}
                      {githubExportStatus && githubExportStatus.url && (
                        <a href={githubExportStatus.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 underline bg-gray-800 px-2 py-1 rounded">View Repo</a>
                      )}
                      <button onClick={() => handleAICodeReview('file')} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold text-xs mt-2">AI Code Review (File)</button>
                      <button onClick={() => handleAICodeReview('project')} className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold text-xs">AI Code Review (Project)</button>
                    </div>
                    {/* --- EXPORT MODAL --- */}
                    {showExportModal && (
                      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6 relative">
                          <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                          <h2 className="text-xl font-bold text-green-400 mb-4">Export to GitHub</h2>
                          <label className="block mb-2 text-gray-300 font-semibold">Repository Name</label>
                          <input type="text" value={repoNameInput} onChange={e => setRepoNameInput(e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white mb-4" />
                          <button onClick={handleExportToGithub} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded">Export</button>
                        </div>
                      </div>
                    )}
                    {/* --- AI REVIEW MODAL --- */}
                    {showReviewModal && (
                      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
                          <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                          <h2 className="text-2xl font-bold text-blue-400 mb-4">AI Code Review</h2>
                          {reviewLoading && <div className="text-gray-300">Reviewing code...</div>}
                          {reviewError && <div className="text-red-400">{reviewError}</div>}
                          {reviewResult && (
                            <pre className="bg-gray-800 p-4 rounded text-gray-200 whitespace-pre-wrap text-sm max-h-[50vh] overflow-y-auto">{reviewResult}</pre>
                          )}
                        </div>
                      </div>
                    )}
                </main>
            </div>
            {imagePreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center modal" onClick={() => setImagePreview(null)}>
                    <div className="relative w-11/12 max-w-4xl h-5/6 bg-gray-800 rounded-lg shadow-xl flex flex-col p-4">
                        <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
                        <img src={imagePreview} className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
             {isPreviewing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center modal">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsPreviewing(false)}></div>
                    <div className="relative w-11/12 h-5/6 bg-gray-800 rounded-lg shadow-xl flex flex-col">
                        <div className="p-2 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
                            <p className="text-sm text-gray-400">{loadingText || 'Live Preview'}</p>
                            <button onClick={() => setIsPreviewing(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                        </div>
                        <iframe src={previewUrl || 'about:blank'} className="flex-grow w-full h-full border-0 bg-white rounded-b-lg"></iframe>
                    </div>
                </div>
            )}
            {/* --- HISTORY PANEL --- */}
            {showHistory && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70">
                <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 relative">
                  <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                  <h2 className="text-2xl font-bold text-green-400 mb-4">Generation History</h2>
                  {history.length === 0 ? (
                    <div className="text-gray-400">No previous generations found.</div>
                  ) : (
                    <ul className="divide-y divide-gray-700">
                      {history.map((v, i) => (
                        <li key={v.timestamp} className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                          <div className="flex-1">
                            <div className="font-bold text-white">{v.projectName || 'Unnamed Project'}</div>
                            <div className="text-xs text-gray-400">{formatTime(v.timestamp)}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRestoreVersion(v)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Restore</button>
                            <button onClick={() => handleDeleteVersion(v.timestamp)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
        </div>
    );
};

const IntegrationLabView = ({ onNavigate }) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [generatedFiles, setGeneratedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [projectName, setProjectName] = useState('ai-generated-app');
    const [accuracyResult, setAccuracyResult] = useState(null);
    const [refinedPlan, setRefinedPlan] = useState('');
    const [error, setError] = useState('');

    const examples = [
        {
            name: 'Insurance Quote',
            prompt: `**Project Plan: Auto Insurance Quote Portal**

**Pages:**
* \`QuoteStartPage\`: A landing page with a form to enter a ZIP code to begin the quote process.
* \`VehicleInfoPage\`: A form to add one or more vehicles (Year, Make, Model).
* \`DriverInfoPage\`: A form to add driver information.
* \`QuoteSummaryPage\`: Displays the calculated premium, coverage details, and options to purchase.

**Reusable Components:**
* \`Header\`: Contains the company logo and a contact number.
* \`TextInput\`: A standardized text input field with a label and validation messages.
* \`VehicleCard\`: A card to display summary information for an added vehicle.
* \`PrimaryButton\`: The main call-to-action button used across different forms.
* \`Footer\`: Contains legal disclaimers and navigation links.`
        },
        {
            name: 'Financial Dashboard',
            prompt: `**Project Plan: Personal Finance Dashboard**

**Pages:**
* \`DashboardPage\`: The main view showing an overview of the user's portfolio, recent transactions, and spending breakdown.
* \`TransactionsPage\`: A detailed, filterable list of all transactions.
* \`SettingsPage\`: Allows users to link bank accounts and manage notification preferences.

**Reusable Components:**
* \`SidebarNav\`: Navigation menu for switching between Dashboard, Transactions, and Settings.
* \`PortfolioChart\`: A pie chart visualizing the asset allocation.
* \`TransactionRow\`: A component for a single transaction entry, showing merchant, amount, and date.
* \`SpendingChart\`: A bar chart showing spending by category.`
        },
        {
            name: 'Loan Calculator',
            prompt: `**Project Plan: Mortgage Loan Calculator**

**Pages:**
* \`CalculatorPage\`: A single-page application containing the calculator and results display.

**Reusable Components:**
* \`LoanInputForm\`: A form with sliders or input fields for Loan Amount, Interest Rate, and Loan Term.
* \`ResultsDisplay\`: A component that shows the calculated monthly payment.
* \`AmortizationSchedule\`: A table that displays the breakdown of principal and interest payments over the life of the loan.`
        }
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPrompt(event.target.result);
                setRefinedPlan(''); // Clear refined plan when new file is uploaded
            };
            reader.readAsText(file);
        }
    };

    const handleAnalyzePlan = async () => {
        if (!prompt.trim()) {
            setError("Please provide a description first.");
            return;
        }
        setIsAnalyzing(true);
        setError('');
        setRefinedPlan('');
        try {
            const response = await fetch('/api/analyze-prompt', { // UPDATED
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const data = await response.json();
            setRefinedPlan(data.plan);
        } catch (error) {
            console.error('Error analyzing plan:', error);
            setError(`Failed to analyze the plan: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateCode = async () => {
        const finalPrompt = refinedPlan || prompt;
        if (!finalPrompt.trim()) {
            setError("Please provide a description or generate a plan first.");
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedFiles({});
        setAccuracyResult(null);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing requirements...', architect: 'running' });
            const response = await fetch('/api/generate-from-text', { // UPDATED
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    projectName
                }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            setWorkflowStatus(prev => ({ ...prev, text: 'Component Builder: Creating reusable components...', architect: 'completed', builder: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setWorkflowStatus(prev => ({ ...prev, text: 'Page Composer: Assembling pages...', builder: 'completed', composer: 'running' }));
            await new Promise(res => setTimeout(res, 800));
            
            const data = await response.json();

            setWorkflowStatus(prev => ({ ...prev, text: 'Finisher & QA: Finalizing and checking quality...', composer: 'completed', finisher: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setGeneratedFiles(data.generatedFiles);
            setAccuracyResult(data.accuracyResult);
            setWorkflowStatus({ text: 'Done!', architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'completed' });

        } catch (error) {
            console.error('Error generating code from text:', error);
            setError(error.message);
            setWorkflowStatus({ text: `Error: ${error.message}`, architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'error' });
        } finally {
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    const handleDownload = async () => {
        const zip = new window.JSZip();
        for (const path in generatedFiles) {
            zip.file(path, generatedFiles[path]);
        }
        const zipBlob = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${projectName || 'ai-generated-app'}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="content-wrapper min-h-screen flex flex-col p-8 bg-[#0D0F18]">
            <button onClick={() => onNavigate('landing')} className="absolute top-5 left-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            
            <header className="text-center my-8">
                <h1 className="text-5xl md:text-6xl font-black text-white">
                    <span className="text-green-400">AI</span> is the new <span className="text-green-400">UI</span>
                </h1>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] mx-auto">
                <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl p-4 flex flex-col gap-4 bg-[#1f2937] border border-gray-700/50">
                    <h3 className="text-lg font-bold text-white mb-2">PROMPT EXAMPLES</h3>
                    <div className="flex flex-col gap-2">
                        {examples.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setPrompt(example.prompt);
                                    setRefinedPlan(''); // Clear refined plan when a new example is selected
                                    setError('');
                                }}
                                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
                            >
                                {example.name}
                            </button>
                        ))}
                    </div>
                </aside>
                
                <main className="flex-grow flex flex-col items-center gap-6">
                    <div className="w-full bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4">1. Describe or Edit Your Application Plan</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                setRefinedPlan('');
                                setError('');
                            }}
                            placeholder="Describe the application you want to build, or select an example to edit..."
                            className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                        />
                        <div className="flex justify-between items-center mt-4">
                            <label htmlFor="doc-upload" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                                Or upload a document (.txt, .md)
                                <input id="doc-upload" type="file" className="hidden" accept=".txt,.md" onChange={handleFileChange} />
                            </label>
                            {uploadedFile && <span className="text-sm text-green-400 ml-4">File: {uploadedFile.name}</span>}
                        </div>
                    </div>

                    <div className="w-full bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4">2. Refine with AI (Optional)</h3>
                        <button onClick={handleAnalyzePlan} disabled={isAnalyzing || !prompt.trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mb-4">
                            {isAnalyzing ? 'Analyzing...' : 'Let AI Refine the Plan'}
                        </button>
                        {refinedPlan && (
                             <textarea
                                value={refinedPlan}
                                onChange={(e) => setRefinedPlan(e.target.value)}
                                className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        )}
                        <ErrorDisplay message={error} />
                    </div>

                    {isLoading ? <WorkflowStatus status={workflowStatus} error={error} /> : (
                        <div className="w-full bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">3. Generate & Download</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleGenerateCode} disabled={isLoading || !prompt.trim()} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                    Generate Application
                                </button>
                                <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                    Download Codebase
                                </button>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                            </div>
                            <ErrorDisplay message={error} />
                        </div>
                    )}

                    {Object.keys(generatedFiles).length > 0 && !isLoading && (
                         <div className="w-full bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 relative mt-6">
                            <div className="p-4 border-b border-gray-700"><h2 className="font-bold text-lg">Generated Code</h2></div>
                            {accuracyResult && (
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="font-bold text-lg mb-2">Estimated Accuracy</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl font-bold text-green-400">{accuracyResult.score}%</div>
                                        <p className="text-gray-400">{accuracyResult.justification}</p>
                                    </div>
                                </div>
                            )}
                            <pre className="p-4 bg-gray-800 rounded-b-lg text-sm"><code className="font-mono whitespace-pre-wrap break-all">{Object.entries(generatedFiles).map(([path, code]) => `// --- FILENAME: ${path} ---\n${code}`).join('\n\n')}</code></pre>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};


// --- Main App Component (Router) ---

function App() {
    const [view, setView] = useState('initial');
    const [appLabPlatform, setAppLabPlatform] = useState('android');

    const handleNavigate = (targetView, platform) => {
        if (platform) {
            setAppLabPlatform(platform);
        }
        setView(targetView);
    };

    const renderView = () => {
        switch (view) {
            case 'landing':
                return <LandingView onNavigate={handleNavigate} />;
            case 'prototype':
                return <PrototypeView onNavigate={handleNavigate} />;
            case 'app-lab-landing':
                return <AppLabLandingView onNavigate={handleNavigate} />;
            case 'app-lab-generate':
                return <AppLabGenerateView onNavigate={handleNavigate} initialPlatform={appLabPlatform} />;
            case 'integration-lab':
                return <IntegrationLabView onNavigate={handleNavigate} />;
            case 'initial':
            default:
                return <InitialView onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="bg-black text-white min-h-screen flex justify-center">
        <main className="relative w-full max-w-[2600px] mx-auto h-screen px-2 md:px-4" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            {renderView()}
        </main>
        </div>
    );
}

export default App;
