import type { Tag } from '../types';

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className="tag-badge">
      <span className="tag-badge-dot" style={tag.color ? { background: tag.color } : undefined} />
      {tag.name}
    </span>
  );
}
