import type { MonthPages } from '../../types';
import { SpineBarChart } from './SpineBarChart';

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function ReadingVelocityChart({ data }: { data: MonthPages[] }) {
  return (
    <SpineBarChart
      title="Páginas leídas por mes"
      tone="alt"
      showValues={false}
      bars={data.map((d) => ({
        key: d.month,
        value: d.pages,
        label: MONTH_ABBR[d.month - 1],
        title: `${MONTH_ABBR[d.month - 1]}: ${d.pages} páginas`,
      }))}
    />
  );
}
