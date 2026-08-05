import { GLSL3, ShaderMaterial, type Texture, Vector3, type WebGLRenderer } from 'three';

import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import paletteShader from '@/shaders/mandelbrot/mandelbrotPalette.frag?raw';

export class ScreenPass<TTexture extends Texture = Texture> {
  private readonly material: ShaderMaterial;
  private readonly quadRender: (gl: WebGLRenderer, material: ShaderMaterial) => void;
  constructor(options: {
    render(gl: WebGLRenderer, material: ShaderMaterial): void;
    computeResult: TTexture;
    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    this.quadRender = options.render;

    const log2 = Math.log(2);
    const TWO_PI = 2.0 * Math.PI;
    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: paletteShader,
      uniforms: {
        u_const: { value: new Vector3(TWO_PI, 1 / (log2 * 2), 1 / log2) },
        u_compute_result: { value: options.computeResult },
        u_palette_a: { value: options.paletteA },
        u_palette_b: { value: options.paletteB },
        u_palette_c: { value: options.paletteC },
        u_palette_d: { value: options.paletteD },
      },
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

  public render(gl: WebGLRenderer, computeResultTexture: TTexture): void {
    this.material.uniforms.u_compute_result.value = computeResultTexture;
    gl.setRenderTarget(null);
    this.quadRender(gl, this.material);
  }

  public dispose() {
    this.material.dispose();
  }
}
