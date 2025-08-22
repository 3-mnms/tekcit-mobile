import React from 'react'
import styles from './NotificationDropdown.module.css'
import NotificationItem from '@components/my/dropdown/NotificationItem'
import { useNotificationStore } from '@/models/dropdown/NotificationStore'
import MyHeader from '@/components/my/hedaer/MyHeader'

const NotificationDropdown: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead} = useNotificationStore()

  return (
    <div className={styles.page} role="region" aria-label="공지사항">
      <MyHeader title="공지사항" />
      <div className={styles.actionRow}>
        <button type="button" onClick={markAllAsRead} className={styles.allReadBtn}>
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
  )
}

export default NotificationDropdown
