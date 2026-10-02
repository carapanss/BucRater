import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useThemeStore } from './store/useThemeStore';
import { useTagsStore } from './store/useTagsStore';
import { useBooksStore } from './store/useBooksStore';
import { errorMessage, useToastStore } from './store/useToastStore';
import { ThemeToggle } from './components/ThemeToggle';
import { UpdateButton } from './components/UpdateButton';
import { ToastStack } from './components/ToastStack';
import { ExportMenu } from './components/ExportMenu';
import { BookListView } from './views/BookListView';
import { MetricsView } from './views/MetricsView';
import { TagsManagerView } from './views/TagsManagerView';
import { importBackup } from './api/backup';
import { syncLibrary } from './api/sync';
import { Icon } from './components/Icon';
import { easeOutExpo, springFirm } from './lib/motion';

type View = 'list' | 'metrics' | 'tags';

const TABS: { id: View; label: string }[] = [
  { id: 'list', label: 'Libros' },
  { id: 'metrics', label: 'Métricas' },
  { id: 'tags', label: 'Tags' },
];

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const loadTags = useTagsStore((s) => s.load);
  const loadBooks = useBooksStore((s) => s.load);
  const pushToast = useToastStore((s) => s.push);
  const [view, setView] = useState<View>('list');
  const [syncReady, setSyncReady] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // La biblioteca local debe aparecer sin esperar a la red. La sincronización continúa
      // en segundo plano y solo recargamos si realmente ha traído cambios remotos.
      try {
        await Promise.all([loadBooks(), loadTags()]);
      } finally {
        if (!cancelled) setSyncReady(true);
      }

      try {
        const result = await syncLibrary();
        if (result.connected && result.changed) {
          pushToast(`Biblioteca sincronizada: ${result.bookCount} libros disponibles.`);
          await Promise.all([loadBooks(), loadTags()]);
        }
      } catch (err) {
        pushToast(`No se pudo sincronizar en segundo plano: ${errorMessage(err)}`, 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadBooks, loadTags, pushToast]);

  async function handleImport() {
    try {
      const report = await importBackup();
      if (report) {
        pushToast(`Importación completada: ${report.imported} nuevos, ${report.updated} actualizados.`);
        await Promise.all([loadBooks(), loadTags()]);
      }
    } catch (err) {
      pushToast(`No se pudo importar el backup: ${errorMessage(err)}`, 'error');
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <header className="app-header">
          <span className="app-title">BucRater</span>
          <nav className="nav-tabs" aria-label="Secciones">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`nav-tab${view === tab.id ? ' active' : ''}`}
                aria-current={view === tab.id ? 'page' : undefined}
                onClick={() => setView(tab.id)}
              >
                {tab.label}
                {view === tab.id && (
                  <motion.div className="nav-tab-underline" layoutId="nav-underline" transition={springFirm} />
                )}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="cloth-button"
              onClick={() => void handleImport()}
              title="Importar un backup"
              aria-label="Importar un backup"
            >
              <Icon name="import" size={16} />
              <span className="label">Importar</span>
            </button>
            <ExportMenu />
            <UpdateButton />
            <ThemeToggle />
          </div>
        </header>
        <motion.main className="app-body" layoutScroll>
          {!syncReady ? (
            <BootState />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                className="app-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOutExpo } }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: 'easeIn' } }}
              >
                {view === 'list' && <BookListView />}
                {view === 'metrics' && <MetricsView />}
                {view === 'tags' && <TagsManagerView />}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.main>
        <ToastStack />
      </div>
    </MotionConfig>
  );
}

const BOOT_SPINES = [
  { color: 'var(--cloth-green)', height: 40 },
  { color: 'var(--cloth-oxblood)', height: 32 },
  { color: 'var(--cloth-ochre)', height: 44 },
  { color: 'var(--cloth-ink)', height: 36 },
];

// Mientras se abre la biblioteca, cuatro lomos se colocan en el estante uno tras otro.
function BootState() {
  return (
    <div className="boot-state" role="status">
      <div className="boot-spines" aria-hidden="true">
        {BOOT_SPINES.map((spine, i) => (
          <motion.span
            key={i}
            style={{ background: spine.color, height: spine.height }}
            initial={{ scaleY: 0.2, opacity: 0 }}
            animate={{ scaleY: [0.2, 1, 1, 0.2], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.8, times: [0, 0.3, 0.75, 1], repeat: Infinity, delay: i * 0.12, ease: easeOutExpo }}
          />
        ))}
      </div>
      <span>Abriendo tu biblioteca…</span>
    </div>
  );
}
