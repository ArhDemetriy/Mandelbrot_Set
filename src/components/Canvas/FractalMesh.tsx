import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { MandelbrotEngine } from '@/engine/MandelbrotEngine';
import fragF32Shader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import fragPaletteShader from '@/shaders/mandelbrot/mandelbrotPalette.frag?raw';
import { offsetAtom, paletteMapAtom, zoomAtom } from '@/store/fractalStore';

export function FractalMesh() {
  const { gl, size } = useThree();

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

        width: pWidth,
        height: pHeight,
        zoom,
        offset,

        paletteA: paletteMap.a,
        paletteB: paletteMap.b,
        paletteC: paletteMap.c,
        paletteD: paletteMap.d,
      })
  );

  useEffect(() => {
    gl.autoClear = false;
    mandelbrotEngine.setGl(gl);
  }, [gl, mandelbrotEngine]);

  useEffect(() => () => mandelbrotEngine?.dispose(), [mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setSize(pWidth, pHeight);
  }, [pWidth, pHeight, zoom, gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setZoom(zoom);
  }, [zoom, gl, mandelbrotEngine]);

  useEffect(() => {
    mandelbrotEngine.setOffset(offset);
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
    mandelbrotEngine.step();
    mandelbrotEngine.renderScreen();
  }, 1);

  return null;
}
