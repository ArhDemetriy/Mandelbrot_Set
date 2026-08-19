import { useFrame, useThree } from '@react-three/fiber';
import { useGesture } from '@use-gesture/react';
import { type ExtractAtomValue, atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useEffect } from 'react';

import { moveSpeedAtom, offsetAtom, zoomAtom } from '@/store/fractalStore';

const KEYS_WHITE_LIST = new Set([
  'KeyA',
  'ArrowLeft',
  'KeyD',
  'ArrowRight',
  'KeyW',
  'ArrowUp',
  'KeyS',
  'ArrowDown',
  'KeyE',
  'KeyQ',
]);

const keysPressedAtom = atom({} as Record<string, { keydownTimestamp: number } | undefined>);
const addKeyPressedAtom = atom(
  null,
  (get, set, key: string, payload: ExtractAtomValue<typeof keysPressedAtom>[string]) => {
    if (!KEYS_WHITE_LIST.has(key)) return;
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

const deltasAtom = atom(get => {
  const keys = get(keysPressedAtom);
  let lastActionTimestamp = Infinity;

  let dxDirection = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) dxDirection -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) dxDirection += 1;
  if (dxDirection !== 0) {
    lastActionTimestamp = Math.min(
      lastActionTimestamp,
      keys['KeyA']?.keydownTimestamp ?? Infinity,
      keys['ArrowLeft']?.keydownTimestamp ?? Infinity,
      keys['KeyD']?.keydownTimestamp ?? Infinity,
      keys['ArrowRight']?.keydownTimestamp ?? Infinity
    );
  }

  let dyDirection = 0;
  if (keys['KeyW'] || keys['ArrowUp']) dyDirection += 1;
  if (keys['KeyS'] || keys['ArrowDown']) dyDirection -= 1;
  if (dyDirection !== 0) {
    lastActionTimestamp = Math.min(
      lastActionTimestamp,
      keys['KeyW']?.keydownTimestamp ?? Infinity,
      keys['ArrowUp']?.keydownTimestamp ?? Infinity,
      keys['KeyS']?.keydownTimestamp ?? Infinity,
      keys['ArrowDown']?.keydownTimestamp ?? Infinity
    );
  }

  let zoomDirection = 0;
  if (keys['KeyE']) zoomDirection += 1;
  if (keys['KeyQ']) zoomDirection -= 1;
  if (zoomDirection !== 0) {
    lastActionTimestamp = Math.min(
      lastActionTimestamp,
      keys['KeyE']?.keydownTimestamp ?? Infinity,
      keys['KeyQ']?.keydownTimestamp ?? Infinity
    );
  }

  return {
    dxDirection: dxDirection as 0 | -1 | 1,
    dyDirection: dyDirection as 0 | -1 | 1,
    zoomDirection: zoomDirection as 0 | -1 | 1,
    lastActionTimestamp,
  };
});

export function NavigationControls() {
  const { gl, invalidate } = useThree();

  const setOffset = useSetAtom(offsetAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const moveSpeed = useAtomValue(moveSpeedAtom);

  const addKeyPressed = useSetAtom(addKeyPressedAtom);
  const delKeyPressed = useSetAtom(delKeyPressedAtom);
  const getDeltas = useAtomCallback(useCallback(get => get(deltasAtom), []));

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

  useFrame((_, delta) => {
    const now = performance.now();

    const { dxDirection, dyDirection, zoomDirection, lastActionTimestamp } = getDeltas();
    const isNoShift = dxDirection === 0 && dyDirection === 0;
    if (isNoShift && zoomDirection == 0) return;

    const safetyDelta = Math.min(delta, Math.max(0, now - lastActionTimestamp) / 1000);
    if (safetyDelta <= 0) return;

    if (dxDirection === 0 && dyDirection === 0) {
      const zoomSpeed = 1.5;
      setZoom(prev => Math.max(0.1, prev * Math.exp(zoomSpeed * zoomDirection * safetyDelta)));
      return;
    }

    const step = (moveSpeed * safetyDelta) / zoom;
    setOffset(([x, y]) => [x + dxDirection * step, y + dyDirection * step]);
  });

  return null;
}
