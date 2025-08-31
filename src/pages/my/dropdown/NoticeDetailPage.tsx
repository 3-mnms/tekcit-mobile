// pages/my/NoticeDetailPage.tsx
import React, { useEffect } from 'react';
import styles from './NoticeDetailPage.module.css';
import MyHeader from '@/components/my/hedaer/MyHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchNotificationDetail } from '@/shared/api/my/notice';
import { useNotificationStore } from '@/models/dropdown/NotificationStore';
import { useParams } from 'react-router-dom';

type Props = { id?: number; onBack?: () => void };

const NoticeDetailPage: React.FC<Props> = ({ id, onBack }) => {
  const params = useParams<{ id?: string }>();

  // 1) prop 우선, 없으면 라우트 파라미터
  const idFromProp = typeof id === 'number' ? id : NaN;
  const idFromRoute = params.id ? Number(params.id) : NaN;
  const nid = Number.isFinite(idFromProp) ? idFromProp : idFromRoute;

  const markAsRead = useNotificationStore(s => s.markAsRead);

  const q = useQuery({
    queryKey: ['notifications','detail', nid],
    queryFn: () => fetchNotificationDetail(nid),
    enabled: Number.isFinite(nid), // nid가 정수일 때만 호출
  });

  useEffect(() => {
    if (Number.isFinite(nid)) {
      markAsRead(nid); // 들어오자마자 읽음 처리
    }
  }, [nid, markAsRead]);

  if (!Number.isFinite(nid)) return <div className={styles.page}>잘못된 공지입니다.</div>;
  if (q.isLoading) return <div className={styles.page}>불러오는 중…</div>;
  if (q.isError || !q.data) return <div className={styles.page}>불러오기에 실패했어요.</div>;

  const { title, body, sentAt } = q.data;

  return (
    <div className={styles.page}>
      <MyHeader title="공지사항" />
      {onBack && (
        <button type="button" onClick={onBack} className={styles.backBtn}>
          ← 뒤로
        </button>
      )}
      <article className={styles.article}>
        <h1 className={styles.title}>{title}</h1>
        <time className={styles.time}>{new Date(sentAt).toLocaleString()}</time>
        <p className={styles.body}>{body}</p>
      </article>
    </div>
  );
};

export default NoticeDetailPage;
