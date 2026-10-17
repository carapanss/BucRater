import { useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { motion } from 'framer-motion';
import { useGoogleBooksSearch } from '../hooks/useGoogleBooksSearch';
import { useShelfStore } from '../store/useShelfStore';
import { Icon } from './Icon';
import { easeOutExpo } from '../lib/motion';
import type { GoogleBooksSuggestion, NewShelfItem, ShelfItem, ShelfKind } from '../types';

export const SHELF_NAME: Record<ShelfKind, string> = {
  wishlist: 'Quiero leer',
  owned: 'Comprados sin leer',
};

interface ShelfItemFormProps {
  /** Libro que se edita; `null` para uno nuevo. */
  item: ShelfItem | null;
  /** Estantería en la que se crea un libro nuevo. */
  shelf: ShelfKind;
  onDone: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

function toForm(item: ShelfItem | null, shelf: ShelfKind): NewShelfItem {
  if (!item) {
    return {
      shelf,
      title: '',
      author: '',
      notes: null,
      coverUrl: null,
      googleBooksId: null,
      pageCount: null,
      publicationYear: null,
      language: null,
    };
  }
  const { id: _id, uuid: _uuid, createdAt: _created, updatedAt: _updated, ...rest } = item;
  return rest;
}

export function ShelfItemForm({ item, shelf, onDone, onDirtyChange }: ShelfItemFormProps) {
  const [initial] = useState(() => toForm(item, shelf));
  const [form, setForm] = useState<NewShelfItem>(initial);
  const [titleQuery, setTitleQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { suggestions, loading, error } = useGoogleBooksSearch(titleQuery);
  const add = useShelfStore((s) => s.add);
  const update = useShelfStore((s) => s.update);
  const remove = useShelfStore((s) => s.remove);

  useEffect(() => {
    onDirtyChange?.(JSON.stringify(form) !== JSON.stringify(initial));
  }, [form, initial, onDirtyChange]);

  function applySuggestion(s: GoogleBooksSuggestion) {
    setForm((f) => ({
      ...f,
      title: s.title,
      author: s.author || f.author,
      coverUrl: s.coverUrl,
      googleBooksId: s.googleBooksId,
      pageCount: s.pageCount,
      publicationYear: s.publicationYear,
      language: s.language,
    }));
    setShowSuggestions(false);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.author.trim()) {
      setFormError('El título y el autor son obligatorios.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim(), author: form.author.trim(), notes: form.notes?.trim() || null };
      if (item) await update(item.uuid, payload);
      else await add(payload);
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el libro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    const confirmed = await ask(`¿Quitar "${item.title}" de la estantería? Esta acción no se puede deshacer.`, {
      title: 'Quitar libro',
      kind: 'warning',
    });
    if (!confirmed) return;
    try {
      await remove(item.id);
      onDone();
    } catch {
      // el error ya se notificó mediante un toast
    }
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="shelf-title">Título</label>
        <div className="autocomplete-wrap">
          <input
            id="shelf-title"
            className="input"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }));
              setTitleQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Título del libro"
          />
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              className="autocomplete-list"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: easeOutExpo }}
            >
              {suggestions.map((s) => (
                <button
                  key={s.googleBooksId}
                  type="button"
                  className="autocomplete-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  {s.coverUrl ? <img src={s.coverUrl} alt="" /> : <span className="autocomplete-item-blank" />}
                  <div className="autocomplete-item-text">
                    <div className="autocomplete-item-title">{s.title}</div>
                    <div className="autocomplete-item-author">{s.author}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
        {loading && <p className="field-hint">Buscando en Google Books…</p>}
        {error && (
          <p className="field-hint field-hint-danger">
            No se pudieron buscar sugerencias ({error}). Puedes rellenar los datos a mano.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="shelf-author">Autor</label>
        <input
          id="shelf-author"
          className="input"
          value={form.author}
          onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          placeholder="Autor"
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="shelf-kind">Estantería</label>
          <select
            id="shelf-kind"
            className="input"
            value={form.shelf}
            onChange={(e) => setForm((f) => ({ ...f, shelf: e.target.value as ShelfKind }))}
          >
            <option value="wishlist">{SHELF_NAME.wishlist}</option>
            <option value="owned">{SHELF_NAME.owned}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="shelf-pages">Páginas</label>
          <input
            id="shelf-pages"
            className="input"
            type="number"
            min={0}
            value={form.pageCount ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value ? Number(e.target.value) : null }))}
          />
        </div>
        <div className="field">
          <label htmlFor="shelf-year">Año de publicación</label>
          <input
            id="shelf-year"
            className="input"
            type="number"
            value={form.publicationYear ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, publicationYear: e.target.value ? Number(e.target.value) : null }))
            }
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="shelf-notes">Notas</label>
        <textarea
          id="shelf-notes"
          className="input"
          value={form.notes ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
          placeholder={form.shelf === 'wishlist' ? 'Quién te lo recomendó, por qué te apetece…' : 'Dónde lo compraste, cuándo piensas leerlo…'}
        />
      </div>

      {formError && (
        <p className="field-error" role="alert">
          <Icon name="alert" size={16} />
          {formError}
        </p>
      )}

      <div className="form-actions">
        {item ? (
          <button type="button" className="btn btn-danger" onClick={() => void handleDelete()}>
            <Icon name="trash" size={16} />
            Quitar
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSubmit()}>
          {saving ? 'Guardando…' : 'Guardar libro'}
        </button>
      </div>
    </div>
  );
}
