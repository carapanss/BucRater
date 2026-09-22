import { invoke } from '@tauri-apps/api/core';
import type { Book, BookFilter, BookUpdate, NewBook } from '../types';

export const addBook = (newBook: NewBook) => invoke<Book>('add_book', { newBook });

export const updateBook = (uuid: string, changes: BookUpdate) =>
  invoke<Book>('update_book', { uuid, changes });

export const setBookCover = (uuid: string, coverUrl: string) =>
  invoke<Book>('set_book_cover', { uuid, coverUrl });

export const deleteBook = (id: number) => invoke<void>('delete_book', { id });

export const getBook = (id: number) => invoke<Book | null>('get_book', { id });

export const listBooks = (filter: BookFilter) => invoke<Book[]>('list_books', { filter });

export const setBookTags = (uuid: string, tagIds: number[]) =>
  invoke<void>('set_book_tags', { uuid, tagIds });

export const incrementReread = (bookId: number) => invoke<Book>('increment_reread', { bookId });

export const decrementReread = (bookId: number) => invoke<Book>('decrement_reread', { bookId });
