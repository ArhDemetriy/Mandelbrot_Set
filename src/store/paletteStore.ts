import { atom } from 'jotai';
import { Vector3 } from 'three';
import { getStore } from './getStore';

const TWO_PI = 2.0 * Math.PI;
const DEFAULT_PALETTE = {
  fire: {
    a: new Vector3(0.8, 0.5, 0.4),
    b: new Vector3(0.2, 0.4, 0.2),
    c: new Vector3(2.0, 1.0, 1.0),
    d: new Vector3(0.0, 0.25 * TWO_PI, 0.25 * TWO_PI),
  },
  electric: {
    a: new Vector3(0.5, 0.5, 0.5),
    b: new Vector3(0.5, 0.5, 0.5),
    c: new Vector3(2.0, 1.0, 0.0),
    d: new Vector3(0.5 * TWO_PI, 0.2 * TWO_PI, 0.25 * TWO_PI),
  },
  psychedelic: {
    a: new Vector3(0.5, 0.5, 0.5),
    b: new Vector3(0.5, 0.5, 0.5),
    c: new Vector3(2.0, 2.0, 1.0),
    d: new Vector3(0.0, 0.1 * TWO_PI, 0.2 * TWO_PI),
  },
  monochrome: {
    a: new Vector3(0.5, 0.5, 0.5),
    b: new Vector3(0.5, 0.5, 0.5),
    c: new Vector3(1.0, 1.0, 1.0),
    d: new Vector3(0.0, 0.0, 0.0),
  },
  classic: {
    a: new Vector3(0.5, 0.5, 0.5),
    b: new Vector3(0.5, 0.5, 0.5),
    c: new Vector3(1.0, 1.0, 1.0),
    d: new Vector3(0.0, 0.33 * TWO_PI, 0.67 * TWO_PI),
  },
};

export type ColorPalette = keyof typeof DEFAULT_PALETTE;

/** Текущая цветовая схема */
export const paletteAtom = atom(DEFAULT_PALETTE.classic);

export function setPresetPalette(key: ColorPalette) {
  const preset = DEFAULT_PALETTE[key];
  if (!preset) return;
  getStore().set(paletteAtom, preset);
}
