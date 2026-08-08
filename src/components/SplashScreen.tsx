import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo, { LOGO_SRC } from './Logo';

const SPLASH_VIDEO_SRC = '/splash.mp4';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const finishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsVisible(false);
    setTimeout(onComplete, 800);
  }, [onComplete]);

  useEffect(() => {
    // Fallback timer just in case video doesn't play or end event fails
    const timer = setTimeout(() => {
      handleFinish();
    }, 60000);
    return () => clearTimeout(timer);
  }, [handleFinish]);

  const handleVideoError = () => {
    setVideoError(true);
    setTimeout(handleFinish, 4000);
  };

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
            src={SPLASH_VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={LOGO_SRC}
            onCanPlay={() => setVideoReady(true)}
            onLoadedData={() => setVideoReady(true)}
            onEnded={handleFinish}
            onError={handleVideoError}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              videoReady && !videoError ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <motion.div
            className={`absolute inset-0 flex items-center justify-center bg-black transition-opacity duration-700 ${
              videoReady && !videoError ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Logo className="w-40 h-40 sm:w-56 sm:h-56 drop-shadow-2xl" />
          </motion.div>
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
