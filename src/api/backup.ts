import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { ImportReport } from '../types';

export async function exportBackup(): Promise<boolean> {
  const path = await save({
    defaultPath: 'bucrater-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!path) return false;
  await invoke('export_backup', { path });
  return true;
}

export async function importBackup(): Promise<ImportReport | null> {
  const path = await open({
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!path || Array.isArray(path)) return null;
  return invoke<ImportReport>('import_backup', { path });
}

export async function exportCsv(): Promise<boolean> {
  const path = await save({
    defaultPath: 'bucrater-biblioteca.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (!path) return false;
  await invoke('export_csv', { path });
  return true;
}

export async function exportMarkdown(): Promise<boolean> {
  const path = await save({
    defaultPath: 'bucrater-biblioteca.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (!path) return false;
  await invoke('export_markdown', { path });
  return true;
}
