import { motion } from 'framer-motion';
import type { MonthCount } from '../../types';

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function MonthlyBarChart({ data }: { data: MonthCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <div className="chart-title">Libros por mes</div>
      <div className="bar-chart">
        {data.map((d) => (
          <div key={d.month} className="bar-chart-col">
            <motion.div
              className="bar-chart-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              title={`${d.count} libro${d.count === 1 ? '' : 's'}`}
            />
            <span className="bar-chart-label">{MONTH_ABBR[d.month - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
