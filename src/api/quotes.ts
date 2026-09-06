import { invoke } from '@tauri-apps/api/core';
import type { Quote } from '../types';

export const listQuotes = (bookId: number) => invoke<Quote[]>('list_quotes', { bookId });

export const addQuote = (bookId: number, text: string) =>
  invoke<Quote>('add_quote', { bookId, text });

export const updateQuote = (id: number, text: string) => invoke<Quote>('update_quote', { id, text });

export const deleteQuote = (id: number) => invoke<void>('delete_quote', { id });
