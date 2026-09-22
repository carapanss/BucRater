import { useCallback, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { AnimatePresence } from 'framer-motion';
import { useBooksStore } from '../store/useBooksStore';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { BookCard } from '../components/BookCard';
import { BookDetailView } from '../components/BookDetailView';
import { Modal } from '../components/Modal';
import { BookFormView } from './BookFormView';
import type { Book } from '../types';

export function BookListView() {
  const books = useBooksStore((s) => s.books);
  const [editing, setEditing] = useState<Book | 'new' | null>(null);
  const [editingDirty, setEditingDirty] = useState(false);
  const [selectedBookUuid, setSelectedBookUuid] = useState<string | null>(null);
  const selectedBook = books.find((book) => book.uuid === selectedBookUuid) ?? null;

  const closeEditor = useCallback(async () => {
    if (editingDirty) {
      const confirmed = await ask('Tienes cambios sin guardar. ¿Quieres salir igualmente?', {
        title: 'Cambios sin guardar',
        kind: 'warning',
      });
      if (!confirmed) return;
    }
    setEditingDirty(false);
    setEditing(null);
  }, [editingDirty]);

  return (
    <div>
      <SearchFilterBar />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSelectedBookUuid(null);
            setEditingDirty(false);
            setEditing('new');
          }}
        >
          + Añadir libro
        </button>
      </div>

      {books.length === 0 ? (
        <p className="empty-state">Todavía no has añadido ningún libro.</p>
      ) : (
        <div className="grid-books">
          <AnimatePresence initial={false}>
            {books.map((book) => (
              <BookCard key={book.uuid} book={book} onClick={() => setSelectedBookUuid(book.uuid)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {selectedBook && (
          <Modal title="Detalles del libro" onClose={() => setSelectedBookUuid(null)}>
            <BookDetailView
              book={selectedBook}
              onEdit={() => {
                setSelectedBookUuid(null);
                setEditingDirty(false);
                setEditing(selectedBook);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <Modal
            title={editing === 'new' ? 'Añadir libro' : 'Editar libro'}
            onClose={() => void closeEditor()}
          >
            <BookFormView
              book={editing === 'new' ? null : editing}
              onDirtyChange={setEditingDirty}
              onDone={() => {
                setEditingDirty(false);
                setEditing(null);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
