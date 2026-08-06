import { GLSL3, ShaderMaterial, type ShaderMaterialProperties, type Texture, Vector3, type WebGLRenderer } from 'three';

import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import paletteShader from '@/shaders/mandelbrot/mandelbrotPalette.frag?raw';

export class ScreenPass<TTexture extends Texture = Texture> {
  private readonly material: ShaderMaterial;
  private readonly quadRender: (props: { gl: WebGLRenderer; material?: ShaderMaterial }) => void;
  constructor({
    render,
    ...initUniforms
  }: {
    render(props: { gl: WebGLRenderer; material?: ShaderMaterial }): void;
    result: TTexture;
    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    this.quadRender = render;

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: paletteShader,
      uniforms: ScreenPass.makeInitScreenUniforms(initUniforms),
    });
  }

  public setPalette({
    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    this.material.uniforms.u_palette_a.value = paletteA;
    this.material.uniforms.u_palette_b.value = paletteB;
    this.material.uniforms.u_palette_c.value = paletteC;
    this.material.uniforms.u_palette_d.value = paletteD;
  }

  public render({ gl, computeResultTexture }: { gl: WebGLRenderer; computeResultTexture: TTexture }) {
    this.getUniforms().u_compute_result.value = computeResultTexture;
    this.quadRender({ gl, material: this.material });
  }

  public dispose() {
    this.material.dispose();
  }

  private getUniforms() {
    return this.material.uniforms as ReturnType<(typeof ScreenPass)['makeInitScreenUniforms']>;
  }

  private static makeInitScreenUniforms<TTexture extends Texture = Texture>({
    result,
    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    result: TTexture;
    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    const log2 = Math.log(2);
    const TWO_PI = 2.0 * Math.PI;
    return {
      u_const: { value: new Vector3(TWO_PI, 1 / (log2 * 2), 1 / log2) },
      u_compute_result: { value: result },
      u_palette_a: { value: paletteA },
      u_palette_b: { value: paletteB },
      u_palette_c: { value: paletteC },
      u_palette_d: { value: paletteD },
    } satisfies ShaderMaterialProperties['uniforms'];
  }
}
