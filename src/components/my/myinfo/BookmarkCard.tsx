// src/components/my/myinfo/BookmarkCard.tsx
import React from 'react';
import styles from './BookmarkCard.module.css';
import type { BookmarkCardProps } from '@/models/bookmark/BookmarkItem';

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  id,
  name,
  isBookmarked,
  onToggleBookmark,
  muted = false, 
}) => {
  return (
    <div className={`${styles.card} ${muted ? styles.muted : ''}`}>
      <div className={styles.thumbWrap}>
        <div className={styles.thumb} aria-hidden="true">🖼</div>
      </div>

      <button
        type="button"
        className={styles.heartBtn}
        aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
        onClick={() => onToggleBookmark(id)}
      >
        {isBookmarked ? '🤍' : '❤️'}
      </button>

      <p className={styles.name} title={name}>{name}</p>
    </div>
  );
};

export default BookmarkCard;
