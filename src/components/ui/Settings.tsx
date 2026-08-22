import { useAtom, useSetAtom } from 'jotai';
import { Check, ChevronUp, Compass, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import { Label } from '@/components/shadcn_ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn_ui/select';
import { offsetAtom, resetViewAtom, zoomAtom } from '@/store/fractalStore';
import { setPresetPalette, type ColorPalette } from '@/store/paletteStore';

export function Settings({ close }: { close: () => void }) {
  const [zoom] = useAtom(zoomAtom);
  const [offset] = useAtom(offsetAtom);
  const resetView = useSetAtom(resetViewAtom);

  const [copied, setCopied] = useState(false);

  // Динамическая точность знаков после запятой при глубоком зуме
  const precision = Math.min(12, Math.max(6, Math.floor(Math.log10(zoom)) + 6));

  return (
    <Card className="w-80 animate-in border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl transition-all duration-300 zoom-in-95 fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <h2 className="flex items-center gap-2">Фрактал Мандельброта</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Сбросить позицию">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close} title="Свернуть панель">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        {/* Текущие координаты и Zoom */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="mb-1 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="-ml-2 h-7 gap-1.5 px-2 font-sans text-xs font-medium text-foreground hover:bg-accent/50"
              title="Скопировать ссылку на текущие координаты"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">Ссылка скопирована!</span>
                </>
              ) : (
                <>
                  <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Координаты</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex justify-between">
            <span>X:</span>
            <span className="text-foreground">{offset[0].toFixed(precision)}</span>
          </div>
          <div className="flex justify-between">
            <span>Y:</span>
            <span className="text-foreground">{offset[1].toFixed(precision)}</span>
          </div>
          <div className="flex justify-between">
            <span>Zoom:</span>
            <span className="text-foreground">{zoom.toExponential(2)}</span>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
