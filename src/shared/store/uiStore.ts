import { create } from 'zustand';

interface UIState {
  headerTitle: string | null;
  setHeaderTitle: (title: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  headerTitle: null, // 기본값은 제목 없음
  setHeaderTitle: (title) => set({ headerTitle: title }),
}));