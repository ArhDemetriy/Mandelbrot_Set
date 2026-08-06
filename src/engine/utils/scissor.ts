export interface ScissorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
type ScissorRects = [] | [ScissorBox] | [ScissorBox, ScissorBox];

export function getShiftDirtyRects({
  dx,
  dy,
  width,
  height,
}: {
  dx: number;
  dy: number;
  width: number;
  height: number;
}): ScissorRects {
  const absX = Math.min(Math.abs(Math.round(dx)), width);
  const absY = Math.min(Math.abs(Math.round(dy)), height);

  if (absX === 0 && absY === 0) return [];

  const rects: ScissorBox[] = [];
  // 1. Горизонтальная полоса (на всю ширину W)
  if (absY > 0) {
    rects.push({
      x: 0,
      y: dy < 0 ? 0 : height - absY, // dy > 0 -> обнажился низ; dy < 0 -> верх
      width,
      height: absY,
    });
  }

  // 2. Вертикальная полоса (урезанная по высоте, чтобы не перекрывать горизонтальную)
  if (absX > 0) {
    const h = height - absY;
    if (h > 0) {
      rects.push({
        x: dx < 0 ? 0 : width - absX, // dx > 0 -> обнажился левый край; dx < 0 -> правый
        y: dy < 0 ? absY : 0,
        width: absX,
        height: h,
      });
    }
  }

  return rects as ScissorRects;
}
