import { useInkStore } from '../store/useInkStore';
import { Icon } from './Icon';

/** Devuelve el color a las portadas (o lo quita) sin tocar el resto del libro. */
export function InkToggle() {
  const color = useInkStore((s) => s.color);
  const toggleColor = useInkStore((s) => s.toggleColor);
  const label = color ? 'Portadas en blanco y negro' : 'Devolver el color a las portadas';

  return (
    <button
      type="button"
      className="cloth-button icon-only"
      onClick={toggleColor}
      aria-pressed={color}
      aria-label={label}
      title={label}
    >
      <Icon name="palette" />
    </button>
  );
}
