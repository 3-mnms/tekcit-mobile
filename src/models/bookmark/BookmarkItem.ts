export interface BookmarkItem {
  id: number;
  name: string;
  isBookmarked: boolean; 
}

export interface BookmarkCardProps extends BookmarkItem {
  onToggleBookmark: (id: number) => void;
  muted?: boolean;
}
