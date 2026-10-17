import type { Tag } from '../types';
import { tagStyle } from '../lib/cloth';

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span className="tag-badge">
      <span className="tag-badge-dot ink-fill" style={tagStyle(tag)} />
      {tag.name}
    </span>
  );
}
