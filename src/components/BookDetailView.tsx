import type { Book } from '../types';
import { CoverImage } from './CoverImage';
import { QuotesPanel } from './QuotesPanel';
import { StarRating } from './StarRating';
import { TagBadge } from './TagBadge';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  reading: 'A medias',
  read: 'Leído',
};

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function addedDate(book: Book): string | null {
  if (book.addedYear === null) return null;
  if (book.addedMonth === null) return String(book.addedYear);
  return `${MONTHS[book.addedMonth - 1] ?? book.addedMonth} de ${book.addedYear}`;
}

export function BookDetailView({ book, onEdit }: { book: Book; onEdit: () => void }) {
  const series = book.seriesName
    ? `${book.seriesName}${book.seriesIndex !== null ? ` · nº ${book.seriesIndex}` : ''}`
    : null;
  const dateAdded = addedDate(book);

  return (
    <div className="book-detail">
      <div className="book-detail-hero">
        <div className="book-detail-cover">
          <CoverImage book={book} />
        </div>
        <div className="book-detail-summary">
          <h2>{book.title}</h2>
          <p className="book-detail-author">{book.author}</p>
          <div className="book-detail-rating">
            <StarRating value={book.rating} readOnly />
            <span>{book.rating === null ? 'Sin puntuación' : `${book.rating}/5`}</span>
          </div>
          <span className="status-chip">{STATUS_LABEL[book.status]}</span>
          {book.tags.length > 0 && (
            <div className="tag-list">
              {book.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="book-detail-info">
        {book.pageCount !== null && (
          <div>
            <span>Páginas</span>
            <strong>{book.pageCount}</strong>
          </div>
        )}
        {book.currentPage !== null && (
          <div>
            <span>Te quedaste en</span>
            <strong>Página {book.currentPage}</strong>
          </div>
        )}
        {book.publicationYear !== null && (
          <div>
            <span>Publicado</span>
            <strong>{book.publicationYear}</strong>
          </div>
        )}
        {book.language && (
          <div>
            <span>Idioma</span>
            <strong>{book.language}</strong>
          </div>
        )}
        {series && (
          <div>
            <span>Saga</span>
            <strong>{series}</strong>
          </div>
        )}
        {dateAdded && (
          <div>
            <span>Fecha de lectura</span>
            <strong>{dateAdded}</strong>
          </div>
        )}
        <div>
          <span>Relecturas</span>
          <strong>{book.rereadCount}</strong>
        </div>
      </div>

      <section className="book-detail-section">
        <h3>Mis notas</h3>
        {book.notes ? <p className="book-detail-notes">{book.notes}</p> : <p className="empty-state">Sin notas.</p>}
      </section>

      <section className="book-detail-section">
        <h3>Citas favoritas</h3>
        <QuotesPanel bookId={book.id} readOnly />
      </section>

      <div className="book-detail-actions">
        <button type="button" className="btn btn-primary" onClick={onEdit}>
          Editar libro
        </button>
      </div>
    </div>
  );
}
