import { motion } from 'framer-motion';
import type { MonthPages } from '../../types';

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ReadingVelocityChart({ data }: { data: MonthPages[] }) {
  const max = Math.max(1, ...data.map((d) => d.pages));

  return (
    <div>
      <div className="chart-title">Páginas leídas por mes</div>
      <div className="bar-chart">
        {data.map((d) => (
          <div key={d.month} className="bar-chart-col">
            <motion.div
              className="bar-chart-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(d.pages / max) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              title={`${d.pages} páginas`}
            />
            <span className="bar-chart-label">{MONTH_ABBR[d.month - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
