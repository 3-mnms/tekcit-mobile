// NotificationDropdown.tsx
import React, { useState } from 'react';
import styles from './NotificationDropdown.module.css';
import NotificationItem from '@components/my/dropdown/NotificationItem';
import { useNotificationStore } from '@/models/dropdown/NotificationStore';
import { useHydrateNotifications } from '@/models/dropdown/useNotificationQuery';
import MyHeader from '@/components/my/hedaer/MyHeader';
import NoticeDetailPage from './NoticeDetailPage';

const NotificationDropdown: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead } = useNotificationStore();
  const { isLoading, isError } = useHydrateNotifications(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className={styles.page} role="region" aria-label="공지사항">
      <MyHeader title="공지사항" />

      {selectedId ? (
        <NoticeDetailPage id={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <div className={styles.actionRow}>
            <button type="button" onClick={markAllAsRead} className={styles.allReadBtn}>
              전체 읽음
            </button>
          </div>
          <div className={styles.list}>
            {isLoading ? (
              <div className={styles.empty}>불러오는 중…</div>
            ) : isError ? (
              <div className={styles.empty}>불러오기에 실패했어요</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>새 공지가 없어요</div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  {...n}
                  onRead={() => {
                    markAsRead(n.id);
                    setSelectedId(n.id); // ✅ 상세로 전환
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
