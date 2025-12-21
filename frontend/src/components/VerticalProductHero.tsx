import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, DollarSign, Activity, CheckCircle2 } from 'lucide-react';

// --- Reused UI Components (Simplified for Animation) ---

// Simulated tiny "Stat Card" row reusing styles from AnalystDashboard
const StatRow = ({ label, value, icon: Icon, delay }: { label: string, value: string, icon: any, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.25, 1, 0.5, 1] }} // Soft ease-out
    className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm mb-2"
  >
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <span className="text-sm font-bold text-gray-900">{value}</span>
  </motion.div>
);

// The Main Product Card (Simulating a specific high-value view)
const ProductCard = () => {
  return (
    <div className="w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Simulated Window Header */}
      <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 space-x-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 opacity-60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-60" />
        <div className="ml-4 h-2 w-20 bg-gray-200 rounded-full opacity-50" />
      </div>

      {/* Content Area */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-4 w-32 bg-gray-900/10 rounded-md mb-2" />
            <div className="h-3 w-20 bg-gray-900/5 rounded-md" />
          </div>
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
             <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Staggered Rows */}
        <StatRow label="Enterprise Value" value="$1.25B" icon={Trophy} delay={1.8} />
        <StatRow label="EBITDA Margin" value="24.5%" icon={Activity} delay={1.9} />
        <StatRow label="Implied Share" value="$45.20" icon={DollarSign} delay={2.0} />

        {/* Status Tag */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="mt-4 flex items-center justify-center space-x-2 py-2 bg-blue-50 rounded-lg border border-blue-100"
        >
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Analysis Complete</span>
        </motion.div>
      </div>
    </div>
  );
};

export const VerticalProductHero = () => {
  // Key for looping the animation
  const [key, setKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
        setKey(prev => prev + 1);
    }, 12000); // 12 second loop
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-black/5">
        {/* 9:16 Container */}
        <div className="relative w-[360px] h-[640px] bg-gradient-to-b from-blue-50 to-white rounded-3xl shadow-2xl overflow-hidden border-[8px] border-white ring-1 ring-black/5">
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={key}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* 1. Headline - Staggered Words */}
                    <div className="text-center mb-8 space-y-1">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="text-2xl font-semibold text-gray-900 tracking-tight"
                        >
                            Financial Precision.
                        </motion.div>
                        <motion.div
                             initial={{ opacity: 0, y: 15 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                             className="text-gray-500 text-sm font-medium"
                        >
                            The new standard for analysts.
                        </motion.div>
                    </div>

                    {/* 2. UI Component - Scale & Fade */}
                    <motion.div
                        className="w-full"
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                            delay: 1.0, 
                            duration: 1.2, 
                            ease: [0.22, 1, 0.36, 1] // Custom "confident" ease
                        }}
                    >
                        <ProductCard />
                    </motion.div>

                    {/* 3. Footer/Caption */}
                    <motion.div
                        className="absolute bottom-12 flex items-center space-x-2 text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.0, duration: 1.0 }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono uppercase tracking-widest">Live Sync Active</span>
                    </motion.div>

                </motion.div>
            </AnimatePresence>
            
        </div>
    </div>
  );
};
