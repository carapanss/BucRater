import { invoke } from '@tauri-apps/api/core';
import type { NewShelfItem, ShelfItem } from '../types';

export const listShelfItems = () => invoke<ShelfItem[]>('list_shelf_items', { shelf: null });

export const addShelfItem = (item: NewShelfItem) => invoke<ShelfItem>('add_shelf_item', { item });

export const updateShelfItem = (uuid: string, changes: NewShelfItem) =>
  invoke<ShelfItem>('update_shelf_item', { uuid, changes });

export const deleteShelfItem = (id: number) => invoke<void>('delete_shelf_item', { id });
