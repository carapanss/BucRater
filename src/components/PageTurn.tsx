import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, cubicBezier, useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion';

/** Dirección del giro: 1 pasa la hoja hacia delante (a la izquierda), -1 la devuelve. */
export type TurnDirection = 1 | -1;

const TURN_SECONDS = 1.05;
const COVER_SECONDS = 0.16;
const STAGGER_SECONDS = 0.13;
const MAX_SHEETS = 3;
const SETTLE_SECONDS = 0.55;
/** Tiras articuladas que forman la hoja: cada una gira un poco más que la anterior y el papel se curva. */
const STRIPS = 22;
const TURN_DEG = -178;
/** Cuánto se arquea la hoja a mitad de giro (grados extra por tira). */
const BEND_DEG = -1.6;
/** Aceleración lenta al despegar, rápida al cruzar la vertical y suave al asentarse. */
const turnEase = cubicBezier(0.42, 0, 0.22, 1);

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** La hoja se desvanece cuando pasa de la vertical: al otro lado del lomo no hay página. */
const visibleAt = (p: number) => 1 - clamp01((p - 0.5) / 0.3);

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

/** Cadena de tiras: la primera cuelga del lomo y cada una cuelga de la anterior. */
function Strip({ index }: { index: number }) {
  return (
    <div className={`turn-strip${index === 0 ? ' is-first' : ''}${index === STRIPS - 1 ? ' is-last' : ''}`} style={{ '--k': index } as CSSProperties}>
      <div className="turn-face" />
      {index < STRIPS - 1 && <Strip index={index + 1} />}
    </div>
  );
}

export function PageTurn({ pageKey, direction, distance = 1, children, variant = 'page' }: PageTurnProps) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frozen = useRef<ReactNode>(children);
  const stop = useRef<(() => void) | null>(null);
  const height = useMotionValue(0);
  const heightAnim = useRef<{ stop: () => void } | null>(null);

  const [shownKey, setShownKey] = useState(pageKey);
  const [run, setRun] = useState<{ sheets: number; inkDelay: number } | null>(null);
  const turning = run !== null;

  // Mientras una hoja se va, el contenido viejo se queda tal cual hasta que la hoja lo tapa.
  useLayoutEffect(() => {
    if (shownKey === pageKey) frozen.current = children;
  });

  const finish = useCallback(() => {
    stop.current = null;
    heightAnim.current?.stop();
    heightAnim.current = null;
    setRun(null);
  }, []);

  useLayoutEffect(() => {
    if (shownKey === pageKey) return;
    stop.current?.();
    stop.current = null;

    const wrap = wrapRef.current;
    if (reduce || !wrap) {
      setShownKey(pageKey);
      setRun(null);
      return;
    }

    const forward = direction > 0;
    const sheets = Math.min(MAX_SHEETS, Math.max(1, Math.round(distance)));
    const landAt = (sheets - 1) * STAGGER_SECONDS + TURN_SECONDS;
    const swapAt = forward ? COVER_SECONDS : landAt;
    // Tras el cambio de contenido queda tiempo para que la altura del libro se asiente.
    const total = (forward ? COVER_SECONDS + landAt : landAt) + (forward ? 0 : SETTLE_SECONDS);
    // La tinta de la hoja nueva empieza a imprimirse cuando la primera hoja ya ha despegado.
    const inkDelay = forward ? (sheets - 1) * STAGGER_SECONDS + TURN_SECONDS * 0.22 : 0.12;

    // El libro conserva su altura actual y la cambia con calma, en vez de dar un salto.
    height.set(contentRef.current?.offsetHeight ?? wrap.offsetHeight);
    setRun({ sheets, inkDelay });

    let swapped = false;
    const width = wrap.offsetWidth;

    const paint = (time: number) => {
      const fade = forward ? clamp01(time / COVER_SECONDS) : 1 - clamp01((time - landAt) / COVER_SECONDS);
      for (let i = 0; i < sheets; i++) {
        const node = sheetRefs.current[i];
        if (!node) continue;
        // 0: hoja plana sobre la página; 1: hoja pasada al otro lado del lomo.
        let p: number;
        let opacity: number;
        if (forward) {
          p = turnEase(clamp01((time - COVER_SECONDS - i * STAGGER_SECONDS) / TURN_SECONDS));
          opacity = fade * visibleAt(p);
        } else {
          p = 1 - turnEase(clamp01((time - i * STAGGER_SECONDS) / TURN_SECONDS));
          opacity = fade * visibleAt(p);
        }
        const bend = BEND_DEG * Math.sin(Math.PI * p);
        // Borde libre de la hoja ya curvada: suma de lo que avanza cada tira (proyección plana).
        let edge = 0;
        for (let k = 0; k < STRIPS; k++) {
          edge += Math.cos(((p * TURN_DEG + (k + 1) * bend) * Math.PI) / 180);
        }
        edge *= (node.offsetWidth || width) / STRIPS;
        node.style.setProperty('--a', `${(p * TURN_DEG).toFixed(2)}deg`);
        node.style.setProperty('--c', `${bend.toFixed(2)}deg`);
        node.style.setProperty('--o', opacity.toFixed(3));
        node.style.setProperty('--edge', `${edge.toFixed(1)}px`);
        node.style.setProperty('--cast', (Math.sin(Math.PI * p) * 0.9).toFixed(3));
      }
    };

    paint(0);
    const controls = animate(0, total, {
      duration: total,
      ease: 'linear',
      onUpdate: (time) => {
        if (!swapped && time >= swapAt) {
          swapped = true;
          setShownKey(pageKey);
        }
        paint(time);
      },
      onComplete: () => {
        if (!swapped) setShownKey(pageKey);
        finish();
      },
    });
    stop.current = () => {
      controls.stop();
      setShownKey(pageKey);
    };
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Altura del contenido: durante un giro se anima, el resto del tiempo manda el contenido.
  useEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (!turning) return;
      heightAnim.current?.stop();
      heightAnim.current = animate(height, node.offsetHeight, { duration: 0.55, ease: [0.3, 0, 0.1, 1] });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [turning, shownKey, height]);

  useEffect(() => () => stop.current?.(), []);

  const showing = shownKey === pageKey ? children : frozen.current;

  return (
    <div
      ref={wrapRef}
      className={`page-turn is-${variant}${turning ? ' is-turning' : ''}`}
      style={run ? ({ '--ink-delay': `${run.inkDelay.toFixed(2)}s` } as CSSProperties) : undefined}
    >
      <HeightBox active={turning} value={height}>
        <div ref={contentRef} key={shownKey} className="page-leaf">
          {showing}
        </div>
      </HeightBox>
      {run && (
        <div className="turn-sheets" aria-hidden="true">
          {Array.from({ length: run.sheets }, (_, i) => (
            <div
              key={i}
              className="turn-sheet"
              ref={(node) => {
                sheetRefs.current[i] = node;
              }}
              style={{ zIndex: direction > 0 ? run.sheets - i : i + 1 }}
            >
              <div className="turn-cast" />
              <Strip index={0} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Fija la altura del libro mientras dura el giro; fuera de él no hace nada. */
function HeightBox({
  active,
  value,
  children,
}: {
  active: boolean;
  value: MotionValue<number>;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!active) {
      node.style.height = '';
      return;
    }
    node.style.height = `${value.get()}px`;
    return value.on('change', (v) => {
      node.style.height = `${v}px`;
    });
  }, [active, value]);
  return (
    <div ref={ref} className="page-box">
      {children}
    </div>
  );
}
