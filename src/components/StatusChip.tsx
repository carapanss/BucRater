import type { BookStatus } from '../types';

export const STATUS_LABEL: Record<BookStatus, string> = {
  pending: 'Pendiente',
  reading: 'A medias',
  read: 'Leído',
};

/** El estado se lee por el relleno de la marca (lleno, medio, vacío) además de por su color. */
export function StatusChip({ status }: { status: BookStatus }) {
  return (
    <span className={`status-chip status-${status}`}>
      <span className="status-mark" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}
