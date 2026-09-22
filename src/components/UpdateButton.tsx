import { useCallback, useEffect, useRef, useState } from 'react';
import { relaunch } from '@tauri-apps/plugin-process';
import { checkForUpdate, type Update } from '../api/updater';
import { errorMessage, useToastStore } from '../store/useToastStore';

type DownloadState = 'idle' | 'checking' | 'downloading' | 'installed';

export function UpdateButton() {
  const pushToast = useToastStore((s) => s.push);
  const [update, setUpdate] = useState<Update | null>(null);
  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const checkPromise = useRef<Promise<Update | null> | null>(null);

  const runCheck = useCallback(() => {
    if (!checkPromise.current) {
      checkPromise.current = checkForUpdate().finally(() => {
        checkPromise.current = null;
      });
    }
    return checkPromise.current;
  }, []);

  const checkSilently = useCallback(async () => {
    try {
      const available = await runCheck();
      if (available) {
        setUpdate(available);
        pushToast(`Hay una actualización disponible: BucRater ${available.version}.`);
      }
    } catch (error) {
      console.warn('No se pudo comprobar si hay actualizaciones:', error);
    }
  }, [pushToast, runCheck]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkSilently(), 1500);
    return () => window.clearTimeout(timer);
  }, [checkSilently]);

  async function handleCheck() {
    setState('checking');
    try {
      const available = await runCheck();
      setUpdate(available);
      if (available) {
        pushToast(`Hay una actualización disponible: BucRater ${available.version}.`);
      } else {
        pushToast('BucRater está actualizado.');
      }
    } catch (error) {
      pushToast(`No se pudo comprobar la actualización: ${errorMessage(error)}`, 'error');
    } finally {
      setState('idle');
    }
  }

  async function handleInstall() {
    if (!update) return;
    setState('downloading');
    setProgress(0);
    let downloaded = 0;
    let total: number | undefined;
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          downloaded = 0;
          total = event.data.contentLength;
          setProgress(0);
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (total) {
            setProgress(Math.min(99, Math.round((downloaded / total) * 100)));
          } else {
            // El plugin no siempre conoce el tamaño total; en ese caso mostramos actividad.
            setProgress((current) => Math.min(95, Math.max(current + 1, 5)));
          }
        } else {
          setProgress(100);
        }
      }, { timeout: 120_000 });
      setState('installed');
      pushToast('Actualización instalada. Cierra y vuelve a abrir BucRater para aplicarla.');
    } catch (error) {
      setState('idle');
      pushToast(`No se pudo instalar la actualización: ${errorMessage(error)}`, 'error');
    }
  }

  async function handleRelaunch() {
    try {
      await relaunch();
    } catch (error) {
      pushToast(`No se pudo reiniciar BucRater: ${errorMessage(error)}`, 'error');
    }
  }

  if (state === 'installed') {
    return (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => void handleRelaunch()}
      >
        Reiniciar BucRater
      </button>
    );
  }

  if (update) {
    return (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={state === 'downloading'}
        onClick={() => void handleInstall()}
        title={`Actualizar a BucRater ${update.version}`}
      >
        {state === 'downloading' ? `Descargando ${progress}%` : `Actualizar a ${update.version}`}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-sm"
      disabled={state === 'checking'}
      onClick={() => void handleCheck()}
      title="Comprobar actualizaciones"
    >
      {state === 'checking' ? 'Comprobando…' : 'Actualizar'}
    </button>
  );
}
