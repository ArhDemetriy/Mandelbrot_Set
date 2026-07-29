import { useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import fragShader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import vertShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import { maxIterationsAtom, offsetAtom, paletteMapAtom, zoomAtom } from '@/store/fractalStore';

const log2 = Math.log(2);
const TWO_PI = 2.0 * Math.PI;

export function FractalMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  // Получаем актуальные параметры из Jotai
  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const maxIterations = useAtomValue(maxIterationsAtom);
  const paletteMap = useAtomValue(paletteMapAtom);

  // Инициализируем uniforms один раз
  const { 0: initUniforms } = useState(() => {
    const texelScale = 1 / zoom;
    return {
      u_scale: { value: new THREE.Vector2(texelScale * (size.width / size.height), texelScale) },
      u_offset: { value: new THREE.Vector2(offset[0], offset[1]) },
      u_max_iterations: { value: maxIterations },
      u_palette_a: { value: paletteMap.a },
      u_palette_b: { value: paletteMap.b },
      u_palette_c: { value: paletteMap.c },
      u_palette_d: { value: paletteMap.d },

      u_const: {
        value: new THREE.Vector3(TWO_PI, 1 / (log2 * 2), 1 / log2),
      },
    } satisfies THREE.ShaderMaterialProperties['uniforms'];
  });

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;

    uniforms.u_palette_a.value = paletteMap.a;
    uniforms.u_palette_b.value = paletteMap.b;
    uniforms.u_palette_c.value = paletteMap.c;
    uniforms.u_palette_d.value = paletteMap.d;
  }, [paletteMap, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;

    uniforms.u_offset.value.set(offset[0], offset[1]);
  }, [offset, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;

    uniforms.u_max_iterations.value = maxIterations;
  }, [maxIterations, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;

    const texelScale = 1 / zoom;
    uniforms.u_scale.value.set(texelScale * (size.width / size.height), texelScale);
  }, [zoom, size, materialRef]);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        glslVersion={THREE.GLSL3}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={initUniforms}
      />
    </mesh>
  );
}
