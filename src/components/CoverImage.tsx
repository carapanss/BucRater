import { useEffect, useRef, useState } from 'react';
import type { Book } from '../types';
import { cacheCover, lookupCoverUrls, resolveCoverSrc } from '../api/covers';
import { useBooksStore } from '../store/useBooksStore';

type CoverBook = Pick<Book, 'id' | 'uuid' | 'title' | 'author' | 'coverUrl' | 'googleBooksId'>;

const coverCachePromises = new Map<string, Promise<unknown>>();

function isRemoteUrl(source: string): boolean {
  return source.startsWith('http://') || source.startsWith('https://');
}

function cacheRemoteCover(book: CoverBook, url: string, setCover: (uuid: string, coverUrl: string) => Promise<Book>) {
  const key = `${book.uuid}\u0000${url}`;
  const cached = coverCachePromises.get(key);
  if (cached) return cached;

  const promise = cacheCover(url, book.uuid)
    .then((localPath) => setCover(book.uuid, localPath))
    .catch((error: unknown) => {
      coverCachePromises.delete(key);
      throw error;
    });
  coverCachePromises.set(key, promise);
  return promise;
}

export function CoverImage({ book }: { book: CoverBook }) {
  const setCover = useBooksStore((state) => state.setCover);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sources, setSources] = useState<string[]>(() => {
    const source = resolveCoverSrc(book.coverUrl);
    return source ? [source] : [];
  });
  const [sourceIndex, setSourceIndex] = useState(0);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupTrigger, setLookupTrigger] = useState(0);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const savedSource = resolveCoverSrc(book.coverUrl);
    setSources(savedSource ? [savedSource] : []);
    setSourceIndex(0);

    // Las portadas remotas antiguas también se descargan ahora al dispositivo. Las locales
    // no necesitan una consulta de red.
    if (savedSource && !isRemoteUrl(savedSource)) {
      setLookupLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // Las portadas ya guardadas no necesitan otra consulta. Si fallan, el manejador de
    // error incrementa lookupTrigger y entonces buscamos una alternativa.
    if (savedSource && lookupTrigger === 0) {
      setLookupLoading(false);
      return () => {
        cancelled = true;
      };
    }

    // No hacemos búsquedas para todas las tarjetas al arrancar: solo para las visibles
    // (y un margen cercano), evitando bloquear la red y el renderizado de la biblioteca.
    if (!isVisible) {
      setLookupLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLookupLoading(true);
    void lookupCoverUrls(book)
      .then((urls) => {
        if (!cancelled) {
          setSources((current) => {
            const candidates = urls.map((url) => resolveCoverSrc(url) ?? url);
            return [...current, ...candidates.filter((candidate) => !current.includes(candidate))];
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && !(error instanceof DOMException && error.name === 'AbortError')) {
          // La tarjeta mantiene la portada guardada, si existía, o muestra el estado vacío.
        }
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book.author, book.coverUrl, book.googleBooksId, book.title, isVisible, lookupTrigger]);

  const source = sources[sourceIndex];
  if (!source) {
    return (
      <div ref={rootRef} className="cover-image-root">
        <span>{lookupLoading ? 'Buscando portada…' : 'Sin portada'}</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="cover-image-root">
      <img
        src={source}
        alt={book.title}
        onLoad={() => {
          if (isRemoteUrl(source)) {
            void cacheRemoteCover(book, source, setCover).catch(() => {
              // Si la caché falla, la imagen remota sigue visible como respaldo.
            });
          }
        }}
        onError={() => {
          if (sourceIndex < sources.length - 1) {
            setSourceIndex((index) => index + 1);
          } else if (lookupTrigger === 0) {
            setLookupTrigger((trigger) => trigger + 1);
          }
        }}
      />
    </div>
  );
}
