import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search
} from 'lucide-react';

interface AddressBarProps {
  className?: string;
}

export const AddressBar: React.FC<AddressBarProps> = ({
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [canGoBack] = useState(false);
  const [canGoForward] = useState(false);

  const handleBack = () => {
    console.log('Navigate back');
    // TODO: Implement navigation history
  };

  const handleForward = () => {
    console.log('Navigate forward');
    // TODO: Implement navigation history
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
    // TODO: Implement search functionality
  };

  return (
    <div className={`flex items-center space-x-2 max-w-2xl w-full ${className}`}>
      {/* Back/Forward buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        disabled={!canGoBack}
        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/30 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForward}
        disabled={!canGoForward}
        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/30 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Address/Search input */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3" style={{ color: '#9199A1' }} />
          <Input
            placeholder="Search or enter address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-8 h-6 text-slate-200 text-center border border-transparent focus:border-white focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 placeholder:text-[#9199A1]"
            style={{
              borderRadius: '16px',
              fontSize: '11px',
              backgroundColor: '#171717',
              boxShadow: 'none',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.outline = 'none';
              e.target.style.border = '1px solid white';
              // Select all text when focused (like browser address bars)
              e.target.select();
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid transparent';
            }}
          />
        </div>
      </form>
    </div>
  );
};
