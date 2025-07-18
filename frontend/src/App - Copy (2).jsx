import React, { useState, useEffect, useCallback } from 'react';

// --- Reusable UI Components ---

const TrafficLights = () => (
    <div className="absolute left-4 top-3.5 flex gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#febc2e]"></div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#28c840]"></div>
    </div>
);

const ServiceCard = ({ title, svgPath, onClick, disabled = false }) => (
    <div onClick={!disabled ? onClick : undefined} className={`bg-[#1F2937] border border-[#374151] rounded-lg p-6 md:p-8 flex flex-col items-center justify-center h-full transition-all duration-300 ease-in-out ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-200 hover:-translate-y-1'}`}>
        <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={svgPath}></path>
        </svg>
        <h3 className="font-semibold text-white">{title}</h3>
        {disabled && <span className="text-xs text-yellow-400 mt-2">Coming Soon</span>}
    </div>
);


const WorkflowStatus = ({ status }) => {
    const agents = [
        { id: 'architect', name: 'Architect', description: 'Analyzing project structure...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 20h4v-4"/><path d="M18 4h4v4"/><path d="M12 4v16"/><path d="M2 12h20"/></svg> },
        { id: 'builder', name: 'Component Builder', description: 'Creating reusable components...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="8" rx="2"/><rect x="6" y="14" width="12" height="8" rx="2"/></svg> },
        { id: 'composer', name: 'Page Composer', description: 'Assembling pages...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
        { id: 'finisher', name: 'Finisher & QA', description: 'Finalizing app and checking quality...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> }
    ];

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
        <div className="w-11/12 h-5/6 bg-[#121212] rounded-xl shadow-2xl flex flex-col border border-gray-700/50">
            <div className="flex-shrink-0 h-11 flex items-center justify-center relative border-b border-gray-700/50">
                <TrafficLights />
                <p className="text-sm text-gray-400">VM Digital Studio</p>
            </div>
            <div className="flex-grow p-8 flex items-center justify-center overflow-y-auto">
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
                                <ServiceCard title="App Lab" svgPath="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" onClick={() => onNavigate('app-lab')} />
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
    const [figmaUrl, setFigmaUrl] = useState('');
    const [loadingText, setLoadingText] = useState('');


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
        setWorkflowStatus({ text: 'Importing from Figma...', architect: 'running' });
        try {
            const response = await fetch('http://localhost:3001/api/import-figma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ figmaUrl }),
            });
            if (!response.ok) {
                 const err = await response.json();
                 throw new Error(`Figma API error: ${err.error}`);
            }
            const images = await response.json();
            
            const imageFiles = await Promise.all(images.map(async (img) => {
                const res = await fetch(`https://cors-anywhere.herokuapp.com/${img.imageUrl}`);
                const blob = await res.blob();
                return new File([blob], img.fileName, { type: blob.type });
            }));
            
            handleFileUpload(imageFiles);

        } catch (error) {
            console.error('Figma import failed:', error);
            alert(`Figma import failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setGeneratedFiles({});
        setAccuracyResult(null);

        const formData = new FormData();
        const orderedFiles = flowOrder.filter(Boolean);
        orderedFiles.forEach(file => formData.append('screens', file));
        formData.append('orderedFileNames', JSON.stringify(orderedFiles.map(f => f.name)));
        if (stylesheetContent) formData.append('stylesheet', stylesheetContent);
        if (Object.keys(designTokens).length > 0) formData.append('designTokens', JSON.stringify(designTokens));
        formData.append('projectName', projectName);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing project structure...', architect: 'running' });
            const response = await fetch('http://localhost:3001/api/generate-code', {
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
            setAccuracyResult(data.accuracyResult);
            setWorkflowStatus({ text: 'Done!', architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'completed' });

        } catch (error) {
            console.error('Error generating code:', error);
            setGeneratedFiles({ 'error.txt': error.message });
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
        link.download = `${projectName || 'react-project'}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const handlePreview = async () => {
        setIsPreviewing(true);
        setLoadingText('Booting WebContainer...');
        
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
    };

    return (
        <div className="content-wrapper min-h-screen flex flex-col p-8 bg-[#0D0F18]">
            <button onClick={() => onNavigate('landing')} className="absolute top-5 left-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] mx-auto mt-12">
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
                            <label htmlFor="stylesheet-upload" className="flex items-center justify-center w-full p-3 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                                <svg className="w-8 h-8 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                <span id="stylesheet-upload-text" className="text-sm text-gray-400">Upload .css file</span>
                                <input id="stylesheet-upload" type="file" className="hidden" accept=".css" onChange={(e) => setStylesheetContent(e.target.files[0])} />
                            </label>
                            <div className="relative">
                                <button onClick={() => setIsTooltipVisible(!isTooltipVisible)} className="w-full p-3 flex items-center justify-center border-2 border-gray-600 border-dashed rounded-lg bg-gray-700 hover:bg-gray-600">
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
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
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
                    {isLoading ? <WorkflowStatus status={workflowStatus} /> : (
                        <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleGenerateCode} disabled={isLoading || flowOrder.some(f => f === null)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Generate Code</button>
                                <button onClick={handlePreview} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Preview</button>
                                <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Codebase</button>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                            </div>
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
                            <pre className="p-4 bg-gray-800 rounded-b-lg overflow-x-auto"><code className="font-mono">{Object.entries(generatedFiles).map(([path, code]) => `// --- FILENAME: ${path} ---\n${code}`).join('\n\n')}</code></pre>
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
                        <iframe src={previewUrl} className="flex-grow w-full h-full border-0 bg-white rounded-b-lg"></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

const AppLabView = ({ onNavigate }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [flowOrder, setFlowOrder] = useState([]);
    const [generatedFiles, setGeneratedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [projectName, setProjectName] = useState('MyMobileApp');
    const [draggedItem, setDraggedItem] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [accuracyResult, setAccuracyResult] = useState(null);
    const [platform, setPlatform] = useState('android'); // 'android' or 'ios'

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

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setGeneratedFiles({});
        setAccuracyResult(null);

        const formData = new FormData();
        const orderedFiles = flowOrder.filter(Boolean);
        orderedFiles.forEach(file => formData.append('screens', file));
        formData.append('projectName', projectName);
        formData.append('platform', platform);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing project structure...', architect: 'running' });
            const response = await fetch('http://localhost:3001/api/generate-native-code', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            
            setWorkflowStatus(prev => ({ ...prev, text: 'Component Builder: Creating reusable components...', architect: 'completed', builder: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setWorkflowStatus(prev => ({ ...prev, text: 'Page Composer: Assembling screens...', builder: 'completed', composer: 'running' }));
            await new Promise(res => setTimeout(res, 800));
            
            const data = await response.json();

            setWorkflowStatus(prev => ({ ...prev, text: 'Finisher & QA: Finalizing and checking quality...', composer: 'completed', finisher: 'running' }));
            await new Promise(res => setTimeout(res, 800));

            setGeneratedFiles(data.generatedFiles);
            setAccuracyResult(data.accuracyResult);
            setWorkflowStatus({ text: 'Done!', architect: 'completed', builder: 'completed', composer: 'completed', finisher: 'completed' });

        } catch (error) {
            console.error('Error generating native code:', error);
            setGeneratedFiles({ 'error.txt': error.message });
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
        link.download = `${projectName || 'mobile-app'}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="content-wrapper min-h-screen flex flex-col p-8 bg-[#0D0F18]">
            <button onClick={() => onNavigate('landing')} className="absolute top-5 left-5 z-50 bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">&larr; Back</button>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] mx-auto mt-12">
                <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl p-4 flex flex-col gap-4 bg-[#1f2937] border border-gray-700/50">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">PLATFORM</h3>
                        <div className="flex bg-gray-700 rounded-lg p-1">
                            <button 
                                onClick={() => setPlatform('android')} 
                                className={`flex-1 text-sm font-bold py-2 px-4 rounded-md transition-colors ${platform === 'android' ? 'bg-green-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-600'}`}
                            >
                                Android
                            </button>
                            <button 
                                onClick={() => setPlatform('ios')} 
                                className={`flex-1 text-sm font-bold py-2 px-4 rounded-md transition-colors ${platform === 'ios' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-600'}`}
                            >
                                iOS
                            </button>
                        </div>
                    </div>
                    <hr className="border-gray-600" />
                    <div className="flex flex-col gap-4 flex-grow min-h-0">
                        <h3 className="text-lg font-bold text-white">IMAGE TRAY</h3>
                        <div>
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
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
                    {isLoading ? <WorkflowStatus status={workflowStatus} /> : (
                        <div className="bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                            <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={handleGenerateCode} disabled={isLoading || flowOrder.some(f => f === null)} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Generate Native Code</button>
                                <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">Download Codebase</button>
                                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                            </div>
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
                            <pre className="p-4 bg-gray-800 rounded-b-lg overflow-x-auto"><code className="font-mono">{Object.entries(generatedFiles).map(([path, code]) => `// --- FILENAME: ${path} ---\n${code}`).join('\n\n')}</code></pre>
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
        </div>
    );
};

const IntegrationLabView = ({ onNavigate }) => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [generatedFiles, setGeneratedFiles] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [projectName, setProjectName] = useState('ai-generated-app');
    const [accuracyResult, setAccuracyResult] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setPrompt(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleGenerateCode = async () => {
        if (!prompt.trim()) {
            alert("Please provide a description or upload a file.");
            return;
        }
        setIsLoading(true);
        setGeneratedFiles({});
        setAccuracyResult(null);

        try {
            setWorkflowStatus({ text: 'Architect: Analyzing requirements...', architect: 'running' });
            const response = await fetch('http://localhost:3001/api/generate-from-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
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
            setGeneratedFiles({ 'error.txt': error.message });
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
            
            <header className="text-center my-12">
                <h1 className="text-5xl md:text-6xl font-black text-white">
                    <span className="text-green-400">AI</span> is the new <span className="text-green-400">UI</span>
                </h1>
            </header>

            <div className="flex-grow flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
                <div className="w-full bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                    <h3 className="text-xl font-bold text-white mb-4">Describe Your Application</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the application you want to build. For example: 'A to-do list app with a field to add tasks and a button to submit. The list should show the tasks, and each task should have a delete button.'..."
                        className="w-full h-48 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                    />
                    <div className="flex justify-between items-center mt-4">
                        <label htmlFor="doc-upload" className="text-sm text-gray-400 hover:text-white cursor-pointer">
                            Or upload a document (.txt, .md)
                            <input id="doc-upload" type="file" className="hidden" accept=".txt,.md" onChange={handleFileChange} />
                        </label>
                        {uploadedFile && <span className="text-sm text-green-400">File: {uploadedFile.name}</span>}
                    </div>
                </div>

                {isLoading ? <WorkflowStatus status={workflowStatus} /> : (
                    <div className="w-full bg-[#1f2937] rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleGenerateCode} disabled={isLoading || !prompt.trim()} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Generate Application
                            </button>
                            <button onClick={handleDownload} disabled={Object.keys(generatedFiles).length === 0} className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                Download Codebase
                            </button>
                            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter Project Name" className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"/>
                        </div>
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
                        <pre className="p-4 bg-gray-800 rounded-b-lg overflow-x-auto"><code className="font-mono">{Object.entries(generatedFiles).map(([path, code]) => `// --- FILENAME: ${path} ---\n${code}`).join('\n\n')}</code></pre>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main App Component (Router) ---

function App() {
    const [view, setView] = useState('initial'); // 'initial', 'landing', 'prototype', 'app-lab', 'integration-lab'

    const handleNavigate = (targetView) => {
        setView(targetView);
    };

    const renderView = () => {
        switch (view) {
            case 'landing':
                return <LandingView onNavigate={handleNavigate} />;
            case 'prototype':
                return <PrototypeView onNavigate={handleNavigate} />;
            case 'app-lab':
                return <AppLabView onNavigate={handleNavigate} />;
            case 'integration-lab':
                return <IntegrationLabView onNavigate={handleNavigate} />;
            case 'initial':
            default:
                return <InitialView onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="bg-black text-white min-h-screen">
            <main className="relative w-full h-screen">
                {renderView()}
            </main>
        </div>
    );
}

export default App;
