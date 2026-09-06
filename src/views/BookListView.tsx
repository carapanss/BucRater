import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBooksStore } from '../store/useBooksStore';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { BookCard } from '../components/BookCard';
import { Modal } from '../components/Modal';
import { BookFormView } from './BookFormView';
import type { Book } from '../types';

export function BookListView() {
  const books = useBooksStore((s) => s.books);
  const load = useBooksStore((s) => s.load);
  const [editing, setEditing] = useState<Book | 'new' | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <SearchFilterBar />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          + Añadir libro
        </button>
      </div>

      {books.length === 0 ? (
        <p className="empty-state">Todavía no has añadido ningún libro.</p>
      ) : (
        <div className="grid-books">
          <AnimatePresence initial={false}>
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setEditing(book)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <Modal title={editing === 'new' ? 'Añadir libro' : 'Editar libro'} onClose={() => setEditing(null)}>
            <BookFormView book={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
