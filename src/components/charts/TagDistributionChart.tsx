import { motion } from 'framer-motion';
import type { TagCount } from '../../types';

export function TagDistributionChart({ data }: { data: TagCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return <p className="empty-state">Todavía no has etiquetado ningún libro.</p>;
  }

  return (
    <div>
      <div className="chart-title">Libros por tag</div>
      <div className="hbar-list">
        {data.map((d) => (
          <div key={d.tag.id} className="hbar-row">
            <span className="hbar-row-label">{d.tag.name}</span>
            <div className="hbar-track">
              <motion.div
                className="hbar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(d.count / max) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={d.tag.color ? { background: d.tag.color } : undefined}
              />
            </div>
            <span className="hbar-value">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
