import { useEffect, useRef, useState } from 'react';
import { searchBooks } from '../api/bookSearch';
import type { GoogleBooksSuggestion } from '../types';
import { useDebouncedValue } from './useDebouncedValue';

export function useGoogleBooksSearch(query: string) {
  const debounced = useDebouncedValue(query, 450);
  const [suggestions, setSuggestions] = useState<GoogleBooksSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const trimmed = debounced.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    searchBooks(trimmed, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) setSuggestions(results);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Google Books search failed:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced]);

  return { suggestions, loading, error, clear: () => setSuggestions([]) };
}
