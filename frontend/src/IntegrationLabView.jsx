import React, { useState, useCallback } from 'react';

// NOTE: The 'WorkflowStatus' component is assumed to be in a shared file 
// or passed as a prop for a real-world scenario. For this example, it's redefined here.
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

export default IntegrationLabView;
