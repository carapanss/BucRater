import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { springFirm } from '../lib/motion';

const SPINES = [
  { pattern: 'var(--pat-0)', height: 74 },
  { pattern: 'var(--pat-2)', height: 62 },
  { pattern: 'var(--pat-1)', height: 80 },
  { pattern: 'var(--pat-3)', height: 68 },
];

interface EmptyShelfProps {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}

/** Estantería sin libros: cuatro lomos con trama que se colocan sobre el filete. */
export function EmptyShelf({ title, text, actionLabel, onAction }: EmptyShelfProps) {
  return (
    <div className="shelf-empty">
      <div className="shelf-empty-spines" aria-hidden="true">
        {SPINES.map((spine, i) => (
          <motion.span
            key={i}
            style={{ background: spine.pattern, height: spine.height }}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springFirm, delay: 0.35 + i * 0.07 }}
          />
        ))}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" className="btn btn-primary" onClick={onAction}>
        <Icon name="plus" size={16} />
        {actionLabel}
      </button>
    </div>
  );
}
