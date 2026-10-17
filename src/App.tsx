import { useEffect, useState, type CSSProperties } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { useThemeStore } from './store/useThemeStore';
import { useTagsStore } from './store/useTagsStore';
import { useBooksStore } from './store/useBooksStore';
import { useShelfStore } from './store/useShelfStore';
import { errorMessage, useToastStore } from './store/useToastStore';
import { ThemeToggle } from './components/ThemeToggle';
import { UpdateButton } from './components/UpdateButton';
import { ToastStack } from './components/ToastStack';
import { ExportMenu } from './components/ExportMenu';
import { BookListView } from './views/BookListView';
import { MetricsView } from './views/MetricsView';
import { TagsManagerView } from './views/TagsManagerView';
import { ShelfView } from './views/ShelfView';
import { PageTurn, type TurnDirection } from './components/PageTurn';
import { importBackup } from './api/backup';
import { syncLibrary } from './api/sync';
import { Icon } from './components/Icon';
import { easeOutExpo } from './lib/motion';

type View = 'list' | 'wishlist' | 'owned' | 'metrics' | 'tags';

// Cada sección es una cinta marcapáginas del color de una tela de encuadernar.
const TABS: { id: View; label: string; ribbon: string }[] = [
  { id: 'list', label: 'Libros', ribbon: 'var(--cloth-oxblood)' },
  { id: 'wishlist', label: 'Quiero leer', ribbon: 'var(--cloth-ink)' },
  { id: 'owned', label: 'Comprados', ribbon: 'var(--cloth-ochre)' },
  { id: 'metrics', label: 'Métricas', ribbon: 'var(--cloth-green)' },
  { id: 'tags', label: 'Tags', ribbon: 'var(--cloth-plum)' },
];

const CHAPTER: Record<View, string> = {
  list: 'Biblioteca',
  wishlist: 'Quiero leer',
  owned: 'Comprados sin leer',
  metrics: 'Métricas',
  tags: 'Tags',
};

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const loadTags = useTagsStore((s) => s.load);
  const loadBooks = useBooksStore((s) => s.load);
  const loadShelf = useShelfStore((s) => s.load);
  const pushToast = useToastStore((s) => s.push);
  const [view, setView] = useState<View>('list');
  const [direction, setDirection] = useState<TurnDirection>(1);
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
        await Promise.all([loadBooks(), loadTags(), loadShelf()]);
      } finally {
        if (!cancelled) setSyncReady(true);
      }

      try {
        const result = await syncLibrary();
        if (result.connected && result.changed) {
          pushToast(`Biblioteca sincronizada: ${result.bookCount} libros disponibles.`);
          await Promise.all([loadBooks(), loadTags(), loadShelf()]);
        }
      } catch (err) {
        pushToast(`No se pudo sincronizar en segundo plano: ${errorMessage(err)}`, 'error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadBooks, loadTags, loadShelf, pushToast]);

  function goTo(next: View) {
    if (next === view) return;
    setDirection(TABS.findIndex((t) => t.id === next) > TABS.findIndex((t) => t.id === view) ? 1 : -1);
    setView(next);
    window.scrollTo({ top: 0 });
  }

  async function handleImport() {
    try {
      const report = await importBackup();
      if (report) {
        pushToast(`Importación completada: ${report.imported} nuevos, ${report.updated} actualizados.`);
        await Promise.all([loadBooks(), loadTags(), loadShelf()]);
      }
    } catch (err) {
      pushToast(`No se pudo importar el backup: ${errorMessage(err)}`, 'error');
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="desk">
        <div className="book">
          <div className="book-gutter" aria-hidden="true" />
          <header className="running-head">
            <span className="app-title">BucRater</span>
            <span className="running-chapter" aria-hidden="true">
              {CHAPTER[view]}
            </span>
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
          <nav className="ribbons" aria-label="Secciones">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ribbon${view === tab.id ? ' active' : ''}`}
                style={{ '--ribbon': tab.ribbon } as CSSProperties}
                aria-current={view === tab.id ? 'page' : undefined}
                onClick={() => goTo(tab.id)}
              >
                <span className="ribbon-label">{tab.label}</span>
              </button>
            ))}
          </nav>
          <main className="app-body">
            {!syncReady ? (
              <BootState />
            ) : (
              <PageTurn pageKey={view} direction={direction}>
                <div className="app-view">
                  {view === 'list' && <BookListView />}
                  {view === 'wishlist' && <ShelfView kind="wishlist" />}
                  {view === 'owned' && <ShelfView kind="owned" />}
                  {view === 'metrics' && <MetricsView />}
                  {view === 'tags' && <TagsManagerView />}
                </div>
              </PageTurn>
            )}
          </main>
        </div>
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
