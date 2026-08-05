import * as THREE from 'three';

/** Конфигурация FBO для конкретной стратегии рендера */
interface GPUResourceConfig {
  width: number;
  height: number;
  count: number;
  type: THREE.TextureDataType;
  minFilter: THREE.TextureFilter;
  magFilter: THREE.MagnificationTextureFilter;
}

export interface IGPUResourceManager {
  readonly readTarget: THREE.WebGLRenderTarget<THREE.DataTexture>;
  readonly writeTarget: THREE.WebGLRenderTarget<THREE.DataTexture>;

  readonly currentConfig: Readonly<GPUResourceConfig>;

  /** Переключение Ping-Pong буферов местами */
  swap(): void;

  /** Изменение размера буферов без пересоздания (если формат не менялся) */
  resize(width: number, height: number): void;

  /** Полная переаллокация буферов (например, при смене FP32 -> FP64) */
  reallocate(newConfig: Partial<GPUResourceConfig>): void;

  /** Очистка всех буферов (заполнение нулями/базовым цветом) */
  clear(gl: THREE.WebGLRenderer, requiredRenderTarget?: THREE.WebGLRenderTarget | null): void;

  /** Освобождение WebGL-памяти в GPU */
  dispose(): void;
}

export class GPUResourceManager implements IGPUResourceManager {
  private targets: [THREE.WebGLRenderTarget<THREE.DataTexture>, THREE.WebGLRenderTarget<THREE.DataTexture>];
  private readIndex: 0 | 1 = 0;
  private _config: GPUResourceConfig;

  constructor(
    options: Pick<GPUResourceConfig, 'width' | 'height'> & Partial<Omit<GPUResourceConfig, 'width' | 'height'>>
  ) {
    this._config = {
      width: options.width,
      height: options.height,
      count: options.count ?? 2,
      type: options.type ?? THREE.FloatType,
      minFilter: options.minFilter ?? THREE.NearestFilter,
      magFilter: options.magFilter ?? THREE.NearestFilter,
    };
    this.targets = GPUResourceManager.createRenderTargets(this._config);
  }

  public get readTarget(): THREE.WebGLRenderTarget<THREE.DataTexture> {
    return this.targets[this.readIndex];
  }
  public get writeTarget(): THREE.WebGLRenderTarget<THREE.DataTexture> {
    return this.targets[1 - this.readIndex];
  }

  public get currentConfig() {
    return this._config;
  }

  public swap() {
    this.readIndex = (1 - this.readIndex) as 0 | 1;
  }

  public resize(width: number, height: number) {
    if (this._config.width === width && this._config.height === height) return;

    this._config.width = width;
    this._config.height = height;

    this.targets.forEach(target => target.setSize(width, height));
  }

  public reallocate(newConfig: Partial<GPUResourceConfig>) {
    this._config = { ...this._config, ...newConfig };
    this.targets.forEach(target => target.dispose());
    this.targets = GPUResourceManager.createRenderTargets(this._config);
    this.readIndex = 0;
  }

  clear(gl: THREE.WebGLRenderer, requiredRenderTarget = gl.getRenderTarget()) {
    this.targets.forEach(target => {
      gl.setRenderTarget(target);
      gl.clear(true, true, true);
    });
    this.readIndex = 0;
    gl.setRenderTarget(requiredRenderTarget);
  }

  public dispose() {
    this.targets.forEach(target => target.dispose());
  }

  private static createRenderTargets(config: GPUResourceConfig) {
    return [
      GPUResourceManager.createRenderTarget(config),
      GPUResourceManager.createRenderTarget(config),
    ] satisfies GPUResourceManager['targets'];
  }
  private static createRenderTarget(config: GPUResourceConfig) {
    return new THREE.WebGLRenderTarget<THREE.DataTexture>(config.width, config.height, {
      count: config.count,
      type: config.type,
      minFilter: config.minFilter,
      magFilter: config.magFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }
}
