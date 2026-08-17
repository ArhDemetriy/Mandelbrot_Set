import { useFrame, useThree } from '@react-three/fiber';
import { useGesture } from '@use-gesture/react';
import { type ExtractAtomValue, atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { moveSpeedAtom, offsetAtom, zoomAtom } from '@/store/fractalStore';

const keysPressedAtom = atom({} as Record<string, { keydownTimestamp: number } | undefined>);
const addKeyPressedAtom = atom(
  null,
  (get, set, key: string, payload: ExtractAtomValue<typeof keysPressedAtom>[string]) => {
    const currentState = get(keysPressedAtom);
    set(keysPressedAtom, {
      ...currentState,
      [key]: payload,
    });
  }
);
const delKeyPressedAtom = atom(null, (get, set, key: string) => {
  const currentState = get(keysPressedAtom);
  if (key in currentState)
    set(keysPressedAtom, Object.fromEntries(Object.entries(currentState).filter(({ 0: k }) => k !== key)));
});

export function NavigationControls() {
  const setOffset = useSetAtom(offsetAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const moveSpeed = useAtomValue(moveSpeedAtom);

  const { gl, invalidate } = useThree();

  const keysPressed = useAtomValue(keysPressedAtom);
  const addKeyPressed = useSetAtom(addKeyPressedAtom);
  const delKeyPressed = useSetAtom(delKeyPressedAtom);

  useEffect(() => {
    const abortController = new AbortController();

    window.addEventListener(
      'keydown',
      e => {
        addKeyPressed(e.code, { keydownTimestamp: performance.now() });
        invalidate();
      },
      { passive: true, signal: abortController.signal }
    );
    window.addEventListener(
      'keyup',
      e => {
        delKeyPressed(e.code);
        invalidate();
      },
      { passive: true, signal: abortController.signal }
    );

    return () => abortController.abort();
  }, [addKeyPressed, delKeyPressed, invalidate]);

  useGesture(
    {
      // --- Панорамирование (Drag: 1 палец / ЛКМ) ---
      onDrag: ({ event, touches }) => {
        if (touches > 1) return;
        event.preventDefault();
      },

      // --- Масштабирование двумя пальцами (Pinch Zoom) ---
      onPinch: ({ event }) => {
        event.preventDefault();
      },

      // --- Масштабирование колёсиком мыши (Wheel Zoom) ---
      onWheel: ({ event }) => {
        event.preventDefault();
      },
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
      drag: { filterTaps: true },
    }
  );

  const keysPressedRef = useRef(keysPressed);
  keysPressedRef.current = keysPressed;
  useFrame((_, delta) => {
    const now = performance.now();
    const keys = keysPressedRef.current;

    const deltaUp = Math.max(
      0,
      Math.min(keys['KeyW']?.keydownTimestamp ?? 0, keys['ArrowUp']?.keydownTimestamp ?? 0) - now
    );
    const deltaDown = Math.max(
      0,
      Math.min(keys['KeyS']?.keydownTimestamp ?? 0, keys['ArrowDown']?.keydownTimestamp ?? 0) - now
    );
    const existDeltaY = Boolean(deltaUp) != Boolean(deltaDown);

    const deltaLeft = Math.max(
      0,
      Math.min(keys['KeyA']?.keydownTimestamp ?? 0, keys['ArrowLeft']?.keydownTimestamp ?? 0) - now
    );
    const deltaRight = Math.max(
      0,
      Math.min(keys['KeyD']?.keydownTimestamp ?? 0, keys['ArrowRight']?.keydownTimestamp ?? 0) - now
    );
    const existDeltaX = Boolean(deltaLeft) != Boolean(deltaRight);

    let dxDirection = 0;
    let dyDirection = 0;

    if (keys['KeyW'] || keys['ArrowUp']) dyDirection += 1;
    if (keys['KeyS'] || keys['ArrowDown']) dyDirection -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dxDirection -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dxDirection += 1;

    if (dxDirection === 0 && dyDirection === 0) {
      // зум считаем только если нет offset
      let zoomDelta = 0;
      if (keys['KeyE']) zoomDelta += 1;
      if (keys['KeyQ']) zoomDelta -= 1;
      if (zoomDelta !== 0) {
        const zoomSpeed = 1.5;
        setZoom(prev => Math.max(0.1, prev * Math.exp(zoomDelta * zoomSpeed * delta)));
      }
    }

    const step = (moveSpeed * delta) / zoom;
    setOffset(([x, y]) => [x + dxDirection * step, y + dyDirection * step]);
  });

  return null;
}
