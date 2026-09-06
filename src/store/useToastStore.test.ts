import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore, errorMessage } from './useToastStore';

describe('errorMessage', () => {
  it('devuelve el string tal cual si el error ya es un string', () => {
    expect(errorMessage('algo falló')).toBe('algo falló');
  });

  it('extrae el mensaje de una instancia de Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('convierte cualquier otro valor a texto', () => {
    expect(errorMessage(42)).toBe('42');
  });
});

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('añade un toast al hacer push', () => {
    useToastStore.getState().push('Guardado', 'success');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: 'Guardado', variant: 'success' });
  });

  it('usa "success" como variante por defecto', () => {
    useToastStore.getState().push('Listo');
    expect(useToastStore.getState().toasts[0].variant).toBe('success');
  });

  it('elimina el toast al llamar a dismiss', () => {
    useToastStore.getState().push('Uno');
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('descarta el toast automáticamente pasado un tiempo', () => {
    vi.useFakeTimers();
    useToastStore.getState().push('Temporal');
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(6000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
