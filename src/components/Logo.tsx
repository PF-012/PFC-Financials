import React from 'react';

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img 
      src="/Trans%20Logo.png" 
      alt="Logo" 
      className={`${className} object-contain`}
    />
  );
}
