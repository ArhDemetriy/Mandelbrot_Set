import type { RenderCallback } from '@react-three/fiber';
import {
  type DataTexture,
  FloatType,
  NearestFilter,
  type RenderTargetOptions,
  type ShaderMaterial,
  type Vector3,
  type WebGLRenderer,
} from 'three';

import { GPUResourceManager } from './GPUResourceManager';
import { ComputePass } from './passes/ComputePass';
import { QuadRenderer } from './passes/QuadRenderer';
import { ScreenPass } from './passes/ScreenPass';
import { ShiftPass } from './passes/ShiftPass';
import { getShiftDirtyRects } from './utils';

export class MandelbrotEngine {
  private readonly quadRenderer = new QuadRenderer<ShaderMaterial>();
  private readonly shiftPass: ShiftPass<DataTexture>;
  private readonly computePass: ComputePass;

  private readonly screenPass: ScreenPass<DataTexture>;
  private readonly targets: GPUResourceManager;
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
    gl: WebGLRenderer;
    invalidate: (frames?: number | undefined) => void;
    width: number;
    height: number;
    zoom: number;
    offset: [number, number];

    paletteA: Vector3;
    paletteB: Vector3;
    paletteC: Vector3;
    paletteD: Vector3;
  }) {
    this.currentHeight = height;
    this.currentWidth = width;
    this.currentZoom = zoom;
    this.currentOffset = offset;
    this.gl = gl;
    this.invalidate = invalidate;

    this.targets = new GPUResourceManager({ width, height, ...MandelbrotEngine.getRenderTargetOptions() });
    this.targets.clear(gl, null);
    const { currentTextures } = this.targets;

    const render = this.quadRenderer.render.bind(this.quadRenderer);
    this.shiftPass = new ShiftPass({
      render,
      result: currentTextures[0],
      state: currentTextures[1],
      width,
      height,
    });

    this.computePass = new ComputePass({
      render,
      result: currentTextures[0],
      state: currentTextures[1],
      width,
      height,
      iterationsPerFrame: MandelbrotEngine.iterationsPerFrame,
      maxIterations: MandelbrotEngine.maxIterations,
      zoom,
      offset,
    });

    this.screenPass = new ScreenPass({
      render,
      result: currentTextures[0],
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
    this.currentWidth = width;

    this.targets.resize(width, height);
    this.computePass.setScale({ zoom: this.currentZoom, width, height });
    this.shiftPass.resetShift();
    this.shiftPass.setSize(width, height);

    this.targets.clear(this.gl, null);
    this.resetCompute();
    this.invalidate();
  }

  public setZoom(zoom: number) {
    this.currentZoom = zoom;

    this.computePass.setScale({ zoom, width: this.currentWidth, height: this.currentHeight });
    this.shiftPass.resetShift();

    this.targets.clear(this.gl, null);
    this.resetCompute();
    this.invalidate();
  }
  private currentHeight: number;
  private currentWidth: number;
  private currentZoom: number;

  public setOffset(offset: [number, number]) {
    const { 0: prevOffsetX, 1: prevOffsetY } = this.currentOffset;
    const { 0: currentOffsetX, 1: currentOffsetY } = (this.currentOffset = offset);

    this.computePass.setOffset(offset);

    const scale = this.currentHeight * this.currentZoom;
    this.shiftPass.incShift({
      X: (currentOffsetX - prevOffsetX) * scale,
      Y: (currentOffsetY - prevOffsetY) * scale,
    });

    this.resetCompute();
    this.invalidate();
  }
  private currentOffset: [number, number];

  // управление рендером
  public readonly thisFreeStep: MandelbrotEngine['step'];

  public step(...props: Parameters<RenderCallback>) {
    if (this.shiftPass.existShift()) {
      this.shift(...props);
      this.screen(...props);
      this.invalidate();
      return;
    }

    if (!this.isFullCompute()) {
      this.compute(...props);
      this.screen(...props);
      this.invalidate();
    }
  }

  private shift(...props: Parameters<RenderCallback>) {
    const { gl } = props[0];
    let textures = this.targets.currentTextures;
    gl.setRenderTarget(this.targets.writeTarget);

    this.shiftPass.render({
      gl,
      result: textures[0],
      state: textures[1],
    });

    const completeShift = this.shiftPass.resetShift();
    const { width, height } = this.targets.writeTarget;
    const scissors = getShiftDirtyRects({
      dx: completeShift.X,
      dy: completeShift.Y,
      width,
      height,
    });

    this.targets.swap();
    textures = this.targets.currentTextures;
    gl.setRenderTarget(this.targets.writeTarget);

    this.computePass.render({
      gl,
      result: textures[0],
      state: textures[1],
      scissors,
    });

    this.targets.swap();
    textures = this.targets.currentTextures;
    gl.setRenderTarget(this.targets.writeTarget);

    this.computePass.render({
      gl,
      result: textures[0],
      state: textures[1],
      scissors,
    });

    this.targets.swap();
    this.gl.setRenderTarget(null);
  }
  private compute(...props: Parameters<RenderCallback>) {
    const { gl } = props[0];
    const { currentTextures, writeTarget } = this.targets;

    gl.setRenderTarget(writeTarget);
    this.computePass.render({
      gl,
      result: currentTextures[0],
      state: currentTextures[1],
    });
    gl.setRenderTarget(null);

    this.targets.swap();
    this.incCompute();
  }
  private screen(...props: Parameters<RenderCallback>) {
    const { gl } = props[0];
    gl.setRenderTarget(null);
    this.screenPass.render({ gl, computeResultTexture: this.targets.currentTextures[0] });
  }
  private iterations = 0;
  private isFullCompute() {
    return this.iterations >= MandelbrotEngine.maxIterations;
  }
  private resetCompute() {
    this.iterations = 0;
  }
  private incCompute() {
    this.iterations += MandelbrotEngine.iterationsPerFrame;
  }

  private static iterationsPerFrame = 20;
  private static maxIterations = 10000;

  public setPalette(palettes: Parameters<ScreenPass['setPalette']>[0]) {
    this.screenPass.setPalette(palettes);
    this.invalidate();
  }

  public dispose() {
    this.screenPass.dispose();
    this.computePass.dispose();
    this.shiftPass.dispose();
    this.quadRenderer.dispose();
    this.targets.dispose();
  }

  public setGl(gl: WebGLRenderer) {
    this.gl = gl;
  }
  private gl: WebGLRenderer;

  private static getRenderTargetOptions() {
    return {
      count: 2,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: FloatType,
    } satisfies RenderTargetOptions;
  }
}
