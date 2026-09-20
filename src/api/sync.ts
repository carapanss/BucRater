import { invoke } from '@tauri-apps/api/core';

export interface SyncResult {
  connected: boolean;
  changed: boolean;
  bookCount: number;
}

export const syncLibrary = () => invoke<SyncResult>('sync_library');
