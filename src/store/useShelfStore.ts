import { create } from 'zustand';
import * as shelfApi from '../api/shelf';
import { errorMessage, useToastStore } from './useToastStore';
import type { NewShelfItem, ShelfItem, ShelfKind } from '../types';

interface ShelfState {
  items: ShelfItem[];
  load: () => Promise<void>;
  add: (item: NewShelfItem) => Promise<ShelfItem>;
  update: (uuid: string, changes: NewShelfItem) => Promise<ShelfItem>;
  /** Cambia un libro de estantería (p. ej. de «quiero leer» a «comprados»). */
  move: (item: ShelfItem, shelf: ShelfKind) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

function reportError(action: string, err: unknown): never {
  useToastStore.getState().push(`${action}: ${errorMessage(err)}`, 'error');
  throw err;
}

export const useShelfStore = create<ShelfState>((set, get) => ({
  items: [],
  load: async () => {
    try {
      set({ items: await shelfApi.listShelfItems() });
    } catch (err) {
      reportError('No se pudieron cargar las estanterías', err);
    }
  },
  add: async (item) => {
    try {
      const created = await shelfApi.addShelfItem(item);
      await get().load();
      return created;
    } catch (err) {
      return reportError('No se pudo guardar el libro', err);
    }
  },
  update: async (uuid, changes) => {
    try {
      const updated = await shelfApi.updateShelfItem(uuid, changes);
      await get().load();
      return updated;
    } catch (err) {
      return reportError('No se pudo actualizar el libro', err);
    }
  },
  move: async (item, shelf) => {
    const { id: _id, uuid: _uuid, createdAt: _c, updatedAt: _u, ...rest } = item;
    await get().update(item.uuid, { ...rest, shelf });
  },
  remove: async (id) => {
    try {
      await shelfApi.deleteShelfItem(id);
      await get().load();
    } catch (err) {
      reportError('No se pudo quitar el libro', err);
    }
  },
}));
