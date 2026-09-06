import { useTagsStore } from '../store/useTagsStore';
import { useBooksStore } from '../store/useBooksStore';
import type { BookStatus } from '../types';

export function SearchFilterBar() {
  const filter = useBooksStore((s) => s.filter);
  const setFilter = useBooksStore((s) => s.setFilter);
  const tags = useTagsStore((s) => s.tags);

  return (
    <div className="list-toolbar">
      <input
        className="input"
        placeholder="Buscar por título o autor..."
        value={filter.searchText ?? ''}
        onChange={(e) => setFilter({ ...filter, searchText: e.target.value || null })}
      />
      <select
        className="input"
        value={filter.tagId ?? ''}
        onChange={(e) =>
          setFilter({ ...filter, tagId: e.target.value ? Number(e.target.value) : null })
        }
      >
        <option value="">Todos los tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
      <select
        className="input"
        value={filter.status ?? ''}
        onChange={(e) =>
          setFilter({ ...filter, status: (e.target.value || null) as BookStatus | null })
        }
      >
        <option value="">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="reading">Leyendo</option>
        <option value="read">Leído</option>
      </select>
      <select
        className="input"
        value={filter.minRating ?? ''}
        onChange={(e) =>
          setFilter({ ...filter, minRating: e.target.value ? Number(e.target.value) : null })
        }
      >
        <option value="">Cualquier valoración</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}+ estrellas
          </option>
        ))}
      </select>
    </div>
  );
}
