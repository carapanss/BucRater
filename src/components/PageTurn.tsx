import type { ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

/** Dirección del giro: 1 pasa la hoja hacia delante (a la izquierda), -1 la devuelve. */
export type TurnDirection = 1 | -1;

const TURN_DEG = -96;

// Hacia delante, la hoja visible se levanta por el borde derecho y gira sobre el lomo hasta
// esconderse; debajo ya está la siguiente. Hacia atrás ocurre al revés: la hoja anterior
// vuelve desde el lado del lomo y se posa encima. Solo se animan transform y opacity.
const leaf: Variants = {
  enter: (dir: TurnDirection) =>
    dir > 0 ? { rotateY: 0, opacity: 1 } : { rotateY: TURN_DEG, opacity: 0 },
  center: (dir: TurnDirection) => ({
    rotateY: 0,
    opacity: 1,
    zIndex: dir > 0 ? 0 : 2,
    transition: { duration: 0.62, ease: [0.45, 0.05, 0.2, 1], opacity: { duration: 0.2 } },
  }),
  exit: (dir: TurnDirection) =>
    dir > 0
      ? {
          rotateY: TURN_DEG,
          opacity: [1, 1, 0],
          zIndex: 2,
          transition: { duration: 0.62, ease: [0.45, 0.05, 0.2, 1], opacity: { duration: 0.62, times: [0, 0.7, 1] } },
        }
      : { rotateY: 0, opacity: 1, zIndex: 0, transition: { duration: 0.62 } },
};

// Sombra que cae sobre la hoja que gira, y sombra que la hoja proyecta sobre la de debajo.
const shade: Variants = {
  enter: (dir: TurnDirection) => ({ opacity: dir > 0 ? 0.28 : 0 }),
  center: { opacity: 0, transition: { duration: 0.62, ease: 'easeOut' } },
  exit: (dir: TurnDirection) => ({ opacity: dir > 0 ? 0.55 : 0.28, transition: { duration: 0.62 } }),
};

interface PageTurnProps {
  /** Identifica la página actual; al cambiar, se pasa la hoja. */
  pageKey: string | number;
  direction: TurnDirection;
  children: ReactNode;
  className?: string;
}

export function PageTurn({ pageKey, direction, children, className }: PageTurnProps) {
  return (
    <div className={`page-turn${className ? ` ${className}` : ''}`}>
      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={pageKey}
          className="page-leaf"
          custom={direction}
          variants={leaf}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {children}
          <motion.span className="page-leaf-shade" aria-hidden="true" custom={direction} variants={shade} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
