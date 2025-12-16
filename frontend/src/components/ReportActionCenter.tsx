import React, { useState } from 'react';
import {
    FileText, Download, CheckCircle, Loader2,
    FileSpreadsheet, Presentation, LayoutTemplate,
    Settings, Share2, Mail, Layout, Type
} from 'lucide-react';
import { api } from '../config/api';
import { useToast } from '../context/ToastContext';

interface ReportActionCenterProps {
    runId: string;
    companyName: string;
    initialFormat?: 'pdf' | 'pptx' | 'docx' | 'excel';
    onClose?: () => void;
}

export const ReportActionCenter: React.FC<ReportActionCenterProps> = ({ runId, companyName, initialFormat = 'pdf', onClose }) => {
    const { showToast } = useToast();
    const [generating, setGenerating] = useState(false);

    // Config State
    const [format, setFormat] = useState<'pdf' | 'pptx' | 'docx' | 'excel'>(initialFormat);
    const [sections, setSections] = useState({
        "Executive Summary": true,
        "Detailed Analysis": true,
        "Appendices": true
    });
    const [branding, setBranding] = useState(true);
    const [distribution, setDistribution] = useState({
        "Email Team": false,
        "Save to SharePoint": false
    });

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const selectedSections = Object.entries(sections)
                .filter(([_, v]) => v)
                .map(([k]) => k);

            const selectedDistribution = Object.entries(distribution)
                .filter(([_, v]) => v)
                .map(([k]) => k);

            const payload = {
                valuation_id: runId,
                company_name: companyName,
                sections: selectedSections,
                format: format,
                branding: branding,
                distribution: selectedDistribution
            };

            const response = await fetch(api.url('/api/reports/generate'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Report generation failed");

            // Handle File Download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Derive filename extension
            const ext = format === 'excel' ? 'xlsx' : format;
            // Note: backend might handle excel differently or as xlsx.
            // Our service handles 'pdf', 'pptx', 'docx'. 'excel' might need backend update 
            // or we fall back. The backend currently mapped formats: pdf, pptx, docx.
            // Let's assume Excel is handled separately or we add mapping.
            // Backend `report_routes.py` supports PDF, PPTX, DOCX.

            a.download = `${companyName}_Report.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            showToast('Report generated successfully', 'success');
            if (onClose) onClose();

        } catch (error) {
            console.error("Generation failed:", error);
            showToast('Failed to generate report', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const toggleSection = (key: string) => setSections(prev => ({ ...prev, [key]: !prev[key as keyof typeof sections] }));
    const toggleDistribution = (key: string) => setDistribution(prev => ({ ...prev, [key]: !prev[key as keyof typeof distribution] }));

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-2xl mx-auto animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <LayoutTemplate className="w-6 h-6 text-blue-400" />
                        Report Action Center
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Configure and generate professional deliverables.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        ✕
                    </button>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Configuration */}
                <div className="space-y-6">

                    {/* Format Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Type className="w-4 h-4 text-blue-500" /> Format
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'pdf', label: 'PDF Report', icon: FileText },
                                { id: 'pptx', label: 'PowerPoint', icon: Presentation },
                                { id: 'docx', label: 'Word Doc', icon: Layout },
                                { id: 'excel', label: 'Excel Model', icon: FileSpreadsheet, disabled: true } // Disabled for now as backend service handles others
                            ].map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => !fmt.disabled && setFormat(fmt.id as any)}
                                    className={`
                                        flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                                        ${format === fmt.id
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'}
                                        ${fmt.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <fmt.icon className="w-4 h-4" />
                                    {fmt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Branding */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-500" /> Settings
                        </h3>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${branding ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                {branding && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                checked={branding}
                                onChange={(e) => setBranding(e.target.checked)}
                                className="hidden"
                            />
                            <span className="text-sm text-gray-700 font-medium">Use Company Branding</span>
                        </label>
                    </div>

                </div>

                {/* Right Column: Sections & Actions */}
                <div className="space-y-6">

                    {/* Content Sections */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Layout className="w-4 h-4 text-blue-500" /> Content Sections
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(sections).map(([label, checked]) => (
                                <label key={label} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                        {checked && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleSection(label)}
                                        className="hidden"
                                    />
                                    <span className="text-sm text-gray-700">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Distribution */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-blue-500" /> Distribution
                        </h3>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${distribution['Email Team'] ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                    {distribution['Email Team'] && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={distribution['Email Team']}
                                    onChange={() => toggleDistribution('Email Team')}
                                    className="hidden"
                                />
                                <span className="text-sm text-gray-700 flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-gray-400" /> Email to Team
                                </span>
                            </label>
                            {/* SharePoint placeholder */}
                        </div>
                    </div>


                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="
                        bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-slate-900/20 
                        hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center gap-2
                    "
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
