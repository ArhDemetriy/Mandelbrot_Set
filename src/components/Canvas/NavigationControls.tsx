import { useFrame, useThree } from '@react-three/fiber';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

import { moveSpeedAtom, offsetAtom, zoomAtom } from '@/store/fractalStore';

export function NavigationControls() {
  const [offset, setOffset] = useAtom(offsetAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const moveSpeed = useAtomValue(moveSpeedAtom);

  const { gl, size } = useThree();

  // Храним состояние зажатых клавиш в ref, чтобы не провоцировать лишние React-ререндеры
  const keysPressed = useRef<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  // 1. Слушатели событий клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 2. Слушатель колесика мыши (Зум в точку курсора)
  useEffect(() => {
    const domElement = gl.domElement;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Вычисляем нормализованные координаты мыши (-1 до 1) с учетом Aspect Ratio
      const rect = domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const aspect = size.width / size.height;
      const uvX = (mouseX * aspect) / 2;
      const uvY = mouseY / 2;

      // Множитель зума в зависимости от прокрутки
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;

      setZoom(prevZoom => {
        const newZoom = Math.max(0.1, prevZoom * zoomFactor);

        // Пересчитываем offset так, чтобы точка под курсором осталась на месте
        setOffset(([cx, cy]) => {
          const worldX = cx + uvX / prevZoom;
          const worldY = cy + uvY / prevZoom;

          return [worldX - uvX / newZoom, worldY - uvY / newZoom];
        });

        return newZoom;
      });
    };

    domElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => domElement.removeEventListener('wheel', handleWheel);
  }, [gl, size, setZoom, setOffset]);

  // 3. Зажатие мыши для Drag & Drop
  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Только ЛКМ
      isDragging.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - lastPointerPos.current.x;
      const deltaY = e.clientY - lastPointerPos.current.y;

      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      const aspect = size.width / size.height;

      // Переводим дельту пикселей в координаты комплексной плоскости
      const moveX = (-deltaX / size.height) * aspect;
      const moveY = deltaY / size.height;

      setOffset(([x, y]) => [x + moveX / zoom, y + moveY / zoom]);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, size, zoom, setOffset]);

  // 4. Опрос нажатых клавиш каждый кадр (Game Loop)
  useFrame((_, delta) => {
    const keys = keysPressed.current;
    let dx = 0;
    let dy = 0;
    let zoomDelta = 0;

    // Движение (WASD / Стрелки)
    if (keys['KeyW'] || keys['ArrowUp']) dy += 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Зум (Q / E)
    if (keys['KeyE']) zoomDelta += 1;
    if (keys['KeyQ']) zoomDelta -= 1;

    // Обновляем позицию (скорость масштабируется дельтой времени и текущим зумом)
    if (dx !== 0 || dy !== 0) {
      const step = (moveSpeed * delta) / zoom;
      setOffset(([x, y]) => [x + dx * step, y + dy * step]);
    }

    // Обновляем зум с клавиш Q / E
    if (zoomDelta !== 0) {
      const zoomSpeed = 1.5;
      setZoom(prev => Math.max(0.1, prev * Math.exp(zoomDelta * zoomSpeed * delta)));
    }
  });

  return null; // Компонент работает только через хуки управления
}
