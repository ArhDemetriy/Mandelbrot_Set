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
  const { gl, size, viewport, scene, camera } = useThree();

  // state

  const { pWidth, pHeight } = useMemo(
    () => ({
      pWidth: Math.round(size.width * window.devicePixelRatio),
      pHeight: Math.round(size.height * window.devicePixelRatio),
    }),
    [size]
  );

  const offset = useAtomValue(offsetAtom);
  const zoom = useAtomValue(zoomAtom);
  const maxIterations = useAtomValue(maxIterationsAtom);
  const paletteMap = useAtomValue(paletteMapAtom);

  // uniforms

  const { 0: initUniforms } = useState(() => {
    const texelScale = 1 / zoom;
    return {
      u_scale: { value: new THREE.Vector2(texelScale * (pWidth / pHeight), texelScale) },
      u_offset: { value: new THREE.Vector2(offset[0], offset[1]) },
      u_max_iterations: { value: maxIterations },
      u_prev_iterations: { value: 0 },

      u_prev_color: { value: undefined as THREE.Texture | undefined },
      u_prev_mask: { value: undefined as THREE.Texture | undefined },

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
    uniforms.u_prev_iterations.value = 0;

    uniforms.u_palette_a.value = paletteMap.a;
    uniforms.u_palette_b.value = paletteMap.b;
    uniforms.u_palette_c.value = paletteMap.c;
    uniforms.u_palette_d.value = paletteMap.d;
  }, [paletteMap, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_prev_iterations.value = 0;

    uniforms.u_offset.value.set(offset[0], offset[1]);
  }, [offset, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_prev_iterations.value = 0;

    uniforms.u_max_iterations.value = maxIterations;
  }, [maxIterations, materialRef]);

  useEffect(() => {
    if (!materialRef.current?.uniforms) return;
    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_prev_iterations.value = 0;

    const texelScale = 1 / zoom;
    uniforms.u_scale.value.set(texelScale * viewport.aspect, texelScale);
  }, [zoom, viewport.aspect, materialRef]);

  // render

  const buffers = useMemo(() => {
    const config = {
      count: 2,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
    } satisfies THREE.RenderTargetOptions;
    return [new THREE.WebGLRenderTarget(pWidth, pHeight, config), new THREE.WebGLRenderTarget(pWidth, pHeight, config)];
  }, [pWidth, pHeight]);
  const indexCurrentBuffer = useRef(0);

  const {
    0: { screenScene, screenCamera, screenMaterial },
  } = useState(() => {
    const screenScene = new THREE.Scene();
    const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const screenMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        tColor: { value: buffers[indexCurrentBuffer.current].textures.at(0) },
      },
      vertexShader: `
        out vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tColor;
        in vec2 vUv;
        out vec4 fragColor;
        void main() {
          fragColor = texture(tColor, vUv);
        }
      `,
      toneMapped: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMaterial);
    screenScene.add(quad);
    return { screenScene, screenCamera, screenMaterial };
  });
  useEffect(() => {
    if (!screenMaterial.uniforms?.tColor) return;
    screenMaterial.uniforms.tColor.value = buffers[indexCurrentBuffer.current].textures.at(0);
    screenMaterial.needsUpdate = true;
  }, [buffers, screenMaterial]);

  useFrame(() => {
    if (!materialRef.current?.uniforms) return;

    const readBuffer = buffers[indexCurrentBuffer.current];
    indexCurrentBuffer.current = 1 - indexCurrentBuffer.current;
    const writeBuffer = buffers[indexCurrentBuffer.current];

    const uniforms = materialRef.current.uniforms as typeof initUniforms;
    uniforms.u_prev_color.value = readBuffer.textures.at(0);
    uniforms.u_prev_mask.value = readBuffer.textures.at(1);

    gl.setRenderTarget(writeBuffer);
    gl.render(scene, camera);

    uniforms.u_prev_iterations.value += uniforms.u_max_iterations.value;

    gl.setRenderTarget(null);
    if (screenMaterial.uniforms?.tColor) {
      screenMaterial.uniforms.tColor.value = writeBuffer.textures.at(0);
      screenMaterial.needsUpdate = true;
    }
    gl.render(screenScene, screenCamera);
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
      />
    </mesh>
  );
}
