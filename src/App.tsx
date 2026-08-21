import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';

import { FractalMesh } from '@/components/Canvas/FractalMesh';
import { NavigationControls } from '@/components/Canvas/NavigationControls';
import { ControlPanel } from '@/components/ui/ControlPanel';

export function App() {
  return (
    <main className="relative h-screen w-screen touch-none overflow-hidden bg-black select-none">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        gl={{
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        frameloop="demand"
        className="touch-none"
      >
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

(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  if (media.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  media.addEventListener('change', e => {
    const newIsDark = e.matches;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
})();
