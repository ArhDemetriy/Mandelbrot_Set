import { atom } from 'jotai';

export type ColorPalette = 'classic' | 'fire' | 'electric' | 'psychedelic' | 'monochrome';

const DEFAULT_STATE: {
  offset: [number, number];
  zoom: number;
  maxIterations: number;
  palette: ColorPalette;
  moveSpeed: number;
} = {
  offset: [-0.5, 0.0], // Центрируем по умолчанию на интересную часть множества
  zoom: 1.0,
  maxIterations: 400,
  palette: 'electric',
  moveSpeed: 1.5,
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
