import React, { useState } from 'react';

const GitHubImportModal = ({ isOpen, onClose, onImport, platform, framework, styling, architecture }) => {
    const [githubUrl, setGithubUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!githubUrl.trim()) {
            setError('Please enter a GitHub repository URL');
            return;
        }

        // Basic URL validation
        if (!githubUrl.includes('github.com')) {
            setError('Please enter a valid GitHub repository URL');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onImport(githubUrl);
            handleClose();
        } catch (error) {
            setError(error.message || 'Import failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setGithubUrl('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Import from GitHub</h2>
                            <p className="text-sm text-gray-400">Import existing code from GitHub repository</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            GitHub Repository URL
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/username/repository"
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-400">{error}</p>
                        )}
                    </div>

                    {/* Platform Info */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-3">Import Settings</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-400">Platform:</span>
                                <span className="ml-2 text-white capitalize">{platform}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Framework:</span>
                                <span className="ml-2 text-white">{framework}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Styling:</span>
                                <span className="ml-2 text-white">{styling}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Architecture:</span>
                                <span className="ml-2 text-white">{architecture}</span>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-300 mb-2">How to get your GitHub URL:</h4>
                        <ol className="text-xs text-green-200 space-y-1">
                            <li>1. Go to your GitHub repository</li>
                            <li>2. Click the green "Code" button</li>
                            <li>3. Copy the HTTPS URL</li>
                            <li>4. Paste it in the field above</li>
                        </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !githubUrl.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 012.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
                                    </svg>
                                    <span>Import Repository</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GitHubImportModal; 