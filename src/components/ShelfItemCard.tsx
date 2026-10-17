import { memo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { ShelfItem } from '../types';
import { CoverImage } from './CoverImage';
import { clothFor } from '../lib/cloth';
import { easeOutExpo, springFirm } from '../lib/motion';

interface ShelfItemCardProps {
  item: ShelfItem;
  index: number;
  onOpen: (item: ShelfItem) => void;
  onRemoteCover: (item: ShelfItem, url: string) => void;
  /** Acciones de pie, según la estantería (comprar, empezar, ya leído…). */
  actions: { label: string; onClick: (item: ShelfItem) => void }[];
}

export const ShelfItemCard = memo(function ShelfItemCard({
  item,
  index,
  onOpen,
  onRemoteCover,
  actions,
}: ShelfItemCardProps) {
  return (
    <motion.article
      className="book-card shelf-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo, delay: Math.min(index, 12) * 0.03 } }}
      style={{ '--book-cloth': clothFor({ ...item, tags: [] }) } as CSSProperties}
    >
      <button
        type="button"
        className="shelf-item-open"
        onClick={() => onOpen(item)}
        aria-label={`Editar ${item.title}, de ${item.author}`}
      >
        <div className="book-card-stage">
          <motion.div className="book-card-cover" whileHover={{ y: -6, transition: springFirm }} whileTap={{ y: -2 }}>
            <CoverImage book={item} onRemoteCover={(url) => onRemoteCover(item, url)} />
          </motion.div>
        </div>
        <div className="book-card-body">
          <div className="book-card-title">{item.title}</div>
          <div className="book-card-author">{item.author}</div>
          {item.pageCount !== null && <div className="book-card-pages tabular">{item.pageCount} págs.</div>}
        </div>
      </button>
      <div className="shelf-item-actions">
        {actions.map((action) => (
          <button key={action.label} type="button" className="text-action" onClick={() => action.onClick(item)}>
            {action.label}
          </button>
        ))}
      </div>
    </motion.article>
  );
});
