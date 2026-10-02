import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../store/useToastStore';
import { Icon } from './Icon';
import { springFirm } from '../lib/motion';

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            className={`toast toast-${toast.variant}`}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={springFirm}
          >
            <Icon name={toast.variant === 'error' ? 'alert' : 'check'} size={17} className="toast-icon" />
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Cerrar notificación"
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="close" size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
