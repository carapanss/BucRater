import { StarGlyph } from '../Icon';
import { SpineBarChart } from './SpineBarChart';

export function RatingHistogramChart({ data }: { data: number[] }) {
  return (
    <SpineBarChart
      title="Distribución de valoraciones"
      tone="warm"
      bars={data.map((count, i) => ({
        key: i,
        value: count,
        label: (
          <>
            {i + 1}
            <StarGlyph filled size={10} />
          </>
        ),
        title: `${i + 1} estrella${i === 0 ? '' : 's'}: ${count} libro${count === 1 ? '' : 's'}`,
      }))}
    />
  );
}
