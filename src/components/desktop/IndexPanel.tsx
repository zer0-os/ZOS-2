import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, ChevronLeft } from 'lucide-react';
import { SuperButton } from '@/components/ui/super-button';

interface IndexPanelProps {
  className?: string;
  selectedApp: string | null;
  onItemClick?: (appId: string, itemName: string) => void;
}

interface AppContent {
  [key: string]: {
    title: string;
    tabs?: {
      id: string;
      label: string;
      sections: {
        id: string;
        title: string;
        items: string[];
      }[];
    }[];
    sections?: {
      id: string;
      title: string;
      items: string[];
    }[];
  };
}

const appContent: AppContent = {
  chat: {
    title: 'Chat',
    tabs: [
      {
        id: 'frens',
        label: 'Frens',
        sections: [
          {
            id: 'online',
            title: 'Online',
            items: ['Alice Johnson', 'Bob Smith', 'Carol Davis']
          },
          {
            id: 'recent',
            title: 'Recent Chats',
            items: ['David Wilson', 'Emma Thompson', 'Frank Miller']
          }
        ]
      },
      {
        id: 'groups',
        label: 'Groups',
        sections: [
          {
            id: 'active',
            title: 'Active Groups',
            items: ['General Discussion', 'Tech Talk', 'Project Updates']
          },
          {
            id: 'channels',
            title: 'Channels',
            items: ['#announcements', '#development', '#design', '#marketing']
          }
        ]
      },
      {
        id: 'all',
        label: 'All',
        sections: [
          {
            id: 'all-conversations',
            title: 'All Conversations',
            items: ['General Discussion', 'Alice Johnson', '#announcements', 'Tech Talk', 'Bob Smith', '#development']
          },
          {
            id: 'archived',
            title: 'Archived',
            items: ['Old Project Chat', 'Sarah Wilson', '#old-channel']
          }
        ]
      }
    ]
  },
  feed: {
    title: 'Feed',
    tabs: [
      {
        id: 'discover',
        label: 'Discover',
        sections: [
          {
            id: 'trending',
            title: 'Trending',
            items: ['Latest Updates', 'Popular Posts', 'Hot Topics', 'Viral Content']
          },
          {
            id: 'categories',
            title: 'Categories',
            items: ['Technology', 'Design', 'Business', 'Entertainment']
          }
        ]
      },
      {
        id: 'following',
        label: 'Following',
        sections: [
          {
            id: 'subscriptions',
            title: 'Subscriptions',
            items: ['Tech Influencers', 'Design Studios', 'News Outlets']
          },
          {
            id: 'friends',
            title: 'Friends',
            items: ['Alice Updates', 'Bob Posts', 'Carol Shares']
          }
        ]
      },
      {
        id: 'saved',
        label: 'Saved',
        sections: [
          {
            id: 'bookmarks',
            title: 'Bookmarks',
            items: ['Saved Articles', 'Important Posts', 'Read Later']
          },
          {
            id: 'history',
            title: 'History',
            items: ['Recently Viewed', 'Past Interactions', 'Old Favorites']
          }
        ]
      }
    ]
  },
  wallet: {
    title: 'Wallet',
    tabs: [
      {
        id: 'assets',
        label: 'Assets',
        sections: [
          {
            id: 'accounts',
            title: 'Accounts',
            items: ['Main Wallet', 'Savings', 'Trading', 'DeFi Portfolio']
          },
          {
            id: 'tokens',
            title: 'Tokens',
            items: ['ETH', 'BTC', 'USDC', 'ZERO']
          }
        ]
      },
      {
        id: 'activity',
        label: 'Activity',
        sections: [
          {
            id: 'recent',
            title: 'Recent',
            items: ['Latest Transactions', 'Pending Transfers', 'Failed Payments']
          },
          {
            id: 'history',
            title: 'History',
            items: ['All Transactions', 'Monthly Reports', 'Annual Summary']
          }
        ]
      },
      {
        id: 'defi',
        label: 'DeFi',
        sections: [
          {
            id: 'staking',
            title: 'Staking',
            items: ['Active Stakes', 'Rewards', 'Unstaking Queue']
          },
          {
            id: 'liquidity',
            title: 'Liquidity',
            items: ['LP Positions', 'Yield Farming', 'Pool Rewards']
          }
        ]
      }
    ]
  }
};

