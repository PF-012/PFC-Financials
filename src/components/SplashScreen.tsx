import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LOGO_SRC } from './Logo';

const SPLASH_VIDEO_SRC = '/splash.mp4';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        setVideoError(true);
        complete();
      }
    };

    if (video.readyState >= 2) {
      void playVideo();
    } else {
      video.addEventListener('loadeddata', playVideo, { once: true });
    }

    return () => video.removeEventListener('loadeddata', playVideo);
  }, [complete]);

  useEffect(() => {
    // Never leave the application stuck on the splash if the video fails.
    const timer = window.setTimeout(complete, 12000);
    return () => window.clearTimeout(timer);
  }, [complete]);

  const handleVideoError = () => {
    setVideoError(true);
    complete();
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
          {!videoError && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              preload="auto"
              poster={LOGO_SRC}
              onEnded={complete}
              onError={handleVideoError}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={SPLASH_VIDEO_SRC} type="video/mp4" />
            </video>
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
