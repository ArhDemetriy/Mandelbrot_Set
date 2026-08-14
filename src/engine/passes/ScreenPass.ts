import {
  GLSL3,
  ShaderMaterial,
  type ShaderMaterialProperties,
  type Texture,
  Vector3,
  Vector4,
  type WebGLRenderer,
} from 'three';

import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';
import paletteShader from '@/shaders/mandelbrot/mandelbrotPalette.frag?raw';

export class ScreenPass<TTexture extends Texture = Texture> {
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
    ...initUniforms
  }: {
    render(props: { gl: WebGLRenderer; material?: ShaderMaterial }): void;
    zoom: number;
    width: number;
    height: number;
    result: TTexture;
    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    this.quadRender = render;
    this.width = width;
    this.height = height;
    this.prevZoom = this.zoom = zoom;

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: paletteShader,
      uniforms: ScreenPass.makeInitScreenUniforms({ width, height, ...initUniforms }),
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
    const uniforms = this.getUniforms();
    uniforms.u_palette_a.value = paletteA;
    uniforms.u_palette_b.value = paletteB;
    uniforms.u_palette_c.value = paletteC;
    uniforms.u_palette_d.value = paletteD;
  }

  public setZoom({ zoom }: { zoom: number }) {
    this.zoom = zoom;

    clearTimeout(this.afterZoomTimeoutId);
    this.afterZoomTimeoutId = undefined;
    this.getUniforms().u_pass_type.value = -1;
  }

  public existZoomScale() {
    return this.prevZoom !== this.zoom;
  }

  public stopZoom() {
    this.prevZoom = this.zoom;
    this.getUniforms().u_pass_type.value = -3;
  }
  public resetZoom({ zoom }: { zoom?: number } = {}) {
    if (zoom != undefined) this.zoom = zoom;
    this.prevZoom = this.zoom;
    this.getUniforms().u_pass_type.value = -1;
    clearTimeout(this.afterZoomTimeoutId);
    this.afterZoomTimeoutId = undefined;
  }

  public afterZoomStage() {
    return this.afterZoomTimeoutId != undefined;
  }

  public setSize({ width, height }: { width: number; height: number }) {
    this.width = width;
    this.height = height;
    this.resetZoom();
  }

  public render({ gl, computeResultTexture }: { gl: WebGLRenderer; computeResultTexture: TTexture }) {
    this.getUniforms().u_compute_result.value = computeResultTexture;
    this.quadRender({ gl, material: this.material });
  }
  public zoomRender({ gl, computeResultTexture }: { gl: WebGLRenderer; computeResultTexture: TTexture }) {
    clearTimeout(this.afterZoomTimeoutId);

    const scale = this.zoom / this.prevZoom;
    const { height, width } = this;

    const uniforms = this.getUniforms();
    uniforms.u_compute_result.value = computeResultTexture;
    uniforms.u_resolution.value.set(width / 2, height / 2, 1 / (width * scale), 1 / (height * scale));

    uniforms.u_pass_type.value = -2;
    this.quadRender({ gl, material: this.material });
    uniforms.u_pass_type.value = -3;

    this.afterZoomTimeoutId = setTimeout(() => this.resetZoom(), 1000);
  }
  private afterZoomTimeoutId: ReturnType<typeof setTimeout> | undefined;

  public dispose() {
    this.material.dispose();
  }

  private getUniforms() {
    return this.material.uniforms as ReturnType<(typeof ScreenPass)['makeInitScreenUniforms']>;
  }

  private static makeInitScreenUniforms<TTexture extends Texture = Texture>({
    width,
    height,
    result,
    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    width: number;
    height: number;
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
      u_resolution: {
        /** width/2, height/2, 1 / (width * scale), 1 / (height * scale) */
        value: new Vector4(width / 2, height / 2, 1 / width, 1 / height),
      },
      u_pass_type: {
        /** REGULAR | ZOOM | AFTER_ZOOM */
        value: -1 as -1 | -2 | -3,
      },
      u_compute_result: { value: result },
      u_palette_a: { value: paletteA },
      u_palette_b: { value: paletteB },
      u_palette_c: { value: paletteC },
      u_palette_d: { value: paletteD },
    } satisfies ShaderMaterialProperties['uniforms'];
  }
}
