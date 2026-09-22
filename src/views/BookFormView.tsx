import { useEffect, useState } from 'react';
import { ask, open } from '@tauri-apps/plugin-dialog';
import { useBooksStore } from '../store/useBooksStore';
import { useGoogleBooksSearch } from '../hooks/useGoogleBooksSearch';
import { importCover, resolveCoverSrc } from '../api/covers';
import { listBooks } from '../api/books';
import { StarRating } from '../components/StarRating';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { TagPicker } from '../components/TagPicker';
import { RereadCounter } from '../components/RereadCounter';
import { QuotesPanel } from '../components/QuotesPanel';
import type { Book, BookStatus, GoogleBooksSuggestion } from '../types';

interface BookFormViewProps {
  book: Book | null;
  onDone: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

interface FormState {
  title: string;
  author: string;
  rating: number | null;
  notes: string;
  status: BookStatus;
  coverUrl: string | null;
  googleBooksId: string | null;
  addedYear: number | null;
  addedMonth: number | null;
  pageCount: number | null;
  currentPage: number | null;
  publicationYear: number | null;
  language: string | null;
  seriesName: string;
  seriesIndex: string;
  tagIds: number[];
}

function toFormState(book: Book | null): FormState {
  if (!book) {
    const now = new Date();
    return {
      title: '',
      author: '',
      rating: null,
      notes: '',
      status: 'read',
      coverUrl: null,
      googleBooksId: null,
      addedYear: now.getFullYear(),
      addedMonth: now.getMonth() + 1,
      pageCount: null,
      currentPage: null,
      publicationYear: null,
      language: null,
      seriesName: '',
      seriesIndex: '',
      tagIds: [],
    };
  }
  return {
    title: book.title,
    author: book.author,
    rating: book.rating,
    notes: book.notes ?? '',
    status: book.status,
    coverUrl: book.coverUrl,
    googleBooksId: book.googleBooksId,
    addedYear: book.addedYear,
    addedMonth: book.addedMonth,
    pageCount: book.pageCount,
    currentPage: book.currentPage,
    publicationYear: book.publicationYear,
    language: book.language,
    seriesName: book.seriesName ?? '',
    seriesIndex: book.seriesIndex !== null ? String(book.seriesIndex) : '',
    tagIds: book.tags.map((t) => t.id),
  };
}

export function BookFormView({ book, onDone, onDirtyChange }: BookFormViewProps) {
  const [initialForm] = useState<FormState>(() => toFormState(book));
  const [form, setForm] = useState<FormState>(() => initialForm);
  const [titleQuery, setTitleQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading: searchLoading, error: searchError } = useGoogleBooksSearch(titleQuery);
  const [authorQuery, setAuthorQuery] = useState('');
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const authorSearchQuery = authorQuery.trim().length >= 3 ? `inauthor:${authorQuery.trim()}` : '';
  const { suggestions: authorSuggestions, loading: authorSearchLoading } = useGoogleBooksSearch(authorSearchQuery);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rereadCount, setRereadCount] = useState(book?.rereadCount ?? 0);
  const [manualCoverPath, setManualCoverPath] = useState<string | null>(null);

  const addBook = useBooksStore((s) => s.add);
  const updateBook = useBooksStore((s) => s.update);
  const setCover = useBooksStore((s) => s.setCover);
  const setTags = useBooksStore((s) => s.setTags);
  const removeBook = useBooksStore((s) => s.remove);
  const incrementReread = useBooksStore((s) => s.incrementReread);
  const decrementReread = useBooksStore((s) => s.decrementReread);

