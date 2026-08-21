import { atom, type ExtractAtomValue } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { Vector3 } from 'three';
import { debounce } from 'lodash-es';

export type ColorPalette = 'classic' | 'fire' | 'electric' | 'psychedelic' | 'monochrome';

const DEFAULT_STATE: {
  offset: [number, number];
  zoom: number;
  maxIterations: number;
  palette: ColorPalette;
  moveSpeed: number;
} = {
  offset: [-0.75, -0.0],
  zoom: 1.0,
  maxIterations: 20,
  palette: 'classic',
  moveSpeed: 1.0,
};

export const {
  /** Координаты центра экрана в комплексной плоскости */
  offsetAtom,
  /** Масштаб (чем больше значение, тем сильнее приближение) */
  zoomAtom,
} = (() => {
  const getInitialUrlParams = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const x = parseFloat(params.get('x') ?? '');
    const y = parseFloat(params.get('y') ?? '');
    const z = parseFloat(params.get('z') ?? '');

    return {
      offset: !isNaN(x) && !isNaN(y) ? ([x, y] as [number, number]) : null,
      zoom: !isNaN(z) && z > 0 ? z : null,
    };
  };
  const initialParams = getInitialUrlParams();

  return {
    offsetAtom: atomWithDefault(() => initialParams?.offset ?? DEFAULT_STATE.offset),
    zoomAtom: atomWithDefault(() => initialParams?.zoom ?? DEFAULT_STATE.zoom),
  };
})();

const debouncedUpdateUrl = debounce(() => {
  offsetAtom;
  zoomAtom;
}, 150);

export const setZoomAtom = atom(null, (_get, set, zoom: ExtractAtomValue<typeof zoomAtom>) => {
  set(zoomAtom, zoom);
  debouncedUpdateUrl();
});

export const setOffsetAtom = atom(null, (_get, set, offset: ExtractAtomValue<typeof offsetAtom>) => {
  set(offsetAtom, offset);
  debouncedUpdateUrl();
});

/** Максимальное количество итераций (точность/детализация) */
export const maxIterationsAtom = atom(DEFAULT_STATE.maxIterations);
/** Текущая цветовая схема */
export const paletteAtom = atom(DEFAULT_STATE.palette);
/** Скорость перемещения при нажатии WASD */
export const moveSpeedAtom = atom(DEFAULT_STATE.moveSpeed);

/** Экшен-атом для сброса вида к начальным настройкам */
export const resetViewAtom = atom(null, (_get, set) => {
  set(offsetAtom, DEFAULT_STATE.offset);
  set(zoomAtom, DEFAULT_STATE.zoom);
  set(resetEventAtom, prev => prev + 1);
});
export const resetEventAtom = atom(0);

const TWO_PI = 2.0 * Math.PI;
export const paletteMapAtom = atom(get => {
  switch (get(paletteAtom)) {
    case 'fire':
      return {
        a: new Vector3(0.8, 0.5, 0.4),
        b: new Vector3(0.2, 0.4, 0.2),
        c: new Vector3(2.0, 1.0, 1.0),
        d: new Vector3(0.0, 0.25 * TWO_PI, 0.25 * TWO_PI),
      };
    case 'electric':
      return {
        a: new Vector3(0.5, 0.5, 0.5),
        b: new Vector3(0.5, 0.5, 0.5),
        c: new Vector3(2.0, 1.0, 0.0),
        d: new Vector3(0.5 * TWO_PI, 0.2 * TWO_PI, 0.25 * TWO_PI),
      };
    case 'psychedelic':
      return {
        a: new Vector3(0.5, 0.5, 0.5),
        b: new Vector3(0.5, 0.5, 0.5),
        c: new Vector3(2.0, 2.0, 1.0),
        d: new Vector3(0.0, 0.1 * TWO_PI, 0.2 * TWO_PI),
      };
    case 'monochrome':
      return {
        a: new Vector3(0.5, 0.5, 0.5),
        b: new Vector3(0.5, 0.5, 0.5),
        c: new Vector3(1.0, 1.0, 1.0),
        d: new Vector3(0.0, 0.0, 0.0),
      };
    case 'classic':
    default:
      return {
        a: new Vector3(0.5, 0.5, 0.5),
        b: new Vector3(0.5, 0.5, 0.5),
        c: new Vector3(1.0, 1.0, 1.0),
        d: new Vector3(0.0, 0.33 * TWO_PI, 0.67 * TWO_PI),
      };
  }
});
