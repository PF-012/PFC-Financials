import React from 'react';

// Vite serves files in public/ from the site root.
// Keep the URL encoded because the existing public asset contains a space.
export const LOGO_SRC = '/Trans%20Logo.png';

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
