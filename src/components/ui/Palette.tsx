import { useAtom, useSetAtom } from 'jotai';
import { ChevronUp, RotateCcw, Sun } from 'lucide-react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import { Slider } from '@/components/shadcn_ui/slider';
import { resetViewAtom } from '@/store/fractalStore';
import { paletteAtom } from '@/store/paletteStore';

export function Palette({ close }: { close: () => void }) {
  const [palette, setPalette] = useAtom(paletteAtom);
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
