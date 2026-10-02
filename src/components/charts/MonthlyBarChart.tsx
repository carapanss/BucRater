import type { MonthCount } from '../../types';
import { SpineBarChart } from './SpineBarChart';

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function MonthlyBarChart({ data }: { data: MonthCount[] }) {
  return (
    <SpineBarChart
      title="Libros por mes"
      bars={data.map((d) => ({
        key: d.month,
        value: d.count,
        label: MONTH_ABBR[d.month - 1],
        title: `${MONTH_ABBR[d.month - 1]}: ${d.count} libro${d.count === 1 ? '' : 's'}`,
      }))}
    />
  );
}
