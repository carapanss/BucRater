import { create } from 'zustand';
import * as tagsApi from '../api/tags';
import { errorMessage, useToastStore } from './useToastStore';
import type { Tag } from '../types';

interface TagsState {
  tags: Tag[];
  loading: boolean;
  load: () => Promise<void>;
  create: (name: string, color: string | null) => Promise<Tag>;
  rename: (id: number, name: string, color: string | null) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

function reportError(action: string, err: unknown): never {
  useToastStore.getState().push(`${action}: ${errorMessage(err)}`, 'error');
  throw err;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const tags = await tagsApi.listTags();
      set({ tags, loading: false });
    } catch (err) {
      set({ loading: false });
      reportError('No se pudieron cargar los tags', err);
    }
  },
  create: async (name, color) => {
    try {
      const tag = await tagsApi.createTag(name, color);
      set({ tags: [...get().tags, tag].sort((a, b) => a.name.localeCompare(b.name)) });
      return tag;
    } catch (err) {
      return reportError('No se pudo crear el tag', err);
    }
  },
  rename: async (id, name, color) => {
    try {
      const updated = await tagsApi.renameTag(id, name, color);
      set({ tags: get().tags.map((t) => (t.id === id ? updated : t)) });
    } catch (err) {
      reportError('No se pudo renombrar el tag', err);
    }
  },
  remove: async (id) => {
    try {
      await tagsApi.deleteTag(id);
      set({ tags: get().tags.filter((t) => t.id !== id) });
    } catch (err) {
      reportError('No se pudo eliminar el tag', err);
    }
  },
}));
