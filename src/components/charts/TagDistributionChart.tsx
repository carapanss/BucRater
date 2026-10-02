import { motion } from 'framer-motion';
import type { TagCount } from '../../types';
import { springFirm } from '../../lib/motion';

export function TagDistributionChart({ data }: { data: TagCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <>
        <h3 className="chart-title">Libros por tag</h3>
        <p className="field-hint">Todavía no has etiquetado ningún libro.</p>
      </>
    );
  }

  return (
    <div>
      <h3 className="chart-title">Libros por tag</h3>
      <div className="hbar-list">
        {data.map((d, i) => (
          <div key={d.tag.id} className="hbar-row">
            <span className="hbar-row-label">{d.tag.name}</span>
            <div className="hbar-track">
              <motion.div
                className="hbar-fill"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: d.count / max }}
                transition={{ ...springFirm, delay: i * 0.04 }}
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
