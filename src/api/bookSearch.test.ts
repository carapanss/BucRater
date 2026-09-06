import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchBooks } from './bookSearch';
import { searchGoogleBooks } from './googleBooks';
import { searchOpenLibrary } from './openLibrary';
import type { GoogleBooksSuggestion } from '../types';

vi.mock('./googleBooks', () => ({ searchGoogleBooks: vi.fn() }));
vi.mock('./openLibrary', () => ({ searchOpenLibrary: vi.fn() }));

function suggestion(title: string): GoogleBooksSuggestion {
  return {
    googleBooksId: title,
    title,
    author: 'Autora de prueba',
    coverUrl: null,
    pageCount: null,
    publicationYear: null,
    language: null,
  };
}

describe('searchBooks', () => {
  beforeEach(() => {
    vi.mocked(searchGoogleBooks).mockReset();
    vi.mocked(searchOpenLibrary).mockReset();
  });

  it('devuelve los resultados de Google Books cuando funciona', async () => {
    vi.mocked(searchGoogleBooks).mockResolvedValue([suggestion('Rayuela')]);

    const results = await searchBooks(`rayuela-${Date.now()}`, new AbortController().signal);

    expect(results).toEqual([suggestion('Rayuela')]);
    expect(searchOpenLibrary).not.toHaveBeenCalled();
  });

  it('recurre a Open Library si Google Books falla', async () => {
    vi.mocked(searchGoogleBooks).mockRejectedValue(new Error('503'));
    vi.mocked(searchOpenLibrary).mockResolvedValue([suggestion('Alternativa')]);

    const results = await searchBooks(`fallback-${Date.now()}`, new AbortController().signal);

    expect(results).toEqual([suggestion('Alternativa')]);
  });

  it('relanza el error si la búsqueda ya fue abortada', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(searchGoogleBooks).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(searchBooks(`aborted-${Date.now()}`, controller.signal)).rejects.toThrow();
    expect(searchOpenLibrary).not.toHaveBeenCalled();
  });

  it('cachea resultados para la misma consulta, sin distinguir mayúsculas', async () => {
    vi.mocked(searchGoogleBooks).mockResolvedValue([suggestion('Cacheado')]);
    const query = `cache-${Date.now()}`;

    await searchBooks(query, new AbortController().signal);
    await searchBooks(query.toUpperCase(), new AbortController().signal);

    expect(searchGoogleBooks).toHaveBeenCalledTimes(1);
  });
});
