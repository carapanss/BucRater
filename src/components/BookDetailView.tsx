import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Book } from '../types';
import { CoverImage } from './CoverImage';
import { QuotesPanel } from './QuotesPanel';
import { StarRating } from './StarRating';
import { TagBadge } from './TagBadge';
import { StatusChip } from './StatusChip';
import { Icon } from './Icon';
import { clothFor } from '../lib/cloth';
import { easeOutExpo, springFirm } from '../lib/motion';

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

// Cada bloque de la ficha aparece en orden, después de que la portada haya aterrizado.
function Reveal({ order, children, className }: { order: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo, delay: 0.08 + order * 0.05 } }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      {children}
    </motion.div>
  );
}

interface BookDetailViewProps {
  book: Book;
  onEdit: () => void;
  /** "flight": la portada vuela desde la estantería; "rise": sube desde abajo (vista de lomos). */
  entrance?: 'flight' | 'rise';
}

export function BookDetailView({ book, onEdit, entrance = 'flight' }: BookDetailViewProps) {
  const series = book.seriesName
    ? `${book.seriesName}${book.seriesIndex !== null ? ` · nº ${book.seriesIndex}` : ''}`
    : null;
  const dateAdded = addedDate(book);
  const progress =
    book.status === 'reading' && book.currentPage !== null && book.pageCount
      ? Math.min(1, book.currentPage / book.pageCount)
      : null;

  return (
    <div className="book-detail" style={{ '--book-cloth': clothFor(book) } as CSSProperties}>
      <Reveal order={0}>
        <div className="book-detail-endpaper" />
      </Reveal>

      <div className="book-detail-hero">
        <motion.div
          className="book-detail-cover"
          layoutId={entrance === 'flight' ? `cover-${book.uuid}` : undefined}
          initial={entrance === 'rise' ? { opacity: 0, y: 48, rotate: -3 } : undefined}
          animate={entrance === 'rise' ? { opacity: 1, y: 0, rotate: 0 } : undefined}
          exit={entrance === 'rise' ? { opacity: 0, y: 24, transition: { duration: 0.15 } } : undefined}
          transition={springFirm}
        >
          <CoverImage book={book} />
        </motion.div>
        <Reveal order={1} className="book-detail-summary">
          <h2>{book.title}</h2>
          <p className="book-detail-author">{book.author}</p>
          <div className="book-detail-meta">
            <div className="book-detail-rating">
              <StarRating value={book.rating} readOnly />
              <span>{book.rating === null ? 'Sin puntuación' : `${book.rating}/5`}</span>
            </div>
            <StatusChip status={book.status} />
          </div>
          {book.tags.length > 0 && (
            <div className="tag-list">
              {book.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <div className="book-detail-body">
        <Reveal order={3}>
          <div className="book-ledger">
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
                {progress !== null && (
                  <div className="book-progress" aria-hidden="true">
                    <motion.i
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: progress }}
                      transition={{ duration: 0.9, ease: easeOutExpo, delay: 0.35 }}
                    />
                  </div>
                )}
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
        </Reveal>

        <Reveal order={4} className="book-detail-section">
          <h3>Mis notas</h3>
          {book.notes ? (
            <p className="book-detail-notes">{book.notes}</p>
          ) : (
            <p className="field-hint">Todavía no has escrito notas sobre este libro.</p>
          )}
        </Reveal>

        <Reveal order={5} className="book-detail-section">
          <h3>Citas favoritas</h3>
          <QuotesPanel bookId={book.id} readOnly />
        </Reveal>

        <Reveal order={6} className="book-detail-actions">
          <button type="button" className="btn btn-primary" onClick={onEdit}>
            <Icon name="pencil" size={16} />
            Editar libro
          </button>
        </Reveal>
      </div>
    </div>
  );
}
