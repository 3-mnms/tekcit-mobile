// @components/my/dropdown/NotificationItem.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationItem.module.css';

type Props = {
  id: number;
  title: string;
  message: string; // fname에서 온 요약/출처
  time: string;    // "3분전" 등
  read: boolean;
  onRead: () => void;
};

const NotificationItem: React.FC<Props> = ({ id, title, message, time, read, onRead }) => {
  const nav = useNavigate();
  const handleClick = () => {
    onRead();                     // ✅ 스토어에 읽음 반영
    nav(`/mypage/notification/${id}`);      // ✅ 상세로 이동
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.item} ${read ? styles.read : styles.unread}`}
      aria-label={`${title} - ${read ? '읽음' : '안읽음'}`}
    >
      <div className={styles.main}>
        <div className={styles.title}>{title}</div>
        <div className={styles.meta}>
          <span className={styles.source}>{message}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.time}>{time}</span>
        </div>
      </div>
      {!read && <span className={styles.badge} aria-hidden />}
    </button>
  );
};

export default NotificationItem;
