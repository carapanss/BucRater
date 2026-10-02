import { useCallback, useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useBooksStore } from '../store/useBooksStore';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { BookCard } from '../components/BookCard';
import { BookSpine } from '../components/BookSpine';
import { BookDetailView } from '../components/BookDetailView';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { BookFormView } from './BookFormView';
import { springFirm } from '../lib/motion';
import { clothFor } from '../lib/cloth';
import type { Book, BookFilter } from '../types';

type ShelfMode = 'covers' | 'spines';
const SHELF_MODE_KEY = 'bucrater-shelf-mode';

function readShelfMode(): ShelfMode {
  try {
    return localStorage.getItem(SHELF_MODE_KEY) === 'spines' ? 'spines' : 'covers';
  } catch {
    return 'covers';
  }
}

function hasActiveFilter(filter: BookFilter): boolean {
  return Boolean(filter.searchText || filter.tagId || filter.minRating || filter.status || filter.onlyUndefinedDate);
}

export function BookListView() {
  const books = useBooksStore((s) => s.books);
  const filter = useBooksStore((s) => s.filter);
  const [editing, setEditing] = useState<Book | 'new' | null>(null);
  const [editingDirty, setEditingDirty] = useState(false);
  const [selectedBookUuid, setSelectedBookUuid] = useState<string | null>(null);
  const [shelfMode, setShelfMode] = useState<ShelfMode>(readShelfMode);
  const selectedBook = books.find((book) => book.uuid === selectedBookUuid) ?? null;

  useEffect(() => {
    try {
      localStorage.setItem(SHELF_MODE_KEY, shelfMode);
    } catch {
      // Sin almacenamiento local simplemente no se recuerda la vista.
    }
  }, [shelfMode]);

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

  const closeDetail = useCallback(() => setSelectedBookUuid(null), []);

  function openNew() {
    setSelectedBookUuid(null);
    setEditingDirty(false);
    setEditing('new');
  }

  const filtered = hasActiveFilter(filter);

  return (
    <div>
      <div className="list-head">
        <h1 className="list-head-title">
          Biblioteca
          <span className="list-head-count">
            {books.length} {books.length === 1 ? 'libro' : 'libros'}
            {filtered ? ' con estos filtros' : ''}
          </span>
        </h1>
        <div className="list-head-actions">
          <div className="segmented" role="group" aria-label="Vista de la estantería">
            {(['covers', 'spines'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={shelfMode === mode}
                onClick={() => setShelfMode(mode)}
              >
                {shelfMode === mode && (
                  <motion.span className="segmented-thumb" layoutId="shelf-mode-thumb" transition={springFirm} />
                )}
                <Icon name={mode} size={16} />
                {mode === 'covers' ? 'Portadas' : 'Lomos'}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} />
            Añadir libro
          </button>
        </div>
      </div>

      <SearchFilterBar />

      {books.length === 0 ? (
        filtered ? (
          <p className="empty-state">Ningún libro coincide con la búsqueda o los filtros.</p>
        ) : (
          <EmptyShelf onAdd={openNew} />
        )
      ) : (
        <LayoutGroup id={shelfMode}>
          {shelfMode === 'covers' ? (
            <div className="shelf">
              <AnimatePresence>
                {books.map((book, index) => (
                  <BookCard
                    key={book.uuid}
                    book={book}
                    index={index}
                    hidden={book.uuid === selectedBookUuid}
                    onSelect={setSelectedBookUuid}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="spine-shelf">
              <AnimatePresence>
                {books.map((book, index) => (
                  <BookSpine
                    key={book.uuid}
                    book={book}
                    index={index}
                    hidden={book.uuid === selectedBookUuid}
                    onSelect={setSelectedBookUuid}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {selectedBook && (
              <Modal key="detail" title={`Ficha de ${selectedBook.title}`} variant="book" onClose={closeDetail}>
                <BookDetailView
                  book={selectedBook}
                  entrance={shelfMode === 'covers' ? 'flight' : 'rise'}
                  onEdit={() => {
                    setSelectedBookUuid(null);
                    setEditingDirty(false);
                    setEditing(selectedBook);
                  }}
                />
              </Modal>
            )}
          </AnimatePresence>
        </LayoutGroup>
      )}

      <AnimatePresence>
        {editing !== null && (
          <Modal
            title={editing === 'new' ? 'Añadir libro' : 'Editar libro'}
            cloth={editing === 'new' ? 'var(--cloth-green)' : clothFor(editing)}
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

const EMPTY_SPINES = [
  { color: 'var(--cloth-green)', height: 74 },
  { color: 'var(--cloth-oxblood)', height: 62 },
  { color: 'var(--cloth-ochre)', height: 80 },
  { color: 'var(--cloth-ink)', height: 68 },
];

function EmptyShelf({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="shelf-empty">
      <div className="shelf-empty-spines" aria-hidden="true">
        {EMPTY_SPINES.map((spine, i) => (
          <motion.span
            key={i}
            style={{ background: spine.color, height: spine.height }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springFirm, delay: 0.1 + i * 0.07 }}
          />
        ))}
      </div>
      <h2>Tu estantería está vacía</h2>
      <p>Todavía no has añadido ningún libro. Busca el primero por título o autor y lo rellenamos por ti.</p>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <Icon name="plus" size={16} />
        Añadir libro
      </button>
    </div>
  );
}
