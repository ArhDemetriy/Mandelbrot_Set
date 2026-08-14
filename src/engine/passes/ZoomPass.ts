import { GLSL3, ShaderMaterial, type ShaderMaterialProperties, type Texture, Vector4, type WebGLRenderer } from 'three';

import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import zoomShader from '@/shaders/mandelbrot/mandelbrotZoom.frag?raw';

export class ZoomPass<TTexture extends Texture = Texture> {
  private readonly material: ShaderMaterial;
  private readonly quadRender: (props: { gl: WebGLRenderer; material?: ShaderMaterial }) => void;

  private prevZoom: number;
  private zoom: number;
  private width: number;
  private height: number;
  constructor({
    render,
    zoom,
    width,
    height,
    result,
  }: {
    render(props: { gl: WebGLRenderer; material?: ShaderMaterial }): void;
    zoom: number;

    width: number;
    height: number;
    result: TTexture;
  }) {
    this.quadRender = render;
    this.width = width;
    this.height = height;
    this.prevZoom = this.zoom = zoom;

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      fragmentShader: zoomShader,
      vertexShader,
      uniforms: ZoomPass.makeInitUniforms({
        width,
        height,
        result,
      }),
    });
  }

  public render({ gl, result }: { gl: WebGLRenderer; result: TTexture; state: TTexture }) {
    if (!this.existZoomScale()) return;

    const scale = this.zoom / this.prevZoom;
    const { height, width } = this;

    const uniforms = this.getUniforms();
    uniforms.u_prev_result.value = result;
    uniforms.u_resolution.value.set(height / 2, width / 2, 1 / (height * scale), 1 / (width * scale));

    this.quadRender({ gl, material: this.material });
  }

  public setZoom({ zoom }: { zoom: number }) {
    this.zoom = zoom;
  }

  public existZoomScale() {
    return this.prevZoom !== this.zoom;
  }
  public resetZoom() {
    this.prevZoom = this.zoom;
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public dispose() {
    this.material.dispose();
  }

  private getUniforms() {
    return this.material.uniforms as ReturnType<(typeof ZoomPass)['makeInitUniforms']>;
  }

  private static makeInitUniforms<TTexture extends Texture = Texture>({
    width,
    height,
    result,
  }: {
    width: number;
    height: number;
    result: TTexture;
  }) {
    return {
      u_resolution: {
        /** height/2, width/2, 1 / (height * zoom_scale), 1 / (width * zoom_scale) */
        value: new Vector4(height / 2, width / 2, 1 / height, 1 / width),
      },
      u_prev_result: { value: result },
    } satisfies ShaderMaterialProperties['uniforms'];
  }
}
