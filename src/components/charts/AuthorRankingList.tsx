import type { AuthorCount } from '../../types';

export function AuthorRankingList({ data }: { data: AuthorCount[] }) {
  if (data.length === 0) {
    return <p className="empty-state">Todavía no hay autores registrados.</p>;
  }

  return (
    <div>
      <div className="chart-title">Autores más leídos</div>
      <div className="ranking-list">
        {data.map((a, i) => (
          <div key={a.author} className="ranking-row">
            <span className="ranking-rank">{i + 1}</span>
            <span className="ranking-name">{a.author}</span>
            <span className="ranking-count">{a.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
