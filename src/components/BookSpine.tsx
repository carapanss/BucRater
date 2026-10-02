import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Book } from '../types';
import { clothFor, spineMetrics } from '../lib/cloth';
import { STATUS_LABEL } from './StatusChip';
import { easeOutExpo, springFirm } from '../lib/motion';

interface BookSpineProps {
  book: Book;
  index: number;
  hidden: boolean;
  onClick: () => void;
}

/** Un libro de lomo: el grosor sale de sus páginas; la tela, de su primer tag. */
export function BookSpine({ book, index, hidden, onClick }: BookSpineProps) {
  const { width, height } = spineMetrics(book);

  return (
    <motion.div
      className="spine-slot"
      layout="position"
      transition={springFirm}
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOutExpo, delay: Math.min(index, 30) * 0.018 } }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
    >
      <motion.button
        type="button"
        className={`book-spine${width >= 40 ? ' is-wide' : ''}${book.title.length > 22 ? ' is-long' : ''}`}
        style={{ width, height, '--book-cloth': clothFor(book), visibility: hidden ? 'hidden' : 'visible' } as CSSProperties}
        whileHover={{ y: -12, transition: springFirm }}
        whileTap={{ y: -6 }}
        transition={springFirm}
        onClick={onClick}
        aria-label={`${book.title}, de ${book.author}. ${STATUS_LABEL[book.status]}${
          book.rating !== null ? `, ${book.rating} de 5` : ''
        }`}
        title={`${book.title} — ${book.author}`}
      >
        <span className="spine-band" />
        <span className="spine-title">{book.title}</span>
        <span className="spine-author">{book.author.split(/\s+/).slice(-1)[0]}</span>
        {book.rating !== null && (
          <span className="spine-rating" aria-hidden="true">
            {Array.from({ length: book.rating }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        )}
      </motion.button>
    </motion.div>
  );
}
