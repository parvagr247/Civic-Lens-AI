import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, XCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validateImageFile } from '../../services/uploadService';

/**
 * ImageUploader component.
 * Allows drag-and-drop or file system selection of incident photos with immediate validation and thumbnail preview.
 */
export default function ImageUploader({ selectedFile, onFileSelect, onFileRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const fileInputRef = useRef(null);

  // Manage object URLs lifecycle to prevent memory leaks and constant image reloading
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setHasLoadError(false);
      return;
    }

    setHasLoadError(false);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Revoke object URL on unmount or file change
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    processSelectedFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError(null);
    setHasLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileRemove();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        Upload Incident Photo <span className="text-emerald-500 dark:text-emerald-400">*</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3 rounded-lg mb-3 animate-fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className={`relative group border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-6 ${
          selectedFile
            ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
            : dragActive
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-[0.99] cursor-pointer'
            : 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 hover:border-emerald-500 dark:hover:border-slate-600 hover:bg-gray-100/50 dark:hover:bg-slate-900/60 cursor-pointer'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={selectedFile ? undefined : triggerFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 aspect-video flex items-center justify-center bg-gray-100 dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            {hasLoadError && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileSelect();
                }}
                className="flex flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 w-full h-full rounded-lg absolute inset-0 z-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <AlertCircle size={24} className="text-rose-500 mb-2" />
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Failed to load preview</span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 mb-3">Please try another image file</span>
                <span className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors">
                  Select Another Image
                </span>
              </div>
            )}
            
            <img
              src={previewUrl}
              alt="Preview"
              className={`max-w-full max-h-full object-contain ${hasLoadError ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
              onLoad={() => {
                setHasLoadError(false);
              }}
              onError={(e) => {
                if (previewUrl && e.target.src === previewUrl) {
                  setHasLoadError(true);
                }
              }}
            />

            {!hasLoadError && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileSelect();
                }}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white text-xs font-bold gap-1.5 z-20 cursor-pointer"
              >
                <UploadCloud size={16} />
                <span>Change Photo</span>
              </div>
            )}
            
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-gray-900/80 dark:bg-slate-950/80 hover:bg-rose-600 text-white dark:text-slate-300 rounded-full transition-all duration-205 z-30 shadow-md"
              title="Remove Image"
            >
              <XCircle size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-gray-200/50 dark:bg-slate-800/60 rounded-full text-gray-500 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-slate-300 group-hover:scale-105 transition-all duration-300 mb-3">
              <UploadCloud size={28} />
            </div>
            <p className="text-gray-700 dark:text-slate-300 font-medium mb-1">
              Drag & drop your image here, or <span className="text-emerald-600 dark:text-emerald-400 hover:underline">browse</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-500 flex items-center gap-1 mt-1">
              <ImageIcon size={12} />
              Supports JPG, JPEG, PNG, WEBP (Max 10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
