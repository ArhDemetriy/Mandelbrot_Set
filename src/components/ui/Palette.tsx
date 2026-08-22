import { useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { AudioLines, ChevronDown, ChevronUp, Contrast, RotateCcw, Sparkles, Sun, Waves } from 'lucide-react';
import { useCallback, type ReactNode } from 'react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn_ui/dropdown-menu';
import { Slider } from '@/components/shadcn_ui/slider';
import { resetViewAtom } from '@/store/fractalStore';
import { paletteAtom, setPresetPalette } from '@/store/paletteStore';

const TWO_PI = 2.0 * Math.PI;
export function Palette({ close }: { close: () => void }) {
  const resetView = useSetAtom(resetViewAtom);
  const palette = useAtomValue(paletteAtom);

  const handleVectorChange = useAtomCallback(
    useCallback((get, set, vector: 'a' | 'b' | 'c' | 'd', ort: 'x' | 'y' | 'z', value: number) => {
      const prevPalette = get(paletteAtom);

      const nextVector = prevPalette[vector].clone();
      nextVector[ort] = value;

      set(paletteAtom, {
        ...prevPalette,
        [vector]: nextVector,
      });
    }, [])
  );

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
        {/* Быстрые пресеты */}
        <section className="h-max snap-start snap-always rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
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

          <div className="flex w-full items-center justify-between gap-5 pt-1">
            <PaletteControl title={<h4 className="text-red-400">Red (A.x)</h4>} value={palette.a.x.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.x]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('a', 'x', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-green-400">Green (A.y)</h4>} value={palette.a.y.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.y]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('a', 'y', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-blue-400">Blue (A.z)</h4>} value={palette.a.z.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.a.z]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('a', 'z', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>
          </div>
        </section>

        {/* Блок 2: Вектор B (Контраст / Амплитуда) */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Contrast className="h-3.5 w-3.5 text-indigo-400" />
            <h3>Контраст (Вектор B)</h3>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Амплитуда размаха цвета относительно базовой яркости.
          </p>

          <div className="flex w-full items-center justify-between gap-5 pt-1">
            <PaletteControl title={<h4 className="text-red-400">Red (B.x)</h4>} value={palette.b.x.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.b.x]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('b', 'x', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-green-400">Green (B.y)</h4>} value={palette.b.y.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.b.y]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('b', 'y', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-blue-400">Blue (B.z)</h4>} value={palette.b.z.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.b.z]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={val => handleVectorChange('b', 'z', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>
          </div>
        </section>

        {/* Блок 3: Вектор C (Частота) */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            <h3>Частота (Вектор C)</h3>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Скорость смены цвета (количество циклов косинуса).
          </p>

          <div className="flex w-full items-center justify-between gap-5 pt-1">
            <PaletteControl title={<h4 className="text-red-400">Red (C.x)</h4>} value={palette.c.x.toFixed(3)}>
              <Slider
                orientation="vertical"
                value={[palette.c.x]}
                min={0}
                max={0.15}
                step={0.001}
                onValueChange={val => handleVectorChange('c', 'x', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-green-400">Green (C.y)</h4>} value={palette.c.y.toFixed(3)}>
              <Slider
                orientation="vertical"
                value={[palette.c.y]}
                min={0}
                max={0.15}
                step={0.001}
                onValueChange={val => handleVectorChange('c', 'y', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-blue-400">Blue (C.z)</h4>} value={palette.c.z.toFixed(3)}>
              <Slider
                orientation="vertical"
                value={[palette.c.z]}
                min={0}
                max={0.15}
                step={0.001}
                onValueChange={val => handleVectorChange('c', 'z', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>
          </div>
        </section>

        {/* Блок 4: Вектор D (Фаза) */}
        <section className="h-max snap-start snap-always space-y-4 rounded-lg border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <AudioLines className="h-3.5 w-3.5 text-emerald-400" />
            <h3>Фазовый сдвиг (Вектор D)</h3>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Смещение волны цвета для разделения пиков R, G и B.
          </p>

          <div className="flex w-full items-center justify-between gap-5 pt-1">
            <PaletteControl title={<h4 className="text-red-400">Red (D.x)</h4>} value={palette.d.x.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.d.x]}
                min={0}
                max={TWO_PI}
                step={0.01}
                onValueChange={val => handleVectorChange('d', 'x', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-green-400">Green (D.y)</h4>} value={palette.d.y.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.d.y]}
                min={0}
                max={TWO_PI}
                step={0.01}
                onValueChange={val => handleVectorChange('d', 'y', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>

            <PaletteControl title={<h4 className="text-blue-400">Blue (D.z)</h4>} value={palette.d.z.toFixed(2)}>
              <Slider
                orientation="vertical"
                value={[palette.d.z]}
                min={0}
                max={TWO_PI}
                step={0.01}
                onValueChange={val => handleVectorChange('d', 'z', Array.isArray(val) ? val[0] : val)}
              />
            </PaletteControl>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function PaletteControl({ title, value, children }: { title: ReactNode; value: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="self-center font-mono text-[11px] font-medium">{title}</span>
      <span className="font-center self-center font-mono text-xs text-foreground">{value}</span>
      <div className="flex flex-col justify-center py-1">{children}</div>
    </div>
  );
}
