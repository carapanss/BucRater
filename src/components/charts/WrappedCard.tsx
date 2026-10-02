import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DigitRoll } from '../DigitRoll';
import { Icon, StarGlyph } from '../Icon';
import { easeOutExpo } from '../../lib/motion';
import { toPng } from 'html-to-image';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { errorMessage, useToastStore } from '../../store/useToastStore';
import type { WrappedSummary } from '../../types';

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

interface Stat {
  label: string;
  value: string;
  /** Las cifras puras se muestran con el contador mecánico. */
  count?: number;
  stars?: number;
}

function buildStats(wrapped: WrappedSummary): Stat[] {
  const stats: Stat[] = [
    { label: 'Libros leídos', value: String(wrapped.totalBooks), count: wrapped.totalBooks },
    { label: 'Páginas leídas', value: String(wrapped.totalPages), count: wrapped.totalPages },
  ];
  if (wrapped.topAuthor) stats.push({ label: 'Autor favorito', value: wrapped.topAuthor });
  if (wrapped.topTag) stats.push({ label: 'Tag favorito', value: wrapped.topTag });
  if (wrapped.bestRatedBookTitle) {
    stats.push({
      label: 'Mejor valorado',
      value: wrapped.bestRatedBookTitle,
      stars: wrapped.bestRatedBookRating ?? 0,
    });
  }
  if (wrapped.longestStreakMonths > 0) {
    stats.push({
      label: 'Racha más larga',
      value: pluralize(wrapped.longestStreakMonths, 'mes seguido', 'meses seguidos'),
    });
  }
  return stats;
}

export function WrappedCard({ wrapped }: { wrapped: WrappedSummary }) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const stats = buildStats(wrapped);
  const canExport = wrapped.totalBooks > 0;
  const pushToast = useToastStore((s) => s.push);

  async function handleExport() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 });
      const path = await save({
        defaultPath: `bucrater-wrapped-${wrapped.year}.png`,
        filters: [{ name: 'PNG', extensions: ['png'] }],
      });
      if (!path) return;
      const base64 = dataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      await writeFile(path, bytes);
      pushToast('Imagen exportada correctamente.');
    } catch (err) {
      pushToast(`No se pudo exportar la imagen: ${errorMessage(err)}`, 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="wrapped-card" aria-label={`Resumen de ${wrapped.year}`}>
      <div className="wrapped-frame" aria-hidden="true" />
      <motion.h2
        className="wrapped-heading"
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: easeOutExpo }}
      >
        Tu {wrapped.year} en libros
      </motion.h2>
      {canExport ? (
        <>
          <motion.p
            className="wrapped-colophon"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.1 }}
          >
            En {wrapped.year} leíste <DigitRoll value={wrapped.totalBooks} />{' '}
            {wrapped.totalBooks === 1 ? 'libro' : 'libros'} y <DigitRoll value={wrapped.totalPages} /> páginas.
          </motion.p>
          <dl className="wrapped-ledger">
            {stats
              .filter((stat) => stat.count === undefined)
              .map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.25 + i * 0.06 }}
                >
                  <dt>{stat.label}</dt>
                  <dd>
                    {stat.value}
                    {stat.stars ? <Stars count={stat.stars} size={13} /> : null}
                  </dd>
                </motion.div>
              ))}
          </dl>
        </>
      ) : (
        <p className="wrapped-empty">
          Aún no hay libros leídos con fecha en {wrapped.year}. Cuando marques alguno como leído aparecerá aquí tu
          resumen del año.
        </p>
      )}
      <div className="wrapped-actions">
        <button type="button" className="cloth-button is-foil" disabled={exporting || !canExport} onClick={handleExport}>
          <Icon name="export" size={16} />
          {exporting ? 'Exportando…' : 'Exportar como imagen'}
        </button>
      </div>

      {/* Plantilla fuera de pantalla, con su propio diseño de póster — es lo único que se captura al exportar */}
      <div className="wrapped-export-offscreen" aria-hidden="true">
        <div className="wrapped-export" ref={exportRef}>
          <div className="wrapped-export-brand">BucRater</div>
          <div className="wrapped-export-title">Tu {wrapped.year}&nbsp;en libros</div>
          <div className="wrapped-export-divider" />
          <div className="wrapped-export-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="wrapped-export-stat">
                <div className="wrapped-export-stat-value">
                  {stat.value}
                  {stat.stars ? <Stars count={stat.stars} size={30} /> : null}
                </div>
                <div className="wrapped-export-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="wrapped-export-footer">Hecho con BucRater</div>
        </div>
      </div>
    </section>
  );
}

function Stars({ count, size }: { count: number; size: number }) {
  return (
    <span className="wrapped-stars" role="img" aria-label={`${count} de 5`}>
      {Array.from({ length: count }, (_, i) => (
        <StarGlyph key={i} filled size={size} />
      ))}
    </span>
  );
}
