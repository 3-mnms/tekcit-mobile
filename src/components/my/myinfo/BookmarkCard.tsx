// src/components/my/myinfo/BookmarkCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './BookmarkCard.module.css';
import type { BookmarkCardProps } from '@/models/bookmark/BookmarkItem';

const BookmarkCard: React.FC<BookmarkCardProps> = ({
  id,              // = fid
  name,
  isBookmarked,
  onToggleBookmark,
  thumbnailUrl,    // ✅ 추가 (API에서 내려옴)
  muted = false,
}) => {
  const to = `/festival/${encodeURIComponent(id)}`;

  const onHeartClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBookmark(id);
  };

  return (
    <Link
      to={to}
      className={`${styles.card} ${muted ? styles.muted : ''}`}
      title={name}
      aria-label={name}
    >
      <div className={styles.thumbWrap}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className={styles.thumb} />
        ) : (
          <div className={styles.thumb} aria-hidden="true">🖼</div>
        )}
      </div>

      <button
        type="button"
        className={styles.heartBtn}
        aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
        onClick={onHeartClick}
      >
        {isBookmarked ? '❤️' : '🤍'}
      </button>

      <p className={styles.name}>{name}</p>
    </Link>
  );
};

export default BookmarkCard;
