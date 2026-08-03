import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

import { FractalMesh } from '@/components/Canvas/FractalMesh';
import { NavigationControls } from '@/components/Canvas/NavigationControls';
import { ControlPanel } from '@/components/ui/ControlPanel';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black select-none">
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }} gl={{ powerPreference: 'high-performance' }} frameloop="demand">
        <color attach="background" args={['#000000']} />
        {/* Мониторинг производительности (FPS / GPU) */}
        <Perf position="top-left" minimal />
        <FractalMesh />
        <NavigationControls />
      </Canvas>
      <ControlPanel />
    </main>
  );
}
