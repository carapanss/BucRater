import { motion } from 'framer-motion';

interface RereadCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function RereadCounter({ count, onIncrement, onDecrement }: RereadCounterProps) {
  return (
    <div className="reread-counter">
      <span className="reread-count">{count}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
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
