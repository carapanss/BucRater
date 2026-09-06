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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

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
      </main>
      <ToastStack />
    </div>
  );
}
