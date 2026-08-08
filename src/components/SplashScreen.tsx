import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleFinish = () => {
    setIsVisible(false);
    setTimeout(onComplete, 800);
  };

  useEffect(() => {
    // Fallback timer just in case video doesn't play or end event fails
    const timer = setTimeout(() => {
      handleFinish();
    }, 60000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <video 
            src="/splash.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleFinish}
            onError={handleFinish}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            onClick={handleFinish}
            className="absolute top-6 right-6 z-10 px-6 py-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full text-sm font-medium transition-colors border border-white/10"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
