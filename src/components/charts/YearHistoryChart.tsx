import type { YearStats } from '../../types';
import { SpineBarChart } from './SpineBarChart';

export function YearHistoryChart({ history }: { history: YearStats[] }) {
  return (
    <SpineBarChart
      title="Libros por año"
      bars={history.map((y) => ({
        key: y.year,
        value: y.books,
        label: y.year,
        title: `${y.year}: ${y.books} libro${y.books === 1 ? '' : 's'} · ${y.pages} páginas${
          y.avgRating !== null ? ` · ${y.avgRating.toFixed(1)} de media` : ''
        }`,
      }))}
    />
  );
}
