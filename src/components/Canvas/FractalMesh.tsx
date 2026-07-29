import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import fragShader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import vertShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import { maxIterationsAtom, offsetAtom, paletteMapAtom, zoomAtom } from '@/store/fractalStore';

const log2 = Math.log(2);
const TWO_PI = 2.0 * Math.PI;

export function FractalMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, size, scene, camera } = useThree();

  // state

  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const maxIterations = useAtomValue(maxIterationsAtom);
  const paletteMap = useAtomValue(paletteMapAtom);

  // uniforms

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

  // render

  const mrtBuffer = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(size.width, size.height, {
      count: 2,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      // type: THREE.FloatType,
    });

    // ВАЖНО: Указываем правильное цветовое пространство для текстуры цвета
    // Three.js автоматически применит гамму при выводе этой текстуры на экран
    // target.textures[0].colorSpace = THREE.NoColorSpace;

    // Текстуру маски [1] оставляем в NoColorSpace (или LinearSRGBColorSpace),
    // так как там лежат сырые математические данные/координаты, а не цвета
    // target.textures[1].colorSpace = THREE.NoColorSpace;

    return target;
  }, [size]);

  const {
    0: { screenScene, screenCamera, screenMaterial },
  } = useState(() => {
    const screenScene = new THREE.Scene();
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: mrtBuffer.textures[0],
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMaterial);
    screenScene.add(quad);
    return { screenScene, screenCamera, screenMaterial };
  });
  useEffect(() => {
    screenMaterial.map = mrtBuffer.textures.at(0) ?? null;
    // if (screenMaterial.map) {
    //   screenMaterial.map.colorSpace = THREE.SRGBColorSpace;
    // }
    screenMaterial.needsUpdate = true;
  }, [mrtBuffer]);

  useFrame(() => {
    gl.setRenderTarget(mrtBuffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.clear();

    // цвета корректны
    gl.render(scene, camera);

    // цвета как будто высвечены. более светлые, бледные и с меньшим диапазоном. Эффект как от выгоревшей на солнце краски.
    // gl.render(screenScene, screenCamera);
  }, 1);

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        glslVersion={THREE.GLSL3}
        vertexShader={vertShader}
        fragmentShader={fragShader}
        uniforms={initUniforms}
        toneMapped={false}
      />
    </mesh>
  );
}
