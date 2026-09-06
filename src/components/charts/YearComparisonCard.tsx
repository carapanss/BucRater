import type { YearComparison } from '../../types';

function delta(current: number, previous: number): { text: string; cls: 'up' | 'down' } | null {
  const diff = current - previous;
  if (diff === 0) return null;
  return diff > 0 ? { text: `+${diff}`, cls: 'up' } : { text: `${diff}`, cls: 'down' };
}

export function YearComparisonCard({ comparison }: { comparison: YearComparison }) {
  const { thisYear, lastYear } = comparison;
  const booksDelta = delta(thisYear.books, lastYear.books);
  const pagesDelta = delta(thisYear.pages, lastYear.pages);

  return (
    <div>
      <div className="chart-title">
        {thisYear.year} frente a {lastYear.year}
      </div>
      <div className="comparison-row">
        <div className="comparison-col">
          <span className="comparison-col-label">{thisYear.year}</span>
          <div className="comparison-metric">
            <span>Libros</span>
            <span>
              {thisYear.books}
              {booksDelta && <span className={`comparison-delta ${booksDelta.cls}`}> {booksDelta.text}</span>}
            </span>
          </div>
          <div className="comparison-metric">
            <span>Páginas</span>
            <span>
              {thisYear.pages}
              {pagesDelta && <span className={`comparison-delta ${pagesDelta.cls}`}> {pagesDelta.text}</span>}
            </span>
          </div>
          <div className="comparison-metric">
            <span>Valoración media</span>
            <span>{thisYear.avgRating !== null ? thisYear.avgRating.toFixed(1) : '—'}</span>
          </div>
        </div>
        <div className="comparison-col">
          <span className="comparison-col-label">{lastYear.year}</span>
          <div className="comparison-metric">
            <span>Libros</span>
            <span>{lastYear.books}</span>
          </div>
          <div className="comparison-metric">
            <span>Páginas</span>
            <span>{lastYear.pages}</span>
          </div>
          <div className="comparison-metric">
            <span>Valoración media</span>
            <span>{lastYear.avgRating !== null ? lastYear.avgRating.toFixed(1) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
