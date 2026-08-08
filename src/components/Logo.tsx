import React, { useState } from 'react';

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img 
        src="/Trans%20Logo.png" 
        alt="Logo" 
        className={`${className} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
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
      </defs>
      <path d="M 40 180 Q 190 145 340 180 Q 190 160 40 180 Z" fill="url(#archGrad)" />
      <g fill="url(#barGrad)">
        <polygon points="120,158 145,155 145,100 120,110" />
        <polygon points="155,147 180,145 180,80 155,90" />
        <polygon points="190,140 215,140 215,60 190,70" />
        <polygon points="225,145 250,147 250,40 225,50" />
      </g>
      <polygon points="65,150 130,120 115,140 255,85 250,70 310,75 265,112 255,97 115,152 130,132" fill="url(#arrowGrad)" />
    </svg>
  );
}
