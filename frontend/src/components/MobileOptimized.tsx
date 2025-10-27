import React from 'react';

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileOptimizedProps> = ({ children, className = "" }) => (
  <div className={`game-card mb-4 sm:mb-6 ${className}`}>
    {children}
  </div>
);

export const MobileGrid: React.FC<MobileOptimizedProps> = ({ children, className = "" }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${className}`}>
    {children}
  </div>
);

export const MobileButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({ children, onClick, disabled, variant = 'primary', className = "" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} w-full text-sm sm:text-base ${className}`}
  >
    {children}
  </button>
);

export const MobileColorPalette: React.FC<{
  colors: Array<{ color: string; name: string }>;
  onColorSelect: (index: number) => void;
  disabled?: boolean;
}> = ({ colors, onColorSelect, disabled }) => (
  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
    {colors.map((colorInfo, idx) => (
      <button
        key={idx}
        onClick={() => onColorSelect(idx)}
        disabled={disabled}
        className="color-button group relative w-12 h-12 sm:w-16 sm:h-16"
        style={{ backgroundColor: colorInfo.color }}
        title={colorInfo.name}
      >
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-200" />
        <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          {colorInfo.name}
        </div>
      </button>
    ))}
  </div>
);

export const StatusIndicator: React.FC<{
  status: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}> = ({ status, children }) => (
  <div className={`status-badge status-${status} text-xs sm:text-sm`}>
    {children}
  </div>
);

export const InfoCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color?: 'blue' | 'green' | 'purple' | 'red';
}> = ({ icon, title, value, subtitle, color = 'blue' }) => (
  <div className={`bg-${color}-50 rounded-lg p-3 sm:p-4 text-center`}>
    <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 text-${color}-600`}>
      {icon}
    </div>
    <div className={`text-lg sm:text-2xl font-bold text-${color}-600`}>
      {value}
    </div>
    <div className="text-xs sm:text-sm text-gray-600">{subtitle}</div>
  </div>
);
