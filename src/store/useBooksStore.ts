import { create } from 'zustand';
import * as booksApi from '../api/books';
import { errorMessage, useToastStore } from './useToastStore';
import type { Book, BookFilter, BookUpdate, NewBook } from '../types';

interface BooksState {
  books: Book[];
  filter: BookFilter;
  loading: boolean;
  setFilter: (filter: BookFilter) => void;
  load: () => Promise<void>;
  add: (newBook: NewBook) => Promise<Book>;
  update: (uuid: string, changes: BookUpdate) => Promise<Book>;
  setCover: (uuid: string, coverUrl: string) => Promise<Book>;
  remove: (id: number) => Promise<void>;
  setTags: (uuid: string, tagIds: number[]) => Promise<void>;
  incrementReread: (bookId: number) => Promise<void>;
  decrementReread: (bookId: number) => Promise<void>;
}

function reportError(action: string, err: unknown): never {
  useToastStore.getState().push(`${action}: ${errorMessage(err)}`, 'error');
  throw err;
}

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  filter: {},
  loading: false,
  setFilter: (filter) => {
    set({ filter });
    void get().load();
  },
  load: async () => {
    set({ loading: true });
    try {
      const books = await booksApi.listBooks(get().filter);
      set({ books, loading: false });
    } catch (err) {
      set({ loading: false });
      reportError('No se pudo cargar la biblioteca', err);
    }
  },
  add: async (newBook) => {
    try {
      const book = await booksApi.addBook(newBook);
      await get().load();
      return book;
    } catch (err) {
      return reportError('No se pudo añadir el libro', err);
    }
  },
  update: async (uuid, changes) => {
    try {
      const book = await booksApi.updateBook(uuid, changes);
      await get().load();
      return book;
    } catch (err) {
      return reportError('No se pudo actualizar el libro', err);
    }
  },
  setCover: async (uuid, coverUrl) => {
    const book = await booksApi.setBookCover(uuid, coverUrl);
    set((state) => ({
      books: state.books.map((current) => (current.uuid === uuid ? book : current)),
    }));
    return book;
  },
  remove: async (id) => {
    try {
      await booksApi.deleteBook(id);
      await get().load();
    } catch (err) {
      reportError('No se pudo eliminar el libro', err);
    }
  },
  setTags: async (uuid, tagIds) => {
    try {
      await booksApi.setBookTags(uuid, tagIds);
      await get().load();
    } catch (err) {
      reportError('No se pudieron guardar los tags', err);
    }
  },
  incrementReread: async (bookId) => {
    try {
      await booksApi.incrementReread(bookId);
      await get().load();
    } catch (err) {
      reportError('No se pudo registrar la relectura', err);
    }
  },
  decrementReread: async (bookId) => {
    try {
      await booksApi.decrementReread(bookId);
      await get().load();
    } catch (err) {
      reportError('No se pudo corregir la relectura', err);
    }
  },
}));
