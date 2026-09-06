import { invoke } from '@tauri-apps/api/core';
import type { Book, BookFilter, BookUpdate, NewBook } from '../types';

export const addBook = (newBook: NewBook) => invoke<Book>('add_book', { newBook });

export const updateBook = (id: number, changes: BookUpdate) =>
  invoke<Book>('update_book', { id, changes });

export const deleteBook = (id: number) => invoke<void>('delete_book', { id });

export const getBook = (id: number) => invoke<Book | null>('get_book', { id });

export const listBooks = (filter: BookFilter) => invoke<Book[]>('list_books', { filter });

export const setBookTags = (bookId: number, tagIds: number[]) =>
  invoke<void>('set_book_tags', { bookId, tagIds });

export const incrementReread = (bookId: number) => invoke<Book>('increment_reread', { bookId });