  useEffect(() => {
    const dirty = manualCoverPath !== null || JSON.stringify(form) !== JSON.stringify(initialForm);
    onDirtyChange?.(dirty);
  }, [form, initialForm, manualCoverPath, onDirtyChange]);

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
    setManualCoverPath(null);
    setShowSuggestions(false);
    setShowAuthorSuggestions(false);
  }

  async function chooseCover() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
      ],
    });
    if (typeof selected === 'string') {
      setManualCoverPath(selected);
      setFormError(null);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.author.trim()) {
      setFormError('El título y el autor son obligatorios.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      if (!book) {
        const normalizedTitle = normalizeBookValue(form.title);
        const normalizedAuthor = normalizeBookValue(form.author);
        const existingBooks = await listBooks({});
        const duplicate = existingBooks.find(
          (existing) =>
            (normalizeBookValue(existing.title) === normalizedTitle &&
              normalizeBookValue(existing.author) === normalizedAuthor) ||
            (form.googleBooksId !== null && existing.googleBooksId === form.googleBooksId),
        );
        if (duplicate) {
          const confirmed = await ask(
            `Ya tienes guardado “${duplicate.title}” de ${duplicate.author}. ¿Quieres añadirlo de todos modos?`,
            { title: 'Libro repetido', kind: 'warning' },
          );
          if (!confirmed) return;
        }
      }
      const seriesIndexNum = form.seriesIndex.trim() ? Number(form.seriesIndex) : null;
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        rating: form.rating,
        notes: form.notes.trim() || null,
        status: form.status,
        coverUrl: form.coverUrl,
        googleBooksId: form.googleBooksId,
        addedYear: form.addedYear,
        addedMonth: form.addedMonth,
        pageCount: form.pageCount,
        currentPage: form.currentPage,
        publicationYear: form.publicationYear,
        language: form.language,
        seriesName: form.seriesName.trim() || null,
        seriesIndex: seriesIndexNum,
      };
      let saved: Book;
      if (book) {
        saved = await updateBook(book.uuid, payload);
        await setTags(book.uuid, form.tagIds);
      } else {
        saved = await addBook({ ...payload, tagIds: form.tagIds });
      }
      if (manualCoverPath) {
        const localPath = await importCover(manualCoverPath, saved.uuid);
        saved = await setCover(saved.uuid, localPath);
      }
      onDone();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el libro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!book) return;
    const confirmed = await ask(`¿Eliminar "${book.title}"? Esta acción no se puede deshacer.`, {
      title: 'Eliminar libro',
      kind: 'warning',
    });
    if (!confirmed) return;
    try {
      await removeBook(book.id);
      onDone();
    } catch {
      // el error ya se notificó mediante un toast
    }
  }

  return (
    <div>
      <div className="field">
        <label>Título</label>
        <div className="autocomplete-wrap">
          <input
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
            <div className="autocomplete-list">
              {suggestions.map((s) => (
                <button
                  key={s.googleBooksId}
                  type="button"
                  className="autocomplete-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  {s.coverUrl ? <img src={s.coverUrl} alt="" /> : null}
                  <div className="autocomplete-item-text">
                    <div className="autocomplete-item-title">{s.title}</div>
                    <div className="autocomplete-item-author">{s.author}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {searchLoading && <p className="field-hint">Buscando en Google Books...</p>}
        {searchError && (
          <p className="field-hint field-hint-danger">
            No se pudieron buscar sugerencias ({searchError}). Puedes rellenar los datos a mano.
          </p>
        )}
      </div>

      <div className="field">
        <label>Autor</label>
        <div className="autocomplete-wrap">
          <input
            className="input"
            value={form.author}
            onChange={(e) => {
              setForm((f) => ({ ...f, author: e.target.value }));
              setAuthorQuery(e.target.value);
              setShowAuthorSuggestions(true);
            }}
            onFocus={() => setShowAuthorSuggestions(true)}
            onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 150)}
            placeholder="Autor"
          />
          {showAuthorSuggestions && authorSuggestions.length > 0 && (
            <div className="autocomplete-list">
              {authorSuggestions.map((s) => (
                <button
                  key={s.googleBooksId}
                  type="button"
                  className="autocomplete-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(s)}
                >
                  {s.coverUrl ? <img src={s.coverUrl} alt="" /> : null}
                  <div className="autocomplete-item-text">
                    <div className="autocomplete-item-title">{s.title}</div>
                    <div className="autocomplete-item-author">{s.author}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {authorSearchLoading && <p className="field-hint">Buscando títulos de este autor...</p>}
      </div>

      <div className="field-row">
        <div className="field">
          <label>Valoración</label>
          <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
        </div>
        <div className="field">
          <label>Estado</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BookStatus }))}
          >
            <option value="pending">Pendiente</option>
            <option value="reading">A medias</option>
            <option value="read">Leído</option>
          </select>
        </div>
      </div>

      <MonthYearPicker
        year={form.addedYear}
        month={form.addedMonth}
        onChange={(year, month) => setForm((f) => ({ ...f, addedYear: year, addedMonth: month }))}
      />

      <div className="field-row">
        <div className="field">
          <label>Páginas</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.pageCount ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, pageCount: e.target.value ? Number(e.target.value) : null }))
            }
          />
        </div>
        {form.status === 'reading' && (
          <div className="field">
            <label>Página en la que te quedaste</label>
            <input
              className="input"
              type="number"
              min={0}
              max={form.pageCount ?? undefined}
              value={form.currentPage ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  currentPage: e.target.value ? Number(e.target.value) : null,
                }))
              }
              placeholder="Ej. 127"
            />
          </div>
        )}
        <div className="field">
          <label>Año de publicación</label>
          <input
            className="input"
            type="number"
            value={form.publicationYear ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, publicationYear: e.target.value ? Number(e.target.value) : null }))
            }
          />
        </div>
        <div className="field">
          <label>Idioma</label>
          <input
            className="input"
            value={form.language ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value || null }))}
            placeholder="es, en..."
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Saga</label>
          <input
            className="input"
            value={form.seriesName}
            onChange={(e) => setForm((f) => ({ ...f, seriesName: e.target.value }))}
            placeholder="Nombre de la saga (opcional)"
          />
        </div>
        <div className="field">
          <label>Nº en la saga</label>
          <input
            className="input"
            type="number"
            step="0.5"
            value={form.seriesIndex}
            onChange={(e) => setForm((f) => ({ ...f, seriesIndex: e.target.value }))}
          />
        </div>
      </div>

      <div className="field">
        <label>Portada</label>
        <div className="cover-picker">
          {form.coverUrl && !manualCoverPath && (
            <img className="cover-preview" src={resolveCoverSrc(form.coverUrl)} alt="Portada actual" />
          )}
          <div className="cover-picker-actions">
            <button type="button" className="btn btn-sm" disabled={saving} onClick={() => void chooseCover()}>
              Elegir imagen
            </button>
            {manualCoverPath ? (
              <span className="cover-selected-name">{manualCoverPath.split(/[\\/]/).pop()}</span>
            ) : form.coverUrl ? (
              <span className="field-hint">Portada actual</span>
            ) : (
              <span className="field-hint">Sin portada</span>
            )}
            {manualCoverPath && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManualCoverPath(null)}>
                Cancelar
              </button>
            )}
          </div>
        </div>
        <p className="field-hint">JPG, PNG, GIF, WebP o BMP. Se sincronizará con tus otros dispositivos.</p>
      </div>

      <div className="field">
        <label>Notas</label>
        <textarea
          className="input"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Tus notas sobre el libro..."
        />
      </div>

      <div className="field">
        <label>Tags</label>
        <TagPicker selectedIds={form.tagIds} onChange={(ids) => setForm((f) => ({ ...f, tagIds: ids }))} />
      </div>

      {book && (
        <div className="field">
          <label>Relecturas</label>
          <RereadCounter
            count={rereadCount}
            onIncrement={async () => {
              try {
                await incrementReread(book.id);
                setRereadCount((c) => c + 1);
              } catch {
                // el error ya se notificó mediante un toast
              }
            }}
            onDecrement={async () => {
              try {
                await decrementReread(book.id);
                setRereadCount((c) => Math.max(0, c - 1));
              } catch {
                // el error ya se notificó mediante un toast
              }
            }}
          />
        </div>
      )}

      <div className="field">
        <label>Citas favoritas</label>
        <QuotesPanel bookId={book?.id ?? null} />
      </div>

      {formError && <p className="field-error">{formError}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        {book ? (
          <button type="button" className="btn btn-danger" onClick={() => void handleDelete()}>
            Eliminar
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleSubmit()}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

function normalizeBookValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}
