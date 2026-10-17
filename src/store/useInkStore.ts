import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Tinta de las portadas: blanco y negro (por defecto) o con el color de cada encuadernación. */
interface InkState {
  color: boolean;
  toggleColor: () => void;
}

export const useInkStore = create<InkState>()(
  persist(
    (set, get) => ({
      color: false,
      toggleColor: () => set({ color: !get().color }),
    }),
    { name: 'bucrater-ink' },
  ),
);
