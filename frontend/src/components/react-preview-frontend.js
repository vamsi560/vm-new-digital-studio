// frontend/src/components/ReactPreview.jsx
import React, { useState, useRef, useEffect } from 'react';

const ReactPreview = ({ code, onError, onReady }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (code) {
      generatePreview();
    }
  }, [code]);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preview-react', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data);
        onReady?.(data);
      } else {
        setError(data.error);
        onError?.(data.error);
      }
    } catch (err) {
      const errorMsg = 'Failed to generate preview';
      setError(errorMsg);
      onError?.(errorMsg);
    }

    setLoading(false);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'PREVIEW_READY') {
        console.log('Preview is ready');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-red-600 text-lg mr-2">❌</span>
          <h3 className="text-red-800 font-medium">Preview Error</h3>
        </div>
        <p className="text-red-700 mb-3">{error}</p>
        <button
          onClick={generatePreview}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No preview available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Component Info */}
      {previewData.componentInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            📱 {previewData.componentInfo.componentName}
          </h3>
          <p className="text-blue-800 text-sm mb-2">
            {previewData.componentInfo.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {previewData.componentInfo.props?.length > 0 && (
              <div>
                <span className="font-medium text-blue-900">Props:</span>
                <ul className="text-blue-700 mt-1">
                  {previewData.componentInfo.props.map((prop, i) => (
                    <li key={i} className="ml-2">• {prop}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {previewData.componentInfo.hooks?.length > 0 && (
              <div>
                <span className="font-medium text-blue-900">Hooks:</span>
                <ul className="text-blue-700 mt-1">
                  {previewData.componentInfo.hooks.map((hook, i) => (
                    <li key={i} className="ml-2">• {hook}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {previewData.dependencies?.length > 0 && (
              <div>
                <span className="font-medium text-blue-900">Imports:</span>
                <ul className="text-blue-700 mt-1">
                  {previewData.dependencies.map((dep, i) => (
                    <li key={i} className="ml-2">• {dep}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Frame */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-600">React Preview</span>
          <button
            onClick={generatePreview}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        
        <iframe
          ref={iframeRef}
          srcDoc={previewData.iframeContent}
          className="w-full h-96 border-0"
          title="React Component Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default ReactPreview;