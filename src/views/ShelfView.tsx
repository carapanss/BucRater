import { useCallback, useMemo, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { AnimatePresence } from 'framer-motion';
import { useShelfStore } from '../store/useShelfStore';
import { useBooksStore } from '../store/useBooksStore';
import { PagedShelf } from '../components/PagedShelf';
import { ShelfItemCard } from '../components/ShelfItemCard';
import { SHELF_NAME, ShelfItemForm } from '../components/ShelfItemForm';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { BookFormView, type BookPrefill } from './BookFormView';
import { clothStyle, NEW_BOOK_STYLE } from '../lib/cloth';
import type { ShelfItem, ShelfKind } from '../types';

const COPY: Record<ShelfKind, { intro: string; empty: string; emptyHint: string }> = {
  wishlist: {
    intro: 'Lo que te gustaría leer algún día.',
    empty: 'Aquí caben todos los libros que te apetecen',
    emptyHint: 'Apunta el título de lo que quieras leer; cuando lo compres, pásalo a «Comprados sin leer».',
  },
  owned: {
    intro: 'Libros que ya son tuyos y esperan su turno.',
    empty: 'Ningún libro esperando en la mesilla',
    emptyHint: 'Apunta aquí lo que compres sin haberlo leído; al empezarlo pasa a tu biblioteca.',
  },
};

interface Transfer {
  item: ShelfItem;
  prefill: BookPrefill;
}

/** Una estantería de libros que aún no se han leído: «quiero leer» o «comprados sin leer». */
export function ShelfView({ kind }: { kind: ShelfKind }) {
  const allItems = useShelfStore((s) => s.items);
  const update = useShelfStore((s) => s.update);
  const move = useShelfStore((s) => s.move);
  const remove = useShelfStore((s) => s.remove);
  const loadBooks = useBooksStore((s) => s.load);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ShelfItem | 'new' | null>(null);
  const [editingDirty, setEditingDirty] = useState(false);
  const [transfer, setTransfer] = useState<Transfer | null>(null);

  const items = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return allItems
      .filter((item) => item.shelf === kind)
      .filter((item) => !text || `${item.title} ${item.author} ${item.notes ?? ''}`.toLocaleLowerCase().includes(text));
  }, [allItems, kind, query]);
  const total = allItems.filter((item) => item.shelf === kind).length;

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

  const saveRemoteCover = useCallback(
    (item: ShelfItem, url: string) => {
      const { id: _id, uuid: _uuid, createdAt: _c, updatedAt: _u, ...rest } = item;
      void update(item.uuid, { ...rest, coverUrl: url }).catch(() => {
        // La portada remota sigue visible aunque no se haya podido guardar.
      });
    },
    [update],
  );

  function toLibrary(item: ShelfItem, status: 'reading' | 'read') {
    setTransfer({
      item,
      prefill: {
        title: item.title,
        author: item.author,
        notes: item.notes ?? '',
        status,
        coverUrl: item.coverUrl,
        googleBooksId: item.googleBooksId,
        pageCount: item.pageCount,
        publicationYear: item.publicationYear,
        language: item.language,
      },
    });
  }

  const actions = useMemo(
    () =>
      kind === 'wishlist'
        ? [
            { label: 'Ya lo compré', onClick: (item: ShelfItem) => void move(item, 'owned').catch(() => undefined) },
            { label: 'Ya lo leí', onClick: (item: ShelfItem) => toLibrary(item, 'read') },
          ]
        : [
            { label: 'Empezar a leer', onClick: (item: ShelfItem) => toLibrary(item, 'reading') },
            { label: 'Ya lo leí', onClick: (item: ShelfItem) => toLibrary(item, 'read') },
          ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, move],
  );

  return (
    <div>
      <div className="list-head">
        <h1 className="list-head-title">
          {SHELF_NAME[kind]}
          <span className="list-head-count">
            {total} {total === 1 ? 'libro' : 'libros'}
            {query.trim() ? `, ${items.length} con esta búsqueda` : ''}
          </span>
        </h1>
        <div className="list-head-actions">
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} />
            Apuntar libro
          </button>
        </div>
      </div>
      <p className="list-lede">{COPY[kind].intro}</p>

      {total > 0 && (
        <div className="list-toolbar is-single">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              className="input"
              type="search"
              aria-label={`Buscar en ${SHELF_NAME[kind]}`}
              placeholder="Buscar por título, autor o notas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      )}

      {total === 0 ? (
        <div className="shelf-empty">
          <h2>{COPY[kind].empty}</h2>
          <p>{COPY[kind].emptyHint}</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={16} />
            Apuntar libro
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="empty-state">Ningún libro coincide con la búsqueda.</p>
      ) : (
        <PagedShelf
          items={items}
          mode="covers"
          label={SHELF_NAME[kind]}
          resetKey={`${kind}|${query}`}
          itemKey={(item) => item.uuid}
          renderCover={(item, index) => (
            <ShelfItemCard
              item={item}
              index={index}
              onOpen={setEditing}
              onRemoteCover={saveRemoteCover}
              actions={actions}
            />
          )}
        />
      )}

      <AnimatePresence>
        {editing !== null && (
          <Modal
            key="shelf-form"
            title={editing === 'new' ? 'Apuntar libro' : 'Editar libro'}
            cloth={editing === 'new' ? NEW_BOOK_STYLE : clothStyle({ ...editing, tags: [] })}
            onClose={() => void closeEditor()}
          >
            <ShelfItemForm
              item={editing === 'new' ? null : editing}
              shelf={kind}
              onDirtyChange={setEditingDirty}
              onDone={() => {
                setEditingDirty(false);
                setEditing(null);
              }}
            />
          </Modal>
        )}
        {transfer && (
          <Modal
            key="to-library"
            title="Pasar a la biblioteca"
            cloth={clothStyle({ ...transfer.item, tags: [] })}
            onClose={() => setTransfer(null)}
          >
            <BookFormView
              book={null}
              prefill={transfer.prefill}
              onCreated={async () => {
                await remove(transfer.item.id);
                await loadBooks();
              }}
              onDone={() => setTransfer(null)}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
