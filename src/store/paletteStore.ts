import { atomWithStorage, createJSONStorage } from 'jotai/utils';
import { Vector3 } from 'three';
import { getStore } from './getStore';
import { debounce } from 'lodash-es';

interface Palette {
  a: Vector3;
  b: Vector3;
  c: Vector3;
  d: Vector3;
}

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
} satisfies Record<string, Palette>;

export type ColorPalette = keyof typeof DEFAULT_PALETTE;

// Кастомный storage для восстановления инстансов Vector3
const vector3Storage = createJSONStorage<Palette>(() => localStorage);
vector3Storage.getItem = (key, initialValue) => {
  const stored = localStorage.getItem(key);
  if (!stored) return initialValue;
  try {
    const parsed = JSON.parse(stored);
    return {
      a: new Vector3(parsed.a.x, parsed.a.y, parsed.a.z),
      b: new Vector3(parsed.b.x, parsed.b.y, parsed.b.z),
      c: new Vector3(parsed.c.x, parsed.c.y, parsed.c.z),
      d: new Vector3(parsed.d.x, parsed.d.y, parsed.d.z),
    };
  } catch {
    return initialValue;
  }
};

const debouncedSave = debounce((key: string, value: Palette) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save palette to localStorage:', error);
  }
}, 500);
vector3Storage.setItem = (key, newValue) => {
  const snapshot: Palette = {
    a: newValue.a.clone(),
    b: newValue.b.clone(),
    c: newValue.c.clone(),
    d: newValue.d.clone(),
  };
  debouncedSave(key, snapshot);
};

/** Текущая цветовая схема */
export const paletteAtom = atomWithStorage('app_color_palette', DEFAULT_PALETTE.classic, vector3Storage);

export function setPresetPalette(key: ColorPalette) {
  const preset = DEFAULT_PALETTE[key];
  if (!preset) return;
  getStore().set(paletteAtom, preset);
}
