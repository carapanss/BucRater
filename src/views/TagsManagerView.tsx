import { useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { useTagsStore } from '../store/useTagsStore';
import { Icon } from '../components/Icon';
import { easeOutExpo } from '../lib/motion';

// Telas de encuadernar: los colores que se asignan a los tags nuevos, por turnos.
const DEFAULT_COLORS = ['#24412f', '#7b2d26', '#22365a', '#9a6c22', '#4f2e4a', '#3e4a4f', '#5d6b2f', '#8a4a2a'];

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
      <div className="tags-manager-head">
        <h1 className="list-head-title">
          Tags
          <span className="list-head-count">
            {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
          </span>
        </h1>
        <form
          className="tags-create"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <input
            className="input"
            aria-label="Nombre del nuevo tag"
            placeholder="Nombre del nuevo tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
            <Icon name="plus" size={16} />
            Crear tag
          </button>
        </form>
      </div>

      {tags.length === 0 ? (
        <p className="empty-state">
          Todavía no has creado ningún tag. Cada tag tiene su color de tela, y los libros que lo lleven se encuadernan
          con él.
        </p>
      ) : (
        <div className="tags-manager-list">
          <AnimatePresence initial={false}>
            {tags.map((tag) => (
              <motion.div
                key={tag.id}
                className="tags-manager-row"
                layout="position"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                transition={{ duration: 0.4, ease: easeOutExpo }}
              >
                <label className="color-swatch" style={{ background: tag.color ?? '#24412f' }} title="Cambiar color">
                  <input
                    type="color"
                    aria-label={`Color del tag ${tag.name}`}
                    value={tag.color ?? '#24412f'}
                    onChange={(e) => {
                      rename(tag.id, tag.name, e.target.value).catch(() => {});
                    }}
                  />
                </label>
                <input
                  className="input"
                  aria-label={`Nombre del tag ${tag.name}`}
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
                  <Icon name="trash" size={15} />
                  Eliminar
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
