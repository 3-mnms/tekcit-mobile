import React from 'react';
import styles from './NotificationDropdown.module.css';
import NotificationItem from '@components/my/dropdown/NotificationItem';
import { useNotificationStore } from '@/models/dropdown/NotificationStore';
import { FaChevronLeft } from 'react-icons/fa6';

const NotificationDropdown: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead, unreadCount } = useNotificationStore();

  const unread = unreadCount();

  return (
    <div className={styles.page} role="region" aria-label="공지사항">
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          type="button"
          aria-label="뒤로가기"
          onClick={() => window.history.back()}
        >
          <FaChevronLeft size={16} />
        </button>

        <h3 className={styles.title}>공지사항</h3>

        <button
          className={styles.allReadBtn}
          type="button"
          onClick={markAllAsRead}
          disabled={unread === 0}
          aria-disabled={unread === 0}
        >
          전체 읽음
        </button>
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>새 공지가 없어요</div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} {...n} onRead={() => markAsRead(n.id)} />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;