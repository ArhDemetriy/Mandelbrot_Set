import { atom } from 'jotai';
import { Vector3 } from 'three';

export type ColorPalette = 'classic' | 'fire' | 'electric' | 'psychedelic' | 'monochrome';

const DEFAULT_STATE: {
  offset: [number, number];
  zoom: number;
  maxIterations: number;
  palette: ColorPalette;
  moveSpeed: number;
} = {
  offset: [-1.5, -0.5],
  zoom: 1.0,
  maxIterations: 200,
  palette: 'classic',
  moveSpeed: 1.0,
};

/** Координаты центра экрана в комплексной плоскости */
export const offsetAtom = atom(DEFAULT_STATE.offset);
/** Масштаб (чем больше значение, тем сильнее приближение) */
export const zoomAtom = atom(DEFAULT_STATE.zoom);
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
});

const TWO_PI = 2.0 * Math.PI;
export const paletteMapAtom = atom(get => {
  switch (get(paletteAtom)) {
    case 'fire':
      return {
        a: new Vector3(0.5, 0.5, 0.5),
        b: new Vector3(0.5, 0.5, 0.5),
        c: new Vector3(2.0, 1.0, 0.0),
        d: new Vector3(0.5 * TWO_PI, 0.2 * TWO_PI, 0.25 * TWO_PI),
      };
    case 'electric':
      return {
        a: new Vector3(0.8, 0.5, 0.4),
        b: new Vector3(0.2, 0.4, 0.2),
        c: new Vector3(2.0, 1.0, 1.0),
        d: new Vector3(0.0, 0.25 * TWO_PI, 0.25 * TWO_PI),
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
