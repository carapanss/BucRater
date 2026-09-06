import { useTagsStore } from '../store/useTagsStore';
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
    return <p className="empty-state">Todavía no tienes tags. Créalos en la pestaña Tags.</p>;
  }

  return (
    <div className="tag-picker-list">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={`tag-chip${selectedIds.includes(tag.id) ? ' selected' : ''}`}
          onClick={() => toggle(tag)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
