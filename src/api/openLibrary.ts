import type { GoogleBooksSuggestion } from '../types';

interface OpenLibraryDoc {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  language?: string[];
  cover_i?: number;
}

export async function searchOpenLibrary(
  query: string,
  signal: AbortSignal,
): Promise<GoogleBooksSuggestion[]> {
  const url = `https://openlibrary.org/search.json?limit=6&fields=key,title,author_name,first_publish_year,number_of_pages_median,language,cover_i&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Open Library respondió ${res.status}`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const docs = data.docs ?? [];

  return docs
    .map(
      (doc): GoogleBooksSuggestion => ({
        googleBooksId: doc.key,
        title: doc.title ?? '',
        author: (doc.author_name ?? []).join(', '),
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        pageCount: doc.number_of_pages_median ?? null,
        publicationYear: doc.first_publish_year ?? null,
        language: doc.language?.[0] ?? null,
      }),
    )
    .filter((s) => s.title.length > 0);
}
