import { getDefaultStore } from 'jotai';

let str: ReturnType<typeof getDefaultStore>;
export function getStore() {
  return str ?? (str = getDefaultStore());
}
