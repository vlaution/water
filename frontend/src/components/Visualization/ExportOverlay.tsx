import React, { useState } from 'react';
import { Camera, Video, Loader2 } from 'lucide-react';
import { ExportService } from '../../services/sensitivity/ExportService';

export const ExportOverlay: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);

    const handleImageExport = async () => {
        setIsExporting(true);
        try {
            // Target the canvas container or specific ID
            // We assume the heatmap canvas is available in the DOM
            const canvas = document.querySelector('canvas');
            if (canvas) {
                await ExportService.captureImage(canvas);
            }
        } catch (e) {
            console.error("Export failed", e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleVideoExport = async () => {
        setIsExporting(true);
        try {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                // Record for 4 seconds (full loop roughly)
                await ExportService.recordsStream(canvas, 4000);
            }
        } catch (e) {
            console.error("Video failed", e);
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="absolute top-4 right-16 z-20 flex gap-2">
            <button
                onClick={handleImageExport}
                disabled={isExporting}
                className="bg-black/60 backdrop-blur border border-white/10 p-2 rounded hover:bg-white/10 transition-colors text-white disabled:opacity-50"
                title="Export Snapshot (4K)"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <button
                onClick={handleVideoExport}
                disabled={isExporting}
                className="bg-black/60 backdrop-blur border border-white/10 p-2 rounded hover:bg-white/10 transition-colors text-white disabled:opacity-50"
                title="Record Animation"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
            </button>
        </div>
    );
};
