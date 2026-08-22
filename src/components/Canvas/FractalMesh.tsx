import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { MandelbrotEngine } from '@/engine/MandelbrotEngine';
import { offsetAtom, resetEventAtom, zoomAtom } from '@/store/fractalStore';
import { paletteAtom } from '@/store/paletteStore';

export function FractalMesh() {
  const { gl, size, invalidate } = useThree();

  const { pWidth, pHeight } = useMemo(
    () => ({
      pWidth: Math.round(size.width * window.devicePixelRatio),
      pHeight: Math.round(size.height * window.devicePixelRatio),
    }),
    [size]
  );

  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const palette = useAtomValue(paletteAtom);
  const resetEvent = useAtomValue(resetEventAtom);

  const { 0: mandelbrotEngine } = useState(
    () =>
      new MandelbrotEngine({
        gl,
        invalidate,

        width: pWidth,
        height: pHeight,
        zoom,
        offset,

        paletteA: palette.a,
        paletteB: palette.b,
        paletteC: palette.c,
        paletteD: palette.d,
      })
  );

  useEffect(() => () => mandelbrotEngine?.dispose(), [mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.forceReset();
  }, [resetEvent, mandelbrotEngine]);

  useEffect(() => {
    gl.autoClear = false;
    gl.autoClearColor = false;
    gl.autoClearDepth = false;
    gl.autoClearStencil = false;
    mandelbrotEngine.setGl(gl);
  }, [gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setInvalidate(invalidate);
  }, [invalidate, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setSize(pWidth, pHeight);
  }, [pWidth, pHeight, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setZoom(zoom);
  }, [zoom, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setOffset(offset);
  }, [offset, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setPalette({
      paletteA: palette.a,
      paletteB: palette.b,
      paletteC: palette.c,
      paletteD: palette.d,
    });
  }, [palette, mandelbrotEngine]);

  useFrame(mandelbrotEngine.thisFreeStep, 1);

  return null;
}
