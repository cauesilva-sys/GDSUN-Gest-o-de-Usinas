import React from 'react';

interface GdsunLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GdsunLogo: React.FC<GdsunLogoProps> = ({ className = 'h-10 w-auto', size = 'md' }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/gdsun-logo.svg" 
        alt="GDSUN Logo" 
        className="h-full w-auto object-contain drop-shadow-2xs"
      />
    </div>
  );
};
