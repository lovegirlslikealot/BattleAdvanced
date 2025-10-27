import React from 'react';

// Base icon wrapper with consistent styling
const IconWrapper: React.FC<{ className?: string; children: React.ReactNode }> = ({ 
  className = "w-5 h-5", 
  children 
}) => (
  <svg 
    className={`${className} flex-shrink-0 inline-block`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    style={{ maxWidth: '100%', maxHeight: '100%' }}
  >
    {children}
  </svg>
);

export const WalletIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </IconWrapper>
);

export const PlayIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={`${className} flex-shrink-0 inline-block`} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    style={{ maxWidth: '100%', maxHeight: '100%' }}
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </IconWrapper>
);

export const UnlockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </IconWrapper>
);

export const EyeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </IconWrapper>
);

export const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </IconWrapper>
);

export const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </IconWrapper>
);

export const LoadingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    className={`${className} animate-spin flex-shrink-0 inline-block`} 
    fill="none" 
    viewBox="0 0 24 24"
    style={{ maxWidth: '100%', maxHeight: '100%' }}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const CoinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconWrapper>
);

export const PaletteIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <IconWrapper className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="16" cy="12" r="2" />
    <circle cx="16" cy="18" r="2" />
  </IconWrapper>
);
