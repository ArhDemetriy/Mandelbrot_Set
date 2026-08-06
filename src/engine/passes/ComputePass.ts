import {
  type DataTexture,
  GLSL3,
  ShaderMaterial,
  type ShaderMaterialProperties,
  Vector2,
  type WebGLRenderer,
} from 'three';

import f32Shader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';

export class ComputePass {
  private readonly material: ShaderMaterial;
  private readonly quadRender: (props: { gl: WebGLRenderer; material?: ShaderMaterial }) => void;
  constructor({
    render,
    ...initUniforms
  }: {
    render(props: { gl: WebGLRenderer; material?: ShaderMaterial }): void;

    zoom: number;
    height: number;
    iterationsPerFrame: number;
    maxIterations: number;
    offset: [number, number];
    result: DataTexture;
    state: DataTexture;
  }) {
    this.quadRender = render;

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      fragmentShader: f32Shader,
      vertexShader,
      uniforms: ComputePass.makeInitComputeUniforms(initUniforms),
    });
  }

  public render({ gl, result, state }: { gl: WebGLRenderer; result: DataTexture; state: DataTexture }) {
    const uniforms = this.getUniforms();
    uniforms.u_prev_result.value = result;
    uniforms.u_prev_state.value = state;

    this.quadRender({ gl, material: this.material });
  }

  public setOffset(offset: [number, number]) {
    this.getUniforms().u_offset.value.set(offset[0], offset[1]);
  }

  public setScale({ zoom, height }: { zoom: number; height: number }) {
    this.getUniforms().u_view.value.setX(1 / (zoom * height));
  }

  public dispose() {
    this.material.dispose();
  }

  private getUniforms() {
    return this.material.uniforms as ReturnType<(typeof ComputePass)['makeInitComputeUniforms']>;
  }

  private static makeInitComputeUniforms({
    zoom,
    height,
    iterationsPerFrame,
    maxIterations,
    offset,
    result,
    state,
  }: {
    zoom: number;
    height: number;
    iterationsPerFrame: number;
    maxIterations: number;
    offset: [number, number];
    result: DataTexture;
    state: DataTexture;
  }) {
    return {
      u_const: {
        /** iterationsPerFrame, maxIterations */
        value: new Vector2(iterationsPerFrame, maxIterations),
      },
      u_offset: {
        /** ...offset */
        value: new Vector2(offset[0], offset[1]),
      },
      u_view: {
        /** texelScale/height */
        value: new Vector2(zoom / height),
      },
      u_prev_result: { value: result },
      u_prev_state: { value: state },
    } satisfies ShaderMaterialProperties['uniforms'];
  }
}
