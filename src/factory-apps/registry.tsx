import { Home, MessageCircle } from 'lucide-react';
import type { FactoryApp } from '@/types/app';
import { FeedApp } from './feed/FeedApp';
import { ChatApp } from './chat/ChatApp';

export const factoryApps: FactoryApp[] = [
  {
    id: 'chat',
    name: 'Chat',
    icon: MessageCircle,
    component: ChatApp,
    description: 'Chat and messaging',
    defaultWindowTitle: 'Chat',
  },
  {
    id: 'feed',
    name: 'Feed',
    icon: Home,
    component: FeedApp,
    description: 'Your content feed and updates',
    defaultWindowTitle: 'Feed',
  },
  // Add more apps here as they are created
];

export const getAppById = (id: string): FactoryApp | undefined => {
  return factoryApps.find(app => app.id === id);
};
