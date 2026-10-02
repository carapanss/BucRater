import { AnimatePresence, motion } from 'framer-motion';
import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useThemeStore } from '../store/useThemeStore';
import { Icon } from './Icon';
import { springLively } from '../lib/motion';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const doc = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduceMotion) {
      toggleTheme();
      return;
    }

    // El tema nuevo se despliega en círculo desde el propio botón.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(() => {
      flushSync(() => {
        toggleTheme();
        document.documentElement.dataset.theme = useThemeStore.getState().theme;
      });
    });
    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }

  return (
    <button
      type="button"
      className="cloth-button icon-only"
      onClick={handleClick}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          className="theme-icon"
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={springLively}
        >
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
