import { create } from 'zustand';

type LeftIcon = 'logo' | 'back';
type CenterMode = 'title' | 'searchBar' | 'empty';

interface UIState {
  leftIcon: LeftIcon;
  centerMode: CenterMode;
  headerTitle: string | null;
  setHeader: (config: {
    leftIcon?: LeftIcon;
    centerMode?: CenterMode;
    title?: string | null;
  }) => void;
  setBaseHeader: () => void;
}

const initialState = {
  leftIcon: 'logo' as LeftIcon,
  centerMode: 'empty' as CenterMode,
  headerTitle: null,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  setHeader: (config) => 
    set((state) => ({
      leftIcon: config.leftIcon ?? state.leftIcon,
      centerMode: config.centerMode ?? state.centerMode,
      headerTitle:  config.title === undefined ? state.headerTitle : config.title,
    })),
  setBaseHeader: () => set(initialState), 
}));