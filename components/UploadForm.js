'use client';

import { useState, useRef } from 'react';

export default function UploadForm({ onSubmit, error }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length > 0) {
      onSubmit(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors 
          ${isDragging ? 'border-green-500 bg-gray-900' : 'border-gray-600 hover:border-green-400'}`} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
          accept=".pdf"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <p className="text-green-400 font-medium">Drag & drop files here, or click to select files</p>
            <p className="text-gray-400 text-sm">Supports PDF files only</p>
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-200 truncate max-w-xs">{file.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-center">
        <button 
          type="submit" 
          disabled={files.length === 0} 
          className={`px-6 py-3 rounded-full font-medium text-center
            ${files.length === 0 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-400 text-gray-900'
            }`}
        >
          Generate Medical Summary
        </button>
      </div>
    </form>
  );
}