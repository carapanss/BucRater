import type { HeatmapCell } from '../../types';

const MONTH_ABBR = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function ReadingHeatmap({ data }: { data: HeatmapCell[] }) {
  if (data.length === 0) {
    return (
      <>
        <h3 className="chart-title">Actividad por mes y año</h3>
        <p className="field-hint">Todavía no hay suficientes datos.</p>
      </>
    );
  }

  const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
  const max = Math.max(1, ...data.map((d) => d.count));
  const byYearMonth = new Map<string, number>();
  data.forEach((d) => byYearMonth.set(`${d.year}-${d.month}`, d.count));

  return (
    <div>
      <h3 className="chart-title">Actividad por mes y año</h3>
      <div className="heatmap-wrap">
        <div className="heatmap-row">
          <span className="heatmap-row-label" />
          {MONTH_ABBR.map((m, i) => (
            <span key={`${m}-${i}`} className="heatmap-cell-label">
              {m}
            </span>
          ))}
        </div>
        {years.map((year) => (
          <div key={year} className="heatmap-row">
            <span className="heatmap-row-label">{year}</span>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const count = byYearMonth.get(`${year}-${month}`) ?? 0;
              const strength = count === 0 ? 0 : Math.round(28 + 72 * (count / max));
              return (
                <div
                  key={month}
                  className="heatmap-cell"
                  title={`${year}-${month}: ${count} libro${count === 1 ? '' : 's'}`}
                  style={
                    count > 0
                      ? {
                          background: `color-mix(in oklab, var(--heat), transparent ${100 - strength}%)`,
                          boxShadow: 'none',
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
