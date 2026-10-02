import { AnimatePresence, motion } from 'framer-motion';
import { springLively } from '../lib/motion';

interface RereadCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function RereadCounter({ count, onIncrement, onDecrement }: RereadCounterProps) {
  return (
    <div className="reread-counter">
      <span className="reread-count" style={{ overflow: 'hidden', height: 28 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            style={{ display: 'inline-block' }}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={springLively}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="reread-label">
        {count === 1 ? 'relectura' : 'relecturas'}
      </span>
      <motion.button type="button" className="btn btn-sm" whileTap={{ scale: 0.92 }} onClick={onIncrement}>
        +1 relectura
      </motion.button>
      <motion.button
        type="button"
        className="btn btn-sm"
        whileTap={{ scale: 0.92 }}
        disabled={count === 0}
        onClick={onDecrement}
      >
        −1 relectura
      </motion.button>
    </div>
  );
}
