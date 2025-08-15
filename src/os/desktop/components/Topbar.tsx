import React from 'react';
import { Card } from '@/ui/card';
import { GlobalSearch } from './GlobalSearch';
import zeroLogo from '../assets/zero-logo.png';

interface TopbarProps {
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ className = '' }) => {
  return (
    <Card 
      className={`fixed top-0 left-0 right-0 h-10 flex items-center px-4 rounded-none z-50 bg-transparent backdrop-blur-0 border-0 shadow-none ${className}`}
    >
      <div className="flex items-center mr-4">
        <img 
          src={zeroLogo} 
          alt="ZERO Logo" 
          className="h-8 w-auto"
        />
      </div>
      <div className="flex-1 max-w-2xl mx-auto">
        <GlobalSearch />
      </div>
    </Card>
  );
};