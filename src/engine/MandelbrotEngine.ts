import type { RenderCallback } from '@react-three/fiber';
import * as THREE from 'three';

import shiftShader from '@/shaders/mandelbrot/2D/mandelbrotF32Shift.frag?raw';
import vertexShader from '@/shaders/mandelbrot/mandelbrot.vert?raw';

export class MandelbrotEngine {
  private shiftMaterial: THREE.ShaderMaterial;
  private shiftScene: THREE.Scene<THREE.Object3DEventMap>;
  private shiftCamera: THREE.OrthographicCamera;
  constructor({
    gl,
    invalidate,
    f32Shader,
    paletteShader,

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
    f32Shader: string;
    paletteShader: string;
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
    this.targets = [
      new THREE.WebGLRenderTarget(width, height, MandelbrotEngine.getRenderTargetOptions()),
      new THREE.WebGLRenderTarget(width, height, MandelbrotEngine.getRenderTargetOptions()),
    ];
    this.reset();

    const { textures } = this.getTargets().readTarget;
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

    this.screenMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      fragmentShader: paletteShader,
      vertexShader,
      uniforms: MandelbrotEngine.makeInitScreenUniforms({
        initResult: textures[0],
        paletteA,
        paletteB,
        paletteC,
        paletteD,
      }),
    });
    this.screenScene = new THREE.Scene();
    this.screenScene.add(new THREE.Mesh(quadGeometry, this.screenMaterial));
    this.screenCamera = MandelbrotEngine.makeOrthographicCamera();

