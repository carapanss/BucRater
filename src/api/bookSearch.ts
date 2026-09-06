import type { GoogleBooksSuggestion } from '../types';
import { searchGoogleBooks } from './googleBooks';
import { searchOpenLibrary } from './openLibrary';

const cache = new Map<string, GoogleBooksSuggestion[]>();

export async function searchBooks(
  query: string,
  signal: AbortSignal,
): Promise<GoogleBooksSuggestion[]> {
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  let results: GoogleBooksSuggestion[];
  try {
    results = await searchGoogleBooks(query, signal);
  } catch (err) {
    if (signal.aborted) throw err;
    console.warn('Google Books falló, usando Open Library como alternativa:', err);
    results = await searchOpenLibrary(query, signal);
  }

  cache.set(key, results);
  return results;
}
