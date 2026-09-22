import { check, type Update } from '@tauri-apps/plugin-updater';

export type { Update };

// Un chequeo de GitHub no debe dejar la interfaz esperando indefinidamente si no hay
// conexión o el endpoint todavía no está publicado.
export const checkForUpdate = (timeout = 6000) => check({ timeout });
