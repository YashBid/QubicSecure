'use client';

import React, { useState, useCallback } from 'react';

interface UploadZoneProps {
    onUploadComplete: (data: any) => void;
    onUploadStart: () => void;
}

export default function UploadZone({ onUploadComplete, onUploadStart }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) await uploadFile(files[0]);
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) await uploadFile(files[0]);
    }, []);

    const uploadFile = async (file: File) => {
        setError(null);
        setUploading(true);
        onUploadStart();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Upload failed');
            onUploadComplete(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
            setUploading(false);
        }
    };

    return (
        <div className={`upload-zone ${isDragging ? 'dragging' : ''}`}>
            <div
                className="upload-zone-inner scan-container"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Animated scan line */}
                {!uploading && <div className="scan-line" />}

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cyan-500/40 rounded-tl-md" />
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cyan-500/40 rounded-tr-md" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cyan-500/40 rounded-bl-md" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cyan-500/40 rounded-br-md" />

                {uploading ? (
                    <div className="flex flex-col items-center gap-5 py-4">
                        {/* Animated rings */}
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
                            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 spin-anim" />
                            <div className="absolute inset-2 rounded-full border-t-2 border-violet-400 spin-anim" style={{animationDirection:'reverse', animationDuration:'0.8s'}} />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-base">Uploading contract...</p>
                            <p className="text-slate-500 text-sm text-center mt-1">Preparing for analysis</p>
                        </div>
                    </div>
                ) : (
                    <label className="block cursor-pointer" htmlFor="file-input">
                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative float-anim">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
                                    <svg className="w-9 h-9 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                </div>
                                {/* Orbit dot */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 pulse-ring" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                            {isDragging ? 'Drop to analyze' : 'Drop your contract here'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            or{' '}
                            <span className="text-cyan-400 font-medium underline underline-offset-2">browse files</span>
                            {' '}to upload
                        </p>

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="text-xs text-slate-500 mono">.cpp .h .hpp .c .cc .cxx — max 10MB</span>
                        </div>

                        <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            accept=".cpp,.h,.hpp,.c,.cc,.cxx"
                            onChange={handleFileSelect}
                            disabled={uploading}
                        />
                    </label>
                )}

                {error && (
                    <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <span className="text-red-400 text-lg">⚠</span>
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
