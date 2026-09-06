import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
}

function buildStats(wrapped: WrappedSummary): Stat[] {
  const stats: Stat[] = [
    { label: 'Libros leídos', value: String(wrapped.totalBooks) },
    { label: 'Páginas leídas', value: String(wrapped.totalPages) },
  ];
  if (wrapped.topAuthor) stats.push({ label: 'Autor favorito', value: wrapped.topAuthor });
  if (wrapped.topTag) stats.push({ label: 'Tag favorito', value: wrapped.topTag });
  if (wrapped.bestRatedBookTitle) {
    stats.push({
      label: 'Mejor valorado',
      value: `${wrapped.bestRatedBookTitle} (${'★'.repeat(wrapped.bestRatedBookRating ?? 0)})`,
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
    <div className="wrapped-card">
      <div className="wrapped-heading">Tu {wrapped.year} en libros</div>
      <div className="wrapped-stats">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
          >
            <div className="wrapped-stat-value">{stat.value}</div>
            <div className="wrapped-stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="wrapped-actions">
        <button type="button" className="btn" disabled={exporting || !canExport} onClick={handleExport}>
          {exporting ? 'Exportando...' : 'Exportar como imagen'}
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
                <div className="wrapped-export-stat-value">{stat.value}</div>
                <div className="wrapped-export-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="wrapped-export-footer">Hecho con BucRater</div>
        </div>
      </div>
    </div>
  );
}
