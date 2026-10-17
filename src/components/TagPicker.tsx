import { useTagsStore } from '../store/useTagsStore';
import { motion } from 'framer-motion';
import type { Tag } from '../types';
import { tagStyle } from '../lib/cloth';

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
          whileTap={{ scale: 0.94 }}
          onClick={() => toggle(tag)}
        >
          <span className="tag-badge-dot ink-fill" style={tagStyle(tag)} />
          {tag.name}
        </motion.button>
      ))}
    </div>
  );
}
