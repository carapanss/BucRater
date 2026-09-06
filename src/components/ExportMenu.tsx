import { exportBackup, exportCsv, exportMarkdown } from '../api/backup';
import { errorMessage, useToastStore } from '../store/useToastStore';

const ACTIONS: Record<string, { run: () => Promise<boolean>; success: string; failurePrefix: string }> = {
  json: {
    run: exportBackup,
    success: 'Backup exportado correctamente.',
    failurePrefix: 'No se pudo exportar el backup',
  },
  csv: {
    run: exportCsv,
    success: 'CSV exportado correctamente.',
    failurePrefix: 'No se pudo exportar el CSV',
  },
  markdown: {
    run: exportMarkdown,
    success: 'Markdown exportado correctamente.',
    failurePrefix: 'No se pudo exportar el Markdown',
  },
};

export function ExportMenu() {
  const pushToast = useToastStore((s) => s.push);

  async function handleSelect(format: string) {
    const action = ACTIONS[format];
    if (!action) return;
    try {
      const ok = await action.run();
      if (ok) pushToast(action.success);
    } catch (err) {
      pushToast(`${action.failurePrefix}: ${errorMessage(err)}`, 'error');
    }
  }

  return (
    <select
      className="btn btn-sm"
      value=""
      aria-label="Exportar biblioteca"
      onChange={(e) => {
        const format = e.target.value;
        e.target.value = '';
        void handleSelect(format);
      }}
    >
      <option value="">Exportar…</option>
      <option value="json">Backup (JSON)</option>
      <option value="csv">CSV</option>
      <option value="markdown">Markdown</option>
    </select>
  );
}
