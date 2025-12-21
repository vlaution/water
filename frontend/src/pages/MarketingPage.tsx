
import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { DashboardAnimation } from '../components/DashboardAnimation';

// --- Mock Auth Provider (Required if we use real components inside) ---

export const MarketingPage = () => {
  const containerRef = useRef(null);
  
  // Ref for the dashboard section to control scroll-based opacity if needed
  useScroll({
      target: containerRef,
      offset: ["start start", "end start"]
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] overflow-x-hidden font-sans text-gray-100 selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-12">
        
        {/* Background Gradients - Reduced Opacity for "Atmospheric Fog" */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-950/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#0A0A0B] rounded-full blur-[150px]" />
          <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-blue-950/10 rounded-full blur-[120px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center h-full">
            
            {/* Left Col: Text */}
            <div className="space-y-10 pl-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-gray-400 mb-8 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        <span className="tracking-wide uppercase">v2.4 Enterprise Release</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter leading-tight text-white/90">
                        Workflow <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-white/80">
                            Automated.
                        </span>
                    </h1>
                </motion.div>
                
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-lg lg:text-xl text-gray-500 max-w-lg leading-relaxed font-light tracking-wide"
                >
                    Stop wrestling with broken Excel sheets. 
                    Standardize your models, automate your reports, and <span className="text-gray-300 font-medium">go home early</span>.
                </motion.p>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center space-x-4 pt-2"
                >
                    <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold tracking-tight transition-all shadow-lg shadow-indigo-500/20 flex items-center group ring-1 ring-white/20 active:scale-95">
                        Start Free Trial
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-medium transition-all border border-white/10 backdrop-blur-sm active:scale-95">
                        View Demo
                    </button>
                </motion.div>
            </div>


            {/* Right Col: Dashboard Animation */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-[650px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/20 bg-[#0A0A0B]"
                style={{ perspective: '1000px' }}
            >
                {/* Screen Reflection overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20 mix-blend-overlay opacity-30" />
                
                <DashboardAnimation />
            </motion.div>

        </div>
      </section>
    </div>
  );
}

