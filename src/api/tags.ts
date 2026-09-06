import { invoke } from '@tauri-apps/api/core';
import type { Tag } from '../types';

export const listTags = () => invoke<Tag[]>('list_tags');

export const createTag = (name: string, color: string | null) =>
  invoke<Tag>('create_tag', { name, color });

export const renameTag = (id: number, name: string, color: string | null) =>
  invoke<Tag>('rename_tag', { id, name, color });

export const deleteTag = (id: number) => invoke<void>('delete_tag', { id });
