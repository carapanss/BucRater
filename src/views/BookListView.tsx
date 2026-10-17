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
import { PagedShelf } from '../components/PagedShelf';
import { EmptyShelf } from '../components/EmptyShelf';
import { clothStyle, NEW_BOOK_STYLE, spineMetrics } from '../lib/cloth';
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
          <EmptyShelf
            title="Tu estantería está vacía"
            text="Todavía no has añadido ningún libro. Busca el primero por título o autor y lo rellenamos por ti."
            actionLabel="Añadir libro"
            onAction={openNew}
          />
        )
      ) : (
        <LayoutGroup id={shelfMode}>
          <PagedShelf
            items={books}
            mode={shelfMode}
            label="Biblioteca"
            resetKey={JSON.stringify(filter)}
            itemKey={(book) => book.uuid}
            spineWidth={(book) => spineMetrics(book).width}
            renderCover={(book, index) => (
              <BookCard
                book={book}
                index={index}
                hidden={book.uuid === selectedBookUuid}
                onSelect={setSelectedBookUuid}
              />
            )}
            renderSpine={(book, index) => (
              <BookSpine
                book={book}
                index={index}
                hidden={book.uuid === selectedBookUuid}
                onSelect={setSelectedBookUuid}
              />
            )}
          />

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
            cloth={editing === 'new' ? NEW_BOOK_STYLE : clothStyle(editing)}
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
