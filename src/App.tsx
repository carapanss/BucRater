import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeStore } from './store/useThemeStore';
import { useTagsStore } from './store/useTagsStore';
import { useBooksStore } from './store/useBooksStore';
import { errorMessage, useToastStore } from './store/useToastStore';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastStack } from './components/ToastStack';
import { ExportMenu } from './components/ExportMenu';
import { BookListView } from './views/BookListView';
import { MetricsView } from './views/MetricsView';
import { TagsManagerView } from './views/TagsManagerView';
import { importBackup } from './api/backup';
import { syncLibrary } from './api/sync';

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
      try {
        const result = await syncLibrary();
        if (result.connected && result.changed) {
          pushToast(`Biblioteca sincronizada: ${result.bookCount} libros disponibles.`);
        }
      } catch (err) {
        pushToast(`No se pudo iniciar la sincronización: ${errorMessage(err)}`, 'error');
      } finally {
        await Promise.all([loadBooks(), loadTags()]);
        if (!cancelled) setSyncReady(true);
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
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">BucRater</span>
        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab${view === tab.id ? ' active' : ''}`}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
              {view === tab.id && <motion.div className="nav-tab-underline" layoutId="nav-underline" />}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button type="button" className="btn btn-sm" onClick={() => void handleImport()}>
            Importar
          </button>
          <ExportMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="app-body">
        {!syncReady ? (
          <p className="empty-state">Conectando con tu biblioteca…</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {view === 'list' && <BookListView />}
              {view === 'metrics' && <MetricsView />}
              {view === 'tags' && <TagsManagerView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <ToastStack />
    </div>
  );
}
