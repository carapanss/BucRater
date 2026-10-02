import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { springFirm } from '../../lib/motion';

export interface SpineBar {
  key: string | number;
  value: number;
  label: ReactNode;
  title: string;
}

interface SpineBarChartProps {
  title: string;
  bars: SpineBar[];
  tone?: 'green' | 'alt' | 'warm';
  showValues?: boolean;
}

/**
 * Barras como lomos sobre un estante. Al cambiar de año, cada barra conserva su identidad y
 * crece o mengua desde su altura anterior en lugar de volver a empezar desde cero.
 */
export function SpineBarChart({ title, bars, tone = 'green', showValues = true }: SpineBarChartProps) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="chart-title">{title}</figcaption>
      <div className="bar-chart">
        {bars.map((bar, i) => (
          <div key={bar.key} className="bar-chart-col" title={bar.title}>
            {showValues && bar.value > 0 && <span className="bar-chart-value">{bar.value}</span>}
            <motion.div
              className={`bar-chart-bar${tone === 'green' ? '' : ` ${tone}`}${bar.value === 0 ? ' is-zero' : ''}`}
              initial={{ height: '0%' }}
              animate={{ height: `${(bar.value / max) * (showValues ? 86 : 100)}%` }}
              transition={{ ...springFirm, delay: i * 0.025 }}
            />
          </div>
        ))}
      </div>
      <div className="bar-chart-labels" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar.key} className="bar-chart-label">
            {bar.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
