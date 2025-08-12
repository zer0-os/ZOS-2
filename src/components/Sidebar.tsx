import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, MessageCircle, Wallet } from 'lucide-react';
import n3oAvatar from '@/assets/n3o-avatar.jpg';


interface SidebarProps {
  className?: string;
  onOpenApp?: (appId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onOpenApp
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAppClick = (appId: string) => {
    onOpenApp?.(appId);
  };

  return (
    <Card 
      className={`fixed left-0 top-12 h-[calc(100vh-3rem)] flex flex-col py-4 bg-transparent border-0 shadow-none rounded-none transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      } ${className}`}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Navigation Icons - Vertically Centered */}
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="relative group h-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 h-10 w-10 text-slate-300 hover:text-white hover:bg-transparent transition-colors duration-200 [&_svg]:!size-6"
            onClick={() => handleAppClick('chat')}
            onMouseEnter={() => setIsExpanded(true)}
          >
            <MessageCircle className="h-6 w-6" strokeWidth={1} />
          </Button>
          <div
            className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
              Chat
            </span>
          </div>
        </div>

        <div className="relative group h-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 h-10 w-10 text-slate-300 hover:text-white hover:bg-transparent transition-colors duration-200 [&_svg]:!size-6"
            onClick={() => handleAppClick('feed')}
            onMouseEnter={() => setIsExpanded(true)}
          >
            <Home className="h-6 w-6" strokeWidth={1} />
          </Button>
          <div
            className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
                         <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
               Feed
             </span>
          </div>
        </div>

        <div className="relative group h-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-3 h-10 w-10 text-slate-300 hover:text-white hover:bg-transparent transition-colors duration-200 [&_svg]:!size-6"
            onClick={() => handleAppClick('wallet')}
            onMouseEnter={() => setIsExpanded(true)}
          >
            <Wallet className="h-6 w-6" strokeWidth={1} />
          </Button>
          <div
            className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
              Wallet
            </span>
          </div>
        </div>
      </div>



      {/* User Profile at the bottom */}
      <div className="mt-auto relative group h-10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 h-10 w-10 hover:bg-transparent transition-colors duration-200"
          onMouseEnter={() => setIsExpanded(true)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={n3oAvatar} alt="n3o" />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold">
              🚀
            </AvatarFallback>
          </Avatar>
          {/* Online status indicator */}
          <div 
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ 
              backgroundColor: '#01F4CB',
              borderColor: '#121212'
            }}
          />
        </Button>
        <div
          className={`absolute left-16 top-0 h-10 flex items-center pointer-events-none transition-all duration-300 ${
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
        >
          <div className="flex flex-col items-start pl-2">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
              n3o
            </span>
            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200 whitespace-nowrap">
              0://n3o</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
