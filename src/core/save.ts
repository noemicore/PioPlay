import { type PetState, newPet } from './pet';

const KEY = 'pio.save';
const VERSION = 1;

interface SaveFile {
  v: number;
  pet: PetState;
}

/** Lo mínimo que necesitamos de localStorage, para poder probarlo sin navegador. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadPet(store: KeyValueStore, now: number): PetState {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return newPet(now);
    const data = JSON.parse(raw) as SaveFile;
    if (data.v !== VERSION || typeof data.pet?.updatedAt !== 'number') return newPet(now);
    return data.pet;
  } catch {
    return newPet(now);
  }
}

export function savePet(store: KeyValueStore, pet: PetState): void {
  const data: SaveFile = { v: VERSION, pet };
  store.setItem(KEY, JSON.stringify(data));
}
