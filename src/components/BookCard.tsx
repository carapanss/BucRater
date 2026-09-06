import { motion } from 'framer-motion';
import type { Book } from '../types';
import { TagBadge } from './TagBadge';
import { resolveCoverSrc } from '../api/covers';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  reading: 'Leyendo',
  read: 'Leído',
};

export function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="book-card"
      onClick={onClick}
    >
      <div className="book-card-cover">
        {book.coverUrl ? <img src={resolveCoverSrc(book.coverUrl)} alt={book.title} /> : <span>Sin portada</span>}
      </div>
      <div className="book-card-body">
        <div className="book-card-title">{book.title}</div>
        <div className="book-card-author">{book.author}</div>
        {book.tags.length > 0 && (
          <div className="tag-list">
            {book.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        <div className="book-card-footer">
          <span className="status-chip">{STATUS_LABEL[book.status]}</span>
          {book.rating !== null && <span>{'★'.repeat(book.rating)}</span>}
        </div>
      </div>
    </motion.div>
  );
}
