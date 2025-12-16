import React from 'react';
import { Reorder } from 'framer-motion';
import { useSyncScroll } from '../../hooks/useSyncScroll';
import { useComparison } from '../../context/ComparisonContext';
import type { ComparisonSlot } from '../../types/comparison';

interface ComparisonGridProps {
    slots: ComparisonSlot[];
}

export const ComparisonGrid: React.FC<ComparisonGridProps> = ({ slots }) => {
    const { availablePlugins } = useComparison();
    // Stage Manager Logic: Dynamic grid template based on slot count
    // 1 slot: 1fr (centered)
    // 2 slots: 1fr 1fr
    // 3+ slots: repeat(N, minmax(320px, 1fr))

    const registerScrollContainer = useSyncScroll();

    // We use Reorder.Group for drag-and-drop columns

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-900/50 backdrop-blur-sm">
            <Reorder.Group
                axis="x"
                values={slots}
                onReorder={(newOrder) => {
                    // Logic to update project slots order in context would go here
                    // e.g. updateProjectSlots(newOrder)
                    console.log("Reorder:", newOrder);
                }}
                className="flex h-full min-w-full"
            >
                {slots.map((slot) => (
                    <Reorder.Item
                        key={slot.id}
                        value={slot}
                        className="flex-shrink-0 w-[400px] border-r border-white/5 bg-black/20 h-full flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white">{slot.name}</h3>
                                <div className="text-xs text-gray-400 font-mono mt-1">{slot.id}</div>
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slot.color }} />
                        </div>

                        {/* Content Slot - This is where Plugins will render */}
                        <div
                            ref={registerScrollContainer}
                            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                        >
                            <div className="flex flex-col gap-6 pb-20">
                                {availablePlugins.map((plugin) => (
                                    plugin.isApplicable(slot.data) && (
                                        <div key={plugin.id}>
                                            <plugin.component data={slot.data} />
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
};
