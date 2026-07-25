import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import fragShader from '@/shaders/mandelbrot.frag?raw';
import vertShader from '@/shaders/mandelbrot.vert?raw';
import { type ColorPalette, maxIterationsAtom, offsetAtom, paletteAtom, zoomAtom } from '@/store/fractalStore';

const log2 = Math.log(2);
const TWO_PI = 2.0 * Math.PI;

const PALETTE_MAP_VECTORS: Record<
  ColorPalette,
  { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; d: THREE.Vector3 }
> = {
  classic: {
    a: new THREE.Vector3(0.5, 0.5, 0.5),
    b: new THREE.Vector3(0.5, 0.5, 0.5),
    c: new THREE.Vector3(1.0, 1.0, 1.0),
    d: new THREE.Vector3(0.0, 0.33 * TWO_PI, 0.67 * TWO_PI),
  },
  fire: {
    a: new THREE.Vector3(0.5, 0.5, 0.5),
    b: new THREE.Vector3(0.5, 0.5, 0.5),
    c: new THREE.Vector3(2.0, 1.0, 0.0),
    d: new THREE.Vector3(0.5 * TWO_PI, 0.2 * TWO_PI, 0.25 * TWO_PI),
  },
  electric: {
    a: new THREE.Vector3(0.8, 0.5, 0.4),
    b: new THREE.Vector3(0.2, 0.4, 0.2),
    c: new THREE.Vector3(2.0, 1.0, 1.0),
    d: new THREE.Vector3(0.0, 0.25 * TWO_PI, 0.25 * TWO_PI),
  },
  psychedelic: {
    a: new THREE.Vector3(0.5, 0.5, 0.5),
    b: new THREE.Vector3(0.5, 0.5, 0.5),
    c: new THREE.Vector3(2.0, 2.0, 1.0),
    d: new THREE.Vector3(0.0, 0.1 * TWO_PI, 0.2 * TWO_PI),
  },
  monochrome: {
    a: new THREE.Vector3(0.5, 0.5, 0.5),
    b: new THREE.Vector3(0.5, 0.5, 0.5),
    c: new THREE.Vector3(1.0, 1.0, 1.0),
    d: new THREE.Vector3(0.0, 0.0, 0.0),
  },
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
        u_palette_a: { value: PALETTE_MAP_VECTORS[palette].a },
        u_palette_b: { value: PALETTE_MAP_VECTORS[palette].b },
        u_palette_c: { value: PALETTE_MAP_VECTORS[palette].c },
        u_palette_d: { value: PALETTE_MAP_VECTORS[palette].d },

        u_const: {
          value: new THREE.Vector3(TWO_PI, 1 / (log2 * 2), 1 / log2),
        },
      }) satisfies THREE.ShaderMaterialProperties['uniforms'],
    []
  );

  // Обновляем uniforms перед каждым кадром
  useFrame(() => {
    if (!materialRef.current) return;

    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_offset.value.set(offset[0], offset[1]);
    uniforms.u_max_iterations.value = maxIterations;
    uniforms.u_palette_a.value = PALETTE_MAP_VECTORS[palette].a;
    uniforms.u_palette_b.value = PALETTE_MAP_VECTORS[palette].b;
    uniforms.u_palette_c.value = PALETTE_MAP_VECTORS[palette].c;
    uniforms.u_palette_d.value = PALETTE_MAP_VECTORS[palette].d;

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
