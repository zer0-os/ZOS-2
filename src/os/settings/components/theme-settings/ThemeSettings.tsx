import React from 'react';
import { Card } from '@/ui/card';
import { Button } from '@/ui/button';
import { Separator } from '@/ui/separator';
import { ArrowLeft, Palette } from 'lucide-react';
import { ThemeAccentPicker } from './ThemeAccentPicker';
import { ThemeBackgroundPicker } from './ThemeBackgroundPicker';
import { ThemeToggle } from './ThemeToggle';
import { useThemeContext } from '@/os/theme/ThemeProvider';
import { THEME_VARIANTS, THEMES } from '@/os/theme/theme-variants';

interface ThemeSettingsProps {
  onBack: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ onBack }) => {
  const { theme, themeVariant } = useThemeContext();
  const currentTheme = THEME_VARIANTS[themeVariant];
  
  return (
    <Card className="border-0 shadow-none flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">Theme Settings</h3>
      </div>
      
      <div className="p-6 flex-1 space-y-6">
        {/* Theme Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Theme Mode</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm">{THEMES[theme].name}</p>
              <p className="text-xs text-muted-foreground">
                {THEMES[theme].description}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <Separator />

        {/* Theme Colors Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Theme Colors</span>
          </div>

          {/* Current Theme Display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-border/50">
            <div 
              className="w-6 h-6 rounded-full border border-card-foreground/20"
              style={{ backgroundColor: `hsl(${currentTheme.color})` }}
            />
            <div>
              <p className="text-sm">{currentTheme.name}</p>
              <p className="text-xs text-muted-foreground">{currentTheme.description}</p>
            </div>
          </div>

          {/* Color Picker */}
          <ThemeAccentPicker />
        </div>

        <Separator />

        {/* Background Picker */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Background</span>
          </div>
          <ThemeBackgroundPicker />
        </div>
      </div>
    </Card>
  );
};
