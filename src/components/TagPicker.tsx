import { useTagsStore } from '../store/useTagsStore';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { Tag } from '../types';

interface TagPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function TagPicker({ selectedIds, onChange }: TagPickerProps) {
  const tags = useTagsStore((s) => s.tags);

  function toggle(tag: Tag) {
    if (selectedIds.includes(tag.id)) {
      onChange(selectedIds.filter((id) => id !== tag.id));
    } else {
      onChange([...selectedIds, tag.id]);
    }
  }

  if (tags.length === 0) {
    return <p className="field-hint">Todavía no tienes tags. Créalos en la pestaña Tags.</p>;
  }

  return (
    <div className="tag-picker-list">
      {tags.map((tag) => (
        <motion.button
          key={tag.id}
          type="button"
          aria-pressed={selectedIds.includes(tag.id)}
          className={`tag-chip${selectedIds.includes(tag.id) ? ' selected' : ''}`}
          style={{ '--tag-color': tag.color ?? undefined } as CSSProperties}
          whileTap={{ scale: 0.94 }}
          onClick={() => toggle(tag)}
        >
          <span className="tag-badge-dot" style={tag.color ? { background: tag.color } : undefined} />
          {tag.name}
        </motion.button>
      ))}
    </div>
  );
}
