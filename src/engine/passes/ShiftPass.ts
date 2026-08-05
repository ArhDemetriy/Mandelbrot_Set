import { GLSL3, ShaderMaterial, type ShaderMaterialProperties, type Texture, Vector4, type WebGLRenderer } from 'three';

import shiftShader from '@/shaders/mandelbrot/2D/mandelbrotF32Shift.frag?raw';
import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';

export class ShiftPass<TTexture extends Texture = Texture> {
  private readonly material: ShaderMaterial;
  private readonly quadRender: (gl: WebGLRenderer, material: ShaderMaterial) => void;
  constructor({
    render,
    ...initUniforms
  }: {
    render(gl: WebGLRenderer, material: ShaderMaterial): void;

    width: number;
    height: number;
    result: TTexture;
    state: TTexture;
  }) {
    this.quadRender = render;

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      fragmentShader: shiftShader,
      vertexShader,
      uniforms: ShiftPass.makeInitShiftUniforms(initUniforms),
    });
  }

  public render({ gl, result, state }: { gl: WebGLRenderer; result: TTexture; state: TTexture }) {
    if (!this.existShift()) return;

    const uniforms = this.getUniforms();
    uniforms.u_prev_result.value = result;
    uniforms.u_prev_state.value = state;

    this.quadRender(gl, this.material);
  }

  public incShift({ X, Y }: { X: number; Y: number }) {
    const { value: uOffset } = this.getUniforms().u_offset;
    const xShift = uOffset.x + X;
    const yShift = uOffset.y + Y;
    uOffset.setX(xShift);
    uOffset.setY(yShift);
  }

  public existShift() {
    const { value: uOffset } = this.getUniforms().u_offset;
    return Boolean(uOffset.x || uOffset.y);
  }
  public resetShift() {
    const { value: uOffset } = this.getUniforms().u_offset;
    uOffset.setX(0);
    uOffset.setY(0);
  }

  public setSize(width: number, height: number) {
    const { value: uOffset } = this.getUniforms().u_offset;
    uOffset.setZ(width);
    uOffset.setW(height);
  }

  public dispose() {
    this.material.dispose();
  }

  private getUniforms() {
    return this.material.uniforms as ReturnType<(typeof ShiftPass)['makeInitShiftUniforms']>;
  }

  private static makeInitShiftUniforms<TTexture extends Texture = Texture>({
    width,
    height,
    result,
    state,
  }: {
    width: number;
    height: number;
    result: TTexture;
    state: TTexture;
  }) {
    return {
      u_offset: {
        /** ...shift, width, height */
        value: new Vector4(0, 0, width, height),
      },
      u_prev_result: { value: result },
      u_prev_state: { value: state },
    } satisfies ShaderMaterialProperties['uniforms'];
  }
}
