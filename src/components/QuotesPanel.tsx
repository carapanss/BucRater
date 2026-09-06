import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as quotesApi from '../api/quotes';
import { errorMessage, useToastStore } from '../store/useToastStore';
import type { Quote } from '../types';

export function QuotesPanel({ bookId }: { bookId: number | null }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    if (bookId === null) {
      setQuotes([]);
      return;
    }
    quotesApi
      .listQuotes(bookId)
      .then(setQuotes)
      .catch((err: unknown) => pushToast(`No se pudieron cargar las citas: ${errorMessage(err)}`, 'error'));
  }, [bookId, pushToast]);

  if (bookId === null) {
    return <p className="empty-state">Guarda el libro para poder añadir citas.</p>;
  }

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setLoading(true);
    try {
      const quote = await quotesApi.addQuote(bookId as number, text);
      setQuotes((prev) => [...prev, quote]);
      setDraft('');
    } catch (err) {
      pushToast(`No se pudo añadir la cita: ${errorMessage(err)}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await quotesApi.deleteQuote(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      pushToast(`No se pudo eliminar la cita: ${errorMessage(err)}`, 'error');
    }
  }

  return (
    <div className="quotes-panel">
      <AnimatePresence initial={false}>
        {quotes.map((quote) => (
          <motion.div
            key={quote.id}
            className="quote-item"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p>&ldquo;{quote.text}&rdquo;</p>
            <button
              type="button"
              className="icon-button"
              onClick={() => handleDelete(quote.id)}
              aria-label="Eliminar cita"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {quotes.length === 0 && <p className="empty-state">Todavía no has guardado ninguna cita.</p>}
      <div className="quote-add-row">
        <textarea
          className="input"
          rows={2}
          placeholder="Añadir una cita o frase favorita..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="button" className="btn" disabled={loading || !draft.trim()} onClick={handleAdd}>
          Añadir
        </button>
      </div>
    </div>
  );
}
