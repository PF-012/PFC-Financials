import React from 'react';

// Files in Vite's public/ directory are served from the site root.
// Keep the asset URL free of spaces so it works consistently on Vercel/CDNs.
export const LOGO_SRC = '/trans-logo.png';

export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <img
      src={LOGO_SRC}
      alt="PFC Financials logo"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
}