    this.shiftMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      fragmentShader: shiftShader,
      vertexShader,
      uniforms: MandelbrotEngine.makeInitShiftUniforms({
        initResult: textures[0],
        initState: textures[1],
        width,
        height,
        offset,
      }),
    });
    this.shiftScene = new THREE.Scene();
    this.shiftScene.add(new THREE.Mesh(quadGeometry, this.shiftMaterial));
    this.shiftCamera = MandelbrotEngine.makeOrthographicCamera();

    this.thisFreeStep = this.step.bind(this);

    this.invalidate();
  }
  private invalidate: (frames?: number | undefined) => void;
  public setInvalidate(invalidate: (frames?: number | undefined) => void) {
    this.invalidate = invalidate;
  }

  public setSize(width: number, height: number) {
    this.currentHeight = height;
    this.targets.forEach(target => target.setSize(width, height));
    const { value: u_view } = this.getComputeUniforms().u_view;
    u_view.setX(this.getDivScaleHeight());
    u_view.setY(width);
    this.resetPixelDeltaOffset();
    this.reset();
    this.invalidate();
  }

  public setZoom(zoom: number) {
    this.currentZoom = zoom;
    this.getComputeUniforms().u_view.value.setX(this.getDivScaleHeight());
    this.resetPixelDeltaOffset();
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

    const { value: sOffset } = this.getShiftUniforms().u_offset;
    const { x: prevOffsetX, y: prevOffsetY } = cOffset;
    const scale = this.currentHeight * this.currentZoom;
    const xShift = (X - prevOffsetX) * scale;
    const yShift = (Y - prevOffsetY) * scale;
    sOffset.setX(xShift);
    sOffset.setY(yShift);

    cOffset.set(X, Y);

    this.resetCompute();
    this.needShift = true;
    this.invalidate();
  }
  private needShift = false;
  private resetPixelDeltaOffset() {
    const { value: sOffset } = this.getShiftUniforms().u_offset;
    sOffset.setX(0);
    sOffset.setY(0);
    this.needShift = false;
  }

  private reset() {
    this.targets.forEach(target => {
      this.gl.setRenderTarget(target);
      this.gl.clear(true, true, true);
    });
    this.gl.setRenderTarget(null);
    this.readIndex = 0;
    this.resetCompute();
  }

  protected getTargets() {
    return {
      readTarget: this.targets[this.readIndex],
      writeTarget: this.targets[1 - this.readIndex],
    };
  }
  protected switchTargets() {
    this.readIndex = (1 - this.readIndex) as 0 | 1;
  }

  /** GPGPU Буферы (Ping-Pong) */
  private targets: Readonly<[THREE.WebGLRenderTarget<THREE.DataTexture>, THREE.WebGLRenderTarget<THREE.DataTexture>]>;
  /** индекс текущего GPGPU буффера */
  private readIndex: 0 | 1 = 0;

  // управление рендером
  public readonly thisFreeStep: MandelbrotEngine['step'];

  private isOddFrame = false;
  public step(..._props: Parameters<RenderCallback>) {
    if (this.needShift) {
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
    const { readTarget, writeTarget } = this.getTargets();

    const uniforms = this.getShiftUniforms();
    uniforms.u_prev_result.value = readTarget.textures[0];
    uniforms.u_prev_state.value = readTarget.textures[1];

    this.gl.setRenderTarget(writeTarget);
    this.gl.render(this.shiftScene, this.shiftCamera);
    this.gl.setRenderTarget(null);

    this.switchTargets();
    this.resetPixelDeltaOffset();
  }
  private compute() {
    const { readTarget, writeTarget } = this.getTargets();

    const uniforms = this.getComputeUniforms();
    uniforms.u_prev_result.value = readTarget.textures[0];
    uniforms.u_prev_state.value = readTarget.textures[1];

    this.gl.setRenderTarget(writeTarget);
    this.gl.render(this.computeScene, this.computeCamera);
    this.gl.setRenderTarget(null);

    this.switchTargets();
    this.incCompute();
  }
  private screen() {
    const uniforms = this.getScreenUniforms();
    uniforms.u_compute_result.value = this.getTargets().readTarget.textures[0];

    this.gl.setRenderTarget(null);
    this.gl.render(this.screenScene, this.screenCamera);
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

  public setPalette({
    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    paletteA: THREE.Vector3;
    paletteB: THREE.Vector3;
    paletteC: THREE.Vector3;
    paletteD: THREE.Vector3;
  }) {
    const screenUniforms = this.getScreenUniforms();
    screenUniforms.u_palette_a.value = paletteA;
    screenUniforms.u_palette_b.value = paletteB;
    screenUniforms.u_palette_c.value = paletteC;
    screenUniforms.u_palette_d.value = paletteD;
    this.invalidate();
  }

  protected getScreenUniforms() {
    return this.screenMaterial.uniforms as ReturnType<(typeof MandelbrotEngine)['makeInitScreenUniforms']>;
  }

  protected getShiftUniforms() {
    return this.shiftMaterial.uniforms as ReturnType<(typeof MandelbrotEngine)['makeInitShiftUniforms']>;
  }

  private screenScene: THREE.Scene;
  private screenCamera: THREE.OrthographicCamera;

  public dispose() {
    this.targets.forEach(target => target.dispose());
    this.computeMaterial.dispose();
    this.screenMaterial.dispose();
  }
  private computeMaterial: THREE.ShaderMaterial;
  private screenMaterial: THREE.ShaderMaterial;

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
      u_prev_result: { value: initResult } satisfies ReturnType<
        (typeof MandelbrotEngine)['makeInitScreenUniforms']
      >['u_compute_result'],
      u_prev_state: { value: initState },
    } satisfies THREE.ShaderMaterialProperties['uniforms'];
  }

  private static makeInitScreenUniforms({
    initResult,
    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    initResult: THREE.DataTexture;
    paletteA: THREE.Vector3;
    paletteB: THREE.Vector3;
    paletteC: THREE.Vector3;
    paletteD: THREE.Vector3;
  }) {
    const log2 = Math.log(2);
    const TWO_PI = 2.0 * Math.PI;
    return {
      u_const: { value: new THREE.Vector3(TWO_PI, 1 / (log2 * 2), 1 / log2) },
      u_compute_result: { value: initResult },
      u_palette_a: { value: paletteA },
      u_palette_b: { value: paletteB },
      u_palette_c: { value: paletteC },
      u_palette_d: { value: paletteD },
    } satisfies THREE.ShaderMaterialProperties['uniforms'];
  }

  private static makeInitShiftUniforms({
    width,
    height,
    offset,
    initResult,
    initState,
  }: {
    width: number;
    height: number;
    offset: [number, number];
    initResult: THREE.DataTexture;
    initState: THREE.DataTexture;
  }) {
    return {
      u_offset: {
        /** ...offset, width, height */
        value: new THREE.Vector4(offset[0], offset[1], width, height),
      },
      u_prev_result: { value: initResult } satisfies ReturnType<
        (typeof MandelbrotEngine)['makeInitScreenUniforms']
      >['u_compute_result'],
      u_prev_state: { value: initState },
    } satisfies THREE.ShaderMaterialProperties['uniforms'];
  }
}
