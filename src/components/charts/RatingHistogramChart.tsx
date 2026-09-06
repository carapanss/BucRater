import { motion } from 'framer-motion';

export function RatingHistogramChart({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);

  return (
    <div>
      <div className="chart-title">Distribución de valoraciones</div>
      <div className="bar-chart">
        {data.map((count, i) => (
          <div key={i} className="bar-chart-col">
            <motion.div
              className="bar-chart-bar"
              initial={{ height: 0 }}
              animate={{ height: `${(count / max) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              title={`${count} libro${count === 1 ? '' : 's'}`}
            />
            <span className="bar-chart-label">{'★'.repeat(i + 1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
