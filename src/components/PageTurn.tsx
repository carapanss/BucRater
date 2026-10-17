import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

/** Dirección del giro: 1 pasa la hoja hacia delante (a la izquierda), -1 la devuelve. */
export type TurnDirection = 1 | -1;

const TURN_SECONDS = 0.95;
const TURN_DEG = -98;
/** Aceleración lenta al despegar, rápida al cruzar la vertical y suave al asentarse. */
const PAGE_EASE = [0.5, 0.02, 0.18, 1] as const;

// La hoja visible se levanta por el borde derecho y gira sobre el lomo. Mientras sube se
// inclina y se arquea un poco (skewY + escala) para que no gire como un cartón rígido, y al
// pasar de la vertical desaparece sin más (la cara trasera no se pinta). Debajo ya está la siguiente. Hacia atrás ocurre al revés:
// la hoja vuelve desde el lado del lomo y se posa encima con un pequeño rebote de peso.
const leaf: Variants = {
  enter: (dir: TurnDirection) =>
    dir > 0
      ? { rotateY: 0, skewY: 0, scaleX: 1, zIndex: 0 }
      : { rotateY: TURN_DEG, skewY: -1.6, scaleX: 0.99, zIndex: 2 },
  center: (dir: TurnDirection) => ({
    rotateY: 0,
    skewY: 0,
    scaleX: 1,
    zIndex: dir > 0 ? 0 : 2,
    transition:
      dir > 0
        ? { duration: TURN_SECONDS, zIndex: { duration: 0 } }
        : {
            zIndex: { duration: 0 },
            rotateY: { type: 'spring', stiffness: 62, damping: 13, mass: 0.9 },
            skewY: { duration: TURN_SECONDS * 0.8, ease: PAGE_EASE },
            scaleX: { duration: TURN_SECONDS * 0.8, ease: PAGE_EASE },
          },
  }),
  exit: (dir: TurnDirection) =>
    dir > 0
      ? {
          rotateY: [0, -22, -58, TURN_DEG],
          skewY: [0, -0.4, -1.1, -1.6],
          scaleX: [1, 1, 0.995, 0.99],
          zIndex: 2,
          transition: {
            duration: TURN_SECONDS,
            times: [0, 0.34, 0.74, 1],
            ease: PAGE_EASE,
            zIndex: { duration: 0 },
          },
        }
      : { rotateY: 0, zIndex: 0, transition: { duration: TURN_SECONDS, zIndex: { duration: 0 } } },
};

// Sombra sobre la hoja que gira y sombra que proyecta sobre la de debajo.
const shade: Variants = {
  enter: (dir: TurnDirection) => ({ opacity: dir > 0 ? 0.34 : 0 }),
  center: { opacity: 0, transition: { duration: TURN_SECONDS, ease: 'easeOut' } },
  exit: (dir: TurnDirection) => ({
    opacity: dir > 0 ? [0, 0.25, 0.7] : 0.34,
    transition: { duration: TURN_SECONDS, times: dir > 0 ? [0, 0.5, 1] : undefined },
  }),
};

// El canto de las hojas: se ve un instante, mientras la hoja está levantada.
const edge: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 0, transition: { duration: 0.3 } },
  exit: (dir: TurnDirection) => ({ opacity: dir > 0 ? [0, 1, 1, 0] : 0, transition: { duration: TURN_SECONDS } }),
};

/** Hoja en blanco que pasa deprisa cuando se saltan varias secciones o hojas de golpe. */
function Ghost({ index, direction, onDone }: { index: number; direction: TurnDirection; onDone: () => void }) {
  const forward = direction > 0;
  return (
    <motion.div
      className="page-ghost"
      aria-hidden="true"
      initial={{ rotateY: forward ? 0 : TURN_DEG }}
      animate={{ rotateY: forward ? [0, -40, TURN_DEG] : [TURN_DEG, -40, 0] }}
      transition={{
        duration: TURN_SECONDS * 0.72,
        delay: 0.07 + index * 0.1,
        ease: PAGE_EASE,
        times: [0, 0.55, 1],
      }}
      onAnimationComplete={onDone}
    />
  );
}

interface PageTurnProps {
  /** Identifica la página actual; al cambiar, se pasa la hoja. */
  pageKey: string | number;
  direction: TurnDirection;
  /** Cuántas hojas se saltan en este giro (1 si es la siguiente). Las intermedias pasan en cadena. */
  distance?: number;
  children: ReactNode;
  /** `shelf`: la hoja gira sobre el lomo del libro, no sobre su propio borde izquierdo. */
  variant?: 'page' | 'shelf';
}

export function PageTurn({ pageKey, direction, distance = 1, children, variant = 'page' }: PageTurnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHeight = useRef(0);
  const lastKey = useRef(pageKey);
  const [hold, setHold] = useState<number | null>(null);
  const [ghosts, setGhosts] = useState<{ key: string; count: number } | null>(null);

  // Mientras la hoja vieja se va, el libro conserva su altura: así el borde inferior no salta.
  useLayoutEffect(() => {
    if (lastKey.current === pageKey) return;
    lastKey.current = pageKey;
    if (lastHeight.current > 0) setHold(lastHeight.current);
    const intermediate = Math.min(3, Math.max(0, Math.round(distance) - 1));
    setGhosts(intermediate > 0 ? { key: String(pageKey), count: intermediate } : null);
  }, [pageKey, distance]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (hold === null) lastHeight.current = node.offsetHeight;
    });
    observer.observe(node);
    lastHeight.current = node.offsetHeight;
    return () => observer.disconnect();
  }, [hold]);

  const releaseHold = useCallback(() => setHold(null), []);
  const dropGhosts = useCallback(() => setGhosts(null), []);

  return (
    <div
      ref={containerRef}
      className={`page-turn is-${variant}`}
      style={hold !== null ? { minHeight: hold } : undefined}
    >
      <AnimatePresence mode="popLayout" custom={direction} initial={false} onExitComplete={releaseHold}>
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
          <motion.span className="page-leaf-edge" aria-hidden="true" custom={direction} variants={edge} />
        </motion.div>
      </AnimatePresence>
      {ghosts &&
        Array.from({ length: ghosts.count }, (_, i) => (
          <Ghost
            key={`${ghosts.key}-${i}`}
            index={i}
            direction={direction}
            onDone={i === ghosts.count - 1 ? dropGhosts : () => undefined}
          />
        ))}
    </div>
  );
}
