import React, { useState } from 'react';

const FigmaImportModal = ({ isOpen, onClose, onImport, platform, framework, styling, architecture }) => {
    const [figmaUrl, setFigmaUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!figmaUrl.trim()) {
            setError('Please enter a Figma URL');
            return;
        }

        // Basic URL validation
        if (!figmaUrl.includes('figma.com')) {
            setError('Please enter a valid Figma URL');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onImport(figmaUrl);
            handleClose();
        } catch (error) {
            setError(error.message || 'Import failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFigmaUrl('');
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
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Import from Figma</h2>
                            <p className="text-sm text-gray-400">Generate code from your Figma designs</p>
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
                            Figma File URL
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={figmaUrl}
                                onChange={(e) => setFigmaUrl(e.target.value)}
                                placeholder="https://www.figma.com/file/..."
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-300 mb-2">How to get your Figma URL:</h4>
                        <ol className="text-xs text-blue-200 space-y-1">
                            <li>1. Open your Figma file</li>
                            <li>2. Click "Share" in the top right</li>
                            <li>3. Copy the link from your browser</li>
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
                            disabled={isLoading || !figmaUrl.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <span>Import Design</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FigmaImportModal; 