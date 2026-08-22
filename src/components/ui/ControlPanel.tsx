import { SlidersHorizontal, Brush } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/shadcn_ui/button';
import { Palette } from './Palette';
import { Settings } from './Settings';

export function ControlPanel() {
  const [currentMenu, setIsCollapsed] = useState<'settings' | 'palette' | null>(null);

  return (
    <div className="absolute top-4 right-4 z-10">
      {!currentMenu && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 border border-border bg-background/85 shadow-2xl backdrop-blur-md transition-transform active:scale-95"
            onClick={() => setIsCollapsed('palette')}
            title="Открыть настройку цветов"
          >
            <Brush className="h-5 w-5 text-foreground" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 border border-border bg-background/85 shadow-2xl backdrop-blur-md transition-transform active:scale-95"
            onClick={() => setIsCollapsed('settings')}
            title="Открыть панель управления"
          >
            <SlidersHorizontal className="h-5 w-5 text-foreground" />
          </Button>
        </div>
      )}
      {currentMenu === 'settings' && <Settings close={() => setIsCollapsed(null)} />}
      {currentMenu === 'palette' && <Palette close={() => setIsCollapsed(null)} />}
    </div>
  );
}
