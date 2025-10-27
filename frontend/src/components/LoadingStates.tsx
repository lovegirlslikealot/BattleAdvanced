import React from 'react';
import { LoadingIcon } from './Icons';

export const ButtonLoading: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}> = ({ loading, children, loadingText = "Processing..." }) => (
  <>
    {loading ? (
      <>
        <LoadingIcon className="w-5 h-5 mr-2" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </>
);

export const CardSkeleton: React.FC = () => (
  <div className="game-card animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

export const ColorPaletteSkeleton: React.FC = () => (
  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
    {Array.from({ length: 8 }).map((_, idx) => (
      <div
        key={idx}
        className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse"
      />
    ))}
  </div>
);

export const FullPageLoading: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <LoadingIcon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
      <p className="text-lg text-gray-600">{message}</p>
    </div>
  </div>
);

export const InlineLoading: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <LoadingIcon className={`${sizeClasses[size]} text-blue-600`} />
      {message && <span className="text-gray-600">{message}</span>}
    </div>
  );
};
