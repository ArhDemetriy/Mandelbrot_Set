import type { RenderCallback } from '@react-three/fiber';
import * as THREE from 'three';
import type { DataTexture, ShaderMaterial } from 'three';

import f32Shader from '@/shaders/mandelbrot/2D/mandelbrotF32.frag?raw';
import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';

import { GPUResourceManager, type IGPUResourceManager } from './GPUResourceManager';
import { ComputePass } from './passes/ComputePass';
import { QuadRenderer } from './passes/QuadRenderer';
import { ScreenPass } from './passes/ScreenPass';
import { ShiftPass } from './passes/ShiftPass';

export class MandelbrotEngine {
  private readonly quadRenderer = new QuadRenderer<ShaderMaterial>();
  private readonly shiftPass: ShiftPass<DataTexture>;
  private readonly computePass: ComputePass;

  private readonly screenPass: ScreenPass<DataTexture>;
  private readonly targets: IGPUResourceManager;
  constructor({
    gl,
    invalidate,

    width,
    height,
    zoom,
    offset,

    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    gl: THREE.WebGLRenderer;
    invalidate: (frames?: number | undefined) => void;
    width: number;
    height: number;
    zoom: number;
    offset: [number, number];

    paletteA: THREE.Vector3;
    paletteB: THREE.Vector3;
    paletteC: THREE.Vector3;
    paletteD: THREE.Vector3;
  }) {
    this.currentHeight = height;
    this.currentZoom = zoom;
    this.gl = gl;
    this.invalidate = invalidate;

    this.targets = new GPUResourceManager({ width, height, ...MandelbrotEngine.getRenderTargetOptions() });
    this.reset();

    const { textures } = this.targets.readTarget;
    this.computeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      fragmentShader: f32Shader,
      vertexShader,
      uniforms: MandelbrotEngine.makeInitComputeUniforms({
        initResult: textures[0],
        initState: textures[1],
        width,
        height,
        zoom,
        offset,
      }),
    });

    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.computeScene = new THREE.Scene();
    this.computeScene.add(new THREE.Mesh(quadGeometry, this.computeMaterial));
    this.computeCamera = MandelbrotEngine.makeOrthographicCamera();

    const render = this.quadRenderer.render.bind(this.quadRenderer);
    this.shiftPass = new ShiftPass({
      render,
      result: textures[0],
      state: textures[1],
      width,
      height,
    });

    this.computePass = new ComputePass({
      render,
      result: textures[0],
      state: textures[1],
      width,
      height,
      zoom,
      offset,
    });

    this.screenPass = new ScreenPass({
      render,
      result: textures[0],
      paletteA,
      paletteB,
      paletteC,
      paletteD,
    });

    this.thisFreeStep = this.step.bind(this);

    this.invalidate();
  }
  private invalidate: (frames?: number | undefined) => void;
  public setInvalidate(invalidate: (frames?: number | undefined) => void) {
    this.invalidate = invalidate;
  }

  public setSize(width: number, height: number) {
    this.currentHeight = height;
    this.targets.resize(width, height);
    const { value: u_view } = this.getComputeUniforms().u_view;
    u_view.setX(this.getDivScaleHeight());
    u_view.setY(width);

    this.shiftPass.resetShift();
    this.shiftPass.setSize(width, height);

    this.reset();
    this.invalidate();
  }

  public setZoom(zoom: number) {
    this.currentZoom = zoom;
    this.getComputeUniforms().u_view.value.setX(this.getDivScaleHeight());
    this.shiftPass.resetShift();
    this.reset();
    this.invalidate();
  }
  private currentHeight: number;
  private currentZoom: number;
  private getDivScaleHeight() {
    return 1 / (this.currentHeight * this.currentZoom);
  }

  public setOffset({ 0: X, 1: Y }: [number, number]) {
    const { value: cOffset } = this.getComputeUniforms().u_offset;

    const { x: prevOffsetX, y: prevOffsetY } = cOffset;
    const scale = this.currentHeight * this.currentZoom;
    this.shiftPass.incShift({
      X: (X - prevOffsetX) * scale,
      Y: (Y - prevOffsetY) * scale,
    });

    cOffset.set(X, Y);

    this.resetCompute();
    this.invalidate();
  }

  private reset() {
    this.targets.clear(this.gl, null);
    this.resetCompute();
  }

  // управление рендером
  public readonly thisFreeStep: MandelbrotEngine['step'];

  private isOddFrame = false;
  public step(..._props: Parameters<RenderCallback>) {
    if (this.shiftPass.existShift()) {
      this.shift();
      if (this.isOddFrame) this.compute();
      this.screen();
      this.isOddFrame = !this.isOddFrame;
      this.invalidate();
      return;
    }

    if (!this.isFullCompute()) {
      this.compute();
      this.screen();
      this.invalidate();
    }
  }
  private shift() {
    const {
      readTarget: { textures },
      writeTarget,
    } = this.targets;

    this.gl.setRenderTarget(writeTarget);
    this.shiftPass.render({
      gl: this.gl,
      result: textures[0],
      state: textures[1],
    });
    this.gl.setRenderTarget(null);
    this.shiftPass.resetShift();

    this.targets.swap();
  }
  private compute() {
    const { readTarget, writeTarget } = this.targets;

    const uniforms = this.getComputeUniforms();
    uniforms.u_prev_result.value = readTarget.textures[0];
    uniforms.u_prev_state.value = readTarget.textures[1];

    this.gl.setRenderTarget(writeTarget);
    this.gl.render(this.computeScene, this.computeCamera);
    this.gl.setRenderTarget(null);

    this.targets.swap();
    this.incCompute();
  }
  private screen() {
    this.gl.setRenderTarget(null);
    this.screenPass.render(this.gl, this.targets.readTarget.textures[0]);
  }
  private iterations = 0;
  private isFullCompute() {
    return this.iterations >= MandelbrotEngine.maxIterations;
  }
  private resetCompute() {
    this.iterations = 0;
  }
  private incCompute() {
    this.iterations += MandelbrotEngine.iterationOnFrame;
  }

  private static iterationOnFrame = 20;
  private static maxIterations = 10000;

  protected getComputeUniforms() {
    return this.computeMaterial.uniforms as ReturnType<(typeof MandelbrotEngine)['makeInitComputeUniforms']>;
  }
  private computeScene: THREE.Scene;
  private computeCamera: THREE.OrthographicCamera;

  public setPalette(palettes: Parameters<ScreenPass['setPalette']>[0]) {
    this.screenPass.setPalette(palettes);
    this.invalidate();
  }

  public dispose() {
    this.computeMaterial.dispose();

    this.screenPass.dispose();
    this.computePass.dispose();
    this.shiftPass.dispose();
    this.quadRenderer.dispose();
    this.targets.dispose();
  }
  private computeMaterial: THREE.ShaderMaterial;

  public setGl(gl: THREE.WebGLRenderer) {
    this.gl = gl;
  }
  private gl: THREE.WebGLRenderer;

  private static makeOrthographicCamera() {
    return new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  private static getRenderTargetOptions() {
    return {
      count: 2,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
    } satisfies THREE.RenderTargetOptions;
  }

  private static makeInitComputeUniforms({
    zoom,
    height,
    offset,
    initResult,
    initState,
  }: {
    zoom: number;
    width?: number;
    height: number;
    offset: [number, number];
    initResult: THREE.DataTexture;
    initState: THREE.DataTexture;
  }) {
    return {
      u_const: { value: new THREE.Vector2(MandelbrotEngine.iterationOnFrame, MandelbrotEngine.maxIterations) },
      u_offset: {
        /** ...offset */
        value: new THREE.Vector2(offset[0], offset[1]),
      },
      u_view: {
        /** texelScale/height */
        value: new THREE.Vector2(zoom / height),
      },
      u_prev_result: { value: initResult },
      u_prev_state: { value: initState },
    } satisfies THREE.ShaderMaterialProperties['uniforms'];
  }
}
