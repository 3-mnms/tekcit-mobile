// src/pages/my/myInfo/bookmark/BookmarkPage.tsx
import React, { useEffect, useState } from 'react';
import styles from './BookmarkPage.module.css';
import BookmarkCard from '@/components/my/myinfo/BookmarkCard';
import type { BookmarkItem } from '@/models/bookmark/BookmarkItem';
import MyHeader from '@/components/my/hedaer/MyHeader';

const LS_KEY = 'my_bookmarks_demo';
const FALLBACK: BookmarkItem[] = [
  { id: 1, name: '공연 이름 1', isBookmarked: true },
  { id: 2, name: '공연 이름 2', isBookmarked: true },
  { id: 3, name: '공연 이름 3', isBookmarked: true },
  { id: 4, name: '공연 이름 4', isBookmarked: true },
];

const BookmarkPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setBookmarks(raw ? JSON.parse(raw) : FALLBACK);
    } catch {
      setBookmarks(FALLBACK);
    }
  }, []);

  useEffect(() => {
    if (bookmarks.length) {
      localStorage.setItem(LS_KEY, JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  const handleToggleBookmark = (id: number) => {
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, isBookmarked: !b.isBookmarked } : b
      )
    );
  };

  return (
    <div className={styles.page}>
      <MyHeader title="북마크" />

      <div className={styles.sectionHead}>
        <p className={styles.subTitle}>관심 공연</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className={styles.empty}>아직 북마크한 공연이 없어요</div>
      ) : (
        <div className={styles.grid}>
          {bookmarks.map((item) => (
            <BookmarkCard
              key={item.id}
              id={item.id}
              name={item.name}
              isBookmarked={item.isBookmarked}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkPage;
