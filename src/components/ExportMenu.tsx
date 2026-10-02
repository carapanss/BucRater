import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { exportBackup, exportCsv, exportMarkdown } from '../api/backup';
import { errorMessage, useToastStore } from '../store/useToastStore';
import { Icon } from './Icon';
import { easeOutExpo } from '../lib/motion';

const ACTIONS = [
  {
    id: 'json',
    label: 'Backup (JSON)',
    hint: 'Toda la biblioteca, para restaurarla',
    run: exportBackup,
    success: 'Backup exportado correctamente.',
    failurePrefix: 'No se pudo exportar el backup',
  },
  {
    id: 'csv',
    label: 'CSV',
    hint: 'Para abrir en una hoja de cálculo',
    run: exportCsv,
    success: 'CSV exportado correctamente.',
    failurePrefix: 'No se pudo exportar el CSV',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    hint: 'Una lista legible con tus notas',
    run: exportMarkdown,
    success: 'Markdown exportado correctamente.',
    failurePrefix: 'No se pudo exportar el Markdown',
  },
];

export function ExportMenu() {
  const pushToast = useToastStore((s) => s.push);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSelect(action: (typeof ACTIONS)[number]) {
    setOpen(false);
    try {
      const ok = await action.run();
      if (ok) pushToast(action.success);
    } catch (err) {
      pushToast(`${action.failurePrefix}: ${errorMessage(err)}`, 'error');
    }
  }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="cloth-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Exportar biblioteca"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="export" size={16} />
        <span className="label">Exportar</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="menu-popover"
            role="menu"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
          >
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                className="menu-item"
                onClick={() => void handleSelect(action)}
              >
                {action.label}
                <small>{action.hint}</small>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
