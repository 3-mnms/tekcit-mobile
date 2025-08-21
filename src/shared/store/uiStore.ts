import { create } from 'zustand';

type HeaderMode = 'default' | 'search';

interface UIState {
  headerMode: HeaderMode;
  headerTitle: string | null;
  setHeaderTitle: (title: string) => void;
  setHeaderToSearchMode: () => void;
  resetHeader: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  headerMode: 'default', // 기본 모드
  headerTitle: null,
  
  setHeaderTitle: (title) => set({ headerMode: 'default', headerTitle: title }),
  setHeaderToSearchMode: () => set({ headerMode: 'search', headerTitle: null }),
  resetHeader: () => set({ headerMode: 'default', headerTitle: null }),
}));