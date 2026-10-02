import type { Book } from '../types';

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
