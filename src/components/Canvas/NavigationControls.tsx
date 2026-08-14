import { useFrame, useThree } from '@react-three/fiber';
import { useGesture } from '@use-gesture/react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

import { moveSpeedAtom, offsetAtom, zoomAtom } from '@/store/fractalStore';

export function NavigationControls() {
  const setOffset = useSetAtom(offsetAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const moveSpeed = useAtomValue(moveSpeedAtom);

  const { gl, size, invalidate } = useThree();

  // Состояние зажатых клавиш для клавиатуры (WASD / Arrow / Q / E)
  const keysPressed = useRef<Record<string, boolean>>({});

  // 1. Слушатели клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      invalidate();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
      invalidate();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [invalidate]);

  // Вспомогательная функция для перевода пиксельных координат экрана в UV-пространство Canvas
  const getUvCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      const aspect = size.width / size.height;
      return {
        uvX: (mouseX * aspect) / 2,
        uvY: mouseY / 2,
      };
    },
    [gl.domElement, size]
  );

  // 2. Обработка жестов мыши и тач-устройств с помощью @use-gesture/react
  useGesture(
    {
      // --- Панорамирование (Drag: 1 палец / ЛКМ) ---
      onDrag: ({ delta: [dx, dy], event, touches }) => {
        // Если на экране больше одного пальца, отдаём приоритет Pinch Zoom
        if (touches > 1) return;
        event.preventDefault();

        const aspect = size.width / size.height;
        const moveX = (-dx / size.height) * aspect;
        const moveY = dy / size.height;

        setOffset(([x, y]) => [x + moveX / zoom, y + moveY / zoom]);
      },

      // --- Масштабирование двумя пальцами (Pinch Zoom) ---
      onPinch: ({ offset, origin: [ox, oy], event, memo }) => {
        event.preventDefault();

        // При старте жеста запоминаем начальные значения в memo
        const initial = memo ?? {
          zoom,
          offset,
        };

        const newZoom = Math.max(0.1, initial.zoom * offset[0]);
        const { uvX, uvY } = getUvCoords(ox, oy);

        // Фиксируем мировые координаты точки под центром пальцев на момент начала жеста
        const worldX = initial.offset[0] + uvX / initial.zoom;
        const worldY = initial.offset[1] + uvY / initial.zoom;

        setZoom(newZoom);
        setOffset([worldX - uvX / newZoom, worldY - uvY / newZoom]);

        return initial; // Возвращаем initial, чтобы сохранить его в memo на весь период жеста
      },

      // --- Масштабирование колёсиком мыши (Wheel Zoom) ---
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();

        const wheelEvent = event as WheelEvent;
        const { uvX, uvY } = getUvCoords(wheelEvent.clientX, wheelEvent.clientY);

        // Множитель зума в зависимости от направления прокрутки
        const zoomFactor = dy < 0 ? 1.15 : 1 / 1.15;

        setZoom(prevZoom => {
          const newZoom = Math.max(0.1, prevZoom * zoomFactor);

          setOffset(([cx, cy]) => {
            const worldX = cx + uvX / prevZoom;
            const worldY = cy + uvY / prevZoom;
            return [worldX - uvX / newZoom, worldY - uvY / newZoom];
          });

          return newZoom;
        });
      },
    },
    {
      target: gl.domElement, // Привязываем обработчики непосредственно к DOM-элементу Canvas
      eventOptions: { passive: false }, // Обязательно для блокировки системной прокрутки/зума браузера
      drag: {
        filterTaps: true, // Игнорирует быстрые клики/тапы без движения
      },
    }
  );

  // 3. Опрос клавиатуры на каждом кадре (Game Loop)
  useFrame((_, delta) => {
    const keys = keysPressed.current;
    let dx = 0;
    let dy = 0;
    let zoomDelta = 0;

    if (keys['KeyW'] || keys['ArrowUp']) dy += 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (keys['KeyE']) zoomDelta += 1;
    if (keys['KeyQ']) zoomDelta -= 1;

    if (dx !== 0 || dy !== 0) {
      const step = (moveSpeed * delta) / zoom;
      setOffset(([x, y]) => [x + dx * step, y + dy * step]);
    }

    if (zoomDelta !== 0) {
      const zoomSpeed = 1.5;
      setZoom(prev => Math.max(0.1, prev * Math.exp(zoomDelta * zoomSpeed * delta)));
    }
  });

  return null;
}
