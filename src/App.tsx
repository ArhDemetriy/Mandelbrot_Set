import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

export function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      {/* R3F Canvas */}
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={['#000000']} />
        <Perf position="top-left" />
        {/* Здесь будет <FractalMesh /> и <NavigationControls /> */}
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 right-4 w-80 rounded-xl border border-border bg-background/80 p-4 shadow-lg backdrop-blur-md">
        <h2 className="mb-2 text-lg font-bold">Множество Мандельброта</h2>
        <p className="mb-4 text-xs text-muted-foreground">Управление: WASD — перемещение, Q/E или Колесико — Зум.</p>
        {/* Компоненты управления (Jotai + Base UI / Shadcn) */}
      </div>
    </div>
  );
}
