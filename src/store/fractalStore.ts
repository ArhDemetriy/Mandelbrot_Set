import { atom, type ExtractAtomValue, getDefaultStore } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { Vector3 } from 'three';
import { debounce } from 'lodash-es';

export type ColorPalette = 'classic' | 'fire' | 'electric' | 'psychedelic' | 'monochrome' | 'custom';

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

const store = getDefaultStore();

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
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);

  const offset = store.get(offsetAtom);
  params.set('x', offset[0].toPrecision(16));
  params.set('y', offset[1].toPrecision(16));

  const z = store.get(zoomAtom);
  const zoom = z < 1e6 ? Number(z.toPrecision(8)).toString() : z.toExponential(8).replace('e+', 'e');
  params.set('z', zoom);

  const url = new URL(window.location.toString());
  url.search = params.toString();
  window.history.replaceState(null, '', url);
}, 150);
store.sub(zoomAtom, debouncedUpdateUrl);
store.sub(offsetAtom, debouncedUpdateUrl);

export const setZoomAtom = atom(null, (_get, set, zoom: ExtractAtomValue<typeof zoomAtom>) => {
  set(zoomAtom, zoom);
});

export const setOffsetAtom = atom(null, (_get, set, offset: ExtractAtomValue<typeof offsetAtom>) => {
  set(offsetAtom, offset);
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
    case 'custom': {
      return get(customPalette);
    }
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

export const customPalette = atom({
  a: new Vector3(0.5, 0.5, 0.5),
  b: new Vector3(0.5, 0.5, 0.5),
  c: new Vector3(1.0, 1.0, 1.0),
  d: new Vector3(0.0, 0.33 * TWO_PI, 0.67 * TWO_PI),
});
