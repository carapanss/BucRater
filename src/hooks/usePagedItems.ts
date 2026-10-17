import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TurnDirection } from '../components/PageTurn';

export interface PagedItems<T> {
  /** Referencia del contenedor cuyo ancho decide cuántos libros caben por hoja. */
  measureRef: (node: HTMLElement | null) => void;
  width: number;
  /** Hojas → baldas → libros. */
  pages: T[][][];
  page: number;
  direction: TurnDirection;
  goTo: (page: number) => void;
  turn: (delta: 1 | -1) => void;
}

/**
 * Reparte los libros en hojas según el ancho disponible y recuerda hacia dónde se pasó la
 * última hoja. `pack` recibe el ancho del contenedor y los libros y devuelve las hojas, cada una con sus baldas.
 */
export function usePagedItems<T>(
  items: T[],
  pack: (items: T[], width: number) => T[][][],
  resetKey: string,
): PagedItems<T> {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<TurnDirection>(1);
  const observer = useRef<ResizeObserver | null>(null);

  const measureRef = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    setWidth(Math.floor(node.clientWidth));
    if (typeof ResizeObserver === 'undefined') return;
    observer.current = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      setWidth((current) => (Math.abs(current - next) > 1 ? next : current));
    });
    observer.current.observe(node);
  }, []);

  const pages = width > 0 ? pack(items, width) : [];
  const lastPage = Math.max(0, pages.length - 1);
  const current = Math.min(page, lastPage);

  // Al cambiar los filtros se vuelve a la primera hoja.
  useLayoutEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, lastPage));
      if (clamped === current) return;
      setDirection(clamped > current ? 1 : -1);
      setPage(clamped);
    },
    [current, lastPage],
  );

  const turn = useCallback((delta: 1 | -1) => goTo(current + delta), [current, goTo]);

  return { measureRef, width, pages, page: current, direction, goTo, turn };
}
