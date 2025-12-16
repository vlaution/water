import React, { useEffect, useState } from 'react';
import { MarketDataService } from '../../services/MarketDataService';

interface SectorMultiples {
    senior: number;
    total: number;
}

interface SectorMultiplesHeatmapProps {
    currentSector?: string;
    onSelectSector?: (sector: string) => void;
}

export const SectorMultiplesHeatmap: React.FC<SectorMultiplesHeatmapProps> = ({
    currentSector,
    onSelectSector
}) => {
    const [data, setData] = useState<Record<string, SectorMultiples> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const multiples = await MarketDataService.getAllLeverageMultiples();
                // Filter out 'default' from display usually, or keep it as 'General'
                setData(multiples);
            } catch (error) {
                console.error("Failed to fetch sector multiples", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading market data...</div>;
    if (!data) return null;

    // Find max leverage to scale bars
    const maxLeverage = Math.max(...Object.values(data).map(d => d.total));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
                <span>Sector Leverage Multiples</span>
                <span className="text-xs font-normal text-gray-500">Live Market Data</span>
            </h4>

            <div className="space-y-3">
                {Object.entries(data)
                    .filter(([name]) => name !== 'default') // Hide default
                    .map(([sector, multiples]) => {
                        const isSelected = currentSector === sector;
                        return (
                            <div
                                key={sector}
                                onClick={() => onSelectSector?.(sector)}
                                className={`group cursor-pointer p-2 rounded-lg transition-all ${isSelected ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {sector}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {multiples.total.toFixed(1)}x
                                    </span>
                                </div>

                                {/* Bar Chart */}
                                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                    {/* Total Leverage (Background Bar) */}
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-blue-200' : 'bg-gray-300 group-hover:bg-gray-400'
                                            }`}
                                        style={{ width: `${(multiples.total / maxLeverage) * 100}%` }}
                                    />
                                    {/* Senior Leverage (Foreground Bar) */}
                                    <div
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-blue-500' : 'bg-gray-500 group-hover:bg-gray-600'
                                            }`}
                                        style={{ width: `${(multiples.senior / maxLeverage) * 100}%` }}
                                    />
                                </div>

                                <div className="flex justify-between mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-gray-400">Senior: {multiples.senior}x</span>
                                </div>
                            </div>
                        );
                    })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span>Senior Debt</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span>Total Debt</span>
                </div>
            </div>
        </div>
    );
};
