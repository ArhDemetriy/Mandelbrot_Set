import * as THREE from 'three';

export class MandelbrotEngine {
  constructor({
    gl,
    f32Shader,
    paletteShader,

    initWidth,
    initHeight,
    texelScale,
    offset,

    paletteA,
    paletteB,
    paletteC,
    paletteD,
  }: {
    gl: THREE.WebGLRenderer;
    f32Shader: string;
    paletteShader: string;
    initWidth: number;
    initHeight: number;
    texelScale: number;
    offset: [number, number];

    paletteA: THREE.Vector3;
    paletteB: THREE.Vector3;
    paletteC: THREE.Vector3;
    paletteD: THREE.Vector3;
  }) {
    this.targets = [
      new THREE.WebGLRenderTarget(initWidth, initHeight, MandelbrotEngine.getRenderTargetOptions()),
      new THREE.WebGLRenderTarget(initWidth, initHeight, MandelbrotEngine.getRenderTargetOptions()),
    ];
    this.reset(gl);

    const { textures } = this.getTargets().readTarget;
    this.computeMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      fragmentShader: f32Shader,
      vertexShader: MandelbrotEngine.getFullScreenVertShader(),
      uniforms: MandelbrotEngine.makeInitComputeUniforms({
        initResult: textures[0],
        initState: textures[1],
        initWidth,
        initHeight,
        texelScale,
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
      vertexShader: MandelbrotEngine.getFullScreenVertShader(),
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
  }

  public setSize(width: number, height: number) {
    this.targets.forEach(target => target.setSize(width, height));
    const uScreen = this.getComputeUniforms().u_screen.value;
    uScreen.setX(width);
    uScreen.setY(height);

    this.setTexelScale(this.getTexelScale());
  }

  public setTexelScale(texelScale: number) {
    const uScreen = this.getComputeUniforms().u_screen.value;
    this.getComputeUniforms().u_scale.value.set(
      texelScale * (uScreen.getComponent(0) / uScreen.getComponent(1)),
      texelScale
    );
  }

  protected getTexelScale() {
    return this.getComputeUniforms().u_scale.value.getComponent(1);
  }

  public setOffset(offset: [number, number]) {
    this.getComputeUniforms().u_offset.value.set(...offset);
  }

  public reset(gl: THREE.WebGLRenderer) {
    this.targets.forEach(target => {
      gl.setRenderTarget(target);
      gl.clear(true, true, true);
    });
    gl.setRenderTarget(null);
    this.readIndex = 0;
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

  /** Выполнить 1 шаг накопления фрактала (Ping-Pong) */
  public step(gl: THREE.WebGLRenderer) {
    const { readTarget, writeTarget } = this.getTargets();

    const uniforms = this.getComputeUniforms();
    uniforms.u_prev_result.value = readTarget.textures[0];
    uniforms.u_prev_state.value = readTarget.textures[1];

    gl.setRenderTarget(writeTarget);
    gl.render(this.computeScene, this.computeCamera);
    gl.setRenderTarget(null);

    this.switchTargets();
  }

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
  }

  public renderScreen(gl: THREE.WebGLRenderer) {
    const uniforms = this.getScreenUniforms();
    uniforms.u_compute_result.value = this.getTargets().readTarget.textures[0];

    gl.setRenderTarget(null);
    gl.render(this.screenScene, this.screenCamera);
  }

  protected getScreenUniforms() {
    return this.screenMaterial.uniforms as ReturnType<(typeof MandelbrotEngine)['makeInitScreenUniforms']>;
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

  private static getFullScreenVertShader() {
    return `
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
` as const;
  }

  private static makeInitComputeUniforms({
    texelScale,
    initWidth,
    initHeight,
    offset,
    initResult,
    initState,
  }: {
    texelScale: number;
    initWidth: number;
    initHeight: number;
    offset: [number, number];
    initResult: THREE.DataTexture;
    initState: THREE.DataTexture;
  }) {
    return {
      u_scale: { value: new THREE.Vector2(texelScale * (initWidth / initHeight), texelScale) },
      u_offset: { value: new THREE.Vector2(...offset) },
      u_screen: { value: new THREE.Vector2(initWidth, initHeight) },
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
}
