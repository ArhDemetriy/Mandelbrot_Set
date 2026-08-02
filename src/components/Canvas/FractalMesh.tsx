import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { MandelbrotEngine } from '@/engine/MandelbrotEngine';
import fragF32Shader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import fragPaletteShader from '@/shaders/mandelbrot/mandelbrotPalette.frag?raw';
import { offsetAtom, paletteMapAtom, zoomAtom } from '@/store/fractalStore';

export function FractalMesh() {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.autoClear = false;
  }, [gl]);

  const { pWidth, pHeight } = useMemo(
    () => ({
      pWidth: Math.round(size.width * window.devicePixelRatio),
      pHeight: Math.round(size.height * window.devicePixelRatio),
    }),
    [size]
  );

  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const paletteMap = useAtomValue(paletteMapAtom);

  const { 0: mandelbrotEngine } = useState(
    () =>
      new MandelbrotEngine({
        gl,
        f32Shader: fragF32Shader,
        paletteShader: fragPaletteShader,

        initWidth: pWidth,
        initHeight: pHeight,
        texelScale: 1 / zoom,
        offset,

        paletteA: paletteMap.a,
        paletteB: paletteMap.b,
        paletteC: paletteMap.c,
        paletteD: paletteMap.d,
      })
  );

  useEffect(() => {
    if (!mandelbrotEngine) return;
    return () => mandelbrotEngine.dispose();
  }, [mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setSize(pWidth, pHeight);
    mandelbrotEngine.reset(gl);
  }, [pWidth, pHeight, zoom, gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setTexelScale(1 / zoom);
    mandelbrotEngine.reset(gl);
  }, [zoom, gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setOffset(offset);
    mandelbrotEngine.reset(gl);
  }, [offset, gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setPalette({
      paletteA: paletteMap.a,
      paletteB: paletteMap.b,
      paletteC: paletteMap.c,
      paletteD: paletteMap.d,
    });
  }, [paletteMap, mandelbrotEngine]);

  useFrame(() => {
    mandelbrotEngine.step(gl);
    mandelbrotEngine.renderScreen(gl);
  }, 1);

  return null;
}
