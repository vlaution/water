import React, { useState } from 'react';

interface FileUploadProps {
    onUploadSuccess?: (data: any) => void;
}

import { useToast } from '../context/ToastContext';

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Assuming backend is running on port 8000
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(data);
            if (onUploadSuccess) {
                onUploadSuccess(data);
            } else {
                showToast('Upload successful!', 'success');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast('Upload failed. Check console for details.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-panel p-8 max-w-md mx-auto mt-20 text-center transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 tracking-tight">Upload Valuation Workbook</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6 hover:border-system-blue transition-colors group">
                <input
                    type="file"
                    accept=".xlsx, .xlsm"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <span className="text-gray-600 font-medium">{file ? file.name : "Click to select file"}</span>
                    <span className="text-gray-400 text-sm mt-1">.xlsx or .xlsm</span>
                </label>
            </div>

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full py-3 rounded-xl font-medium text-white transition-all transform active:scale-95 ${!file || uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-system-blue hover:bg-blue-600 shadow-lg hover:shadow-blue-500/30'
                    }`}
            >
                {uploading ? 'Uploading...' : 'Start Processing'}
            </button>
        </div>
    );
};
