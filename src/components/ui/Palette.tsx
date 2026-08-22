import { useAtom, useSetAtom } from 'jotai';
import { ChevronDown, ChevronUp, RotateCcw, Sparkles, Sun } from 'lucide-react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import { Slider } from '@/components/shadcn_ui/slider';
import { resetViewAtom } from '@/store/fractalStore';
import { paletteAtom, setPresetPalette } from '@/store/paletteStore';
import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn_ui/dropdown-menu';

function PaletteControl({ title, value, children }: { title: ReactNode; value: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="self-center font-mono text-[11px] font-medium">{title}</span>
      <span className="font-center self-center font-mono text-xs text-foreground">{value}</span>
      <div className="flex flex-col justify-center py-1">{children}</div>
    </div>
  );
}

export function Palette({ close }: { close: () => void }) {
  const [palette, setPalette] = useAtom(paletteAtom);
  const resetView = useSetAtom(resetViewAtom);

  const handleVectorAChange = (ort: 'x' | 'y' | 'z', val: number) => {
    const nextA = palette.a.clone();
    nextA[ort] = val;
    setPalette(prev => ({
      ...prev,
      a: nextA,
    }));
  };

  return (
    <Card className="w-80 animate-in border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl transition-all duration-300 zoom-in-95 fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <h2 className="flex items-center gap-2">Настройка палитры</h2>
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

      <CardContent className="h-max max-h-[80vh] snap-y snap-mandatory scrollbar-thin scrollbar-thumb-muted-foreground/20 space-y-6 overflow-y-auto pr-2 text-sm">
        <section className="3 h-max snap-start snap-always rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <h3>Быстрые пресеты</h3>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="mt-3 flex w-full justify-between rounded-sm bg-background/50 p-2 text-xs text-muted-foreground hover:text-foreground">
              <span>Применить готовую палитру...</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPresetPalette('electric')}>Electric Blue</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPresetPalette('fire')}>Fire & Magma</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPresetPalette('classic')}>Classic Smooth</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPresetPalette('psychedelic')}>Psychedelic</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPresetPalette('monochrome')}>Monochrome</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        {/* Блок 1: Вектор A (Яркость / Offset) */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <h3>Яркость (Вектор A)</h3>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Базовый яркостный сдвиг палитры для каждого цветового канала.
          </p>

          {/* Контейнер для 3 вертикальных слайдеров */}
          <div className="flex w-full items-center justify-between gap-5 pt-1">
            {/* Red Channel */}
            <PaletteControl title={<h4 className="text-red-400">Red (A.x)</h4>} value={palette.a.x.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.x]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorAChange('x', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            {/* Green Channel */}
            <PaletteControl title={<h4 className="text-green-400">Green (A.y)</h4>} value={palette.a.y.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.y]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorAChange('y', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            {/* Blue Channel */}
            <PaletteControl title={<h4 className="text-blue-400">Blue (A.z)</h4>} value={palette.a.z.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.z]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorAChange('z', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
