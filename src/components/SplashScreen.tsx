import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo, { LOGO_SRC } from './Logo';

// Files inside public/ are served from the site root by Vite/Vercel.
const SPLASH_VIDEO_SRC = '/splash.mp4';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'video' | 'logo'>('video');
  const [isVisible, setIsVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);

  const complete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsVisible(false);
    window.setTimeout(onComplete, 800);
  }, [onComplete]);

  const showLogo = useCallback(() => {
    if (finishedRef.current) return;
    setPhase('logo');
    window.setTimeout(complete, 1400);
  }, [complete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly request muted playback. This is more reliable than relying
    // only on the autoplay attribute across browsers and Vercel previews.
    video.muted = true;
    video.defaultMuted = true;

    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        setVideoError(true);
        showLogo();
      }
    };

    if (video.readyState >= 2) {
      void playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
    }

    return () => video.removeEventListener('loadeddata', playVideo);
  }, [showLogo]);

  useEffect(() => {
    // A broken/unsupported video must never block the application.
    const timer = window.setTimeout(showLogo, 12000);
    return () => window.clearTimeout(timer);
  }, [showLogo]);

  const handleVideoError = () => {
    setVideoError(true);
    showLogo();
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
          {phase === 'video' && !videoError && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              poster={LOGO_SRC}
              onEnded={showLogo}
              onError={handleVideoError}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={SPLASH_VIDEO_SRC} type="video/mp4" />
            </video>
          )}

          {phase === 'logo' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <Logo className="w-40 h-40 sm:w-56 sm:h-56 drop-shadow-2xl" />
            </motion.div>
          )}

          <button
            onClick={complete}
            className="absolute top-6 right-6 z-10 px-6 py-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm rounded-full text-sm font-medium transition-colors border border-white/10"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
