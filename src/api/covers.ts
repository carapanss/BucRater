import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import type { Book } from '../types';

/** Descarga una portada remota y la guarda localmente; devuelve la ruta local absoluta. */
export const cacheCover = (url: string, bookUuid: string) =>
  invoke<string>('cache_cover', { url, bookUuid });

/** Copia una portada elegida desde el dispositivo y devuelve su ruta local. */
export const importCover = (sourcePath: string, bookUuid: string) =>
  invoke<string>('import_cover', { sourcePath, bookUuid });

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

/**
 * Recupera candidatas para libros antiguos que se guardaron sin `coverUrl`.
 * La consulta se hace en el proceso nativo para no depender de CORS del WebView.
 */
type CoverLookupBook = Pick<Book, 'title' | 'author' | 'googleBooksId'>;
type CoverLookupTask = {
  book: CoverLookupBook;
  resolve: (urls: string[]) => void;
  reject: (error: unknown) => void;
};

const lookupCache = new Map<string, Promise<string[]>>();
const lookupQueue: CoverLookupTask[] = [];
let activeLookups = 0;
const MAX_PARALLEL_LOOKUPS = 3;

function lookupKey(book: CoverLookupBook): string {
  return book.googleBooksId ?? `${book.title}\u0000${book.author}`;
}

function runNextLookup() {
  while (activeLookups < MAX_PARALLEL_LOOKUPS && lookupQueue.length > 0) {
    const task = lookupQueue.shift();
    if (!task) return;
    activeLookups += 1;
    invoke<string[]>('lookup_cover_urls', {
      title: task.book.title,
      author: task.book.author,
      identifier: task.book.googleBooksId,
    })
      .then(task.resolve, task.reject)
      .finally(() => {
        activeLookups -= 1;
        runNextLookup();
      });
  }
}

export function lookupCoverUrls(book: CoverLookupBook): Promise<string[]> {
  const key = lookupKey(book);
  const cached = lookupCache.get(key);
  if (cached) return cached;

  const promise = new Promise<string[]>((resolve, reject) => {
    lookupQueue.push({ book, resolve, reject });
    runNextLookup();
  });
  lookupCache.set(key, promise);
  return promise;
}
