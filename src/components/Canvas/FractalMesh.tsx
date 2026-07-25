import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import fragShader from '@/shaders/mandelbrot.frag?raw';
import vertShader from '@/shaders/mandelbrot.vert?raw';
import { type ColorPalette, maxIterationsAtom, offsetAtom, paletteAtom, zoomAtom } from '@/store/fractalStore';

const PALETTE_MAP: Record<ColorPalette, number> = {
  classic: 0,
  fire: 1,
  electric: 2,
  psychedelic: 3,
  monochrome: 4,
};

export function FractalMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  // Получаем актуальные параметры из Jotai
  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const maxIterations = useAtomValue(maxIterationsAtom);
  const palette = useAtomValue(paletteAtom);

  // Инициализируем uniforms один раз
  const initUniforms = useMemo(
    () =>
      ({
        u_scale: { value: new THREE.Vector2(size.width / size.height / zoom, 1 / zoom) },
        u_offset: { value: new THREE.Vector2(offset[0], offset[1]) },
        u_max_iterations: { value: maxIterations },
        u_palette: { value: PALETTE_MAP[palette] },
      }) satisfies THREE.ShaderMaterialProperties['uniforms'],
    []
  );

  // Обновляем uniforms перед каждым кадром
  useFrame(() => {
    if (!materialRef.current) return;

    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_offset.value.set(offset[0], offset[1]);
    uniforms.u_max_iterations.value = maxIterations;
    uniforms.u_palette.value = PALETTE_MAP[palette];
    const texelScale = 1 / zoom;
    uniforms.u_scale.value.set(texelScale * (size.width / size.height), texelScale);
  });

  return (
    <mesh>
      {/* Плоскость 2x2 перекрывает весь viewport ортографической или перспективной камеры */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={initUniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
