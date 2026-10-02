import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Book } from '../types';
import { CoverImage } from './CoverImage';
import { StarGlyph } from './Icon';
import { StatusChip } from './StatusChip';
import { clothFor } from '../lib/cloth';
import { easeOutExpo, springFirm } from '../lib/motion';

interface BookCardProps {
  book: Book;
  index: number;
  hidden: boolean;
  onClick: () => void;
}

export function BookCard({ book, index, hidden, onClick }: BookCardProps) {
  return (
    <motion.button
      type="button"
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo, delay: Math.min(index, 14) * 0.03 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={springFirm}
      className="book-card"
      style={{ '--book-cloth': clothFor(book) } as CSSProperties}
      onClick={onClick}
      aria-label={`${book.title}, de ${book.author}`}
    >
      <div className="book-card-stage">
        {/* La tapa se "saca" del estante al pasar por encima y vuela hasta la ficha al abrirla */}
        <motion.div
          className="book-card-cover"
          layoutId={`cover-${book.uuid}`}
          style={{ visibility: hidden ? 'hidden' : 'visible' }}
          whileHover={{ y: -7, rotate: -0.6, transition: springFirm }}
          whileTap={{ y: -3, scale: 0.985 }}
          transition={springFirm}
        >
          <CoverImage book={book} />
        </motion.div>
      </div>
      <div className="book-card-body">
        <div className="book-card-title">{book.title}</div>
        <div className="book-card-author">{book.author}</div>
        <div className="book-card-footer">
          <StatusChip status={book.status} />
          {book.rating !== null && (
            <span className="mini-stars" aria-label={`${book.rating} de 5`}>
              {Array.from({ length: book.rating }, (_, i) => (
                <StarGlyph key={i} filled size={11} />
              ))}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
