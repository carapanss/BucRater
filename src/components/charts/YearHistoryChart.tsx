import { motion } from 'framer-motion';
import type { YearStats } from '../../types';

export function YearHistoryChart({ history }: { history: YearStats[] }) {
  const max = Math.max(1, ...history.map((y) => y.books));

  return (
    <div>
      <div className="chart-title">Libros por año</div>
      <div className="bar-chart">
        {history.map((y) => (
          <div key={y.year} className="bar-chart-col">
            <motion.div
              className="bar-chart-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(y.books / max) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              title={`${y.books} libro${y.books === 1 ? '' : 's'} · ${y.pages} páginas${
                y.avgRating !== null ? ` · ${y.avgRating.toFixed(1)}★ media` : ''
              }`}
            />
            <span className="bar-chart-label">{y.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
