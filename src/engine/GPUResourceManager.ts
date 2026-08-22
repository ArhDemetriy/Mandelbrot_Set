import {
  type DataTexture,
  FloatType,
  type MagnificationTextureFilter,
  NearestFilter,
  type TextureDataType,
  type TextureFilter,
  WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';

/** Конфигурация FBO для конкретной стратегии рендера */
interface GPUResourceConfig {
  width: number;
  height: number;
  count: number;
  type: TextureDataType;
  minFilter: TextureFilter;
  magFilter: MagnificationTextureFilter;
}

export class GPUResourceManager {
  private targets: [WebGLRenderTarget<DataTexture>, WebGLRenderTarget<DataTexture>];
  private readIndex: 0 | 1 = 0;
  private _config: GPUResourceConfig;

  constructor(
    options: Pick<GPUResourceConfig, 'width' | 'height'> & Partial<Omit<GPUResourceConfig, 'width' | 'height'>>
  ) {
    this._config = {
      width: options.width,
      height: options.height,
      count: options.count ?? 3,
      type: options.type ?? FloatType,
      minFilter: options.minFilter ?? NearestFilter,
      magFilter: options.magFilter ?? NearestFilter,
    };
    this.targets = GPUResourceManager.createRenderTargets(this._config);
  }

  public get currentTextures() {
    return this.targets[this.readIndex].textures;
  }
  public get readTarget() {
    return this.targets[this.readIndex];
  }
  public get writeTarget() {
    return this.targets[1 - this.readIndex];
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

  public clear(gl: WebGLRenderer, requiredRenderTarget = gl.getRenderTarget()) {
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
    return new WebGLRenderTarget<DataTexture>(config.width, config.height, {
      count: config.count,
      type: config.type,
      minFilter: config.minFilter,
      magFilter: config.magFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }
}
