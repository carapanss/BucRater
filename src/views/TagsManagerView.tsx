import { useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useTagsStore } from '../store/useTagsStore';

const DEFAULT_COLORS = ['#8a7355', '#6b7a5e', '#5f7a8a', '#a1453b', '#8a5f8a', '#a68a3f'];

export function TagsManagerView() {
  const tags = useTagsStore((s) => s.tags);
  const load = useTagsStore((s) => s.load);
  const create = useTagsStore((s) => s.create);
  const rename = useTagsStore((s) => s.rename);
  const remove = useTagsStore((s) => s.remove);
  const merge = useTagsStore((s) => s.merge);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const color = DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length];
    try {
      await create(name, color);
      setNewName('');
    } catch {
      // el error ya se notificó mediante un toast
    }
  }

  async function handleDelete(id: number, name: string) {
    const confirmed = await ask(`¿Eliminar el tag "${name}"?`, { title: 'Eliminar tag', kind: 'warning' });
    if (!confirmed) return;
    try {
      await remove(id);
    } catch {
      // el error ya se notificó mediante un toast
    }
  }

  async function handleMerge(sourceId: number, sourceName: string, targetId: number, targetName: string) {
    const confirmed = await ask(
      `¿Fusionar "${sourceName}" dentro de "${targetName}"? Los libros con "${sourceName}" pasarán a tener "${targetName}", y "${sourceName}" se eliminará.`,
      { title: 'Fusionar tags', kind: 'warning' },
    );
    if (!confirmed) return;
    try {
      await merge(sourceId, targetId);
    } catch {
      // el error ya se notificó mediante un toast
    }
  }

  return (
    <div>
      <div className="list-toolbar">
        <input
          className="input"
          placeholder="Nombre del nuevo tag"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          Crear tag
        </button>
      </div>

      {tags.length === 0 ? (
        <p className="empty-state">Todavía no has creado ningún tag.</p>
      ) : (
        <div className="tags-manager-list">
          {tags.map((tag) => (
            <div key={tag.id} className="tags-manager-row">
              <input
                type="color"
                className="color-swatch"
                value={tag.color ?? '#8a7355'}
                onChange={(e) => {
                  rename(tag.id, tag.name, e.target.value).catch(() => {});
                }}
              />
              <input
                className="input"
                value={tag.name}
                onChange={(e) => {
                  rename(tag.id, e.target.value, tag.color).catch(() => {});
                }}
              />
              {tags.length > 1 && (
                <select
                  className="input tags-manager-merge"
                  value=""
                  aria-label={`Fusionar el tag ${tag.name} con otro`}
                  onChange={(e) => {
                    const targetId = Number(e.target.value);
                    e.target.value = '';
                    if (!targetId) return;
                    const target = tags.find((t) => t.id === targetId);
                    if (!target) return;
                    void handleMerge(tag.id, tag.name, target.id, target.name);
                  }}
                >
                  <option value="">Fusionar con…</option>
                  {tags
                    .filter((t) => t.id !== tag.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              )}
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => void handleDelete(tag.id, tag.name)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
