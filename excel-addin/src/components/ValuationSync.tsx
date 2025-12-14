import React, { useState } from 'react';

// Declare Office global for TypeScript
declare const Office: any;
declare const Excel: any;

interface Props {
    token: string;
    valuationId: string;
}

const ValuationSync: React.FC<Props> = ({ token, valuationId }) => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const loadToExcel = async () => {
        setLoading(true);
        setStatus('Fetching data...');
        try {
            const response = await fetch(`http://localhost:8000/api/excel/valuation/${valuationId}/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();

            setStatus('Writing to Excel...');

            await Excel.run(async (context: any) => {
                const sheet = context.workbook.worksheets.getActiveWorksheet();

                // HEADER
                sheet.getRange("A1").values = [[`Valuation Report: ${data.company_name}`]];
                sheet.getRange("A1").format.font.bold = true;
                sheet.getRange("A1").format.font.size = 14;

                // INPUTS
                sheet.getRange("A3").values = [["Assumptions"]];
                sheet.getRange("A3").format.font.bold = true;

                let row = 4;
                const inputs = data.inputs || {};

                // Helper to maximize flatten object for display
                const flatten = (obj: any, prefix = '') => {
                    Object.keys(obj).forEach(key => {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            flatten(obj[key], `${prefix}${key}.`);
                        } else {
                            sheet.getRange(`A${row}`).values = [[`${prefix}${key}`]];
                            sheet.getRange(`B${row}`).values = [[obj[key]]];
                            // Mark as Input Style
                            sheet.getRange(`B${row}`).format.fill.color = "#E6F3FF";
                            row++;
                        }
                    });
                };

                flatten(inputs);

                // RESULTS
                row += 2;
                sheet.getRange(`A${row}`).values = [["Results"]];
                sheet.getRange(`A${row}`).format.font.bold = true;
                row++;

                const results = data.outputs || {};
                const flattenResults = (obj: any, prefix = '') => {
                    Object.keys(obj).forEach(key => {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            flattenResults(obj[key], `${prefix}${key}.`);
                        } else {
                            sheet.getRange(`A${row}`).values = [[`${prefix}${key}`]];
                            sheet.getRange(`B${row}`).values = [[obj[key]]];
                            row++;
                        }
                    });
                };

                flattenResults(results);

                sheet.getUsedRange().format.autofitColumns();
                await context.sync();
            });

            setStatus('Loaded successfully!');
            setLastSync(new Date());

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const syncBack = async () => {
        setLoading(true);
        setStatus('Reading from Excel...');
        try {
            let inputs: any = {};

            await Excel.run(async (context: any) => {
                const sheet = context.workbook.worksheets.getActiveWorksheet();
                const range = sheet.getUsedRange();
                range.load("values");
                await context.sync();

                const rows = range.values;
                // Simple parser assuming Key-Value pairs in A-B columns starting at row 4
                // This is brittle for MVP

                let readingInputs = false;

                rows.forEach((row: any[]) => {
                    if (row[0] === "Assumptions") {
                        readingInputs = true;
                        return;
                    }
                    if (row[0] === "Results") {
                        readingInputs = false;
                        return;
                    }

                    if (readingInputs && row[0] && row[1] !== undefined) {
                        const key = row[0];
                        const value = row[1];

                        // Unflatten logic (simplified)
                        // inputs["assumptions.growth_rate"] = 0.05
                        // Ideally we reconstruct the object

                        // For now, let's just construct a flat map and rely on backend to handle or basic unflattening
                        // Actually, backend needs nested structure probably.
                        // Let's do basic unflattening

                        const keys = key.split('.');
                        let current = inputs;
                        for (let i = 0; i < keys.length - 1; i++) {
                            if (!current[keys[i]]) current[keys[i]] = {};
                            current = current[keys[i]];
                        }
                        current[keys[keys.length - 1]] = value;
                    }
                });
            });

            setStatus('Pushing updates...');
            const response = await fetch(`http://localhost:8000/api/excel/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: valuationId,
                    inputs: inputs
                })
            });

            if (!response.ok) throw new Error('Update failed');

            setStatus('Synced successfully!');
            setLastSync(new Date());

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                Selected ID: <span className="font-mono">{valuationId.substring(0, 8)}...</span>
            </div>

            <button
                onClick={loadToExcel}
                disabled={loading}
                className="w-full bg-green-600 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-green-700"
            >
                📥 Load to Excel
            </button>

            <button
                onClick={syncBack}
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
            >
                📤 Sync Updates to Platform
            </button>

            {status && (
                <div className={`text-center text-sm p-2 rounded ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {status}
                </div>
            )}

            {lastSync && (
                <div className="text-center text-xs text-gray-400">
                    Last sync: {lastSync.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default ValuationSync;
