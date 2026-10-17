import { useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PageTurn } from './PageTurn';
import { usePagedItems } from '../hooks/usePagedItems';

const NARROW_WIDTH = 600;
const SPINE_GAP = 6;

/** Cuántas baldas caben en una hoja: tres si la ventana es alta, dos en el resto. */
function shelvesPerPage(): number {
  return typeof window !== 'undefined' && window.innerHeight >= 980 ? 3 : 2;
}

/** Ancho mínimo de portada y separación entre portadas (el relleno de cada tarjeta, por dos). */
function coverColumns(width: number): number {
  const [min, gap] = width < NARROW_WIDTH ? [116, 16] : [150, 28];
  return Math.max(1, Math.floor((width + gap) / (min + gap)));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Reparte los lomos en baldas llenando cada una hasta el ancho disponible. */
function packSpines<T>(items: T[], width: number, spineWidth: (item: T) => number): T[][] {
  const rows: T[][] = [];
  let row: T[] = [];
  let used = 0;
  for (const item of items) {
    const w = spineWidth(item) + SPINE_GAP;
    if (row.length > 0 && used + w > width) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(item);
    used += w;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

interface PagedShelfProps<T> {
  items: T[];
  mode: 'covers' | 'spines';
  itemKey: (item: T) => string;
  renderCover: (item: T, index: number) => ReactNode;
  renderSpine?: (item: T, index: number) => ReactNode;
  spineWidth?: (item: T) => number;
  /** Cambia cuando cambian los filtros: la estantería vuelve a la primera hoja. */
  resetKey: string;
  label: string;
}

/** Números de hoja a mostrar: todos si caben; si no, los extremos y los vecinos de la actual. */
function visibleFolios(total: number, current: number): (number | null)[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i);
  const keep = new Set([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...keep].filter((i) => i >= 0 && i < total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((value, i) => {
    if (i > 0 && value - sorted[i - 1] > 1) out.push(null);
    out.push(value);
  });
  return out;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Estantería paginada: cada hoja lleva un par de baldas y se pasa como la hoja de un libro.
 * Con flechas del teclado, con los botones del pie o desde el número de hoja.
 */
export function PagedShelf<T>({
  items,
  mode,
  itemKey,
  renderCover,
  renderSpine,
  spineWidth,
  resetKey,
  label,
}: PagedShelfProps<T>) {
  const { measureRef, width, pages, page, direction, goTo, turn } = usePagedItems<T>(
    items,
    (all, w) => {
      const shelves = shelvesPerPage();
      const rows =
        mode === 'covers'
          ? chunk(all, coverColumns(w))
          : packSpines(all, w, spineWidth ?? (() => 40));
      return chunk(rows, shelves);
    },
    `${mode}|${resetKey}`,
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTyping(event.target) || document.querySelector('[role="dialog"]')) return;
      if (event.key === 'ArrowRight') turn(1);
      else if (event.key === 'ArrowLeft') turn(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  const current = pages[page] ?? [];
  const columns = coverColumns(width);
  let counter = pages.slice(0, page).reduce((n, shelves) => n + shelves.reduce((m, r) => m + r.length, 0), 0);

  return (
    <div className="paged-shelf" ref={measureRef} aria-label={label}>
      <PageTurn pageKey={`${mode}-${page}`} direction={direction}>
        <div className={`shelf-page is-${mode}`}>
          {current.map((row, r) => (
            <div
              key={r}
              className={mode === 'covers' ? 'shelf-row' : 'spine-row'}
              style={mode === 'covers' ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
            >
              {row.map((item) => {
                const index = counter++;
                return (
                  <div key={itemKey(item)} className={mode === 'covers' ? 'shelf-slot' : 'spine-slot-wrap'}>
                    {mode === 'covers' ? renderCover(item, index) : (renderSpine ?? renderCover)(item, index)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </PageTurn>

      {pages.length > 1 && (
        <nav className="folio-nav" aria-label="Hojas de la estantería">
          <button
            type="button"
            className="folio-turn"
            onClick={() => turn(-1)}
            disabled={page === 0}
            aria-label="Hoja anterior"
          >
            <span className="folio-arrow is-back" aria-hidden="true" />
          </button>
          <ol className="folio-list">
            {visibleFolios(pages.length, page).map((i, slot) =>
              i === null ? (
                <li key={`gap-${slot}`} className="folio-gap" aria-hidden="true">
                  …
                </li>
              ) : (
              <li key={i}>
                <button
                  type="button"
                  className={`folio-number${i === page ? ' is-current' : ''}`}
                  aria-current={i === page ? 'page' : undefined}
                  aria-label={`Hoja ${i + 1} de ${pages.length}`}
                  onClick={() => goTo(i)}
                >
                  {i + 1}
                  {i === page && <motion.span className="folio-mark" layoutId={`folio-mark-${label}`} />}
                </button>
              </li>
              ),
            )}
          </ol>
          <button
            type="button"
            className="folio-turn"
            onClick={() => turn(1)}
            disabled={page === pages.length - 1}
            aria-label="Hoja siguiente"
          >
            <span className="folio-arrow" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
