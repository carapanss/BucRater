import { invoke, convertFileSrc } from '@tauri-apps/api/core';

/** Descarga una portada remota y la guarda localmente; devuelve la ruta local absoluta. */
export const cacheCover = (url: string, bookUuid: string) =>
  invoke<string>('cache_cover', { url, bookUuid });

/**
 * Convierte el valor guardado en `coverUrl` en algo usable como `src` de una imagen: si es
 * una URL remota se deja tal cual, si es una ruta local (portada ya cacheada) se resuelve
 * con `convertFileSrc` para que el webview pueda servirla.
 */
export function resolveCoverSrc(coverUrl: string | null): string | undefined {
  if (!coverUrl) return undefined;
  if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) return coverUrl;
  return convertFileSrc(coverUrl);
}
