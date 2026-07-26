import { useAtom, useSetAtom } from 'jotai';
import { Compass, Eye, RotateCcw, Zap } from 'lucide-react';

import { Button } from '@/components/shadcn_ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn_ui/card';
import { Label } from '@/components/shadcn_ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn_ui/select';
import { Slider } from '@/components/shadcn_ui/slider';
import {
  type ColorPalette,
  maxIterationsAtom,
  moveSpeedAtom,
  offsetAtom,
  paletteAtom,
  resetViewAtom,
  zoomAtom,
} from '@/store/fractalStore';

export function ControlPanel() {
  const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);
  const [palette, setPalette] = useAtom(paletteAtom);
  const [moveSpeed, setMoveSpeed] = useAtom(moveSpeedAtom);
  const [zoom] = useAtom(zoomAtom);
  const [offset] = useAtom(offsetAtom);
  const resetView = useSetAtom(resetViewAtom);

  return (
    <div className="absolute top-4 right-4 z-10 w-80">
      <Card className="border-border bg-background/85 shadow-2xl backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base font-semibold">
            <span>Фрактал Мандельброта</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView} title="Сбросить вид">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {/* Настройка итераций */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                Детализация (Max Iter)
              </Label>
              <span className="font-mono text-xs font-medium">{maxIterations}</span>
            </div>
            <Slider
              value={[maxIterations]}
              min={100}
              max={4000}
              step={10}
              onValueChange={val => setMaxIterations(Array.isArray(val) ? val[0] : val)}
            />
          </div>

          {/* Цветовая палитра */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Цветовая палитра</Label>
            <Select value={palette} onValueChange={val => val && setPalette(val)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Выберите палитру" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'electric' satisfies ColorPalette}>Electric Blue</SelectItem>
                <SelectItem value={'fire' satisfies ColorPalette}>Fire & Magma</SelectItem>
                <SelectItem value={'classic' satisfies ColorPalette}>Classic Smooth</SelectItem>
                <SelectItem value={'psychedelic' satisfies ColorPalette}>Psychedelic</SelectItem>
                <SelectItem value={'monochrome' satisfies ColorPalette}>Monochrome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Скорость перемещения */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Скорость WASD
              </Label>
              <span className="font-mono text-xs font-medium">{moveSpeed.toFixed(1)}x</span>
            </div>
            <Slider
              value={moveSpeed}
              min={0.2}
              max={5.0}
              step={0.1}
              onValueChange={val => setMoveSpeed(Array.isArray(val) ? val[0] : val)}
            />
          </div>

          {/* Текущие координаты и Zoom (только для чтения) */}
          <div className="space-y-1.5 border-t border-border/60 pt-2 font-mono text-[11px] text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-sans text-xs font-medium text-foreground">
              <Compass className="h-3.5 w-3.5" /> Координаты
            </div>
            <div className="flex justify-between">
              <span>X:</span>
              <span className="text-foreground">{offset[0].toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Y:</span>
              <span className="text-foreground">{offset[1].toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Zoom:</span>
              <span className="text-foreground">{zoom.toExponential(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
