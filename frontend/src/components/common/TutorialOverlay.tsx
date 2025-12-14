import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

interface TutorialStep {
    targetId?: string; // ID of element to highlight (simple version: just absolute positioning)
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
    steps: TutorialStep[];
    isOpen: boolean;
    onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    if (!isOpen) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative ml-64 border border-gray-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Step {currentStep + 1} of {steps.length}</p>
                    </div>
                </div>

                <div className="prose prose-sm text-gray-600 mb-8 min-h-[80px]">
                    <p>{step.content}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>

                    <div className="flex gap-1.5">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'bg-blue-600 w-4' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all flex items-center gap-1 shadow-lg shadow-gray-200"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1 shadow-lg shadow-green-200"
                        >
                            Finish
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
