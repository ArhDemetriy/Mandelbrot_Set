import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

import { FractalMesh } from '@/components/Canvas/FractalMesh';
import { NavigationControls } from '@/components/Canvas/NavigationControls';
import { ControlPanel } from '@/components/ui/ControlPanel';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* 1. 3D Canvas / Фрактальная сцена */}
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#000000']} />

        {/* Мониторинг производительности (FPS / GPU) */}
        <Perf position="top-left" />

        <FractalMesh />
        <NavigationControls />
      </Canvas>

      {/* 2. Реакт-интерфейс управления */}
      <ControlPanel />
    </main>
  );
}
