import type { AuthorCount } from '../../types';

export function AuthorRankingList({ data }: { data: AuthorCount[] }) {
  if (data.length === 0) {
    return (
      <>
        <h3 className="chart-title">Autores más leídos</h3>
        <p className="field-hint">Todavía no hay autores registrados.</p>
      </>
    );
  }

  return (
    <div>
      <h3 className="chart-title">Autores más leídos</h3>
      <ol className="ranking-list">
        {data.map((a, i) => (
          <li key={a.author} className="ranking-row">
            <span className="ranking-rank">{i + 1}</span>
            <span className="ranking-name">{a.author}</span>
            <span className="ranking-count">{a.count}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
