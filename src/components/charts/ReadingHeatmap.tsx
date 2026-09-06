import type { HeatmapCell } from '../../types';

const MONTH_ABBR = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function ReadingHeatmap({ data }: { data: HeatmapCell[] }) {
  if (data.length === 0) {
    return <p className="empty-state">Todavía no hay suficientes datos.</p>;
  }

  const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
  const max = Math.max(1, ...data.map((d) => d.count));
  const byYearMonth = new Map<string, number>();
  data.forEach((d) => byYearMonth.set(`${d.year}-${d.month}`, d.count));

  return (
    <div>
      <div className="chart-title">Actividad por mes y año</div>
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
              const opacity = count === 0 ? 0 : 0.25 + 0.75 * (count / max);
              return (
                <div
                  key={month}
                  className="heatmap-cell"
                  title={`${year}-${month}: ${count} libro${count === 1 ? '' : 's'}`}
                  style={
                    count > 0
                      ? {
                          background: `hsla(var(--accent-h), var(--accent-s), var(--accent-l), ${opacity})`,
                          borderColor: 'transparent',
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
