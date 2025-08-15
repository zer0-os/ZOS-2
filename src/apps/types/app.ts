export interface AppWindow {
  id: string;
  appId: string;
  title: string;
  component: React.ComponentType<any>;
  position?: { x: number; y: number };
  restorePosition?: { x: number; y: number }; // Position to restore to when un-maximizing
  isMinimized?: boolean;
  isMaximized?: boolean;
  isSnapped?: 'left' | 'right' | null;
  zIndex?: number;
  props?: Record<string, any>;
}

export interface FactoryApp {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  description?: string;
  defaultWindowTitle?: string;
}
