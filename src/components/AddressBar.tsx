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
        className="p-0 text-muted-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForward}
        disabled={!canGoForward}
        className="p-0 text-muted-foreground disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Address/Search input */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search or enter address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-8 text-foreground text-center bg-muted/50 border-transparent focus:border-ring text-xs placeholder:text-muted-foreground transition-colors"
            onFocus={(e) => {
              // Select all text when focused (like browser address bars)
              e.target.select();
            }}
          />
        </div>
      </form>
    </div>
  );
};