export const IndexPanel: React.FC<IndexPanelProps> = ({
  className = '',
  selectedApp,
  onItemClick
}) => {
  const content = selectedApp ? appContent[selectedApp] : null;
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // When selectedApp changes, set default tab and open first section
  useEffect(() => {
    if (content) {
      if (content.tabs && content.tabs.length > 0) {
        // App has tabs - set first tab as active and open its first section
        setActiveTab(content.tabs[0].id);
        setOpenSections([content.tabs[0].sections[0].id]);
      } else if (content.sections && content.sections.length > 0) {
        // App has direct sections - open first section
        setActiveTab('');
        setOpenSections([content.sections[0].id]);
      }
    } else {
      setActiveTab('');
      setOpenSections([]);
    }
  }, [selectedApp, content]);

  // When tab changes, open the first section of that tab
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = content?.tabs?.find(t => t.id === tabId);
    if (tab && tab.sections.length > 0) {
      setOpenSections([tab.sections[0].id]);
    }
  };

  // Filter items based on search query
  const filterItems = (items: string[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Filter sections based on search query
  const filterSections = (sections: { id: string; title: string; items: string[] }[]) => {
    if (!searchQuery.trim()) return sections;
    return sections.map(section => ({
      ...section,
      items: filterItems(section.items)
    })).filter(section => section.items.length > 0);
  };

  return (
    <div className="fixed left-16 top-10 h-[calc(100vh-2.5rem)] w-64 flex flex-col">
      <Card 
        className={`flex flex-col bg-transparent border-0 shadow-none rounded-none transition-transform duration-300 ease-in-out w-64 overflow-hidden ${
          isCollapsed ? 'transform -translate-x-full' : 'transform translate-x-0'
        } ${className}`}
        style={{ height: '100%' }}
      >
        <div className={`transition-opacity duration-300 ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`} style={{ 
          transitionDelay: isCollapsed ? '0ms' : '0ms' 
        }}>
          {/* Search Input */}
          <div className="px-4 pt-12 pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 bg-muted/50 text-foreground text-sm placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
        {content ? (
          content.tabs ? (
            // Render tabbed content
            <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
              <TabsList className="flex w-auto mx-4 mt-4 mb-2 h-8 gap-1 justify-start">
                {content.tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="text-xs font-normal hover:text-foreground px-2.5 py-1 h-6 min-w-0"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {content.tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="flex-1 px-4 pt-0">
                  <Accordion 
                    type="multiple" 
                    value={openSections}
                    onValueChange={setOpenSections}
                    className="w-full space-y-2"
                  >
                    {filterSections(tab.sections).map((section) => (
                      <AccordionItem 
                        key={section.id} 
                        value={section.id}
                      >
                        <AccordionTrigger className="px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                          <div className="space-y-1">
                            {section.items.map((item, index) => (
                              <div 
                                key={index}
                                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded cursor-pointer transition-colors"
                                onClick={() => onItemClick?.(selectedApp!, item)}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Render direct sections (no tabs)
            <div className="px-4 pt-0">
              <Accordion 
                type="multiple" 
                value={openSections}
                onValueChange={setOpenSections}
                className="w-full space-y-2"
              >
                {filterSections(content.sections || []).map((section) => (
                  <AccordionItem 
                    key={section.id} 
                    value={section.id}
                    className="rounded-lg bg-card/20"
                  >
                    <AccordionTrigger className="px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:no-underline">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3">
                      <div className="space-y-1">
                        {section.items.map((item, index) => (
                          <div 
                            key={index}
                                                            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 rounded cursor-pointer transition-colors"
                            onClick={() => onItemClick?.(selectedApp!, item)}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              Click an app in the sidebar to view its contents
            </p>
          </div>
        )}
          </div>
        </div>
      </Card>
      
      {/* Invite a Friend Super Button - positioned at bottom to align with sidebar avatar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 transition-opacity duration-300 ease-out ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
        style={{ 
          transitionDelay: isCollapsed ? '0ms' : '0ms' 
        }}
      >
        <SuperButton 
          variant="default" 
          size="custom"
          className="w-full h-9"
          onClick={() => {
            // TODO: Implement invite friend functionality
            console.log('Invite a friend clicked');
          }}
        >
          Invite a Friend
        </SuperButton>
      </div>
      
      {/* Collapse Button - inside the sliding panel */}
      {!isCollapsed && (
        <div className="absolute bottom-16 right-4">
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-6 h-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105"
            aria-label="Collapse panel"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground transition-transform duration-300" />
          </button>
        </div>
      )}
      
      {/* Expand Button - positioned outside the sliding panel */}
      {isCollapsed && (
        <div className="absolute bottom-16 left-0 z-10">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-6 h-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md"
            aria-label="Expand panel"
          >
            <ChevronLeft className="h-3 w-3 text-muted-foreground rotate-180 transition-transform duration-300" />
          </button>
        </div>
      )}
    </div>
  );
};
