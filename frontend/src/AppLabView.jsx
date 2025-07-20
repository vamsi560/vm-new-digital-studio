import React, { useState, useCallback } from 'react';

// NOTE: The 'WorkflowStatus' component is assumed to be in a shared file 
// or passed as a prop for a real-world scenario. For this example, it's redefined here.

const WorkflowStatus = ({ status }) => {
    const agents = [
        { id: 'architect', name: 'Architect', description: 'Analyzing project structure...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 20h4v-4"/><path d="M18 4h4v4"/><path d="M12 4v16"/><path d="M2 12h20"/></svg> },
        { id: 'builder', name: 'Component Builder', description: 'Creating reusable components...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="8" rx="2"/><rect x="6" y="14" width="12" height="8" rx="2"/></svg> },
        { id: 'composer', name: 'Page Composer', description: 'Assembling screens...', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
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
            // This endpoint will be created in the backend next
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
            {/* --- HEADER LOGO --- */}
            <div className="flex items-center gap-3 mb-8">
                <div className="border border-gray-600 p-2 rounded-lg bg-black"><span className="font-bold text-3xl text-white">VM</span></div>
                <span className="text-3xl font-bold text-white">Digital Studio</span>
            </div>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 w-full max-w-[90rem] mx-auto mt-12">
                <aside className="w-full lg:w-80 flex-shrink-0 rounded-xl p-4 flex flex-col gap-4 bg-[#1f2937] border border-gray-700/50">
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
                            <h3 className="text-xl font-bold text-white mb-4">Target Platform</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <button onClick={() => setPlatform('android')} className={`flex-1 font-bold py-3 px-4 rounded-lg transition-colors ${platform === 'android' ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}>Android</button>
                                <button onClick={() => setPlatform('ios')} className={`flex-1 font-bold py-3 px-4 rounded-lg transition-colors ${platform === 'ios' ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}>iOS</button>
                            </div>
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

export default AppLabView;
