import type { GoogleBooksSuggestion } from '../types';

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  pageCount?: number;
  publishedDate?: string;
  language?: string;
  imageLinks?: { thumbnail?: string };
}

interface GoogleBooksItem {
  id: string;
  volumeInfo?: GoogleBooksVolumeInfo;
}

export async function searchGoogleBooks(
  query: string,
  signal: AbortSignal,
): Promise<GoogleBooksSuggestion[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?maxResults=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('demasiadas peticiones a Google Books, espera unos segundos');
    }
    throw new Error(`Google Books respondió ${res.status}`);
  }

  const data = (await res.json()) as { items?: GoogleBooksItem[] };
  const items = data.items ?? [];

  const suggestions = items
    .map((item): GoogleBooksSuggestion => {
      const info = item.volumeInfo ?? {};
      const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : NaN;
      return {
        googleBooksId: item.id,
        title: info.title ?? '',
        author: (info.authors ?? []).join(', '),
        coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
        pageCount: info.pageCount ?? null,
        publicationYear: Number.isFinite(year) ? year : null,
        language: info.language ?? null,
      };
    })
    .filter((s) => s.title.length > 0);

  return suggestions;
}
