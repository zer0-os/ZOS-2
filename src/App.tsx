import { Desktop } from './components/desktop/Desktop'
import { Window } from './components/desktop/Window'
// import { Button } from './components/ui/button'
// import { Plus } from 'lucide-react'
import { useAppManager } from './hooks/useAppManager'
import { getAppById } from './factory-apps/registry'

function App() {
  const {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    focusWindow,
    snapWindow,
  } = useAppManager();

  const handleOpenApp = (appId: string, props?: Record<string, any>) => {
    const app = getAppById(appId);
    if (app) {
      openApp(app, props);
    }
  };

  return (
    <Desktop onOpenApp={handleOpenApp}>

      {/* App Windows */}
      {windows.map((window) => (
        <Window
          key={window.id}
          window={window}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          onMaximize={() => maximizeWindow(window.id)}
          onPositionChange={(position) => updateWindowPosition(window.id, position)}
          onSnapToEdge={(side) => snapWindow(window.id, side)}
          onFocus={() => focusWindow(window.id)}
          className="animate-in fade-in duration-300"
        />
      ))}
    </Desktop>
  )
}

export default App
