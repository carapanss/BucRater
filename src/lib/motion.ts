import type { Transition } from 'framer-motion';

/** Muelle principal: firme, sin rebote visible. Para tapas, modales y reordenaciones. */
export const springFirm: Transition = { type: 'spring', stiffness: 420, damping: 38, mass: 0.9 };

/** Muelle con algo de vida: estrellas, contadores, pequeños objetos que se asientan. */
export const springLively: Transition = { type: 'spring', stiffness: 520, damping: 22 };

/** Salida exponencial para entradas por opacidad y desplazamiento. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;
