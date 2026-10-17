import type { CSSProperties } from 'react';
import type { Book, Tag } from '../types';

// Telas de encuadernar por defecto, en el orden en que se reparten entre libros sin tag.
const CLOTHS = [
  'var(--cloth-green)',
  'var(--cloth-oxblood)',
  'var(--cloth-ink)',
  'var(--cloth-ochre)',
  'var(--cloth-plum)',
  'var(--cloth-slate)',
];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Color de la tela del libro: el de su primer tag o, si no tiene, uno estable según el título. */
export function clothFor(book: Pick<Book, 'title' | 'author' | 'tags'>): string {
  const tagColor = book.tags.find((tag) => tag.color)?.color;
  if (tagColor) return tagColor;
  return CLOTHS[hash(`${book.title}\u0000${book.author}`) % CLOTHS.length];
}

/** Grosor del lomo en px a partir de las páginas, y una altura estable para variar la estantería. */
export function spineMetrics(book: Pick<Book, 'title' | 'pageCount'>): { width: number; height: number } {
  const pages = book.pageCount ?? 280;
  const width = Math.round(Math.min(64, Math.max(26, 18 + pages / 14)));
  const height = 200 + (hash(book.title) % 5) * 10;
  return { width, height };
}

/** Cuántas tramas distintas hay (--pat-0 … --pat-5 en themes.css). */
export const PATTERN_COUNT = 6;

/** Trama de un tag: estable, para que los libros del mismo tag compartan encuadernación. */
export function tagPattern(tag: Pick<Tag, 'id'>): number {
  return tag.id % PATTERN_COUNT;
}

/**
 * Encuadernación del libro: la trama (blanco y negro) y la tela (color), que se elige según
 * el modo de tinta. Ambas se heredan por todo lo que se dibuja dentro del libro.
 */
export function clothStyle(book: Pick<Book, 'title' | 'author' | 'tags'>): CSSProperties {
  const tag = book.tags.find((t) => t.color);
  const index = tag ? tagPattern(tag) : hash(`${book.title}\u0000${book.author}`) % PATTERN_COUNT;
  return { '--book-cloth': clothFor(book), '--book-pattern': `var(--pat-${index})` } as CSSProperties;
}

/** Trama y color de un tag, para las marcas pequeñas que lo representan. */
export function tagStyle(tag: Pick<Tag, 'id' | 'color'>): CSSProperties {
  return {
    '--book-cloth': tag.color ?? 'var(--cloth-green)',
    '--book-pattern': `var(--pat-${tagPattern(tag)})`,
  } as CSSProperties;
}

/** Encuadernación de un libro que aún no existe (formularios nuevos). */
export const NEW_BOOK_STYLE: CSSProperties = {
  '--book-cloth': 'var(--cloth-green)',
  '--book-pattern': 'var(--pat-0)',
} as CSSProperties;
