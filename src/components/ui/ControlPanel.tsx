import { useAtom, useSetAtom } from 'jotai';
import { Check, ChevronUp, Compass, RotateCcw, SlidersHorizontal, Brush, Sun } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import { Label } from '@/components/shadcn_ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn_ui/select';
import {
  type ColorPalette,
  customPalette,
  offsetAtom,
  paletteAtom,
  resetViewAtom,
  zoomAtom,
} from '@/store/fractalStore';
import { Slider } from '../shadcn_ui/slider';

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

function Settings({ close }: { close: () => void }) {
  const [palette, setPalette] = useAtom(paletteAtom);
  const [zoom] = useAtom(zoomAtom);
  const [offset] = useAtom(offsetAtom);
  const resetView = useSetAtom(resetViewAtom);

  const [copied, setCopied] = useState(false);

  // Динамическая точность знаков после запятой при глубоком зуме
  const precision = Math.min(12, Math.max(6, Math.floor(Math.log10(zoom)) + 6));

  return (
    <Card className="w-80 animate-in border-border bg-background/85 shadow-2xl backdrop-blur-md transition-all duration-300 zoom-in-95 fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="flex items-center gap-2">Фрактал Мандельброта</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Сбросить вид">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close} title="Свернуть панель">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        {/* Цветовая палитра */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Цветовая палитра</Label>
          <Select value={palette} onValueChange={val => val && setPalette(val as ColorPalette)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Выберите палитру" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={'electric' satisfies ColorPalette}>Electric Blue</SelectItem>
              <SelectItem value={'fire' satisfies ColorPalette}>Fire & Magma</SelectItem>
              <SelectItem value={'classic' satisfies ColorPalette}>Classic Smooth</SelectItem>
              <SelectItem value={'psychedelic' satisfies ColorPalette}>Psychedelic</SelectItem>
              <SelectItem value={'monochrome' satisfies ColorPalette}>Monochrome</SelectItem>
              <SelectItem value={'custom' satisfies ColorPalette}>Custom palette</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Текущие координаты и Zoom */}
        <div className="space-y-1.5 border-t border-border/60 pt-2 font-mono text-[11px] text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  );
}

export function Palette({ close }: { close: () => void }) {
  const [palette, setPalette] = useAtom(customPalette);
  const resetView = useSetAtom(resetViewAtom);

  const handleVectorAChange = (index: 0 | 1 | 2, val: number) => {
    const nextA = palette.a.clone();
    if (index === 0) nextA.x = val;
    if (index === 1) nextA.y = val;
    if (index === 2) nextA.z = val;

    setPalette(prev => ({
      ...prev,
      a: nextA,
    }));
  };

  return (
    <Card className="w-80 animate-in border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl transition-all duration-300 zoom-in-95 fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="flex items-center gap-2">Настройка палитры</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Сбросить вид">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close} title="Свернуть панель">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="h-max max-h-[80vh] snap-y snap-mandatory scrollbar-thin scrollbar-thumb-muted-foreground/20 space-y-6 overflow-y-auto pr-2 text-sm">
        {/* Блок 1: Вектор A (Яркость / Offset) */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Яркость (Вектор A)</span>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Базовый яркостный сдвиг палитры для каждого цветового канала.
          </p>

          {/* Контейнер для 3 вертикальных слайдеров */}
          <div className="flex w-full items-center justify-between gap-3 pt-1">
            {/* Red Channel */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[11px] font-medium text-red-400">Red (A.x)</span>
              <span className="font-mono text-xs text-foreground">{palette.a.x.toFixed(2)}</span>
              <div className="flex items-center justify-center py-1">
                <Slider
                  orientation="vertical"
                  value={palette.a.x}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={val => handleVectorAChange(0, Array.isArray(val) ? val[0] : val)}
                />
              </div>
            </div>

            {/* Green Channel */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[11px] font-medium text-green-400">Green (A.y)</span>
              <span className="font-mono text-xs text-foreground">{palette.a.y.toFixed(2)}</span>
              <div className="flex items-center justify-center pt-1">
                <Slider
                  orientation="vertical"
                  value={palette.a.y}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={val => handleVectorAChange(1, Array.isArray(val) ? val[0] : val)}
                />
              </div>
            </div>

            {/* Blue Channel */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <span className="font-mono text-[11px] font-medium text-blue-400">Blue (A.z)</span>
              <span className="font-mono text-xs text-foreground">{palette.a.z.toFixed(2)}</span>
              <div className="flex items-center justify-center pt-1">
                <Slider
                  orientation="vertical"
                  value={palette.a.z}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={val => handleVectorAChange(2, Array.isArray(val) ? val[0] : val)}
                />
              </div>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
