import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { easeOutExpo } from '../lib/motion';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** "book": la ficha de un libro, sin cabecera visible; la portada vuela desde la estantería. */
  variant?: 'sheet' | 'book';
  /** Tela de la guarda que encabeza la hoja (formularios de un libro). */
  cloth?: string;
}

export function Modal({ title, onClose, children, variant = 'sheet', cloth }: ModalProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isBook = variant === 'book';

  return (
    <motion.div
      className="modal-overlay"
      layoutScroll
      initial={{ backgroundColor: 'rgba(12, 18, 14, 0)', backdropFilter: 'blur(0px)' }}
      animate={{ backgroundColor: 'rgba(12, 18, 14, 0.5)', backdropFilter: 'blur(3px)' }}
      exit={{ backgroundColor: 'rgba(12, 18, 14, 0)', backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.3, ease: easeOutExpo }}
      onClick={onClose}
    >
      {/*
        En la ficha de libro el contenedor no se desvanece: si lo hiciera, la portada que vuela
        dentro se desvanecería con él. Lo que aparece es el papel (capa de fondo) y cada bloque.
      */}
      <motion.div
        className={`modal-content${isBook ? ' is-book' : ''}${cloth ? ' has-endpaper' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={isBook ? { background: 'transparent', boxShadow: 'none' } : undefined}
        initial={isBook ? false : { opacity: 0, y: 24, scale: 0.985 }}
        animate={isBook ? undefined : { opacity: 1, y: 0, scale: 1 }}
        exit={isBook ? undefined : { opacity: 0, y: 12, scale: 0.99, transition: { duration: 0.16, ease: 'easeIn' } }}
        transition={{ duration: 0.45, ease: easeOutExpo }}
        onClick={(e) => e.stopPropagation()}
      >
        {isBook && (
          <motion.div
            className="modal-paper"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.18 } }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          />
        )}
        {cloth && (
          <div className="book-detail-endpaper modal-endpaper" style={{ '--book-cloth': cloth } as CSSProperties} />
        )}
        <div className="modal-header">
          {!isBook && <h2 className="modal-title">{title}</h2>}
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
