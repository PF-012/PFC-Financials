import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="flex flex-col items-center justify-center p-8 w-full max-w-md">
            
            <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a84d4" />
                  <stop offset="100%" stopColor="#023b82" />
                </linearGradient>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00b4ff" />
                  <stop offset="50%" stopColor="#298bf0" />
                  <stop offset="100%" stopColor="#0456c2" />
                </linearGradient>
                <linearGradient id="archGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#032a68" />
                  <stop offset="50%" stopColor="#086bc4" />
                  <stop offset="100%" stopColor="#011b4a" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Arch */}
              <motion.path 
                d="M 40 180 Q 190 145 340 180 Q 190 160 40 180 Z" 
                fill="url(#archGrad)"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                style={{ transformOrigin: "190px 180px" }}
              />
              
              {/* Bars */}
              <g fill="url(#barGrad)">
                <motion.polygon 
                  points="120,158 145,155 145,100 120,110" 
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  style={{ transformOrigin: "132px 158px" }}
                />
                <motion.polygon 
                  points="155,147 180,145 180,80 155,90" 
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
                  style={{ transformOrigin: "167px 147px" }}
                />
                <motion.polygon 
                  points="190,140 215,140 215,60 190,70" 
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                  style={{ transformOrigin: "202px 140px" }}
                />
                <motion.polygon 
                  points="225,145 250,147 250,40 225,50" 
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
                  style={{ transformOrigin: "237px 147px" }}
                />
              </g>

              {/* Arrow */}
              <motion.polygon 
                points="65,150 130,120 115,140 255,85 250,70 310,75 265,112 255,97 115,152 130,132" 
                fill="url(#arrowGrad)" 
                filter="url(#shadow)"
                initial={{ opacity: 0, x: -50, y: 50 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: 1.5, ease: "backOut" }}
              />
              
              <motion.text 
                x="190" y="240" 
                fontFamily="Georgia, serif" fontSize="38" fontWeight="bold" fill="#011b4a" textAnchor="middle" letterSpacing="1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.2 }}
              >
                PFC FINANCIALS
              </motion.text>
            </svg>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
