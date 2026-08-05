import { type Material, Mesh, OrthographicCamera, PlaneGeometry, Scene, type WebGLRenderer } from 'three';

export class QuadRenderer<TMaterial extends Material | Material[] = Material | Material[]> {
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mesh = new Mesh<PlaneGeometry, TMaterial>(new PlaneGeometry(2, 2));
  constructor() {
    this.scene.add(this.mesh);
  }

  public get material() {
    return this.mesh.material;
  }
  public set material(material: TMaterial) {
    this.mesh.material = material;
  }

  /**
   * Выполняет отрисовку конкретного материала в текущий Render Target
   */
  public render(gl: WebGLRenderer, material?: TMaterial) {
    if (material) this.material = material;
    return gl.render(this.scene, this.camera);
  }
  public dispose(): void {
    this.mesh.geometry.dispose();
  }
}
